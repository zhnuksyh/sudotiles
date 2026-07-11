import Board from "./components/Board";
import Confetti from "./components/Confetti";
import Controls from "./components/Controls";
import DifficultyModal from "./components/DifficultyModal";
import GameOverlay from "./components/GameOverlay";
import Hud from "./components/Hud";
import NumberPad from "./components/NumberPad";
import StreakFlourish from "./components/StreakFlourish";
import { useSudotiles } from "./game/useSudotiles";

function App() {
  const { state, flash, shaking, diff, confettiRef, actions } = useSudotiles();

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-8 font-sans"
      style={{
        background:
          "radial-gradient(135% 105% at 50% 14%, #171614 0%, #100f0e 58%, #0a0908 100%)",
      }}
    >
      <div
        className="flex flex-col items-center gap-5"
        style={{ animation: shaking ? "st-shake 0.45s ease-in-out" : "" }}
      >
        <Hud hearts={state.hearts} score={state.score} elapsed={state.elapsed} streak={state.streak} />
        <Board state={state} onSelect={actions.select} />
        <div className="flex w-[560px] max-w-[90vw] flex-col gap-3">
          <NumberPad onPlace={actions.placeNum} onScribble={actions.scribbleToggle} />
          <Controls
            guides={state.guides}
            pencil={state.pencil}
            onToggleGuides={actions.toggleGuides}
            onTogglePencil={actions.togglePencil}
            onErase={actions.erase}
            onOpenDiff={actions.openDiff}
          />
        </div>
      </div>

      <Confetti ref={confettiRef} />

      <StreakFlourish show={flash.on} text={flash.text} />

      <DifficultyModal
        open={diff.open}
        closing={diff.closing}
        current={state.difficulty}
        onSelect={actions.setDifficulty}
        onClose={actions.closeDiff}
      />

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
