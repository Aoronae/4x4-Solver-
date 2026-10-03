import { Rubik4x4State } from './core/Rubik4x4State.js';
import { Scrambler4x4 } from './core/Scrambler.js';
import { CubeRenderer } from './rendering/CubeRenderer.js';
import { AnimationEngine } from './rendering/AnimationEngine.js';
import { SpeedcubingTimer } from './ui/Timer.js';
import { ReductionSolver } from './solver/ReductionSolver.js';

window.addEventListener('DOMContentLoaded', () => {
  const rubikState = new Rubik4x4State();
  const canvasContainer = document.getElementById('cube-canvas-container');
  const cubeRenderer = new CubeRenderer(canvasContainer);
  const animEngine = new AnimationEngine(cubeRenderer, rubikState);
  animEngine.setSpeed(180);

  const timerDisplay = document.getElementById('timer-display');
  const timerStatus = document.getElementById('timer-status');
  const timer = new SpeedcubingTimer(timerDisplay, timerStatus);

  let solverWorker = null;
  try {
    solverWorker = new Worker(new URL('./solver/solver.worker.js', import.meta.url), { type: 'module' });
  } catch (err) {
    console.warn('Worker fallback:', err);
  }

  const btnResetCube = document.getElementById('btn-reset-cube');
  const btnSolveCube = document.getElementById('btn-solve-cube');
  const btnScramble = document.getElementById('btn-scramble');
  const scrambleLengthInput = document.getElementById('scramble-length');
  const scrambleDisplay = document.getElementById('scramble-display');
  const algoInput = document.getElementById('algo-input');
  const btnPlayAlgo = document.getElementById('btn-play-algo');

  btnResetCube.addEventListener('click', () => {
    animEngine.clearQueue();
    rubikState.reset();
    cubeRenderer.resetToSolved();
    timer.reset();
    scrambleDisplay.textContent = 'Cubo Resuelto';
  });

  document.querySelectorAll('.move-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const move = btn.getAttribute('data-move');
      if (move) animEngine.enqueue(move);
    });
  });

  btnScramble.addEventListener('click', () => {
    const length = parseInt(scrambleLengthInput.value, 10) || 40;
    const scramble = Scrambler4x4.generate(length);
    scrambleDisplay.textContent = scramble;

    animEngine.clearQueue();
    rubikState.reset();
    cubeRenderer.resetToSolved();

    const normalSpeed = animEngine.animationDuration;
    animEngine.setSpeed(35);
    animEngine.enqueue(scramble);
    animEngine.onQueueEmpty = () => {
      animEngine.setSpeed(normalSpeed);
      animEngine.onQueueEmpty = null;
    };
  });

  scrambleDisplay.addEventListener('click', () => {
    navigator.clipboard.writeText(scrambleDisplay.textContent);
    const orig = scrambleDisplay.textContent;
    scrambleDisplay.textContent = 'Copiado al portapapeles';
    setTimeout(() => {
      scrambleDisplay.textContent = orig;
    }, 1200);
  });

  const playCustomAlgo = () => {
    const seq = algoInput.value.trim();
    if (!seq) return;
    try {
      animEngine.enqueue(seq);
    } catch (err) {
      alert(`Error de sintaxis: ${err.message}`);
    }
  };

  btnPlayAlgo.addEventListener('click', playCustomAlgo);
  algoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') playCustomAlgo();
  });

  const handleSolveResult = (result, timeMs) => {
    if (result.solutionMoves.length === 0) {
      scrambleDisplay.textContent = 'El cubo ya está resuelto';
      return;
    }

    scrambleDisplay.textContent = `Solución (${result.totalMoves} movs, ${timeMs}ms): ${result.solutionString}`;

    const animateSolution = confirm(
      `Solución encontrada en ${timeMs}ms (${result.totalMoves} movimientos):\n\n` +
      `• Centros: ${result.phases.centers.count} movs (${result.phases.centers.percentage}%)\n` +
      `• Aristas: ${result.phases.edges.count} movs (${result.phases.edges.percentage}%)\n` +
      `• Fase 3x3: ${result.phases.stage3x3.count} movs (${result.phases.stage3x3.percentage}%)\n\n` +
      `¿Deseas animar la solución en el cubo 3D?`
    );

    if (animateSolution) {
      animEngine.clearQueue();
      animEngine.enqueue(result.solutionString);
    }
  };

  if (solverWorker) {
    solverWorker.onmessage = (e) => {
      const { type, result, computationTimeMs, error } = e.data;
      btnSolveCube.classList.remove('opacity-60', 'pointer-events-none');
      btnSolveCube.querySelector('span').textContent = 'Resolver';

      if (type === 'SOLVE_SUCCESS') {
        handleSolveResult(result, computationTimeMs);
      } else {
        alert(`Error en solver: ${error}`);
      }
    };
  }

  btnSolveCube.addEventListener('click', () => {
    btnSolveCube.classList.add('opacity-60', 'pointer-events-none');
    btnSolveCube.querySelector('span').textContent = 'Calculando...';

    if (solverWorker) {
      solverWorker.postMessage({
        type: 'SOLVE',
        serializedState: rubikState.serialize()
      });
    } else {
      const t0 = performance.now();
      const result = ReductionSolver.solve(rubikState);
      const dt = Number((performance.now() - t0).toFixed(2));
      btnSolveCube.classList.remove('opacity-60', 'pointer-events-none');
      btnSolveCube.querySelector('span').textContent = 'Resolver';
      handleSolveResult(result, dt);
    }
  });

  window.rubik = {
    state: rubikState,
    renderer: cubeRenderer,
    animEngine,
    timer,
    solver: ReductionSolver
  };
});
