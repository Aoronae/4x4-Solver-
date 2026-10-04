import { Rubik4x4State } from '../core/Rubik4x4State.js';
import { ReductionSolver } from './ReductionSolver.js';

// Web Worker para ejecutar el cálculo del solver sin bloquear el renderizado
self.onmessage = (e) => {
  const { type, serializedState, moveHistory } = e.data;

  if (type === 'SOLVE') {
    try {
      const state = new Rubik4x4State();
      state.deserialize(serializedState);
      if (Array.isArray(moveHistory)) {
        state.moveHistory = [...moveHistory];
      }

      const startTime = performance.now();
      const result = ReductionSolver.solve(state);
      const computationTimeMs = Number((performance.now() - startTime).toFixed(2));

      self.postMessage({
        type: 'SOLVE_SUCCESS',
        result,
        computationTimeMs
      });
    } catch (err) {
      self.postMessage({
        type: 'SOLVE_ERROR',
        error: err.message
      });
    }
  }
};
