export class Scrambler4x4 {
  static BASES = [
    { name: 'U', axis: 'Y', layer: 0 },
    { name: 'Uw', axis: 'Y', layer: 1 },
    { name: 'D', axis: 'Y', layer: 3 },
    { name: 'Dw', axis: 'Y', layer: 2 },
    { name: 'R', axis: 'X', layer: 0 },
    { name: 'Rw', axis: 'X', layer: 1 },
    { name: 'L', axis: 'X', layer: 3 },
    { name: 'Lw', axis: 'X', layer: 2 },
    { name: 'F', axis: 'Z', layer: 0 },
    { name: 'Fw', axis: 'Z', layer: 1 },
    { name: 'B', axis: 'Z', layer: 3 },
    { name: 'Bw', axis: 'Z', layer: 2 }
  ];

  static SUFFIXES = ['', "'", '2'];

  static generate(count = 40) {
    const scramble = [];
    let lastBase = null;
    let secondLastBase = null;

    for (let i = 0; i < count; i++) {
      let candidate;
      let attempts = 0;

      while (attempts < 100) {
        attempts++;
        const randBase = Scrambler4x4.BASES[Math.floor(Math.random() * Scrambler4x4.BASES.length)];

        if (lastBase && randBase.name === lastBase.name) continue;

        if (
          lastBase &&
          secondLastBase &&
          randBase.axis === lastBase.axis &&
          lastBase.axis === secondLastBase.axis
        ) {
          continue;
        }

        candidate = randBase;
        break;
      }

      if (!candidate) candidate = Scrambler4x4.BASES[0];

      const suffix = Scrambler4x4.SUFFIXES[Math.floor(Math.random() * Scrambler4x4.SUFFIXES.length)];
      scramble.push(`${candidate.name}${suffix}`);

      secondLastBase = lastBase;
      lastBase = candidate;
    }

    return scramble.join(' ');
  }
}
