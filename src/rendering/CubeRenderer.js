import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCubieMesh } from './PieceMesh.js';

export class CubeRenderer {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.cubies = [];
    this.spacing = 1.02;
    this.cubieSize = 0.98;

    this._initScene();
    this._initCamera();
    this._initRenderer();
    this._initLighting();
    this._initControls();
    this._buildCube();

    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);

    this._render = this._render.bind(this);
    this._render();
  }

  // Inicializa la escena con fondo gris claro confortable para la vista
  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xd1d5db);

    this.cubeGroup = new THREE.Group();
    this.cubeGroup.name = 'Rubik4x4MasterGroup';
    this.scene.add(this.cubeGroup);
  }

  // Cámara en perspectiva isométrica
  _initCamera() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(7.5, 6.5, 8.5);
  }

  // Renderizador WebGL con antialiasing
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);
  }

  // Iluminación ajustada para resaltar facetas blancas sobre fondo blanco
  _initLighting() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.3);
    keyLight.position.set(10, 16, 12);
    keyLight.castShadow = true;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x94a3b8, 0.6);
    rimLight.position.set(-10, -8, -10);
    this.scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.5);
    fillLight.position.set(4, -6, 10);
    this.scene.add(fillLight);
  }

  // Control orbital con ratón o toque
  _initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 25;
    this.controls.target.set(0, 0, 0);
  }

  // Construye las 56 piezas visibles en la cuadrícula discreta
  _buildCube() {
    this.cubies = [];
    while (this.cubeGroup.children.length > 0) {
      this.cubeGroup.remove(this.cubeGroup.children[0]);
    }

    for (let ix = 0; ix < 4; ix++) {
      for (let iy = 0; iy < 4; iy++) {
        for (let iz = 0; iz < 4; iz++) {
          const esInterno = (ix >= 1 && ix <= 2) && (iy >= 1 && iy <= 2) && (iz >= 1 && iz <= 2);
          if (esInterno) continue;

          const cubie = createCubieMesh(ix, iy, iz, this.cubieSize);
          cubie.position.set(
            (ix - 1.5) * this.spacing,
            (iy - 1.5) * this.spacing,
            (iz - 1.5) * this.spacing
          );

          this.cubeGroup.add(cubie);
          this.cubies.push(cubie);
        }
      }
    }
  }

  // Obtiene las piezas correspondientes a una capa k en el eje especificado
  getCubiesInLayer(axis, k) {
    const targetCoord = 3 - k;
    const tolerance = 0.25;

    return this.cubies.filter(cubie => {
      const pos = cubie.position;
      let val = 0;
      if (axis === 'X') val = (pos.x / this.spacing) + 1.5;
      else if (axis === 'Y') val = (pos.y / this.spacing) + 1.5;
      else if (axis === 'Z') val = (pos.z / this.spacing) + 1.5;

      return Math.abs(val - targetCoord) < tolerance;
    });
  }

  // Alineación ortonormal exacta para evitar desajustes en la rotación
  snapCubies() {
    for (const cubie of this.cubies) {
      const ix = Math.max(0, Math.min(3, Math.round((cubie.position.x / this.spacing) + 1.5)));
      const iy = Math.max(0, Math.min(3, Math.round((cubie.position.y / this.spacing) + 1.5)));
      const iz = Math.max(0, Math.min(3, Math.round((cubie.position.z / this.spacing) + 1.5)));

      cubie.position.set(
        (ix - 1.5) * this.spacing,
        (iy - 1.5) * this.spacing,
        (iz - 1.5) * this.spacing
      );

      cubie.userData.gridX = ix;
      cubie.userData.gridY = iy;
      cubie.userData.gridZ = iz;

      this._snapOrientation(cubie);
      cubie.updateMatrix();
      cubie.updateMatrixWorld(true);
    }
  }

  // Ajuste de orientación a los múltiplos ortogonales de 90 grados
  _snapOrientation(cubie) {
    const m = new THREE.Matrix4().makeRotationFromQuaternion(cubie.quaternion);
    const e = m.elements;

    const vX = this._snapVectorToPrimaryAxis(new THREE.Vector3(e[0], e[1], e[2]));
    const vY = this._snapVectorOrthogonal(new THREE.Vector3(e[4], e[5], e[6]), vX);
    const vZ = new THREE.Vector3().crossVectors(vX, vY);

    m.makeBasis(vX, vY, vZ);
    cubie.quaternion.setFromRotationMatrix(m);
  }

  _snapVectorToPrimaryAxis(v) {
    const ax = Math.abs(v.x);
    const ay = Math.abs(v.y);
    const az = Math.abs(v.z);

    if (ax >= ay && ax >= az) {
      return new THREE.Vector3(Math.sign(v.x) || 1, 0, 0);
    } else if (ay >= ax && ay >= az) {
      return new THREE.Vector3(0, Math.sign(v.y) || 1, 0);
    } else {
      return new THREE.Vector3(0, 0, Math.sign(v.z) || 1);
    }
  }

  _snapVectorOrthogonal(v, perpTo) {
    const proj = perpTo.clone().multiplyScalar(v.dot(perpTo));
    const ortho = v.clone().sub(proj);
    return this._snapVectorToPrimaryAxis(ortho);
  }

  // Restablece el cubo visual al estado inicial
  resetToSolved() {
    this._buildCube();
  }

  _onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  _render() {
    requestAnimationFrame(this._render);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
