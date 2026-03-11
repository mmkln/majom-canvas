import type { Subject } from 'rxjs';
import {
  type GraphEdge,
  type GraphNode,
  type GraphSnapshot,
  type HistoryStateToken,
  type IViewState as CoreViewState,
  TypedEventBus,
} from 'majom-canvas-core';

type LegacyElementLike = {
  id: string;
  selected: boolean;
  zIndex: number;
  [key: string]: unknown;
};

type LegacyConnectionLike = LegacyElementLike & {
  fromId: string;
  toId: string;
  relationType: string;
  lineType?: string;
};

type LegacySceneLike = {
  changes: Subject<void>;
  focusChanges: Subject<{ previousId: string | null; currentId: string | null }>;
  highlightChanges: Subject<{ addedIds: string[]; removedIds: string[] }>;
  getElements(): LegacyElementLike[];
  getElementsVersion(): number;
  getSelectedElements(): LegacyElementLike[];
  getFocusedElementId(): string | null;
  getHighlightedElementIds(): string[];
};

type LegacyPanZoomLike = {
  scrollX: number;
  scrollY: number;
  scale: number;
  viewChanges: Subject<CoreViewState>;
};

type LegacyHistoryLike = {
  changes: Subject<void>;
  canUndo(): boolean;
  canRedo(): boolean;
  hasUnsavedChanges(): boolean;
  getStateToken(): HistoryStateToken;
};

type LegacyCanvasNodeData = {
  legacyType: string;
  selected: boolean;
  zIndex: number;
  focused: boolean;
  highlighted: boolean;
  title?: string;
  status?: string;
  priority?: string;
  uuid?: string;
  backendId?: number;
};

type LegacyCanvasEdgeData = {
  relationType: string;
  lineType?: string;
  selected: boolean;
};

export type LegacyCanvasGraphSnapshot = GraphSnapshot<
  LegacyCanvasNodeData,
  LegacyCanvasEdgeData
>;

export type CanvasCoreBridgeEventMap = {
  sceneChanged: {
    elementsVersion: number;
  };
  selectionChanged: {
    selectedIds: string[];
  };
  focusChanged: {
    previousId: string | null;
    currentId: string | null;
  };
  highlightChanged: {
    addedIds: string[];
    removedIds: string[];
    currentIds: string[];
  };
  viewChanged: CoreViewState;
  historyChanged: {
    canUndo: boolean;
    canRedo: boolean;
    hasUnsavedChanges: boolean;
    stateToken: HistoryStateToken;
  };
};

export class CanvasCoreBridge {
  public readonly events = new TypedEventBus<CanvasCoreBridgeEventMap>();

  private readonly subscriptions: Array<{ unsubscribe(): void }> = [];
  private started = false;

  constructor(
    private readonly scene: LegacySceneLike,
    private readonly panZoom: LegacyPanZoomLike,
    private readonly history: LegacyHistoryLike
  ) {}

  public start(): void {
    if (this.started) return;
    this.started = true;
    this.subscriptions.push(
      this.scene.changes.subscribe(() => {
        this.events.emit('sceneChanged', {
          elementsVersion: this.scene.getElementsVersion(),
        });
        this.events.emit('selectionChanged', {
          selectedIds: this.scene.getSelectedElements().map((el) => el.id),
        });
      }),
      this.scene.focusChanges.subscribe((change) => {
        this.events.emit('focusChanged', change);
      }),
      this.scene.highlightChanges.subscribe((change) => {
        this.events.emit('highlightChanged', {
          ...change,
          currentIds: this.scene.getHighlightedElementIds(),
        });
      }),
      this.panZoom.viewChanges.subscribe((viewState) => {
        this.events.emit('viewChanged', viewState);
      }),
      this.history.changes.subscribe(() => {
        this.events.emit('historyChanged', this.getHistoryState());
      })
    );

    this.emitInitialState();
  }

  public stop(): void {
    if (!this.started) return;
    this.started = false;
    while (this.subscriptions.length > 0) {
      const subscription = this.subscriptions.pop();
      subscription?.unsubscribe();
    }
    this.events.clear();
  }

  public exportGraphSnapshot(): LegacyCanvasGraphSnapshot {
    const focusedId = this.scene.getFocusedElementId();
    const highlightedIds = new Set(this.scene.getHighlightedElementIds());
    const allElements = this.scene.getElements();

    const nodes: GraphNode<LegacyCanvasNodeData>[] = [];
    const edges: GraphEdge<LegacyCanvasEdgeData>[] = [];

    allElements.forEach((element) => {
      if (this.isLegacyConnection(element)) {
        edges.push({
          id: element.id,
          from: element.fromId,
          to: element.toId,
          type: element.relationType,
          selected: element.selected,
          data: {
            relationType: element.relationType,
            lineType: element.lineType,
            selected: element.selected,
          },
        });
        return;
      }

      const bounds = this.resolveBounds(element);
      const legacyType = this.getLegacyType(element);
      const title =
        typeof element.title === 'string' ? element.title : undefined;
      const status =
        typeof element.status === 'string' ? element.status : undefined;
      const priority =
        typeof element.priority === 'string' ? element.priority : undefined;
      const uuid = typeof element.uuid === 'string' ? element.uuid : undefined;
      const backendId =
        typeof element.backendId === 'number' ? element.backendId : undefined;

      nodes.push({
        id: element.id,
        kind: this.getNodeKind(element),
        bounds,
        selected: element.selected,
        zIndex: element.zIndex,
        data: {
          legacyType,
          selected: element.selected,
          zIndex: element.zIndex,
          focused: focusedId === element.id,
          highlighted: highlightedIds.has(element.id),
          title,
          status,
          priority,
          uuid,
          backendId,
        },
      });
    });

    return {
      nodes,
      edges,
      view: {
        scrollX: this.panZoom.scrollX,
        scrollY: this.panZoom.scrollY,
        scale: this.panZoom.scale,
      },
    };
  }

  private emitInitialState(): void {
    this.events.emit('sceneChanged', {
      elementsVersion: this.scene.getElementsVersion(),
    });
    this.events.emit('selectionChanged', {
      selectedIds: this.scene.getSelectedElements().map((el) => el.id),
    });
    this.events.emit('focusChanged', {
      previousId: null,
      currentId: this.scene.getFocusedElementId(),
    });
    this.events.emit('highlightChanged', {
      addedIds: [],
      removedIds: [],
      currentIds: this.scene.getHighlightedElementIds(),
    });
    this.events.emit('viewChanged', {
      scrollX: this.panZoom.scrollX,
      scrollY: this.panZoom.scrollY,
      scale: this.panZoom.scale,
    });
    this.events.emit('historyChanged', this.getHistoryState());
  }

  private getHistoryState(): CanvasCoreBridgeEventMap['historyChanged'] {
    return {
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
      hasUnsavedChanges: this.history.hasUnsavedChanges(),
      stateToken: this.history.getStateToken(),
    };
  }

  private resolveBounds(element: LegacyElementLike): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const x = typeof element.x === 'number' ? element.x : 0;
    const y = typeof element.y === 'number' ? element.y : 0;
    const width = typeof element.width === 'number' ? element.width : null;
    const height = typeof element.height === 'number' ? element.height : null;
    const radius = typeof element.radius === 'number' ? element.radius : null;

    if (width !== null && height !== null) {
      return { x, y, width, height };
    }
    if (radius !== null) {
      return {
        x: x - radius,
        y: y - radius,
        width: radius * 2,
        height: radius * 2,
      };
    }
    return { x, y, width: 0, height: 0 };
  }

  private getNodeKind(element: LegacyElementLike): string {
    const explicitKind =
      typeof element.kind === 'string' ? element.kind.trim() : '';
    if (explicitKind.length > 0) {
      return explicitKind;
    }
    const type = this.getLegacyType(element);
    return type.replace(/Element$/, '').toLowerCase();
  }

  private getLegacyType(element: LegacyElementLike): string {
    const ctor = (element as { constructor?: { name?: string } }).constructor;
    const name =
      ctor && typeof ctor.name === 'string' && ctor.name.length > 0
        ? ctor.name
        : 'LegacyElement';
    return name;
  }

  private isLegacyConnection(
    element: LegacyElementLike
  ): element is LegacyConnectionLike {
    return (
      typeof element.fromId === 'string' &&
      typeof element.toId === 'string' &&
      typeof element.relationType === 'string'
    );
  }
}

