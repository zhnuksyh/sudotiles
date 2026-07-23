import { useRef, useState } from "react";
import { APP_VERSION, DIFFICULTIES, REPO_URL } from "../game/constants";
import type { NumpadPosition, Settings, ThemeChoice } from "../game/settings";
import { ChevronDownIcon, CloseIcon, GitHubIcon } from "./icons";

const ACTIVE_BG = "rgba(var(--sel-rgb),0.10)";
const ACTIVE_SHADOW = "0 0 0 2px rgba(var(--sel-rgb),0.55) inset";
const ACTIVE_COLOR = "var(--ink0)";
const IDLE_BG = "linear-gradient(180deg,var(--row0),var(--row1))";
const IDLE_SHADOW = "0 1px 0 rgba(255,255,255,0.04) inset";
const IDLE_COLOR = "var(--ink1)";

interface SettingsModalProps {
  open: boolean;
  closing: boolean;
  settings: Settings;
  onSelectDifficulty: (label: string) => void;
  onSetNumpadPosition: (position: NumpadPosition) => void;
  onSetTheme: (theme: ThemeChoice) => void;
  customBg: string | null;
  onUploadBackground: (file: File) => void;
  onRemoveBackground: () => void;
  onToggleLives: () => void;
  onToggleTimer: () => void;
  onToggleKeyboard: () => void;
  onToggleAnimations: () => void;
  onToggleSounds: () => void;
  onToggleGuides: () => void;
  onClose: () => void;
}

// Hide keyboard-only options on touch devices where they don't apply.
const isTouchDevice =
  typeof window !== "undefined" &&
  ("ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0);

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mt-3 mb-1 text-[11px] font-semibold tracking-[1.5px] text-[var(--ink5)] uppercase">
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
      <span className="text-[15px] font-medium text-[var(--ink1)]">{label}</span>
      <span
        className="relative inline-flex h-[26px] w-[46px] shrink-0 items-center rounded-full transition-colors duration-150"
        style={{ background: on ? "rgba(var(--sel-rgb),0.85)" : "rgba(255,255,255,0.10)" }}
      >
        <span
          className="absolute h-[20px] w-[20px] rounded-full bg-[var(--knob)] transition-transform duration-150"
          style={{ transform: on ? "translateX(23px)" : "translateX(3px)" }}
        />
      </span>
    </button>
  );
}

/* Custom difficulty dropdown styled to match the app (no native <select>). */
function DifficultyDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = DIFFICULTIES.find((d) => d.label === value) ?? DIFFICULTIES[1];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[14px] border-none px-4 py-[13px] text-left transition-[filter] duration-100 ease-in-out hover:brightness-[1.12]"
        style={{ background: IDLE_BG, boxShadow: IDLE_SHADOW }}
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-[16px] font-semibold" style={{ color: IDLE_COLOR }}>
            {current.label}
          </span>
          <span className="text-[12px] font-normal text-[var(--ink4)]">{current.desc}</span>
        </span>
        <span
          className="shrink-0 text-[var(--ink4)] transition-transform duration-150"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <>
          {/* Click-away layer to close the menu. */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            className="absolute top-[calc(100%+6px)] right-0 left-0 z-20 flex flex-col gap-1 rounded-[14px] bg-gradient-to-b from-[var(--menu0)] to-[var(--menu1)] p-1.5 shadow-[0_18px_40px_-10px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
            style={{ animation: "st-drop 0.18s ease-out both" }}
          >
            {DIFFICULTIES.map((d) => {
              const active = d.label === value;
              return (
                <button
                  key={d.label}
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setOpen(false);
                    if (!active) onChange(d.label);
                  }}
                  className={`flex cursor-pointer flex-col gap-0.5 rounded-[10px] border-none px-3 py-2.5 text-left transition-[filter,box-shadow] duration-100 ease-in-out hover:brightness-[1.15] ${
                    active ? "" : "hover:shadow-[0_0_0_1.5px_rgba(var(--accent-rgb),0.55)_inset]"
                  }`}
                  style={{
                    background: active ? ACTIVE_BG : "transparent",
                    boxShadow: active ? ACTIVE_SHADOW : undefined,
                  }}
                >
                  <span
                    className="text-[15px] font-semibold"
                    style={{ color: active ? ACTIVE_COLOR : IDLE_COLOR }}
                  >
                    {d.label}
                  </span>
                  <span className="text-[11.5px] font-normal text-[var(--ink4)]">{d.desc}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* Background picker: the default dark look, or an uploaded picture — the page
 * background becomes the picture and the accent/surface palette is derived
 * automatically from its colors. */
function BackgroundPicker({
  value,
  onChange,
  customBg,
  onUpload,
  onRemove,
}: {
  value: ThemeChoice;
  onChange: (t: ThemeChoice) => void;
  customBg: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const customActive = value === "custom";

  // Non-selected tiles get an accent outline on hover (inline boxShadow must
  // stay unset on them or it would override the hover class).
  const tileClass = (active: boolean) =>
    `flex cursor-pointer flex-col items-center gap-1.5 rounded-[14px] border-none px-1 py-2.5 transition-[transform,filter,box-shadow] duration-100 ease-in-out hover:-translate-y-px hover:brightness-[1.15] active:translate-y-0 ${
      active ? "" : "hover:shadow-[0_0_0_1.5px_rgba(var(--accent-rgb),0.55)_inset]"
    }`;

  // Swatch previews are deliberately literal: each tile must show its own
  // theme's colours, not the theme that happens to be active.
  const presets: { id: ThemeChoice; label: string; title: string; surface: string; accent: string }[] = [
    { id: "ember", label: "Ember", title: "The default warm dark look", surface: "#211f1d", accent: "#dcb887" },
    { id: "void", label: "Void", title: "Black & white", surface: "#1f1f1f", accent: "#e6e6e6" },
  ];

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = ""; // allow re-picking the same file
        }}
      />
      <div className="grid grid-cols-4 gap-2">
        {presets.map((p) => {
          const active = value === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onChange(p.id)}
              title={p.title}
              className={tileClass(active)}
              style={{
                background: active ? ACTIVE_BG : "transparent",
                boxShadow: active ? ACTIVE_SHADOW : undefined,
              }}
            >
              <span
                className="relative h-[30px] w-[30px] rounded-full"
                style={{
                  background: p.surface,
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.12) inset, 0 2px 5px rgba(0,0,0,0.4)",
                }}
              >
                <span
                  className="absolute right-[3px] bottom-[3px] h-[12px] w-[12px] rounded-full"
                  style={{ background: p.accent }}
                />
              </span>
              <span
                className="text-[11.5px] font-medium"
                style={{ color: active ? ACTIVE_COLOR : "var(--ink4)" }}
              >
                {p.label}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => {
            // No picture yet (or re-tapping the active tile): open the picker.
            if (!customBg || customActive) fileRef.current?.click();
            else onChange("custom");
          }}
          title={customBg ? "Use your picture (tap again to change it)" : "Upload a background picture"}
          className={tileClass(customActive)}
          style={{
            background: customActive ? ACTIVE_BG : "transparent",
            boxShadow: customActive ? ACTIVE_SHADOW : undefined,
          }}
        >
          <span
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-cover bg-center text-[16px] leading-none text-[var(--ink4)]"
            style={{
              backgroundImage: customBg ? `url("${customBg}")` : undefined,
              boxShadow: customBg
                ? "0 0 0 1px rgba(255,255,255,0.12) inset, 0 2px 5px rgba(0,0,0,0.4)"
                : "0 0 0 1.5px rgba(255,255,255,0.18) inset",
            }}
          >
            {!customBg && "+"}
          </span>
          <span
            className="text-[11.5px] font-medium"
            style={{ color: customActive ? ACTIVE_COLOR : "var(--ink4)" }}
          >
            Custom
          </span>
        </button>
      </div>
      {customBg && (
        <button
          onClick={onRemove}
          className="mt-1.5 cursor-pointer self-start border-none bg-transparent px-1 py-0.5 text-[11.5px] font-medium text-[var(--ink4)] transition-[filter] duration-100 ease-in-out hover:brightness-140"
        >
          Remove custom background
        </button>
      )}
    </>
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
              color: active ? ACTIVE_COLOR : "var(--ink4)",
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
  onSetTheme,
  customBg,
  onUploadBackground,
  onRemoveBackground,
  onToggleLives,
  onToggleTimer,
  onToggleKeyboard,
  onToggleAnimations,
  onToggleSounds,
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
        className="relative flex max-h-[86vh] w-[min(92vw,340px)] flex-col overflow-y-auto rounded-[26px] bg-gradient-to-b from-[var(--panel0)] to-[var(--panel1)] p-[26px] shadow-[0_34px_70px_-18px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.05)_inset] sm:w-[400px] lg:w-[440px]"
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
          className="absolute top-[18px] right-[18px] z-10 flex cursor-pointer items-center justify-center rounded-[10px] border-none bg-white/[0.06] p-1.5 text-[var(--ink2)] transition-[filter] duration-100 ease-in-out hover:brightness-150"
        >
          <CloseIcon />
        </button>

        <div className="text-[20px] font-semibold text-[var(--ink0)]">Settings</div>

        <SectionLabel>Difficulty</SectionLabel>
        <DifficultyDropdown value={settings.difficulty} onChange={onSelectDifficulty} />

        <SectionLabel>Background</SectionLabel>
        <BackgroundPicker
          value={settings.theme}
          onChange={onSetTheme}
          customBg={customBg}
          onUpload={onUploadBackground}
          onRemove={onRemoveBackground}
        />

        <SectionLabel>Number pad</SectionLabel>
        <Segmented value={settings.numpadPosition} onChange={onSetNumpadPosition} />

        <SectionLabel>Gameplay</SectionLabel>
        <div className="flex flex-col gap-2">
          <Toggle on={settings.guidesEnabled} onChange={onToggleGuides} label="Show guide" />
          <Toggle on={settings.livesEnabled} onChange={onToggleLives} label="Lives" />
          <Toggle on={settings.timerEnabled} onChange={onToggleTimer} label="Timer" />
          <Toggle on={settings.animationsEnabled} onChange={onToggleAnimations} label="Animations" />
          <Toggle on={settings.soundsEnabled} onChange={onToggleSounds} label="Sounds" />
          {!isTouchDevice && (
            <Toggle
              on={settings.keyboardEnabled}
              onChange={onToggleKeyboard}
              label="Keyboard shortcuts"
            />
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <span className="text-[12px] text-[var(--ink5)]">Sudotiles v{APP_VERSION}</span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            title="View source on GitHub"
            className="flex items-center justify-center rounded-[10px] bg-white/[0.06] p-2 text-[var(--ink2)] transition-[filter] duration-100 ease-in-out hover:brightness-150"
          >
            <GitHubIcon />
          </a>
        </div>
      </div>
    </div>
  );
}
