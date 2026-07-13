import { BookIcon, EraserIcon, GearIcon, HistoryIcon, PencilIcon, RefreshIcon, ShareIcon } from "./icons";

const ACTIVE_BG = "rgba(var(--accent-rgb),0.12)";
const ACTIVE_SHADOW = "0 0 0 2px rgba(var(--accent-rgb),0.65) inset";
const ACTIVE_COLOR = "var(--accent)";
const IDLE_BG = "linear-gradient(180deg,var(--ctl0),var(--ctl1))";
const IDLE_SHADOW = "0 2px 5px rgba(0,0,0,0.4),0 1px 0 rgba(255,255,255,0.04) inset";
const IDLE_COLOR = "#c2bcb2";

interface ControlsProps {
  pencil: boolean;
  onTogglePencil: () => void;
  onErase: () => void;
  onOpenDiff: () => void;
  onOpenGuide: () => void;
  onRefresh: () => void;
  onShare: () => void;
  onOpenHistory: () => void;
  orientation?: "horizontal" | "vertical";
}

const buttonBase =
  "cursor-pointer rounded-[14px] border-none transition-[transform,filter] duration-100 ease-in-out hover:-translate-y-0.5 hover:brightness-115 active:translate-y-0";

export default function Controls({
  pencil,
  onTogglePencil,
  onErase,
  onOpenDiff,
  onOpenGuide,
  onRefresh,
  onShare,
  onOpenHistory,
  orientation = "horizontal",
}: ControlsProps) {
  const vertical = orientation === "vertical";

  const guideBtn = (
    <button
      onClick={onOpenGuide}
      title="How to play"
      className={`${buttonBase} flex items-center justify-center py-[11px]`}
      style={{ background: IDLE_BG, boxShadow: IDLE_SHADOW, color: IDLE_COLOR }}
    >
      <BookIcon />
    </button>
  );

  const pencilBtn = (
    <button
      onClick={onTogglePencil}
      title="Scribble"
      className={`${buttonBase} flex items-center justify-center py-[11px]`}
      style={{
        background: pencil ? ACTIVE_BG : IDLE_BG,
        boxShadow: pencil ? ACTIVE_SHADOW : IDLE_SHADOW,
        color: pencil ? ACTIVE_COLOR : IDLE_COLOR,
      }}
    >
      <PencilIcon />
    </button>
  );

  const eraseBtn = (
    <button
      onClick={onErase}
      title="Erase"
      className={`${buttonBase} flex items-center justify-center py-[11px]`}
      style={{ background: IDLE_BG, boxShadow: IDLE_SHADOW, color: IDLE_COLOR }}
    >
      <EraserIcon />
    </button>
  );

  const refreshBtn = (
    <button
      onClick={onRefresh}
      title="New puzzle"
      className={`${buttonBase} flex items-center justify-center py-[11px]`}
      style={{ background: IDLE_BG, boxShadow: IDLE_SHADOW, color: IDLE_COLOR }}
    >
      <RefreshIcon />
    </button>
  );

  const shareBtn = (
    <button
      onClick={onShare}
      title="Share this puzzle"
      className={`${buttonBase} flex items-center justify-center py-[11px]`}
      style={{ background: IDLE_BG, boxShadow: IDLE_SHADOW, color: IDLE_COLOR }}
    >
      <ShareIcon />
    </button>
  );

  const historyBtn = (
    <button
      onClick={onOpenHistory}
      title="Solved history"
      className={`${buttonBase} flex items-center justify-center py-[11px]`}
      style={{ background: IDLE_BG, boxShadow: IDLE_SHADOW, color: IDLE_COLOR }}
    >
      <HistoryIcon />
    </button>
  );

  const gearBtn = (
    <button
      onClick={onOpenDiff}
      title="Settings"
      className={`${buttonBase} flex items-center justify-center py-[11px]`}
      style={{ background: IDLE_BG, boxShadow: IDLE_SHADOW, color: IDLE_COLOR }}
    >
      <GearIcon />
    </button>
  );

  // Right-column layout uses a compact 3-wide grid; the default bottom layout
  // spreads the seven buttons evenly in a single row.
  const wrapClass = vertical
    ? "grid grid-cols-3 items-stretch gap-2"
    : "grid grid-cols-7 items-stretch gap-1.5 sm:gap-2";

  return (
    <div className={wrapClass}>
      {guideBtn}
      {pencilBtn}
      {eraseBtn}
      {shareBtn}
      {historyBtn}
      {refreshBtn}
      {gearBtn}
    </div>
  );
}
