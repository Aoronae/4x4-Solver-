export const TIMER_STATES = {
  IDLE: 'IDLE',
  HOLDING: 'HOLDING',
  READY: 'READY',
  RUNNING: 'RUNNING',
  STOPPED: 'STOPPED'
};

export class SpeedcubingTimer {
  constructor(displayElement, statusElement) {
    this.displayEl = displayElement;
    this.statusEl = statusElement;
    this.state = TIMER_STATES.IDLE;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.holdTimeout = null;
    this.animFrameId = null;
    this.onStart = null;
    this.onStop = null;

    this._bindEvents();
    this.render();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        this._handleSpaceDown();
      } else if (this.state === TIMER_STATES.RUNNING) {
        this._stopTimer();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        this._handleSpaceUp();
      }
    });
  }

  _handleSpaceDown() {
    if (this.state === TIMER_STATES.RUNNING) {
      this._stopTimer();
      return;
    }

    if (this.state === TIMER_STATES.IDLE || this.state === TIMER_STATES.STOPPED) {
      this.state = TIMER_STATES.HOLDING;
      this.render();

      this.holdTimeout = setTimeout(() => {
        if (this.state === TIMER_STATES.HOLDING) {
          this.state = TIMER_STATES.READY;
          this.render();
        }
      }, 300);
    }
  }

  _handleSpaceUp() {
    if (this.state === TIMER_STATES.HOLDING) {
      clearTimeout(this.holdTimeout);
      this.state = TIMER_STATES.IDLE;
      this.render();
    } else if (this.state === TIMER_STATES.READY) {
      this._startTimer();
    }
  }

  _startTimer() {
    this.state = TIMER_STATES.RUNNING;
    this.startTime = performance.now();
    this.elapsedTime = 0;
    this.render();

    if (this.onStart) this.onStart();

    const tick = () => {
      if (this.state !== TIMER_STATES.RUNNING) return;
      this.elapsedTime = performance.now() - this.startTime;
      this.render();
      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  _stopTimer() {
    if (this.state !== TIMER_STATES.RUNNING) return;
    cancelAnimationFrame(this.animFrameId);
    this.elapsedTime = performance.now() - this.startTime;
    this.state = TIMER_STATES.STOPPED;
    this.render();

    if (this.onStop) this.onStop(this.elapsedTime);
  }

  reset() {
    cancelAnimationFrame(this.animFrameId);
    clearTimeout(this.holdTimeout);
    this.state = TIMER_STATES.IDLE;
    this.elapsedTime = 0;
    this.render();
  }

  static format(ms) {
    if (ms <= 0) return '0.000';
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(3);

    if (minutes > 0) {
      const paddedSec = seconds.padStart(6, '0');
      return `${minutes}:${paddedSec}`;
    }
    return seconds;
  }

  render() {
    if (!this.displayEl) return;

    this.displayEl.textContent = SpeedcubingTimer.format(this.elapsedTime);

    if (this.statusEl) {
      switch (this.state) {
        case TIMER_STATES.IDLE:
          this.displayEl.style.color = '#ffffff';
          this.statusEl.textContent = 'Mantén ESPACIO para preparar';
          this.statusEl.style.color = '#cbd5e1';
          break;
        case TIMER_STATES.HOLDING:
          this.displayEl.style.color = '#f87171';
          this.statusEl.textContent = 'Preparando...';
          this.statusEl.style.color = '#f87171';
          break;
        case TIMER_STATES.READY:
          this.displayEl.style.color = '#C69214';
          this.statusEl.textContent = 'Listo. Suelta para iniciar';
          this.statusEl.style.color = '#C69214';
          break;
        case TIMER_STATES.RUNNING:
          this.displayEl.style.color = '#ffffff';
          this.statusEl.textContent = 'En marcha (presiona cualquier tecla para parar)';
          this.statusEl.style.color = '#e2e8f0';
          break;
        case TIMER_STATES.STOPPED:
          this.displayEl.style.color = '#C69214';
          this.statusEl.textContent = 'Tiempo registrado';
          this.statusEl.style.color = '#cbd5e1';
          break;
      }
    }
  }
}
