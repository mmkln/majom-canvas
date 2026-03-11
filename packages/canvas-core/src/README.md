# canvas-core

Reusable canvas engine primitives extracted from the legacy planning app.

## Scope

- generic scene state (`Scene`)
- viewport logic (`PanZoomManager`)
- undo/redo (`HistoryService`)
- generic copy/paste primitives (`ClipboardService`)
- generic shortcut + command runtime (`ShortcutManager`, `CommandManager`)
- generic connection interaction runtime (`ConnectionInteractionRuntime`)
- generic selection runtime (`SelectionRuntime`)
- generic drag interaction runtime (`DragInteractionRuntime`)
- pluggable drag-group policy contract (`DragGroupResolver`)
- pluggable top-element hit-test policy (`TopElementResolver`)
- pluggable connectables ordering policy (`ConnectableOrderResolver`)
- shared connection-point hit testing utility (`findConnectionPointAt`)
- edge model + render utils (`Connection`, `ConnectionRenderer`)
- geometry/path utilities
- typed event bus and relation policy contracts

## Explicit non-goals

- no imports from `features/canvas`
- no imports from `majom-wrapper`
- no backend, auth, routing, or UI shell concerns

## Build

From repo root:

```bash
npm run build:canvas-core
```

This writes ESM bundle + declarations to `packages/canvas-core/dist`.

## Minimal usage

```ts
import {
  InteractionRuntime,
  PanZoomManager,
  Scene,
  HistoryService,
  ClipboardService,
} from 'majom-canvas-core';

const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const scene = new Scene();
const panZoom = new PanZoomManager(canvas);
const history = new HistoryService();
const clipboard = new ClipboardService();

const interaction = new InteractionRuntime({
  canvas,
  scene,
  panZoom,
  connectionInteraction: {
    start: () => false,
    update: () => undefined,
    finish: () => undefined,
    cancel: () => undefined,
    isCreating: () => false,
    hitTest: () => null,
    getTemporaryLine: () => null,
  },
  interactionCommandSink: {
    executeMove: (initial, final) => {
      // bridge to your app command stack
    },
    executeResize: (initial, final) => {
      // bridge to your app command stack
    },
  },
});

canvas.addEventListener('mousedown', (event) => {
  const sceneX = (event.offsetX + panZoom.scrollX) / panZoom.scale;
  const sceneY = (event.offsetY + panZoom.scrollY) / panZoom.scale;
  interaction.handleMouseDown(event, sceneX, sceneY);
});
```

`canvas-core` intentionally does not include app-specific node classes, backend adapters, or UI overlays.

For full implementation steps in a new project, see:

- `packages/canvas-core/INTEGRATION_GUIDE.md`
