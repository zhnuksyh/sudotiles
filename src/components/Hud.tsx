import { HeartEmptyIcon, HeartFilledIcon } from "./icons";
import { MAX_HEARTS, streakMultiplier } from "../game/constants";

interface HudProps {
  hearts: number;
  score: number;
  elapsed: number;
  streak: number;
  showLives: boolean;
  showTimer: boolean;
}

export default function Hud({ hearts, score, elapsed, streak, showLives, showTimer }: HudProps) {
  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, "0");
  const timeLabel = `${mm}:${ss}`;
  const mult = streakMultiplier(streak);

  return (
    <div className="grid w-full max-w-[min(560px,90vw)] grid-cols-[1fr_auto_1fr] items-center">
      <div className="flex items-center justify-self-start gap-[7px]">
        {showLives &&
          Array.from({ length: MAX_HEARTS }, (_, i) =>
            i < hearts ? <HeartFilledIcon key={i} /> : <HeartEmptyIcon key={i} />,
          )}
      </div>
      <div className="flex items-start justify-self-center gap-[26px] sm:gap-[34px]">
        <div className="text-center">
          <div className="text-[11px] font-medium tracking-[2.5px] text-[#7d766c]">SCORE</div>
          <div className="text-[26px] leading-[1.05] font-semibold text-[#ecebe8] sm:text-[32px]">
            {score.toLocaleString()}
          </div>
        </div>
        {showTimer && (
          <div className="text-center">
            <div className="text-[11px] font-medium tracking-[2.5px] text-[#7d766c]">TIME</div>
            <div className="text-[26px] leading-[1.05] font-semibold text-[#b3ada3] [font-variant-numeric:tabular-nums] sm:text-[32px]">
              {timeLabel}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end justify-self-end">
        <div className="text-[11px] font-medium tracking-[2.5px] text-[#7d766c]">STREAK</div>
        <span className="flex items-baseline gap-1.5 text-[26px] leading-[1.05] font-semibold text-[#d8d3ca] sm:text-[32px]">
          {streak}
          {mult > 1 && (
            <span className="text-[15px] font-semibold text-[var(--accent)] sm:text-[17px]">
              ×{mult}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
