import * as THREE from 'three';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class AnimationEngine {
  constructor(cubeRenderer, rubikState) {
    this.renderer = cubeRenderer;
    this.state = rubikState;
    this.queue = [];
    this.isAnimating = false;
    this.animationDuration = 180;
    this.onMoveComplete = null;
    this.onQueueEmpty = null;
  }

  setSpeed(ms) {
    this.animationDuration = Math.max(0, ms);
  }

  enqueue(sequence) {
    if (!sequence) return;
    const tokens = sequence.trim().split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      this.queue.push(token);
    }
    if (!this.isAnimating) {
      this._processNext();
    }
  }

  clearQueue() {
    this.queue = [];
  }

  _parseMove(move) {
    const trimmed = move.trim();
    const match = trimmed.match(/^([0-9]?)([UDFBLRxyzudfblr]|[UDFBLR]w)([2']|'2)?$/);
    if (!match) {
      throw new Error(`Notación inválida: "${move}"`);
    }

    const [, prefix, base, suffix] = match;
    let turns = 1;
    if (suffix === "'" || suffix === "'2") turns = -1;
    if (suffix === "2" || suffix === "'2") turns = 2;

    const baseUpper = base.toUpperCase();
    let axis = 'Y';
    let layers = [0];
    let angle = -turns * (Math.PI / 2);

    switch (baseUpper) {
      case 'U':
        axis = 'Y';
        if (prefix === '2') layers = [1];
        else if (base === 'u') layers = [0, 1];
        else layers = [0];
        break;
      case 'UW':
        axis = 'Y';
        layers = [0, 1];
        break;
      case 'D':
        axis = 'Y';
        angle = -angle;
        if (prefix === '2') layers = [2];
        else if (base === 'd') layers = [2, 3];
        else layers = [3];
        break;
      case 'DW':
        axis = 'Y';
        angle = -angle;
        layers = [2, 3];
        break;
      case 'R':
        axis = 'X';
        if (prefix === '2') layers = [1];
        else if (base === 'r') layers = [0, 1];
        else layers = [0];
        break;
      case 'RW':
        axis = 'X';
        layers = [0, 1];
        break;
      case 'L':
        axis = 'X';
        angle = -angle;
        if (prefix === '2') layers = [2];
        else if (base === 'l') layers = [2, 3];
        else layers = [3];
        break;
      case 'LW':
        axis = 'X';
        angle = -angle;
        layers = [2, 3];
        break;
      case 'F':
        axis = 'Z';
        if (prefix === '2') layers = [1];
        else if (base === 'f') layers = [0, 1];
        else layers = [0];
        break;
      case 'FW':
        axis = 'Z';
        layers = [0, 1];
        break;
      case 'B':
        axis = 'Z';
        angle = -angle;
        if (prefix === '2') layers = [2];
        else if (base === 'b') layers = [2, 3];
        else layers = [3];
        break;
      case 'BW':
        axis = 'Z';
        angle = -angle;
        layers = [2, 3];
        break;
      case 'X':
        axis = 'X';
        layers = [0, 1, 2, 3];
        break;
      case 'Y':
        axis = 'Y';
        layers = [0, 1, 2, 3];
        break;
      case 'Z':
        axis = 'Z';
        layers = [0, 1, 2, 3];
        break;
      default:
        throw new Error(`Movimiento no reconocido: ${move}`);
    }

    return { axis, layers, angle };
  }

  _processNext() {
    if (this.queue.length === 0) {
      this.isAnimating = false;
      if (this.onQueueEmpty) this.onQueueEmpty();
      return;
    }

    this.isAnimating = true;
    const move = this.queue.shift();
    const { axis, layers, angle } = this._parseMove(move);

    if (this.animationDuration === 0) {
      this._executeInstantMove(axis, layers, angle, move);
      this._processNext();
      return;
    }

    const targetCubies = new Set();
    for (const layer of layers) {
      const cubiesInLayer = this.renderer.getCubiesInLayer(axis, layer);
      for (const c of cubiesInLayer) targetCubies.add(c);
    }

    const pivot = new THREE.Group();
    this.renderer.cubeGroup.add(pivot);

    for (const cubie of targetCubies) {
      pivot.attach(cubie);
    }

    const startTime = performance.now();
    const duration = Math.abs(angle / (Math.PI / 2)) * this.animationDuration;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeInOutCubic(progress);

      const currentAngle = angle * easedProgress;
      if (axis === 'X') pivot.rotation.x = currentAngle;
      else if (axis === 'Y') pivot.rotation.y = currentAngle;
      else if (axis === 'Z') pivot.rotation.z = currentAngle;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (axis === 'X') pivot.rotation.x = angle;
        else if (axis === 'Y') pivot.rotation.y = angle;
        else if (axis === 'Z') pivot.rotation.z = angle;

        pivot.updateMatrixWorld(true);

        for (const cubie of targetCubies) {
          this.renderer.cubeGroup.attach(cubie);
        }

        this.renderer.cubeGroup.remove(pivot);
        this.renderer.snapCubies();

        this.state.applyMove(move);

        if (this.onMoveComplete) this.onMoveComplete(move);
        this._processNext();
      }
    };

    requestAnimationFrame(animate);
  }

  _executeInstantMove(axis, layers, angle, move) {
    const targetCubies = new Set();
    for (const layer of layers) {
      const cubiesInLayer = this.renderer.getCubiesInLayer(axis, layer);
      for (const c of cubiesInLayer) targetCubies.add(c);
    }

    const pivot = new THREE.Group();
    this.renderer.cubeGroup.add(pivot);
    for (const cubie of targetCubies) pivot.attach(cubie);

    if (axis === 'X') pivot.rotation.x = angle;
    else if (axis === 'Y') pivot.rotation.y = angle;
    else if (axis === 'Z') pivot.rotation.z = angle;

    pivot.updateMatrixWorld(true);
    for (const cubie of targetCubies) this.renderer.cubeGroup.attach(cubie);
    this.renderer.cubeGroup.remove(pivot);
    this.renderer.snapCubies();

    this.state.applyMove(move);
    if (this.onMoveComplete) this.onMoveComplete(move);
  }

  flushQueue() {
    while (this.queue.length > 0) {
      const move = this.queue.shift();
      const { axis, layers, angle } = this._parseMove(move);
      this._executeInstantMove(axis, layers, angle, move);
    }
  }
}
