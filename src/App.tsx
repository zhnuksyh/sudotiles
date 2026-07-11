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
  const animate = settings.animationsEnabled;

  const hud = (
    <Hud
      hearts={state.hearts}
      score={state.score}
      elapsed={state.elapsed}
      streak={state.streak}
      showLives={settings.livesEnabled}
      showTimer={settings.timerEnabled}
    />
  );

  const board = (
    <Board
      state={state}
      onSelect={actions.select}
      animate={animate}
      guides={settings.guidesEnabled}
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
        style={{ animation: shaking && animate ? "st-shake 0.45s ease-in-out" : "" }}
      >
        {numpadRight ? (
          /* Right layout. On wide viewports a 2-column grid keeps the header
             directly above the board (column 1) while the number pad and
             controls sit in column 2 starting at the board's top. It collapses
             to a single centered column (header, board, pad) on narrow screens. */
          <div className="flex flex-col items-center gap-4 sm:gap-5 lg:grid lg:grid-cols-[auto_248px] lg:items-start lg:gap-x-5 lg:gap-y-4">
            <div className="lg:col-start-1 lg:row-start-1 lg:justify-self-stretch">{hud}</div>
            <div className="lg:col-start-1 lg:row-start-2">{board}</div>
            <div className="flex w-full max-w-[min(560px,90vw)] flex-col gap-3 lg:col-start-2 lg:row-start-2 lg:w-[248px]">
              <NumberPad
                onPlace={actions.placeNum}
                onScribble={actions.scribbleToggle}
                orientation="vertical"
              />
              <Controls
                pencil={state.pencil}
                onTogglePencil={actions.togglePencil}
                onErase={actions.erase}
                onOpenDiff={actions.openDiff}
                onOpenGuide={actions.openGuide}
                onRefresh={actions.openConfirm}
                orientation="vertical"
              />
            </div>
          </div>
        ) : (
          /* Bottom layout (default): header, board, then pad + controls below. */
          <>
            {hud}
            {board}
            <div className="flex w-full max-w-[min(560px,90vw)] flex-col gap-3">
              <NumberPad onPlace={actions.placeNum} onScribble={actions.scribbleToggle} />
              <Controls
                pencil={state.pencil}
                onTogglePencil={actions.togglePencil}
                onErase={actions.erase}
                onOpenDiff={actions.openDiff}
                onOpenGuide={actions.openGuide}
                onRefresh={actions.openConfirm}
              />
            </div>
          </>
        )}
      </div>

      <Confetti ref={confettiRef} />

      <StreakFlourish show={flash.on} text={flash.text} animate={animate} />

      <SettingsModal
        open={diff.open}
        closing={diff.closing}
        settings={settings}
        onSelectDifficulty={actions.setDifficulty}
        onSetNumpadPosition={actions.setNumpadPosition}
        onToggleLives={actions.toggleLives}
        onToggleTimer={actions.toggleTimer}
        onToggleKeyboard={actions.toggleKeyboard}
        onToggleAnimations={actions.toggleAnimations}
        onToggleGuides={actions.toggleGuides}
        onClose={actions.closeDiff}
      />

      <ConfirmModal
        open={confirm.open}
        closing={confirm.closing}
        animate={animate}
        onConfirm={actions.confirmRefresh}
        onClose={actions.closeConfirm}
      />

      <GuideModal open={guide.open} closing={guide.closing} animate={animate} onClose={actions.closeGuide} />

      {state.over && (
        <GameOverlay
          title="Out of lives"
          subtitle={`You scored ${state.score.toLocaleString()} points in ${formatTime(state.elapsed)}`}
          buttonLabel="Play again"
          animate={animate}
          onButtonClick={actions.restart}
        />
      )}

      {state.won && (
        <GameOverlay
          title="Solved!"
          subtitle={`Final score ${state.score.toLocaleString()} · ${formatTime(state.elapsed)}`}
          buttonLabel="New puzzle"
          animate={animate}
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
