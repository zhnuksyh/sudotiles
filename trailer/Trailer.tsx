import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SCENES, STARTS, TOTAL } from "./scenes";
import { CueScheduler, rewindMusic, startMusic, stopMusic } from "./audio";

/* Index of the active scene for a given absolute elapsed time. */
function sceneIndexAt(elapsed: number): number {
  let i = 0;
  for (let k = 0; k < SCENES.length; k++) if (elapsed >= STARTS[k]) i = k;
  return i;
}

/* Static single-scene preview for screenshots/inspection, e.g.
 * `/trailer/?preview=multi&ts=3.4` renders the "multi" scene frozen at 3.4s
 * with no gate and no clock. Not linked from the UI. */
function PreviewFrame({ id, ts }: { id: string; ts: number }) {
  const idx = Math.max(0, SCENES.findIndex((s) => s.id === id));
  const Scene = SCENES[idx].Comp;
  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--bg2)] text-[color:var(--accent)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(var(--accent-rgb),0.06),transparent_55%),radial-gradient(120%_120%_at_50%_115%,rgba(0,0,0,0.5),transparent_60%)]" />
      <Scene t={ts} />
    </div>
  );
}

export default function Trailer() {
  const preview = useMemo(() => {
    if (typeof window === "undefined") return null;
    const p = new URLSearchParams(window.location.search);
    const id = p.get("preview");
    if (!id) return null;
    return { id, ts: Number(p.get("ts") ?? "1") };
  }, []);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [flash, setFlash] = useState(0); // bump to replay the white flash
  // `run` bumps on restart; combined with scene id it forms the remount key.
  const [run, setRun] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [sceneIdx, setSceneIdx] = useState(0);

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const playingRef = useRef(false);
  const runRef = useRef(0);
  const prevSceneRef = useRef(0);

  const cues = useMemo(() => {
    // Flatten each scene's relative cues into absolute-time cues.
    const specs = SCENES.flatMap((s, i) => s.cues.map((c) => ({ t: STARTS[i] + c.t, cue: c.cue })));
    return new CueScheduler(specs);
  }, []);

  // Keep the scheduler's mute in sync.
  useEffect(() => {
    cues.setMuted(muted);
  }, [cues, muted]);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
  }, []);

  const tick = useCallback(
    (ts: number) => {
      if (!playingRef.current) return;
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      let next = elapsedRef.current + dt;
      if (next >= TOTAL) {
        next = TOTAL;
        cues.tick(next);
        elapsedRef.current = next;
        setElapsed(next);
        setPlaying(false);
        playingRef.current = false;
        stopLoop();
        return;
      }

      cues.tick(next);
      elapsedRef.current = next;
      setElapsed(next);

      const idx = sceneIndexAt(next);
      if (idx !== prevSceneRef.current) {
        prevSceneRef.current = idx;
        setSceneIdx(idx);
        setFlash((f) => f + 1); // white flash on every hard cut
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [cues, stopLoop],
  );

  const play = useCallback(() => {
    if (playingRef.current) return;
    if (elapsedRef.current >= TOTAL) {
      // restart from the top
      elapsedRef.current = 0;
      setElapsed(0);
      setSceneIdx(0);
      prevSceneRef.current = 0;
      runRef.current += 1;
      setRun(runRef.current);
      cues.reset(0);
    }
    playingRef.current = true;
    setPlaying(true);
    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  }, [cues, tick]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    stopLoop();
  }, [stopLoop]);

  const togglePlay = useCallback(() => {
    if (playingRef.current) pause();
    else play();
  }, [pause, play]);

  const restart = useCallback(() => {
    stopLoop();
    elapsedRef.current = 0;
    setElapsed(0);
    setSceneIdx(0);
    prevSceneRef.current = 0;
    runRef.current += 1;
    setRun(runRef.current);
    cues.reset(0);
    rewindMusic();
    setFlash((f) => f + 1);
    playingRef.current = true;
    setPlaying(true);
    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  }, [cues, stopLoop, tick]);

  /* Seek a whole scene at a time so we always land on a clean beat: set elapsed
   * to the target scene start, bump the remount key so its CSS entrances replay,
   * and reset the cue bookkeeping so cues fire from the new position. */
  const seekScene = useCallback(
    (dir: -1 | 1) => {
      const cur = sceneIndexAt(elapsedRef.current);
      const target = Math.min(SCENES.length - 1, Math.max(0, cur + dir));
      const at = STARTS[target];
      elapsedRef.current = at;
      setElapsed(at);
      setSceneIdx(target);
      prevSceneRef.current = target;
      runRef.current += 1;
      setRun(runRef.current);
      cues.reset(at);
      setFlash((f) => f + 1);
      lastTsRef.current = null;
    },
    [cues],
  );

  const boot = useCallback(() => {
    setStarted(true);
    startMusic();
    // small delay so the gate's fade doesn't clip the first slam
    requestAnimationFrame(() => play());
  }, [play]);

  // Keyboard: space play/pause, R restart, M mute, ←/→ seek by scene.
  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "r" || e.key === "R") restart();
      else if (e.key === "m" || e.key === "M") setMuted((m) => !m);
      else if (e.key === "ArrowRight") seekScene(1);
      else if (e.key === "ArrowLeft") seekScene(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, togglePlay, restart, seekScene]);

  useEffect(() => () => stopLoop(), [stopLoop]);
  useEffect(() => () => stopMusic(), []);

  // `?auto=1` starts playback immediately without the click gate or audio —
  // for automated/live screenshots. Not linked from the UI.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("auto") === "1" && !started) {
      setStarted(true);
      setMuted(true);
      play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── HD video export (browser-native) ────────────────────────────────────
  const exportVideo = useCallback(async () => {
    const nav = navigator.mediaDevices as MediaDevices | undefined;
    if (!nav?.getDisplayMedia || typeof MediaRecorder === "undefined") {
      alert(
        "This browser can't capture the tab. Use a desktop Chromium browser, or screen-record /trailer/ manually.",
      );
      return;
    }

    let stream: MediaStream;
    try {
      stream = await nav.getDisplayMedia({
        video: { width: 1920, height: 1080, frameRate: 60 },
        // Disable voice-processing on captured tab audio — auto-gain pumps the
        // level and noise-suppression chews music/SFX (the #1 cause of bad
        // recorded audio). Ask for stereo / 48kHz.
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
          channelCount: 2,
          sampleRate: 48000,
        } as MediaTrackConstraints,
        // @ts-expect-error preferCurrentTab is Chromium-only
        preferCurrentTab: true,
      });
    } catch {
      return; // user cancelled the share dialog
    }

    // Prefer VP9/WebM — Chromium's mature high-quality path. MP4 here routes to
    // an immature muxer that drops quality; convert to .mp4 afterward instead.
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const rec = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 16_000_000,
      audioBitsPerSecond: 192_000,
    });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);

    const cleanup = () => {
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      if (document.fullscreenElement) void document.exitFullscreen();
    };

    rec.onstop = () => {
      cleanup();
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sudotiles-trailer.webm";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    };

    // If the user stops sharing from the browser bar, finalize gracefully.
    stream.getVideoTracks()[0].addEventListener("ended", () => {
      if (rec.state !== "inactive") rec.stop();
    });

    setRecording(true);
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* fullscreen optional */
    }

    rec.start();
    restart();
    // Stop a beat after the timeline ends.
    setTimeout(
      () => {
        if (rec.state !== "inactive") rec.stop();
      },
      (TOTAL + 0.6) * 1000,
    );
  }, [restart]);

  const Scene = SCENES[sceneIdx].Comp;
  const sceneStart = STARTS[sceneIdx];
  const sceneT = elapsed - sceneStart;
  const atEnd = elapsed >= TOTAL;
  const curIdx = sceneIndexAt(elapsed);

  // Static preview short-circuits the whole player (all hooks above still run).
  if (preview) return <PreviewFrame id={preview.id} ts={preview.ts} />;

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[var(--bg2)] text-[color:var(--accent)] ${
        !playing && started ? "tr-paused" : ""
      } ${recording ? "tr-recording" : ""}`}
    >
      {/* subtle brand vignette matching the app's board glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(var(--accent-rgb),0.06),transparent_55%),radial-gradient(120%_120%_at_50%_115%,rgba(0,0,0,0.5),transparent_60%)]" />

      {/* Active scene, keyed on id + run so it remounts (replaying entrances) on
          every scene change and on restart. */}
      <div key={`${SCENES[sceneIdx].id}:${run}`} className="absolute inset-0">
        <Scene t={Math.max(0, sceneT)} />
      </div>

      {/* White flash between scenes. */}
      <div
        key={`flash:${flash}`}
        className="pointer-events-none absolute inset-0 bg-white"
        style={{ opacity: 0, animation: flash ? "tr-flash 0.22s ease-out both" : undefined }}
      />

      {/* Click-to-play gate (also boots audio via the user gesture). */}
      {!started && (
        <button
          onClick={boot}
          className="absolute inset-0 z-30 flex cursor-pointer flex-col items-center justify-center gap-6 border-none bg-[var(--bg2)]"
        >
          <span className="text-[clamp(2.5rem,10vw,7rem)] font-bold tracking-[-0.02em] text-[var(--accent)]">
            Sudotiles
          </span>
          <span className="flex items-center gap-3 rounded-full bg-white/[0.07] px-6 py-3 text-[clamp(1rem,2.6vw,1.4rem)] font-medium text-[#ecebe8] shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset]">
            <span className="text-[var(--accent)]">▶</span> Play trailer
          </span>
          <span className="text-[13px] text-[#7d766c]">with sound</span>
        </button>
      )}

      {/* Controls + progress (hidden while recording). */}
      {started && !recording && (
        <>
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
            <Btn label="Mute (M)" onClick={() => setMuted((m) => !m)} active={muted}>
              {muted ? "🔇" : "🔊"}
            </Btn>
            <Btn label="Previous scene (←)" onClick={() => seekScene(-1)} disabled={curIdx === 0}>
              ⏮
            </Btn>
            <Btn label="Play / pause (Space)" onClick={togglePlay}>
              {atEnd ? "↺" : playing ? "⏸" : "▶"}
            </Btn>
            <Btn
              label="Next scene (→)"
              onClick={() => seekScene(1)}
              disabled={curIdx === SCENES.length - 1}
            >
              ⏭
            </Btn>
            <Btn label="Restart (R)" onClick={restart}>
              ⟳
            </Btn>
            <Btn label="Export HD video" onClick={exportVideo}>
              ⬇
            </Btn>
          </div>

          <div className="absolute right-0 bottom-0 left-0 z-20 h-1 bg-white/10">
            <div
              className="h-full bg-[var(--accent)]"
              style={{ width: `${(elapsed / TOTAL) * 100}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Btn({
  children,
  label,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none text-[16px] shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset] transition-[filter,opacity] duration-100 hover:brightness-125 disabled:cursor-default disabled:opacity-30 ${
        active ? "bg-[var(--accent)] text-[var(--bg2)]" : "bg-white/[0.07] text-[#ecebe8]"
      }`}
    >
      {children}
    </button>
  );
}
