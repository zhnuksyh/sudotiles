import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_POINTS, STREAK_MILESTONE } from "./constants";
import { dealingState, freshState, readyState } from "./freshState";
import { loadSettings, saveSettings } from "./settings";
import type { Settings } from "./settings";
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

export function useSudotiles() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [state, setState] = useState<GameState>(() =>
    supportsWorker ? dealingState(settings.difficulty) : freshState(settings.difficulty),
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const [flash, setFlash] = useState({ on: false, text: "" });
  const [shaking, setShaking] = useState(false);
  const [diff, setDiff] = useState({ open: false, closing: false });
  const [confirm, setConfirm] = useState({ open: false, closing: false });
  const [guide, setGuide] = useState({ open: false, closing: false });

  // Track whether any modal is open so keyboard shortcuts stay dormant then.
  const anyModalOpenRef = useRef(false);
  anyModalOpenRef.current = diff.open || confirm.open || guide.open;

  const confettiRef = useRef<ConfettiHandle>(null);
  const flashTimeout = useRef<number | undefined>(undefined);
  const shakeTimeout = useRef<number | undefined>(undefined);
  const diffTimeout = useRef<number | undefined>(undefined);
  const confirmTimeout = useRef<number | undefined>(undefined);
  const guideTimeout = useRef<number | undefined>(undefined);

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
      window.clearTimeout(shakeTimeout.current);
      window.clearTimeout(diffTimeout.current);
      window.clearTimeout(confirmTimeout.current);
      window.clearTimeout(guideTimeout.current);
    };
  }, []);

  // Request a fresh puzzle for `difficulty`. Shows a "dealing" board immediately
  // and fills it when the worker (or the synchronous fallback) responds. Stale
  // worker responses (from a superseded request) are ignored via `requestId`.
  const deal = useCallback((difficulty: string) => {
    const next = dealingState(difficulty);
    setState(next);
    stateRef.current = next;

    const id = ++requestId.current;
    const worker = workerRef.current;
    if (worker) {
      const req: WorkerRequest = { id, difficulty };
      worker.postMessage(req);
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
      const ready = readyState(stateRef.current.difficulty, puzzle);
      setState(ready);
      stateRef.current = ready;
    };
    // Deal the opening puzzle once the worker is live.
    deal(stateRef.current.difficulty);
    return () => {
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

  const celebrate = useCallback(() => {
    if (!settingsRef.current.animationsEnabled) return;
    confettiRef.current?.fire(140, 0.5, 0.35);
    window.setTimeout(() => confettiRef.current?.fire(90, 0.2, 0.45), 200);
    window.setTimeout(() => confettiRef.current?.fire(90, 0.8, 0.45), 380);
  }, []);

  const select = useCallback((i: number) => {
    const s = stateRef.current;
    if (s.over || s.won || s.dealing) return;
    setState({ ...s, selected: i });
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

  const erase = useCallback(() => {
    const s = stateRef.current;
    if (s.selected == null || s.over || s.won) return;
    const cell = s.board[s.selected];
    if (cell.given) return;
    // A correctly placed number is locked in and can't be erased; only wrong
    // entries (error) and scribbles can be cleared.
    if (cell.value !== "" && !cell.error) return;
    const board = s.board.slice();
    board[s.selected] = { ...cell, value: "", error: false, scribbles: Array(9).fill(false) };
    setState({ ...s, board });
  }, []);

  const scribbleToggle = useCallback((n: number) => {
    const s = stateRef.current;
    if (s.selected == null || s.over || s.won) return;
    const cell = s.board[s.selected];
    if (cell.given || cell.value) return;
    const board = s.board.slice();
    const scribbles = board[s.selected].scribbles.slice();
    scribbles[n - 1] = !scribbles[n - 1];
    board[s.selected] = { ...board[s.selected], scribbles };
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
        const next: GameState = {
          ...s,
          board,
          score: s.score + BASE_POINTS,
          streak,
          won,
          started: true,
        };
        setState(next);
        stateRef.current = next;
        if (won) celebrate();
        else if (milestone) flourish(`+${streak} STREAK`);
      } else {
        shake();
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
          hearts,
          over: livesOn && hearts <= 0,
          streak: 0,
          started: true,
        };
        setState(next);
        stateRef.current = next;
      }
    },
    [scribbleToggle, shake, flourish, celebrate],
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
    shaking,
    diff,
    confirm,
    guide,
    confettiRef,
    actions: {
      select,
      togglePencil,
      toggleGuides,
      openDiff,
      closeDiff,
      setDifficulty,
      setNumpadPosition,
      toggleLives,
      toggleTimer,
      toggleKeyboard,
      toggleAnimations,
      erase,
      scribbleToggle,
      placeNum,
      restart,
      openConfirm,
      closeConfirm,
      confirmRefresh,
      openGuide,
      closeGuide,
    },
  };
}
