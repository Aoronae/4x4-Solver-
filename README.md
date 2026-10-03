# Simulador y Solver de Cubo de Rubik 4×4

Una aplicación web interactiva y modular para simular, mezclar y resolver el Cubo de Rubik 4×4 en 3D utilizando **Three.js** y **Vite**.

![Diseño](https://img.shields.io/badge/Three.js-r160-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF)
![Licencia](https://img.shields.io/badge/Licencia-MIT-green)

---

## Características

- **Renderizado 3D con Three.js**: Visualización fotorrealista de las 56 piezas visibles del cubo con materiales plásticos oscuros y colores oficiales WCA.
- **Motor de Giros y Animaciones**: Permite rotaciones de capas simples, dobles y anchas con suavizado cúbico (*cubic ease-in-out*) y reajuste ortogonal $\mathrm{SO}(3)$ para evitar desalineaciones o bloqueo de cardán (*gimbal lock*).
- **Algoritmo de Resolución por Reducción**:
  - **Fase 1**: Resolución y ordenamiento de centros 2×2.
  - **Fase 2**: Emparejamiento de las 12 aristas dobles (*dedges*).
  - **Fase 3**: Reducción a 3×3 y detección/corrección de paridades **OLL** y **PLL**.
- **Cómputo en Segundo Plano (Web Worker)**: El cálculo del algoritmo de resolución se delega a un *worker* dedicado para mantener la tasa de refresco a 60 FPS sin congelar la interfaz gráfica.
- **Cronómetro de Speedcubing**: Cronómetro de alta precisión activado con la barra espaciadora (estados: inactivo, preparando, listo, corriendo y detenido).
- **Generador de Mezclas WCA**: Algoritmo de dispersión oficial que descarta cancelaciones consecutivas o en ejes paralelos.
- **Diseño Institucional Sobrio**: Interfaz con paleta de colores PANTONE 655 C (azul marino) y PANTONE 1245 C (dorado), optimizada sobre un fondo gris claro descansado para largas sesiones de visualización.

---

## Estructura del Proyecto

```text
rubik4x4/
├── index.html                     # Interfaz de usuario y controles
├── package.json                   # Dependencias y scripts
├── .gitignore                     # Exclusión de node_modules y dist
├── src/
│   ├── main.js                    # Punto de entrada y vinculación de eventos
│   ├── core/
│   │   ├── Rubik4x4State.js       # Modelo matemático discreto del cubo
│   │   └── Scrambler.js           # Generador de mezclas oficiales WCA
│   ├── rendering/
│   │   ├── AnimationEngine.js     # Motor de animación de giros
│   │   ├── CubeRenderer.js        # Configuración de escena, cámara y luces
│   │   └── PieceMesh.js           # Geometría y materiales de las piezas
│   ├── solver/
│   │   ├── ParityAnalyzer.js      # Análisis de permutaciones y paridad OLL/PLL
│   │   ├── ReductionSolver.js     # Algoritmo de resolución por reducción
│   │   └── solver.worker.js       # Web Worker para cómputo asíncrono
│   └── ui/
│       └── Timer.js               # Lógica del cronómetro de preparación y carrera
```

---

## Instalación y Uso Local

### Prerrequisitos
- Node.js (versión 18 o superior)
- npm

### Pasos

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/Aoronae/4x4-Solver-.git
   cd 4x4-Solver-
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Compilar para producción:
   ```bash
   npm run build
   ```
