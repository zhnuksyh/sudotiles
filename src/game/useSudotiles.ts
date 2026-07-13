import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_POINTS, STREAK_MILESTONE, streakMultiplier } from "./constants";
import { dealingState, fallbackState, freshState, readyState } from "./freshState";
import { addHistoryEntry } from "./history";
import { deliverShareUrl, readSharedPuzzle, shareUrlFor } from "./share";
import { clearCustomBackground, createCustomBackground, loadCustomBackground } from "./customTheme";
import { applyTheme, loadSettings, saveSettings } from "./settings";
import { setSoundsEnabled, sounds } from "./sounds";
import { TUTORIAL_STEPS } from "./tutorial";
import type { Settings, ThemeChoice } from "./settings";
import type { Cell, GameState } from "./types";
import type { WorkerRequest, WorkerResponse } from "./sudoku.worker";
import type { ConfettiHandle } from "../components/Confetti";

const supportsWorker = typeof Worker !== "undefined";

function clearPeerScribbles(board: Cell[], selected: number, n: number) {
  const sr = Math.floor(selected / 9);
  const sc = selected % 9;
  for (let i = 0; i < 81; i++) {
    const b = board[i];
    if (i === selected || b.given || b.value) continue;
    const sameRow = b.r === sr;
    const sameCol = b.c === sc;
    const sameBox =
      Math.floor(b.r / 3) === Math.floor(sr / 3) && Math.floor(b.c / 3) === Math.floor(sc / 3);
    if ((sameRow || sameCol || sameBox) && b.scribbles[n - 1]) {
      const scr = b.scribbles.slice();
      scr[n - 1] = false;
      board[i] = { ...b, scribbles: scr };
    }
  }
}

/* Units (row/column/box) that the cell at `idx` belongs to and that are now
 * fully and correctly filled. Called right after a correct placement, so any
 * complete unit is newly complete. */
function completedUnits(board: Cell[], idx: number): string[] {
  const filled = (i: number) => board[i].value !== "" && !board[i].error;
  const r = Math.floor(idx / 9);
  const c = idx % 9;
  const units: string[] = [];
  if (Array.from({ length: 9 }, (_, k) => r * 9 + k).every(filled)) units.push("Row");
  if (Array.from({ length: 9 }, (_, k) => k * 9 + c).every(filled)) units.push("Column");
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  const box: number[] = [];
  for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) box.push((br + dr) * 9 + bc + dc);
  if (box.every(filled)) units.push("Box");
  return units;
}

export function useSudotiles() {
  const [settings, setSettings] = useState<Settings>(() => {
    const s = loadSettings();
    // Apply before first paint so a saved theme doesn't flash the default.
    applyTheme(s.theme);
    return s;
  });
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // A puzzle arriving via a share link takes precedence over generating one.
  const sharedRef = useRef(typeof window === "undefined" ? null : readSharedPuzzle());

  const [state, setState] = useState<GameState>(() => {
    const shared = sharedRef.current;
    if (shared) return readyState(shared.difficulty, shared.puzzle);
    return supportsWorker ? dealingState(settings.difficulty) : freshState(settings.difficulty);
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const dealTimeout = useRef<number | undefined>(undefined);

  // If the worker takes longer than this to return a puzzle, fall back to the
  // bundled static puzzle so a request can never leave the board stuck
  // "dealing" indefinitely. Generation normally finishes in well under 100ms.
  const DEAL_TIMEOUT_MS = 4000;

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    setSoundsEnabled(settings.soundsEnabled);
  }, [settings.soundsEnabled]);

  const [flash, setFlash] = useState({ on: false, text: "" });
  // Brief "Row complete!"-style popup when a unit gets fully filled.
  const [unitFlash, setUnitFlash] = useState({ on: false, text: "" });
  const [shaking, setShaking] = useState(false);
  const [diff, setDiff] = useState({ open: false, closing: false });
  const [confirm, setConfirm] = useState({ open: false, closing: false });
  const [guide, setGuide] = useState({ open: false, closing: false });
  const [history, setHistory] = useState({ open: false, closing: false });
  const [notice, setNotice] = useState("");

  // Current tutorial step index, or null when not in the tutorial.
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const tutorialRef = useRef(tutorialStep);
  tutorialRef.current = tutorialStep;

  // Track whether any modal is open so keyboard shortcuts stay dormant then.
  const anyModalOpenRef = useRef(false);
  anyModalOpenRef.current = diff.open || confirm.open || guide.open || history.open;

  const confettiRef = useRef<ConfettiHandle>(null);
  const flashTimeout = useRef<number | undefined>(undefined);
  const unitFlashTimeout = useRef<number | undefined>(undefined);
  // Defers the streak flourish while a unit-complete pill is showing.
  const chainTimeout = useRef<number | undefined>(undefined);
  const shakeTimeout = useRef<number | undefined>(undefined);
  const diffTimeout = useRef<number | undefined>(undefined);
  const confirmTimeout = useRef<number | undefined>(undefined);
  const guideTimeout = useRef<number | undefined>(undefined);
  const historyTimeout = useRef<number | undefined>(undefined);
  const noticeTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!settingsRef.current.timerEnabled) return;
      setState((s) => (!s.started || s.over || s.won ? s : { ...s, elapsed: s.elapsed + 1 }));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(flashTimeout.current);
      window.clearTimeout(unitFlashTimeout.current);
      window.clearTimeout(chainTimeout.current);
      window.clearTimeout(shakeTimeout.current);
      window.clearTimeout(diffTimeout.current);
      window.clearTimeout(confirmTimeout.current);
      window.clearTimeout(guideTimeout.current);
      window.clearTimeout(historyTimeout.current);
      window.clearTimeout(noticeTimeout.current);
      window.clearTimeout(dealTimeout.current);
    };
  }, []);

  // Request a fresh puzzle for `difficulty`. Shows a "dealing" board immediately
  // and fills it when the worker (or the synchronous fallback) responds. Stale
  // worker responses (from a superseded request) are ignored via `requestId`.
  const deal = useCallback((difficulty: string) => {
    setTutorialStep(null); // dealing a new board leaves the tutorial
    window.clearTimeout(chainTimeout.current); // drop any queued flourish
    const next = dealingState(difficulty);
    setState(next);
    stateRef.current = next;

    window.clearTimeout(dealTimeout.current);
    const id = ++requestId.current;
    const worker = workerRef.current;
    if (worker) {
      const req: WorkerRequest = { id, difficulty };
      worker.postMessage(req);
      // Safety net: if the worker doesn't respond in time, deal the bundled
      // puzzle so we never hang on "dealing".
      dealTimeout.current = window.setTimeout(() => {
        if (id !== requestId.current) return;
        const ready = fallbackState(difficulty);
        setState(ready);
        stateRef.current = ready;
      }, DEAL_TIMEOUT_MS);
    } else {
      const ready = freshState(difficulty);
      setState(ready);
      stateRef.current = ready;
    }
  }, []);

  useEffect(() => {
    if (!supportsWorker) return;
    const worker = new Worker(new URL("./sudoku.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { id, puzzle } = e.data;
      // Ignore responses for superseded requests.
      if (id !== requestId.current) return;
      window.clearTimeout(dealTimeout.current);
      const ready = readyState(stateRef.current.difficulty, puzzle);
      setState(ready);
      stateRef.current = ready;
    };
    // Deal the opening puzzle once the worker is live — unless a shared
    // puzzle from the URL is already on the board. The ref is intentionally
    // never cleared so a StrictMode remount doesn't deal over the shared board.
    if (!sharedRef.current) deal(stateRef.current.difficulty);
    return () => {
      window.clearTimeout(dealTimeout.current);
      worker.terminate();
      workerRef.current = null;
    };
  }, [deal]);

  const shake = useCallback(() => {
    if (!settingsRef.current.animationsEnabled) return;
    window.clearTimeout(shakeTimeout.current);
    setShaking(true);
    shakeTimeout.current = window.setTimeout(() => setShaking(false), 460);
  }, []);

  const flourish = useCallback((text: string) => {
    if (!settingsRef.current.animationsEnabled) return;
    window.clearTimeout(flashTimeout.current);
    setFlash({ on: true, text });
    flashTimeout.current = window.setTimeout(() => setFlash({ on: false, text: "" }), 1300);
    confettiRef.current?.fire(90, 0.5, 0.42);
  }, []);

  const showUnitFlash = useCallback((units: string[]) => {
    window.clearTimeout(unitFlashTimeout.current);
    setUnitFlash({ on: true, text: `${units.join(" & ")} complete!` });
    unitFlashTimeout.current = window.setTimeout(
      () => setUnitFlash({ on: false, text: "" }),
      1300,
    );
  }, []);

  const celebrate = useCallback(() => {
    if (!settingsRef.current.animationsEnabled) return;
    confettiRef.current?.fire(140, 0.5, 0.35);
    window.setTimeout(() => confettiRef.current?.fire(90, 0.2, 0.45), 200);
    window.setTimeout(() => confettiRef.current?.fire(90, 0.8, 0.45), 380);
  }, []);

  const select = useCallback((i: number) => {
    const s = stateRef.current;
    if (s.over || s.won || s.dealing) return;
    const next = { ...s, selected: i, multiSelected: [i] };
    setState(next);
    // Update the ref eagerly: drag pointermove events can arrive before the
    // next render refreshes stateRef.
    stateRef.current = next;
  }, []);

  // Extend the current selection while click-dragging (or touch-dragging)
  // across the board. The first pressed cell stays the anchor (`selected`).
  const dragSelect = useCallback((i: number) => {
    const s = stateRef.current;
    if (s.over || s.won || s.dealing) return;
    if (s.selected == null || s.multiSelected.includes(i)) return;
    const next = { ...s, multiSelected: [...s.multiSelected, i] };
    setState(next);
    stateRef.current = next;
  }, []);

  const togglePencil = useCallback(() => {
    setState((s) => ({ ...s, pencil: !s.pencil }));
  }, []);

  const toggleGuides = useCallback(() => {
    setSettings((prev) => ({ ...prev, guidesEnabled: !prev.guidesEnabled }));
  }, []);

  const openDiff = useCallback(() => {
    window.clearTimeout(diffTimeout.current);
    setDiff({ open: true, closing: false });
  }, []);

  const closeDiff = useCallback(() => {
    window.clearTimeout(diffTimeout.current);
    setDiff((d) => ({ ...d, closing: true }));
    diffTimeout.current = window.setTimeout(() => setDiff({ open: false, closing: false }), 210);
  }, []);

  const openConfirm = useCallback(() => {
    window.clearTimeout(confirmTimeout.current);
    setConfirm({ open: true, closing: false });
  }, []);

  const closeConfirm = useCallback(() => {
    window.clearTimeout(confirmTimeout.current);
    setConfirm((c) => ({ ...c, closing: true }));
    confirmTimeout.current = window.setTimeout(() => setConfirm({ open: false, closing: false }), 210);
  }, []);

  const openGuide = useCallback(() => {
    window.clearTimeout(guideTimeout.current);
    setGuide({ open: true, closing: false });
  }, []);

  const closeGuide = useCallback(() => {
    window.clearTimeout(guideTimeout.current);
    setGuide((g) => ({ ...g, closing: true }));
    guideTimeout.current = window.setTimeout(() => setGuide({ open: false, closing: false }), 210);
  }, []);

  const openHistory = useCallback(() => {
    window.clearTimeout(historyTimeout.current);
    setHistory({ open: true, closing: false });
  }, []);

  const closeHistory = useCallback(() => {
    window.clearTimeout(historyTimeout.current);
    setHistory((h) => ({ ...h, closing: true }));
    historyTimeout.current = window.setTimeout(
      () => setHistory({ open: false, closing: false }),
      210,
    );
  }, []);

  // Move to tutorial step `i`, pre-selecting its target cell; past the last
  // step the tutorial simply ends and normal play continues on the board.
  const gotoTutorialStep = useCallback(
    (i: number) => {
      if (i >= TUTORIAL_STEPS.length) {
        setTutorialStep(null);
        return;
      }
      setTutorialStep(i);
      const cell = TUTORIAL_STEPS[i].cell;
      if (cell != null) select(cell);
    },
    [select],
  );

  // Start the guided tutorial on the bundled puzzle (its steps are authored
  // against that exact board).
  const startTutorial = useCallback(() => {
    window.clearTimeout(dealTimeout.current);
    requestId.current++; // supersede any in-flight worker deal
    const ready = fallbackState(settingsRef.current.difficulty);
    setState(ready);
    stateRef.current = ready;
    closeGuide();
    gotoTutorialStep(0);
  }, [closeGuide, gotoTutorialStep]);

  const nextTutorialStep = useCallback(() => {
    const t = tutorialRef.current;
    if (t != null) gotoTutorialStep(t + 1);
  }, [gotoTutorialStep]);

  const skipTutorial = useCallback(() => {
    setTutorialStep(null);
  }, []);

  const showNotice = useCallback((text: string) => {
    window.clearTimeout(noticeTimeout.current);
    setNotice(text);
    noticeTimeout.current = window.setTimeout(() => setNotice(""), 1800);
  }, []);

  // Share a puzzle link: the current board's givens, or an explicit givens
  // string (used by the history modal to re-share past puzzles).
  const sharePuzzle = useCallback(
    async (givens?: string, difficulty?: string) => {
      const s = stateRef.current;
      if (givens == null) {
        if (s.dealing) return;
        givens = s.board.map((c) => (c.given ? c.value : "0")).join("");
      }
      const url = shareUrlFor(givens, difficulty ?? s.difficulty);
      const result = await deliverShareUrl(url);
      if (result === "copied") showNotice("Link copied to clipboard");
      else if (result === "failed") showNotice("Couldn't copy the link");
    },
    [showNotice],
  );

  const setDifficulty = useCallback(
    (label: string) => {
      setSettings((prev) => ({ ...prev, difficulty: label }));
      deal(label);
      closeDiff();
    },
    [deal, closeDiff],
  );

  const setNumpadPosition = useCallback((numpadPosition: Settings["numpadPosition"]) => {
    setSettings((prev) => ({ ...prev, numpadPosition }));
  }, []);

  const setTheme = useCallback((theme: ThemeChoice) => {
    setSettings((prev) => ({ ...prev, theme }));
  }, []);

  // The uploaded background image (data URL) backing the "custom" theme.
  const [customBg, setCustomBg] = useState<string | null>(() => loadCustomBackground());

  const uploadBackground = useCallback(
    async (file: File) => {
      try {
        const image = await createCustomBackground(file);
        setCustomBg(image);
        setSettings((prev) => ({ ...prev, theme: "custom" }));
        applyTheme("custom");
      } catch {
        showNotice("Couldn't use that image");
      }
    },
    [showNotice],
  );

  const removeCustomBackground = useCallback(() => {
    clearCustomBackground();
    setCustomBg(null);
    setSettings((prev) => ({ ...prev, theme: "ember" }));
    applyTheme("ember");
  }, []);

  const toggleLives = useCallback(() => {
    setSettings((prev) => ({ ...prev, livesEnabled: !prev.livesEnabled }));
  }, []);

  const toggleTimer = useCallback(() => {
    setSettings((prev) => ({ ...prev, timerEnabled: !prev.timerEnabled }));
  }, []);

  const toggleKeyboard = useCallback(() => {
    setSettings((prev) => ({ ...prev, keyboardEnabled: !prev.keyboardEnabled }));
  }, []);

  const toggleAnimations = useCallback(() => {
    setSettings((prev) => ({ ...prev, animationsEnabled: !prev.animationsEnabled }));
  }, []);

  const toggleSounds = useCallback(() => {
    setSettings((prev) => ({ ...prev, soundsEnabled: !prev.soundsEnabled }));
  }, []);

  // The cells an edit applies to: the whole drag selection, or just the
  // anchor when nothing was dragged.
  const selectionOf = (s: GameState): number[] => {
    if (s.multiSelected.length > 0) return s.multiSelected;
    return s.selected == null ? [] : [s.selected];
  };

  const erase = useCallback(() => {
    const s = stateRef.current;
    if (s.over || s.won) return;
    // A correctly placed number is locked in and can't be erased; only wrong
    // entries (error) and scribbles can be cleared.
    const targets = selectionOf(s).filter((i) => {
      const cell = s.board[i];
      return !cell.given && (cell.value === "" || cell.error);
    });
    if (targets.length === 0) return;
    sounds.erase();
    const board = s.board.slice();
    for (const i of targets) {
      board[i] = { ...board[i], value: "", error: false, scribbles: Array(9).fill(false) };
    }
    setState({ ...s, board });
  }, []);

  const scribbleToggle = useCallback((n: number) => {
    const s = stateRef.current;
    if (s.over || s.won) return;
    const targets = selectionOf(s).filter((i) => {
      const cell = s.board[i];
      return !cell.given && !cell.value;
    });
    if (targets.length === 0) return;
    sounds.scribble();
    // Toggle in unison: if any target is missing the note, add it everywhere;
    // otherwise all targets have it, so clear it everywhere.
    const turnOn = targets.some((i) => !s.board[i].scribbles[n - 1]);
    const board = s.board.slice();
    for (const i of targets) {
      if (board[i].scribbles[n - 1] === turnOn) continue;
      const scribbles = board[i].scribbles.slice();
      scribbles[n - 1] = turnOn;
      board[i] = { ...board[i], scribbles };
    }
    setState({ ...s, board, started: true });
  }, []);

  const placeNum = useCallback(
    (n: number) => {
      const s = stateRef.current;
      if (s.pencil) {
        scribbleToggle(n);
        return;
      }
      if (s.selected == null || s.over || s.won) return;

      // During the tutorial only the current step's exact move is accepted.
      const t = tutorialRef.current;
      if (t != null) {
        const step = TUTORIAL_STEPS[t];
        if (step.cell == null) return; // info step: advance with Next instead
        if (s.selected !== step.cell || n !== step.n) {
          shake();
          showNotice("Follow the highlighted cell first");
          return;
        }
      }

      const cell = s.board[s.selected];
      if (cell.given) return;
      // A correctly placed number is locked; don't allow overwriting it.
      if (cell.value !== "" && !cell.error) return;

      const correct = s.solution[s.selected] === String(n);
      if (correct) {
        const board = s.board.slice();
        board[s.selected] = {
          ...board[s.selected],
          value: String(n),
          error: false,
          scribbles: Array(9).fill(false),
        };
        clearPeerScribbles(board, s.selected, n);
        const streak = s.streak + 1;
        const won = board.every((b) => b.value !== "" && !b.error);
        const milestone = streak % STREAK_MILESTONE === 0 && !won;
        const units = won ? [] : completedUnits(board, s.selected);
        const next: GameState = {
          ...s,
          board,
          // Placing a value only affects the anchor, so drop any drag selection.
          multiSelected: [s.selected],
          score: s.score + BASE_POINTS * streakMultiplier(streak),
          streak,
          won,
          started: true,
        };
        setState(next);
        stateRef.current = next;
        if (tutorialRef.current != null) gotoTutorialStep(tutorialRef.current + 1);
        // Celebrations, biggest event first; when a unit fill and a streak
        // milestone land on the same placement they play one by one — the
        // fill happened first, so its pill shows, then the streak flourish.
        if (won) {
          sounds.win();
          celebrate();
          addHistoryEntry({
            date: new Date().toISOString(),
            difficulty: s.difficulty,
            score: next.score,
            elapsed: s.elapsed,
            givens: board.map((c) => (c.given ? c.value : ".")).join(""),
            solution: s.solution,
          });
        } else if (milestone && units.length > 0) {
          sounds.unit();
          showUnitFlash(units);
          window.clearTimeout(chainTimeout.current);
          chainTimeout.current = window.setTimeout(() => {
            sounds.streak();
            flourish(`+${streak} STREAK`);
          }, 1350);
        } else if (milestone) {
          sounds.streak();
          flourish(`+${streak} STREAK`);
        } else if (units.length > 0) {
          sounds.unit();
          showUnitFlash(units);
        } else {
          sounds.blip();
        }
      } else {
        shake();
        sounds.error();
        const board = s.board.slice();
        board[s.selected] = {
          ...board[s.selected],
          value: String(n),
          error: true,
          scribbles: Array(9).fill(false),
        };
        const livesOn = settingsRef.current.livesEnabled;
        const hearts = livesOn ? s.hearts - 1 : s.hearts;
        const next: GameState = {
          ...s,
          board,
          multiSelected: [s.selected],
          hearts,
          over: livesOn && hearts <= 0,
          streak: 0,
          started: true,
        };
        setState(next);
        stateRef.current = next;
      }
    },
    [scribbleToggle, shake, flourish, celebrate, showNotice, gotoTutorialStep, showUnitFlash],
  );

  // Keyboard shortcuts: 1-9 place a number, Space erases, Tab toggles scribble
  // mode. Active only when enabled in settings and no modal is open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!settingsRef.current.keyboardEnabled) return;
      if (anyModalOpenRef.current) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        placeNum(Number(e.key));
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        erase();
      } else if (e.key === "Tab") {
        e.preventDefault();
        togglePencil();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [placeNum, erase, togglePencil]);

  const restart = useCallback(() => {
    window.clearTimeout(flashTimeout.current);
    setFlash({ on: false, text: "" });
    deal(stateRef.current.difficulty);
  }, [deal]);

  const confirmRefresh = useCallback(() => {
    restart();
    closeConfirm();
  }, [restart, closeConfirm]);

  return {
    state,
    settings,
    flash,
    unitFlash,
    shaking,
    diff,
    confirm,
    guide,
    history,
    notice,
    customBg,
    tutorialStep,
    confettiRef,
    actions: {
      select,
      dragSelect,
      togglePencil,
      toggleGuides,
      openDiff,
      closeDiff,
      setDifficulty,
      setNumpadPosition,
      setTheme,
      uploadBackground,
      removeCustomBackground,
      toggleLives,
      toggleTimer,
      toggleKeyboard,
      toggleAnimations,
      toggleSounds,
      erase,
      scribbleToggle,
      placeNum,
      restart,
      openConfirm,
      closeConfirm,
      confirmRefresh,
      openGuide,
      closeGuide,
      openHistory,
      closeHistory,
      sharePuzzle,
      startTutorial,
      nextTutorialStep,
      skipTutorial,
    },
  };
}
