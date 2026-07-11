import { BookIcon, EraserIcon, GearIcon, PencilIcon, RefreshIcon } from "./icons";

const ACTIVE_BG = "rgba(224,170,96,0.12)";
const ACTIVE_SHADOW = "0 0 0 2px rgba(224,170,96,0.65) inset";
const ACTIVE_COLOR = "#dcb887";
const IDLE_BG = "linear-gradient(180deg,#242118,#1a1813)";
const IDLE_SHADOW = "0 2px 5px rgba(0,0,0,0.4),0 1px 0 rgba(255,255,255,0.04) inset";
const IDLE_COLOR = "#c2bcb2";

interface ControlsProps {
  guides: boolean;
  pencil: boolean;
  onToggleGuides: () => void;
  onTogglePencil: () => void;
  onErase: () => void;
  onOpenDiff: () => void;
  onOpenGuide: () => void;
  onRefresh: () => void;
}

const buttonBase =
  "cursor-pointer rounded-[14px] border-none transition-[transform,filter] duration-100 ease-in-out hover:-translate-y-0.5 hover:brightness-115 active:translate-y-0";

export default function Controls({
  guides,
  pencil,
  onToggleGuides,
  onTogglePencil,
  onErase,
  onOpenDiff,
  onOpenGuide,
  onRefresh,
}: ControlsProps) {
  return (
    <div className="grid grid-cols-9 items-stretch gap-2">
      <button
        onClick={onToggleGuides}
        className={`${buttonBase} col-span-2 px-1.5 py-[11px] text-[15px] font-medium whitespace-nowrap`}
        style={{
          background: guides ? ACTIVE_BG : IDLE_BG,
          boxShadow: guides ? ACTIVE_SHADOW : IDLE_SHADOW,
          color: guides ? ACTIVE_COLOR : IDLE_COLOR,
        }}
      >
        Show Guide
      </button>
      <button
        onClick={onOpenGuide}
        title="How to play"
        className={`${buttonBase} flex items-center justify-center py-[11px]`}
        style={{ background: IDLE_BG, boxShadow: IDLE_SHADOW, color: IDLE_COLOR }}
      >
        <BookIcon />
      </button>
      <button
        onClick={onTogglePencil}
        title="Scribble"
        className={`${buttonBase} col-start-6 flex items-center justify-center py-[11px]`}
        style={{
          background: pencil ? ACTIVE_BG : IDLE_BG,
          boxShadow: pencil ? ACTIVE_SHADOW : IDLE_SHADOW,
          color: pencil ? ACTIVE_COLOR : IDLE_COLOR,
        }}
      >
        <PencilIcon />
      </button>
      <button
        onClick={onErase}
        title="Erase"
        className={`${buttonBase} flex items-center justify-center py-[11px]`}
        style={{ background: IDLE_BG, boxShadow: IDLE_SHADOW, color: IDLE_COLOR }}
      >
        <EraserIcon />
      </button>
      <button
        onClick={onRefresh}
        title="New puzzle"
        className={`${buttonBase} flex items-center justify-center py-[11px]`}
        style={{ background: IDLE_BG, boxShadow: IDLE_SHADOW, color: IDLE_COLOR }}
      >
        <RefreshIcon />
      </button>
      <button
        onClick={onOpenDiff}
        title="Difficulty"
        className={`${buttonBase} flex items-center justify-center py-[11px]`}
        style={{ background: IDLE_BG, boxShadow: IDLE_SHADOW, color: IDLE_COLOR }}
      >
        <GearIcon />
      </button>
    </div>
  );
}
