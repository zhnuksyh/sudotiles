import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_POINTS, SOLUTION, STREAK_MILESTONE } from "./constants";
import { freshState } from "./freshState";
import type { Cell, GameState } from "./types";
import type { ConfettiHandle } from "../components/Confetti";

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
  const [state, setState] = useState<GameState>(() => freshState());
  const stateRef = useRef(state);
  stateRef.current = state;

  const [flash, setFlash] = useState({ on: false, text: "" });
  const [shaking, setShaking] = useState(false);
  const [diff, setDiff] = useState({ open: false, closing: false });

  const confettiRef = useRef<ConfettiHandle>(null);
  const flashTimeout = useRef<number | undefined>(undefined);
  const shakeTimeout = useRef<number | undefined>(undefined);
  const diffTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    const id = window.setInterval(() => {
      setState((s) => (!s.started || s.over || s.won ? s : { ...s, elapsed: s.elapsed + 1 }));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(flashTimeout.current);
      window.clearTimeout(shakeTimeout.current);
      window.clearTimeout(diffTimeout.current);
    };
  }, []);

  const shake = useCallback(() => {
    window.clearTimeout(shakeTimeout.current);
    setShaking(true);
    shakeTimeout.current = window.setTimeout(() => setShaking(false), 460);
  }, []);

  const flourish = useCallback((text: string) => {
    window.clearTimeout(flashTimeout.current);
    setFlash({ on: true, text });
    flashTimeout.current = window.setTimeout(() => setFlash({ on: false, text: "" }), 1300);
    confettiRef.current?.fire(90, 0.5, 0.42);
  }, []);

  const celebrate = useCallback(() => {
    confettiRef.current?.fire(140, 0.5, 0.35);
    window.setTimeout(() => confettiRef.current?.fire(90, 0.2, 0.45), 200);
    window.setTimeout(() => confettiRef.current?.fire(90, 0.8, 0.45), 380);
  }, []);

  const select = useCallback((i: number) => {
    const s = stateRef.current;
    if (s.over || s.won) return;
    setState({ ...s, selected: i });
  }, []);

  const togglePencil = useCallback(() => {
    setState((s) => ({ ...s, pencil: !s.pencil }));
  }, []);

  const toggleGuides = useCallback(() => {
    setState((s) => ({ ...s, guides: !s.guides }));
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

  const setDifficulty = useCallback(
    (label: string) => {
      setState((s) => ({ ...s, difficulty: label }));
      closeDiff();
    },
    [closeDiff],
  );

  const erase = useCallback(() => {
    const s = stateRef.current;
    if (s.selected == null || s.over || s.won) return;
    const cell = s.board[s.selected];
    if (cell.given) return;
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

      const correct = SOLUTION[s.selected] === String(n);
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
        const hearts = s.hearts - 1;
        const next: GameState = {
          ...s,
          board,
          hearts,
          over: hearts <= 0,
          streak: 0,
          started: true,
        };
        setState(next);
        stateRef.current = next;
      }
    },
    [scribbleToggle, shake, flourish, celebrate],
  );

  const restart = useCallback(() => {
    window.clearTimeout(flashTimeout.current);
    setFlash({ on: false, text: "" });
    const s = stateRef.current;
    const next = freshState(s.difficulty);
    setState(next);
    stateRef.current = next;
  }, []);

  return {
    state,
    flash,
    shaking,
    diff,
    confettiRef,
    actions: {
      select,
      togglePencil,
      toggleGuides,
      openDiff,
      closeDiff,
      setDifficulty,
      erase,
      scribbleToggle,
      placeNum,
      restart,
    },
  };
}
