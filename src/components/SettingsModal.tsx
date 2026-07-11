import { DIFFICULTIES } from "../game/constants";
import type { NumpadPosition, Settings } from "../game/settings";
import { CloseIcon } from "./icons";

const ACTIVE_BG = "rgba(226,224,220,0.10)";
const ACTIVE_SHADOW = "0 0 0 2px rgba(214,210,203,0.55) inset";
const ACTIVE_COLOR = "#e0ddd6";
const IDLE_BG = "linear-gradient(180deg,#282520,#1e1b17)";
const IDLE_SHADOW = "0 1px 0 rgba(255,255,255,0.04) inset";
const IDLE_COLOR = "#e4e1db";

interface SettingsModalProps {
  open: boolean;
  closing: boolean;
  settings: Settings;
  onSelectDifficulty: (label: string) => void;
  onSetNumpadPosition: (position: NumpadPosition) => void;
  onToggleLives: () => void;
  onToggleTimer: () => void;
  onToggleKeyboard: () => void;
  onToggleAnimations: () => void;
  onToggleGuides: () => void;
  onClose: () => void;
}

// Hide keyboard-only options on touch devices where they don't apply.
const isTouchDevice =
  typeof window !== "undefined" &&
  ("ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0);

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mt-3 mb-1 text-[11px] font-semibold tracking-[1.5px] text-[#7d766c] uppercase">
      {children}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      className="flex cursor-pointer items-center justify-between border-none bg-transparent px-1 py-2 text-left transition-[filter] duration-100 ease-in-out hover:brightness-[1.1]"
    >
      <span className="text-[15px] font-medium text-[#e4e1db]">{label}</span>
      <span
        className="relative inline-flex h-[26px] w-[46px] shrink-0 items-center rounded-full transition-colors duration-150"
        style={{ background: on ? "rgba(214,210,203,0.85)" : "rgba(255,255,255,0.10)" }}
      >
        <span
          className="absolute h-[20px] w-[20px] rounded-full bg-[#191714] transition-transform duration-150"
          style={{ transform: on ? "translateX(23px)" : "translateX(3px)" }}
        />
      </span>
    </button>
  );
}

function Segmented({
  value,
  onChange,
}: {
  value: NumpadPosition;
  onChange: (position: NumpadPosition) => void;
}) {
  const options: { key: NumpadPosition; label: string }[] = [
    { key: "bottom", label: "Bottom" },
    { key: "right", label: "Right" },
  ];
  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-[14px] p-1"
      style={{ background: "rgba(0,0,0,0.25)" }}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className="cursor-pointer rounded-[10px] border-none py-2.5 text-[14px] font-medium transition-[filter] duration-100 ease-in-out hover:brightness-110"
            style={{
              background: active ? ACTIVE_BG : "transparent",
              boxShadow: active ? ACTIVE_SHADOW : "none",
              color: active ? ACTIVE_COLOR : "#8a837a",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsModal({
  open,
  closing,
  settings,
  onSelectDifficulty,
  onSetNumpadPosition,
  onToggleLives,
  onToggleTimer,
  onToggleKeyboard,
  onToggleAnimations,
  onToggleGuides,
  onClose,
}: SettingsModalProps) {
  if (!open) return null;

  const animate = settings.animationsEnabled;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
      style={{
        animation: animate
          ? closing
            ? "st-fadeout 0.2s ease-in both"
            : "st-fade 0.2s ease-out both"
          : undefined,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[86vh] w-[min(92vw,340px)] flex-col overflow-y-auto rounded-[26px] bg-gradient-to-b from-[#201e1b] to-[#161513] p-[26px] shadow-[0_34px_70px_-18px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.05)_inset] sm:w-[400px] lg:w-[440px]"
        style={{
          animation: animate
            ? closing
              ? "st-fall 0.2s ease-in both"
              : "st-rise 0.28s ease-out both"
            : undefined,
        }}
      >
        <button
          onClick={onClose}
          title="Close"
          className="absolute top-[18px] right-[18px] z-10 flex cursor-pointer items-center justify-center rounded-[10px] border-none bg-white/[0.06] p-1.5 text-[#b3ada3] transition-[filter] duration-100 ease-in-out hover:brightness-150"
        >
          <CloseIcon />
        </button>

        <div className="text-[20px] font-semibold text-[#ecebe8]">Settings</div>

        <SectionLabel>Difficulty</SectionLabel>
        <div className="flex flex-col gap-2">
          {DIFFICULTIES.map((d) => {
            const active = d.label === settings.difficulty;
            return (
              <button
                key={d.label}
                onClick={() => onSelectDifficulty(d.label)}
                className="flex cursor-pointer flex-col gap-0.5 rounded-[14px] border-none px-4 py-[13px] text-left transition-[transform,filter] duration-100 ease-in-out hover:-translate-y-px hover:brightness-[1.12] active:translate-y-0"
                style={{
                  background: active ? ACTIVE_BG : IDLE_BG,
                  boxShadow: active ? ACTIVE_SHADOW : IDLE_SHADOW,
                }}
              >
                <span
                  className="text-[16px] font-semibold"
                  style={{ color: active ? ACTIVE_COLOR : IDLE_COLOR }}
                >
                  {d.label}
                </span>
                <span className="text-[12px] font-normal text-[#8a837a]">{d.desc}</span>
              </button>
            );
          })}
        </div>

        <SectionLabel>Number pad</SectionLabel>
        <Segmented value={settings.numpadPosition} onChange={onSetNumpadPosition} />

        <SectionLabel>Gameplay</SectionLabel>
        <div className="flex flex-col gap-2">
          <Toggle on={settings.guidesEnabled} onChange={onToggleGuides} label="Show guide" />
          <Toggle on={settings.livesEnabled} onChange={onToggleLives} label="Lives" />
          <Toggle on={settings.timerEnabled} onChange={onToggleTimer} label="Timer" />
          <Toggle on={settings.animationsEnabled} onChange={onToggleAnimations} label="Animations" />
          {!isTouchDevice && (
            <Toggle
              on={settings.keyboardEnabled}
              onChange={onToggleKeyboard}
              label="Keyboard shortcuts"
            />
          )}
        </div>
      </div>
    </div>
  );
}
