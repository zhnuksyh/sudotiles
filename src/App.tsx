import Board from "./components/Board";
import Confetti from "./components/Confetti";
import ConfirmModal from "./components/ConfirmModal";
import Controls from "./components/Controls";
import GameOverlay from "./components/GameOverlay";
import GuideModal from "./components/GuideModal";
import Hud from "./components/Hud";
import NumberPad from "./components/NumberPad";
import SettingsModal from "./components/SettingsModal";
import StreakFlourish from "./components/StreakFlourish";
import { useSudotiles } from "./game/useSudotiles";

function App() {
  const { state, settings, flash, shaking, diff, confirm, guide, confettiRef, actions } =
    useSudotiles();

  const numpadRight = settings.numpadPosition === "right";

  const numberPad = <NumberPad onPlace={actions.placeNum} onScribble={actions.scribbleToggle} />;
  const controls = (
    <Controls
      guides={state.guides}
      pencil={state.pencil}
      onToggleGuides={actions.toggleGuides}
      onTogglePencil={actions.togglePencil}
      onErase={actions.erase}
      onOpenDiff={actions.openDiff}
      onOpenGuide={actions.openGuide}
      onRefresh={actions.openConfirm}
    />
  );

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden overflow-y-auto px-3 py-5 font-sans sm:px-6 sm:py-8"
      style={{
        background:
          "radial-gradient(135% 105% at 50% 14%, #171614 0%, #100f0e 58%, #0a0908 100%)",
      }}
    >
      <div
        className="flex flex-col items-center gap-4 sm:gap-5"
        style={{ animation: shaking ? "st-shake 0.45s ease-in-out" : "" }}
      >
        <Hud
          hearts={state.hearts}
          score={state.score}
          elapsed={state.elapsed}
          streak={state.streak}
          showLives={settings.livesEnabled}
          showTimer={settings.timerEnabled}
        />

        {/* On "right", pad sits beside the board on wide viewports and collapses
            below it on narrow ones. On "bottom", it always sits below. */}
        <div
          className={
            numpadRight
              ? "flex flex-col items-center gap-4 lg:flex-row lg:items-start"
              : "flex flex-col items-center gap-4"
          }
        >
          <Board state={state} onSelect={actions.select} />
          <div
            className={
              numpadRight
                ? "flex w-full max-w-[min(560px,90vw)] flex-col gap-3 lg:w-auto"
                : "flex w-full max-w-[min(560px,90vw)] flex-col gap-3"
            }
          >
            <div className={numpadRight ? "lg:w-[240px]" : ""}>{numberPad}</div>
            {controls}
          </div>
        </div>
      </div>

      <Confetti ref={confettiRef} />

      <StreakFlourish show={flash.on} text={flash.text} />

      <SettingsModal
        open={diff.open}
        closing={diff.closing}
        settings={settings}
        onSelectDifficulty={actions.setDifficulty}
        onSetNumpadPosition={actions.setNumpadPosition}
        onToggleLives={actions.toggleLives}
        onToggleTimer={actions.toggleTimer}
        onClose={actions.closeDiff}
      />

      <ConfirmModal
        open={confirm.open}
        closing={confirm.closing}
        onConfirm={actions.confirmRefresh}
        onClose={actions.closeConfirm}
      />

      <GuideModal open={guide.open} closing={guide.closing} onClose={actions.closeGuide} />

      {state.over && (
        <GameOverlay
          title="Out of lives"
          subtitle={`You scored ${state.score.toLocaleString()} points in ${formatTime(state.elapsed)}`}
          buttonLabel="Play again"
          onButtonClick={actions.restart}
        />
      )}

      {state.won && (
        <GameOverlay
          title="Solved!"
          subtitle={`Final score ${state.score.toLocaleString()} · ${formatTime(state.elapsed)}`}
          buttonLabel="New puzzle"
          onButtonClick={actions.restart}
        />
      )}
    </div>
  );
}

function formatTime(elapsed: number) {
  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default App;
