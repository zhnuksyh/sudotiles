import Board from "./components/Board";
import Confetti from "./components/Confetti";
import ConfirmModal from "./components/ConfirmModal";
import Controls from "./components/Controls";
import GameOverlay from "./components/GameOverlay";
import GuideModal from "./components/GuideModal";
import HistoryModal from "./components/HistoryModal";
import Hud from "./components/Hud";
import NumberPad from "./components/NumberPad";
import SettingsModal from "./components/SettingsModal";
import StreakFlourish from "./components/StreakFlourish";
import { useSudotiles } from "./game/useSudotiles";

function App() {
  const {
    state,
    settings,
    flash,
    shaking,
    diff,
    confirm,
    guide,
    history,
    notice,
    tutorialStep,
    confettiRef,
    actions,
  } = useSudotiles();

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
      onDragSelect={actions.dragSelect}
      animate={animate}
      guides={settings.guidesEnabled}
      tutorialStep={tutorialStep}
      onTutorialNext={actions.nextTutorialStep}
      onTutorialSkip={actions.skipTutorial}
    />
  );

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden overflow-y-auto px-3 py-5 font-sans sm:px-6 sm:py-8"
      style={{
        background:
          "radial-gradient(135% 105% at 50% 14%, var(--bg0) 0%, var(--bg1) 58%, var(--bg2) 100%)",
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
                onShare={() => actions.sharePuzzle()}
                onOpenHistory={actions.openHistory}
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
                onShare={() => actions.sharePuzzle()}
                onOpenHistory={actions.openHistory}
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
        onSetTheme={actions.setTheme}
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

      <GuideModal
        open={guide.open}
        closing={guide.closing}
        animate={animate}
        onStartTutorial={actions.startTutorial}
        onClose={actions.closeGuide}
      />

      <HistoryModal
        open={history.open}
        closing={history.closing}
        animate={animate}
        onShare={(givens, difficulty) => actions.sharePuzzle(givens, difficulty)}
        onClose={actions.closeHistory}
      />

      {notice && (
        <div
          className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[var(--menu0)] px-5 py-2.5 text-[13px] font-medium text-[#e4e1db] shadow-[0_12px_30px_-8px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.07)_inset]"
          style={{ animation: animate ? "st-rise 0.25s ease-out both" : undefined }}
        >
          {notice}
        </div>
      )}

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
