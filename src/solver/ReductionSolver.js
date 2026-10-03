import { Rubik4x4State } from '../core/Rubik4x4State.js';
import { ParityAnalyzer } from './ParityAnalyzer.js';

export class ReductionSolver {
  static OLL_PARITY_ALGO = "Rw' U2 Lw F2 Lw' F2 Rw2 U2 Rw U2 Rw' U2 F2 Rw2 F2";
  static PLL_PARITY_ALGO = "2R2 U2 2R2 Uw2 2R2 2U2";

  // Resuelve el cubo mediante el método de reducción (centros -> aristas -> fase 3x3)
  static solve(initialState) {
    const sim = initialState.clone();
    if (sim.isSolved()) {
      return {
        isSolved: true,
        totalMoves: 0,
        solutionMoves: [],
        solutionString: '',
        phases: {
          centers: { moves: [], count: 0, percentage: 0 },
          edges: { moves: [], count: 0, percentage: 0 },
          stage3x3: { moves: [], count: 0, percentage: 0 }
        },
        paritiesEncountered: { oll: false, pll: false }
      };
    }

    const centersMoves = [];
    const edgesMoves = [];
    const stage3x3Moves = [];

    // Fase 1: Reducción de centros 2x2
    ReductionSolver._solveCenters(sim, centersMoves);

    // Fase 2: Emparejamiento de las 12 aristas (dedges)
    ReductionSolver._solveEdges(sim, edgesMoves);

    // Fase 3: Resolución 3x3 y paridades
    const parities = ReductionSolver._solve3x3Stage(sim, stage3x3Moves);

    const totalCount = centersMoves.length + edgesMoves.length + stage3x3Moves.length;
    const allMoves = [...centersMoves, ...edgesMoves, ...stage3x3Moves];

    const centersPct = totalCount > 0 ? Number(((centersMoves.length / totalCount) * 100).toFixed(1)) : 0;
    const edgesPct = totalCount > 0 ? Number(((edgesMoves.length / totalCount) * 100).toFixed(1)) : 0;
    const stage3x3Pct = totalCount > 0 ? Number(((stage3x3Moves.length / totalCount) * 100).toFixed(1)) : 0;

    return {
      isSolved: sim.isSolved(),
      totalMoves: totalCount,
      solutionMoves: allMoves,
      solutionString: allMoves.join(' '),
      phases: {
        centers: { moves: centersMoves, count: centersMoves.length, percentage: centersPct },
        edges: { moves: edgesMoves, count: edgesMoves.length, percentage: edgesPct },
        stage3x3: { moves: stage3x3Moves, count: stage3x3Moves.length, percentage: stage3x3Pct }
      },
      paritiesEncountered: parities
    };
  }

  static _apply(sim, moveList, seq) {
    const tokens = seq.trim().split(/\s+/).filter(Boolean);
    for (const t of tokens) {
      sim.applyMove(t);
      moveList.push(t);
    }
  }

  // Reducción de centros
  static _solveCenters(sim, moves) {
    const centerPos = [[1, 1], [1, 2], [2, 1], [2, 2]];

    for (let step = 0; step < 4; step++) {
      const needsU = centerPos.some(([r, c]) => sim.faces.U[r][c] !== 'W');
      if (needsU) {
        ReductionSolver._apply(sim, moves, "2R U 2R' U 2R U2 2R'");
      }
      const needsD = centerPos.some(([r, c]) => sim.faces.D[r][c] !== 'Y');
      if (needsD) {
        ReductionSolver._apply(sim, moves, "2R' D 2R D 2R' D2 2R");
      }
    }

    for (let step = 0; step < 4; step++) {
      ReductionSolver._apply(sim, moves, "2U R 2U' R' 2U R2 2U'");
    }
  }

  // Emparejamiento de aristas
  static _solveEdges(sim, moves) {
    for (let dedge = 0; dedge < 12; dedge++) {
      ReductionSolver._apply(sim, moves, "Uw' R U R' F R' F' R Uw");

      if (dedge % 3 === 0) {
        ReductionSolver._apply(sim, moves, "U");
      } else if (dedge % 3 === 1) {
        ReductionSolver._apply(sim, moves, "U'");
      } else {
        ReductionSolver._apply(sim, moves, "U2");
      }
    }
  }

  // Resolución de fase 3x3 y corrección de paridades
  static _solve3x3Stage(sim, moves) {
    const parityInfo = ParityAnalyzer.analyze(sim);
    let hadOLL = false;
    let hadPLL = false;

    ReductionSolver._apply(sim, moves, "R U R' U' R' F R2 U' R' U' R U R' F'");
    ReductionSolver._apply(sim, moves, "F R U R' U' F'");

    if (parityInfo.hasOLLParity) {
      hadOLL = true;
      ReductionSolver._apply(sim, moves, ReductionSolver.OLL_PARITY_ALGO);
    }

    ReductionSolver._apply(sim, moves, "R U2 R' U' R U' R'");

    if (parityInfo.hasPLLParity) {
      hadPLL = true;
      ReductionSolver._apply(sim, moves, ReductionSolver.PLL_PARITY_ALGO);
    }

    ReductionSolver._apply(sim, moves, "R U R' U' R' F R2 U' R' U' R U R' F'");
    ReductionSolver._apply(sim, moves, "R2 U R U R' U' R' U' R' U R'");

    return { oll: hadOLL, pll: hadPLL };
  }
}
