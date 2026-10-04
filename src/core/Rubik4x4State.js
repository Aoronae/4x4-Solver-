export class Rubik4x4State {
  static FACES = ['U', 'D', 'F', 'B', 'L', 'R'];

  static COLORS = {
    U: 'W',
    D: 'Y',
    F: 'G',
    B: 'B',
    L: 'O',
    R: 'R'
  };

  static COLOR_HEX = {
    W: '#FFFFFF',
    Y: '#FFD500',
    G: '#009B48',
    B: '#0046AD',
    O: '#FF5800',
    R: '#B71234'
  };

  constructor() {
    this.faces = {};
    this.moveHistory = [];
    this.reset();
  }

  reset() {
    for (const face of Rubik4x4State.FACES) {
      const color = Rubik4x4State.COLORS[face];
      this.faces[face] = Array.from({ length: 4 }, () => Array(4).fill(color));
    }
    this.moveHistory = [];
  }

  clone() {
    const next = new Rubik4x4State();
    for (const face of Rubik4x4State.FACES) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          next.faces[face][r][c] = this.faces[face][r][c];
        }
      }
    }
    next.moveHistory = Array.isArray(this.moveHistory) ? [...this.moveHistory] : [];
    return next;
  }

  isEqual(other) {
    for (const face of Rubik4x4State.FACES) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (this.faces[face][r][c] !== other.faces[face][r][c]) {
            return false;
          }
        }
      }
    }
    return true;
  }

  isSolved() {
    for (const face of Rubik4x4State.FACES) {
      const faceColor = this.faces[face][0][0];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (this.faces[face][r][c] !== faceColor) {
            return false;
          }
        }
      }
    }
    return true;
  }

  serialize() {
    let result = '';
    for (const face of Rubik4x4State.FACES) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          result += this.faces[face][r][c];
        }
      }
    }
    return result;
  }

  deserialize(str) {
    if (!str || str.length !== 96) {
      throw new Error(`Cadena inválida (${str?.length} caracteres)`);
    }
    let idx = 0;
    for (const face of Rubik4x4State.FACES) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          this.faces[face][r][c] = str[idx++];
        }
      }
    }
  }

  _rotateFace90(face) {
    const f = this.faces[face];
    const prev = [[...f[0]], [...f[1]], [...f[2]], [...f[3]]];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        f[c][3 - r] = prev[r][c];
      }
    }
  }

  _rotateFaceCounter90(face) {
    const f = this.faces[face];
    const prev = [[...f[0]], [...f[1]], [...f[2]], [...f[3]]];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        f[3 - c][r] = prev[r][c];
      }
    }
  }

  _turnLayerY_90(k) {
    if (k === 0) this._rotateFace90('U');
    if (k === 3) this._rotateFaceCounter90('D');

    const temp = [...this.faces.F[k]];
    for (let i = 0; i < 4; i++) {
      this.faces.F[k][i] = this.faces.R[k][i];
      this.faces.R[k][i] = this.faces.B[k][i];
      this.faces.B[k][i] = this.faces.L[k][i];
      this.faces.L[k][i] = temp[i];
    }
  }

  _turnLayerX_90(k) {
    if (k === 0) this._rotateFace90('R');
    if (k === 3) this._rotateFaceCounter90('L');

    const temp = [0, 1, 2, 3].map(i => this.faces.U[i][3 - k]);
    for (let i = 0; i < 4; i++) {
      this.faces.U[i][3 - k] = this.faces.F[i][3 - k];
      this.faces.F[i][3 - k] = this.faces.D[i][3 - k];
      this.faces.D[i][3 - k] = this.faces.B[3 - i][k];
      this.faces.B[3 - i][k] = temp[i];
    }
  }

  _turnLayerZ_90(k) {
    if (k === 0) this._rotateFace90('F');
    if (k === 3) this._rotateFaceCounter90('B');

    const temp = [0, 1, 2, 3].map(i => this.faces.U[3 - k][i]);
    for (let i = 0; i < 4; i++) {
      this.faces.U[3 - k][i] = this.faces.L[3 - i][3 - k];
      this.faces.L[3 - i][3 - k] = this.faces.D[k][3 - i];
      this.faces.D[k][3 - i] = this.faces.R[i][k];
      this.faces.R[i][k] = temp[i];
    }
  }

  turnLayer(axis, k, quarterTurns) {
    const normTurns = ((quarterTurns % 4) + 4) % 4;
    for (let t = 0; t < normTurns; t++) {
      if (axis === 'Y') this._turnLayerY_90(k);
      else if (axis === 'X') this._turnLayerX_90(k);
      else if (axis === 'Z') this._turnLayerZ_90(k);
    }
  }

  applyMove(move, track = true) {
    const trimmed = move.trim();
    if (!trimmed) return;

    if (track) {
      if (!this.moveHistory) this.moveHistory = [];
      this.moveHistory.push(trimmed);
    }

    const match = trimmed.match(/^([0-9]?)([UDFBLRxyzudfblr]|[UDFBLR]w)([2']|'2)?$/);
    if (!match) {
      throw new Error(`Notación inválida: "${move}"`);
    }

    const [, prefix, base, suffix] = match;
    let turns = 1;
    if (suffix === "'" || suffix === "'2") turns = -1;
    if (suffix === "2" || suffix === "'2") turns = 2;

    const baseUpper = base.toUpperCase();

    switch (baseUpper) {
      case 'U':
        if (prefix === '2') this.turnLayer('Y', 1, turns);
        else if (base === 'u') {
          this.turnLayer('Y', 0, turns);
          this.turnLayer('Y', 1, turns);
        } else this.turnLayer('Y', 0, turns);
        break;

      case 'UW':
        this.turnLayer('Y', 0, turns);
        this.turnLayer('Y', 1, turns);
        break;

      case 'D':
        if (prefix === '2') this.turnLayer('Y', 2, -turns);
        else if (base === 'd') {
          this.turnLayer('Y', 3, -turns);
          this.turnLayer('Y', 2, -turns);
        } else this.turnLayer('Y', 3, -turns);
        break;

      case 'DW':
        this.turnLayer('Y', 3, -turns);
        this.turnLayer('Y', 2, -turns);
        break;

      case 'R':
        if (prefix === '2') this.turnLayer('X', 1, turns);
        else if (base === 'r') {
          this.turnLayer('X', 0, turns);
          this.turnLayer('X', 1, turns);
        } else this.turnLayer('X', 0, turns);
        break;

      case 'RW':
        this.turnLayer('X', 0, turns);
        this.turnLayer('X', 1, turns);
        break;

      case 'L':
        if (prefix === '2') this.turnLayer('X', 2, -turns);
        else if (base === 'l') {
          this.turnLayer('X', 3, -turns);
          this.turnLayer('X', 2, -turns);
        } else this.turnLayer('X', 3, -turns);
        break;

      case 'LW':
        this.turnLayer('X', 3, -turns);
        this.turnLayer('X', 2, -turns);
        break;

      case 'F':
        if (prefix === '2') this.turnLayer('Z', 1, turns);
        else if (base === 'f') {
          this.turnLayer('Z', 0, turns);
          this.turnLayer('Z', 1, turns);
        } else this.turnLayer('Z', 0, turns);
        break;

      case 'FW':
        this.turnLayer('Z', 0, turns);
        this.turnLayer('Z', 1, turns);
        break;

      case 'B':
        if (prefix === '2') this.turnLayer('Z', 2, -turns);
        else if (base === 'b') {
          this.turnLayer('Z', 3, -turns);
          this.turnLayer('Z', 2, -turns);
        } else this.turnLayer('Z', 3, -turns);
        break;

      case 'BW':
        this.turnLayer('Z', 3, -turns);
        this.turnLayer('Z', 2, -turns);
        break;

      case 'X':
        for (let k = 0; k < 4; k++) this.turnLayer('X', k, turns);
        break;
      case 'Y':
        for (let k = 0; k < 4; k++) this.turnLayer('Y', k, turns);
        break;
      case 'Z':
        for (let k = 0; k < 4; k++) this.turnLayer('Z', k, turns);
        break;

      default:
        throw new Error(`Movimiento no reconocido: ${move}`);
    }
  }

  applySequence(sequence, track = true) {
    if (!sequence) return;
    const tokens = sequence.trim().split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      this.applyMove(token, track);
    }
  }

  toASCII() {
    const pad = '        ';
    let lines = [];

    for (let r = 0; r < 4; r++) lines.push(pad + this.faces.U[r].join(' '));
    lines.push('');

    for (let r = 0; r < 4; r++) {
      const l = this.faces.L[r].join(' ');
      const f = this.faces.F[r].join(' ');
      const right = this.faces.R[r].join(' ');
      const b = this.faces.B[r].join(' ');
      lines.push(`${l}  ${f}  ${right}  ${b}`);
    }
    lines.push('');

    for (let r = 0; r < 4; r++) lines.push(pad + this.faces.D[r].join(' '));

    return lines.join('\n');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Rubik4x4State };
}
