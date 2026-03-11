# Canvas-Core Integration Guide

Technical implementation guide for integrating `majom-canvas-core` into a new app.

## 1. Goal and Scope

`majom-canvas-core` provides reusable canvas engine primitives:

- scene state (`Scene`)
- viewport/pan/zoom (`PanZoomManager`)
- interaction runtime (`InteractionRuntime`, `ConnectionInteractionRuntime`, `SelectionRuntime`, `DragInteractionRuntime`)
- keyboard/commands/history (`ShortcutManager`, `CommandManager`, `HistoryService`)
- copy/paste primitive (`ClipboardService`)
- connection model/render/math utilities (`Connection`, `connectionRenderer`, geometry helpers)

`majom-canvas-core` does not provide:

- product-specific node classes
- ready inspector/modal/context menu UI shell
- backend adapter implementation
- auth/routing

## 2. Prerequisites

Install package:

```bash
npm i majom-canvas-core
```

Runtime dependencies:

- `rxjs`
- `uuid`

## 3. Recommended Host Architecture

Use a 4-layer host architecture:

1. **Domain layer**
Custom node/edge classes, domain rules, DTO mapping.
2. **Canvas engine layer**
`Scene`, `PanZoomManager`, interaction runtimes, history, clipboard.
3. **UI shell layer**
Canvas component, inspector, context menu, toolbar, minimap.
4. **Persistence layer**
Implementation of `PersistenceAdapter` + API client.

Keep domain logic out of `canvas-core` adapters whenever possible.

## 4. Minimal Data Contracts

Use `GraphSnapshot` as persistence transport shape:

```ts
type GraphSnapshot<TNodeData, TEdgeData> = {
  nodes: Array<{
    id: string;
    kind: string;
    bounds: { x: number; y: number; width: number; height: number };
    data: TNodeData;
    selected?: boolean;
    zIndex?: number;
  }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    type: string;
    data: TEdgeData;
    selected?: boolean;
  }>;
  view?: { scrollX: number; scrollY: number; scale: number };
};
```

## 5. Step-by-Step Integration

### Step 1. Define node/edge runtime classes

Node should implement `ICanvasElement` and (for connections) `IConnectable`.
Edge can use built-in `Connection`.

```ts
import type {
  ICanvasElement,
  IConnectable,
  ConnectionPoint,
  PanZoomManager,
} from 'majom-canvas-core';

export class GraphNode implements ICanvasElement, IConnectable {
  id: string;
  zIndex = 10;
  selected = false;

  x: number;
  y: number;
  width: number;
  height: number;

  constructor(id: string, x: number, y: number, width = 220, height = 120) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  contains(px: number, py: number): boolean {
    return (
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.height
    );
  }

  getConnectionPoints(): ConnectionPoint[] {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    return [
      { x: cx, y: this.y, angle: -Math.PI / 2, direction: 'top' },
      { x: this.x + this.width, y: cy, angle: 0, direction: 'right' },
      { x: cx, y: this.y + this.height, angle: Math.PI / 2, direction: 'bottom' },
      { x: this.x, y: cy, angle: Math.PI, direction: 'left' },
    ];
  }

  getNearestPoint(px: number, py: number): { x: number; y: number } {
    const points = this.getConnectionPoints();
    return points.reduce((best, p) =>
      Math.hypot(px - p.x, py - p.y) < Math.hypot(px - best.x, py - best.y) ? p : best
    );
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = this.selected ? '#dbeafe' : '#ffffff';
    ctx.strokeStyle = this.selected ? '#1d4ed8' : '#d1d5db';
    ctx.lineWidth = 1.5;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }

  drawAnchors(ctx: CanvasRenderingContext2D): void {
    for (const p of this.getConnectionPoints()) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#1d4ed8';
      ctx.fill();
    }
  }

  drawConnectionLine(
    ctx: CanvasRenderingContext2D,
    _panZoom: PanZoomManager,
    target: IConnectable
  ): void {
    const from = this.getNearestPoint(target.getNearestPoint(this.x, this.y).x, target.getNearestPoint(this.x, this.y).y);
    const to = target.getNearestPoint(from.x, from.y);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = '#93c5fd';
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
```

### Step 2. Bootstrap engine services

```ts
import {
  Scene,
  PanZoomManager,
  HistoryService,
  ClipboardService,
  Connection,
  ConnectionInteractionRuntime,
  InteractionRuntime,
} from 'majom-canvas-core';

const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const scene = new Scene<ICanvasElement>();
const panZoom = new PanZoomManager(canvas);
const history = new HistoryService();
const clipboard = new ClipboardService<GraphNode>((() => crypto.randomUUID()) as () => string);
```

Important: `InteractionRuntime` expects a scene-like object with `getShapes`.
`Scene` from core has `getConnectables`, so create a small adapter:

```ts
const runtimeScene = {
  getShapes: () => scene.getConnectables() as GraphNode[],
  getElements: () => scene.getElements() as (GraphNode | Connection)[],
  getSelectedElements: () => scene.getSelectedElements() as (GraphNode | Connection)[],
  setSelected: (elements: (GraphNode | Connection)[]) => scene.setSelected(elements),
  toggleSelected: (elements: (GraphNode | Connection)[]) => scene.toggleSelected(elements),
  changes: scene.changes,
};
```

### Step 3. Configure connection runtime

```ts
const connectionRuntime = new ConnectionInteractionRuntime<GraphNode, Connection>({
  getConnectables: () => scene.getConnectables() as GraphNode[],
  getConnections: () => scene.getConnections() as Connection[],
  getScale: () => panZoom.scale,
  onConnectionCreate: ({ fromId, toId, relationType }) => {
    scene.addElement(new Connection(fromId, toId, undefined, undefined, relationType));
  },
});
```

### Step 4. Wire interaction runtime

`InteractionRuntime` emits move/resize deltas via command sink. Bridge those to history commands.

```ts
import { Command } from 'majom-canvas-core';

class MoveElementsCommand extends Command {
  constructor(
    private readonly elementsById: Map<string, GraphNode>,
    private readonly initial: Map<string, { x: number; y: number }>,
    private readonly final: Map<string, { x: number; y: number }>
  ) {
    super();
  }

  execute(): void {
    this.final.forEach((pos, id) => {
      const el = this.elementsById.get(id);
      if (!el) return;
      el.x = pos.x;
      el.y = pos.y;
    });
  }

  undo(): void {
    this.initial.forEach((pos, id) => {
      const el = this.elementsById.get(id);
      if (!el) return;
      el.x = pos.x;
      el.y = pos.y;
    });
  }
}

const interaction = new InteractionRuntime<
  GraphNode | Connection,
  GraphNode,
  Connection,
  PanZoomManager
>({
  canvas,
  scene: runtimeScene,
  panZoom,
  connectionInteraction: connectionRuntime,
  interactionCommandSink: {
    executeMove: (initial, final) => {
      const map = new Map(
        (scene.getElements() as GraphNode[]).map((el) => [el.id, el] as const)
      );
      history.execute(new MoveElementsCommand(map, initial as any, final as any));
      scene.changes.next();
    },
  },
});
```

### Step 5. Pointer + wheel event routing

Use scene coordinates for runtime handlers:

```ts
const toScene = (event: MouseEvent) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return {
    sceneX: (x + panZoom.scrollX) / panZoom.scale,
    sceneY: (y + panZoom.scrollY) / panZoom.scale,
    screenX: x,
    screenY: y,
  };
};

canvas.addEventListener('mousedown', (e) => {
  const { sceneX, sceneY } = toScene(e);
  interaction.handleMouseDown(e, sceneX, sceneY);
});

window.addEventListener('mousemove', (e) => {
  const { sceneX, sceneY } = toScene(e);
  interaction.handleMouseMove(sceneX, sceneY);
});

window.addEventListener('mouseup', () => interaction.handleMouseUp());

canvas.addEventListener('dblclick', (e) => {
  const { sceneX, sceneY } = toScene(e);
  interaction.handleDoubleClick(sceneX, sceneY);
});

canvas.addEventListener('contextmenu', (e) => {
  const { sceneX, sceneY } = toScene(e);
  interaction.handleRightClick(e, sceneX, sceneY);
});

canvas.addEventListener('wheel', (e) => {
  const rect = canvas.getBoundingClientRect();
  panZoom.handleWheelEvent(e, e.clientX - rect.left, e.clientY - rect.top);
  e.preventDefault();
});
```

### Step 6. Rendering loop

```ts
import { connectionRenderer } from 'majom-canvas-core';

const draw = () => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(panZoom.scale, 0, 0, panZoom.scale, -panZoom.scrollX, -panZoom.scrollY);

  const elements = [...scene.getElements()].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  const connectables = scene.getConnectables();
  for (const element of elements) {
    element.draw(ctx, panZoom, connectables);
  }

  const temp = interaction.getTempConnectionLine();
  if (temp) {
    ctx.beginPath();
    ctx.moveTo(temp.startX, temp.startY);
    ctx.lineTo(temp.endX, temp.endY);
    ctx.strokeStyle = '#60a5fa';
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
};

scene.changes.subscribe(draw);
panZoom.viewChanges.subscribe(draw);
draw();
```

Use continuous `requestAnimationFrame` only if you need animation effects.

### Step 7. Keyboard + commands

```ts
import { ShortcutManager, CommandManager } from 'majom-canvas-core';

const shortcuts = new ShortcutManager({ autoAttach: true });
const commands = new CommandManager(shortcuts);

commands.register('undo', () => history.undo());
commands.register('redo', () => history.redo());
commands.register('zoomIn', () => panZoom.zoomIn());
commands.register('zoomOut', () => panZoom.zoomOut());

commands.bindShortcut('undo', 'ctrl+z');
commands.bindShortcut('redo', 'ctrl+shift+z');
commands.bindShortcut('zoomIn', 'ctrl+=');
commands.bindShortcut('zoomOut', 'ctrl+-');
```

### Step 8. Copy / paste

`ClipboardService` requires cloneable element type.

```ts
clipboard.copy(scene.getSelectedElements().filter((e): e is GraphNode => e instanceof GraphNode));

clipboard.paste(
  { addElement: (element) => scene.addElement(element) },
  { x: 1200, y: 800 },
  { afterPaste: (elements) => scene.setSelected(elements) }
);
```

### Step 9. Persistence adapter

Implement `PersistenceAdapter`:

```ts
import type { PersistenceAdapter, GraphSnapshot, GraphEdge } from 'majom-canvas-core';

class ApiPersistenceAdapter implements PersistenceAdapter<MyNodeData, MyEdgeData> {
  async loadSnapshot(): Promise<GraphSnapshot<MyNodeData, MyEdgeData>> {
    // GET /graph/snapshot
    throw new Error('Not implemented');
  }

  async saveLayout(snapshot: GraphSnapshot<MyNodeData, MyEdgeData>): Promise<void> {
    // PUT /graph/layout
  }

  async saveRelations(edges: GraphEdge<MyEdgeData>[]): Promise<void> {
    // PUT /graph/relations
  }
}
```

Keep conversion logic between `GraphSnapshot` and runtime element classes in a dedicated mapper.

## 6. Integration Contracts You Must Define in Host App

1. Node class contracts:
- `contains`
- `getConnectionPoints`
- `draw`
2. Edge semantics:
- allowed relation types
- edge normalization (optional)
3. Command strategy:
- which operations are undoable
- merge strategy for drag commands
4. Persistence strategy:
- snapshot frequency
- optimistic vs. confirmed save model

## 7. Common Pitfalls

1. Passing screen coordinates to `InteractionRuntime` handlers.
Use scene coordinates only.
2. Forgetting scene adapter `getShapes`.
`InteractionRuntime` requires it.
3. Storing domain side effects inside runtime callbacks.
Keep callbacks thin, forward to app services.
4. Missing redraw trigger after command execution.
Call `scene.changes.next()` when mutations happen outside scene APIs.
5. Mixing connections into connectables set.
Only connectable nodes should be returned from `getConnectables`/`getShapes`.

## 8. Performance Baseline

Recommended baseline before production:

- draw on demand via `scene.changes` + `viewChanges`
- cull by view bounds (`getViewBounds`, `isRectVisible`, `isCircleVisible`)
- keep hit-testing tolerance scale-aware
- debounce save operations
- add spatial index for large graphs

## 9. Production Readiness Checklist

- pan/zoom stable on mouse + trackpad
- select / multi-select / box-select stable
- drag single + group stable
- connection create / hit-test / delete stable
- undo/redo covers all mutating interactions
- copy/paste keeps ids unique
- persistence restores exact view + layout + edges
- no product-specific imports inside core usage layer

## 10. Suggested Rollout Plan

1. Phase 1: read-only render + pan/zoom
2. Phase 2: selection + drag + inspector open
3. Phase 3: edges + undo/redo + copy/paste
4. Phase 4: persistence sync + constraints/policies
5. Phase 5: performance hardening for large graphs
