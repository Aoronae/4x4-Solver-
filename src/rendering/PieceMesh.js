import * as THREE from 'three';

// Colores estándar WCA y cuerpo de plástico
export const CUBIE_COLORS = {
  PLASTIC: 0x111827,
  W: 0xffffff,
  Y: 0xffd500,
  G: 0x009b48,
  B: 0x0046ad,
  O: 0xff5800,
  R: 0xb71234
};

// Caché de materiales para optimizar memoria
const materialCache = new Map();

function getMaterial(colorHex, isSticker = true) {
  const key = `${colorHex}_${isSticker}`;
  if (!materialCache.has(key)) {
    materialCache.set(key, new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: isSticker ? 0.35 : 0.85,
      metalness: 0.05
    }));
  }
  return materialCache.get(key);
}

// Crea la malla individual de una pieza 4x4
export function createCubieMesh(ix, iy, iz, size = 0.96) {
  const geometry = new THREE.BoxGeometry(size, size, size);

  const isRight = (ix === 3);
  const isLeft  = (ix === 0);
  const isUp    = (iy === 3);
  const isDown  = (iy === 0);
  const isFront = (iz === 3);
  const isBack  = (iz === 0);

  const materials = [
    isRight ? getMaterial(CUBIE_COLORS.R) : getMaterial(CUBIE_COLORS.PLASTIC, false),
    isLeft  ? getMaterial(CUBIE_COLORS.O) : getMaterial(CUBIE_COLORS.PLASTIC, false),
    isUp    ? getMaterial(CUBIE_COLORS.W) : getMaterial(CUBIE_COLORS.PLASTIC, false),
    isDown  ? getMaterial(CUBIE_COLORS.Y) : getMaterial(CUBIE_COLORS.PLASTIC, false),
    isFront ? getMaterial(CUBIE_COLORS.G) : getMaterial(CUBIE_COLORS.PLASTIC, false),
    isBack  ? getMaterial(CUBIE_COLORS.B) : getMaterial(CUBIE_COLORS.PLASTIC, false)
  ];

  const mesh = new THREE.Mesh(geometry, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  mesh.userData = {
    gridX: ix,
    gridY: iy,
    gridZ: iz
  };

  return mesh;
}
