import { ParityAnalyzer } from '../solver/ParityAnalyzer.js';
import { ReductionSolver } from '../solver/ReductionSolver.js';

export class ParityTracker {
  constructor(rubikState, animEngine, cubeRenderer) {
    this.rubikState = rubikState;
    this.animEngine = animEngine;
    this.cubeRenderer = cubeRenderer;

    this.totalAttempts = 0;
    this.parityCount = 0;
    this.recentOutcomes = []; // Array de booleanos (últimos 12)
    this.historyPoints = [];  // Array de porcentajes para la gráfica SVG

    this._initElements();
    this._bindEvents();
    this.updateUI();
  }

  _initElements() {
    this.modalEl = document.getElementById('parity-modal');
    this.btnToggle = document.getElementById('btn-toggle-parity');
    this.btnClose = document.getElementById('btn-close-parity');

    this.statTotalEl = document.getElementById('parity-stat-total');
    this.statCountEl = document.getElementById('parity-stat-count');
    this.statCleanCountEl = document.getElementById('parity-stat-clean-count');
    this.statPctEl = document.getElementById('parity-stat-pct');
    this.statCleanPctEl = document.getElementById('parity-stat-clean-pct');
    this.statDiffEl = document.getElementById('parity-stat-diff');

    this.barParityEl = document.getElementById('parity-bar-trap');
    this.barCleanEl = document.getElementById('parity-bar-clean');
    this.chipsContainerEl = document.getElementById('parity-recent-chips');
    this.chartPolylineEl = document.getElementById('parity-chart-line');
    this.chartLastPointEl = document.getElementById('parity-chart-last-point');

    this.btnSim1 = document.getElementById('btn-sim-1');
    this.btnReset = document.getElementById('btn-reset-parity-stats');
    this.btnDemoTrap = document.getElementById('btn-demo-trap-3d');
    this.btnFixTrap = document.getElementById('btn-fix-trap-3d');
  }

  _bindEvents() {
    if (this.btnToggle) {
      this.btnToggle.addEventListener('click', () => this.toggleModal());
    }

    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => this.toggleModal(false));
    }

    if (this.btnSim1) {
      this.btnSim1.addEventListener('click', () => this.record(Math.random() < 0.5));
    }

    document.querySelectorAll('.btn-sim-group').forEach((btn) => {
      btn.addEventListener('click', () => {
        const count = parseInt(btn.getAttribute('data-sim'), 10) || 10;
        this.simulate(count);
      });
    });

    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => this.reset());
    }

    if (this.btnDemoTrap) {
      this.btnDemoTrap.addEventListener('click', () => this.demonstrateTrap3D());
    }

    if (this.btnFixTrap) {
      this.btnFixTrap.addEventListener('click', () => this.fixTrap3D());
    }

    // Cierre al hacer click en el fondo oscuro
    if (this.modalEl) {
      this.modalEl.addEventListener('click', (e) => {
        if (e.target === this.modalEl) {
          this.toggleModal(false);
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalEl && this.modalEl.style.display !== 'none') {
        this.toggleModal(false);
      }
    });
  }

  toggleModal(forceState) {
    if (!this.modalEl) return;
    const isCurrentlyVisible = this.modalEl.style.display === 'flex' || (!this.modalEl.classList.contains('hidden') && this.modalEl.style.display !== 'none');
    const shouldShow = forceState !== undefined ? forceState : !isCurrentlyVisible;

    if (shouldShow) {
      this.modalEl.style.display = 'flex';
      this.modalEl.classList.remove('hidden');
      this.btnToggle?.classList.add('border-p1245', 'text-p1245', 'bg-p655-border');
    } else {
      this.modalEl.style.display = 'none';
      this.modalEl.classList.add('hidden');
      this.btnToggle?.classList.remove('border-p1245', 'text-p1245', 'bg-p655-border');
    }
  }

  record(hasParity) {
    this.totalAttempts++;
    if (hasParity) this.parityCount++;

    this.recentOutcomes.push(hasParity);
    if (this.recentOutcomes.length > 12) {
      this.recentOutcomes.shift();
    }

    const currentPct = (this.parityCount / this.totalAttempts) * 100;
    this.historyPoints.push(currentPct);
    if (this.historyPoints.length > 80) {
      this.historyPoints.shift();
    }

    this.updateUI();
  }

  simulate(times) {
    // Para simulaciones en lote, muestreamos puntos para trazar la curva de convergencia
    const steps = Math.min(times, 40);
    const stepSize = Math.floor(times / steps);
    let remainder = times % steps;

    for (let s = 0; s < steps; s++) {
      const batch = stepSize + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;

      let batchParities = 0;
      for (let i = 0; i < batch; i++) {
        const isParity = Math.random() < 0.5;
        if (isParity) batchParities++;
        this.recentOutcomes.push(isParity);
        if (this.recentOutcomes.length > 12) this.recentOutcomes.shift();
      }

      this.totalAttempts += batch;
      this.parityCount += batchParities;

      const currentPct = (this.parityCount / this.totalAttempts) * 100;
      this.historyPoints.push(currentPct);
      if (this.historyPoints.length > 80) this.historyPoints.shift();
    }

    this.updateUI();
  }

  reset() {
    this.totalAttempts = 0;
    this.parityCount = 0;
    this.recentOutcomes = [];
    this.historyPoints = [];
    this.updateUI();
  }

  // Genera en vivo la paridad OLL en el cubo 3D (arista frontal-superior volteada con todo lo demás resuelto)
  demonstrateTrap3D() {
    if (!this.animEngine || !this.rubikState) return;

    this.toggleModal(false);
    this.animEngine.clearQueue();
    this.rubikState.reset();
    this.cubeRenderer?.resetToSolved();

    const normalSpeed = this.animEngine.animationDuration;
    this.animEngine.setSpeed(60);

    const scrambleDisplay = document.getElementById('scramble-display');
    if (scrambleDisplay) {
      scrambleDisplay.textContent = 'Generando trampa de paridad OLL (1 arista volteada)...';
    }

    this.animEngine.enqueue(ReductionSolver.OLL_PARITY_ALGO);
    this.animEngine.onQueueEmpty = () => {
      this.animEngine.setSpeed(normalSpeed);
      this.animEngine.onQueueEmpty = null;
      if (scrambleDisplay) {
        scrambleDisplay.textContent = 'Trampa de Paridad OLL: 1 sola arista invertida (imposible en 3×3)';
      }
    };
  }

  // Aplica el algoritmo de paridad para resolver la arista rebelde y devolver el cubo al estado resuelto
  fixTrap3D() {
    if (!this.animEngine || !this.rubikState) return;

    this.toggleModal(false);
    this.animEngine.clearQueue();

    const normalSpeed = this.animEngine.animationDuration;
    this.animEngine.setSpeed(60);

    const scrambleDisplay = document.getElementById('scramble-display');
    if (scrambleDisplay) {
      scrambleDisplay.textContent = 'Aplicando algoritmo de corrección de paridad (>15 movimientos)...';
    }

    this.animEngine.enqueue(ReductionSolver.OLL_PARITY_ALGO);
    this.animEngine.onQueueEmpty = () => {
      this.animEngine.setSpeed(normalSpeed);
      this.animEngine.onQueueEmpty = null;
      this.rubikState.reset();
      this.cubeRenderer?.resetToSolved();
      if (scrambleDisplay) {
        scrambleDisplay.textContent = 'Cubo Resuelto: Arista corregida con éxito';
      }
    };
  }

  updateUI() {
    if (!this.statTotalEl) return;

    const total = this.totalAttempts;
    const withParity = this.parityCount;
    const clean = total - withParity;

    const parityPct = total > 0 ? (withParity / total) * 100 : 0;
    const cleanPct = total > 0 ? (clean / total) * 100 : 0;

    this.statTotalEl.textContent = total.toLocaleString();
    this.statCountEl.textContent = withParity.toLocaleString();
    this.statCleanCountEl.textContent = clean.toLocaleString();

    this.statPctEl.textContent = `${parityPct.toFixed(1)}%`;
    this.statCleanPctEl.textContent = `${cleanPct.toFixed(1)}%`;

    if (this.barParityEl) {
      this.barParityEl.style.width = `${total > 0 ? parityPct : 50}%`;
    }
    if (this.barCleanEl) {
      this.barCleanEl.style.width = `${total > 0 ? cleanPct : 50}%`;
    }

    if (this.statDiffEl) {
      if (total === 0) {
        this.statDiffEl.textContent = 'Esperado: 50.0% / 50.0%';
      } else {
        const diff = parityPct - 50.0;
        const sign = diff >= 0 ? '+' : '';
        this.statDiffEl.textContent = `Diferencia teórica: ${sign}${diff.toFixed(1)}%`;
      }
    }

    // Actualizar fichas visuales recientes
    if (this.chipsContainerEl) {
      if (this.recentOutcomes.length === 0) {
        this.chipsContainerEl.innerHTML = `<span class="text-[11px] text-slate-400 italic">Presiona '+1 Intento' o simula para ver la secuencia</span>`;
      } else {
        this.chipsContainerEl.innerHTML = this.recentOutcomes.map((hasParity, idx) => {
          if (hasParity) {
            return `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-p1245 border border-p1245/40 shadow-sm animate-pulse">TRAMPA</span>`;
          } else {
            return `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-p655-light text-slate-300 border border-p655-border shadow-sm">LIMPIO</span>`;
          }
        }).join('');
      }
    }

    // Actualizar gráfica SVG de convergencia
    this._renderSVGChart();
  }

  _renderSVGChart() {
    if (!this.chartPolylineEl) return;

    if (this.historyPoints.length < 2) {
      this.chartPolylineEl.setAttribute('points', '0,50 400,50');
      if (this.chartLastPointEl) this.chartLastPointEl.setAttribute('display', 'none');
      return;
    }

    const n = this.historyPoints.length;
    const pointsStr = this.historyPoints.map((pct, idx) => {
      const x = (idx / (n - 1)) * 390 + 5;
      // y va de 0 (100%) a 100 (0%). 50% corresponde a y = 50.
      const y = Math.max(5, Math.min(95, 100 - pct));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    this.chartPolylineEl.setAttribute('points', pointsStr);

    if (this.chartLastPointEl) {
      const lastPct = this.historyPoints[n - 1];
      const lastX = 395;
      const lastY = Math.max(5, Math.min(95, 100 - lastPct));
      this.chartLastPointEl.setAttribute('cx', lastX);
      this.chartLastPointEl.setAttribute('cy', lastY);
      this.chartLastPointEl.setAttribute('display', 'block');
    }
  }
}
