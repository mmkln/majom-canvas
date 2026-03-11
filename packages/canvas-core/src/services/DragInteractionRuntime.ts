export type DragRuntimePoint = {
  x: number;
  y: number;
};

export type DragRuntimeElement = {
  id: string;
};

export type DragRuntimeActiveKind = 'item' | 'group';

type PendingItemDrag<TElement extends DragRuntimeElement> = {
  kind: 'item';
  item: TElement;
  group: TElement[];
  pointerStart: DragRuntimePoint;
  itemOffset: DragRuntimePoint;
};

type PendingGroupDrag<TElement extends DragRuntimeElement> = {
  kind: 'group';
  group: TElement[];
  pointerStart: DragRuntimePoint;
  clickTarget: TElement | null;
};

type ActiveItemDrag<TElement extends DragRuntimeElement> = {
  kind: 'item';
  item: TElement;
  group: TElement[];
  pointerStart: DragRuntimePoint;
  itemOffset: DragRuntimePoint;
};

type ActiveGroupDrag<TElement extends DragRuntimeElement> = {
  kind: 'group';
  group: TElement[];
  pointerStart: DragRuntimePoint;
};

type PendingDrag<TElement extends DragRuntimeElement> =
  | PendingItemDrag<TElement>
  | PendingGroupDrag<TElement>;

type ActiveDrag<TElement extends DragRuntimeElement> =
  | ActiveItemDrag<TElement>
  | ActiveGroupDrag<TElement>;

/**
 * Generic drag state machine for item/group drag lifecycle.
 */
export class DragInteractionRuntime<TElement extends DragRuntimeElement> {
  private pending: PendingDrag<TElement> | null = null;
  private active: ActiveDrag<TElement> | null = null;
  private readonly initialPositions = new Map<string, DragRuntimePoint>();

  constructor(
    private readonly getPosition: (element: TElement) => DragRuntimePoint
  ) {}

  /**
   * Arms pending drag for a single item (and optional selected group).
   */
  public armItem(params: {
    item: TElement;
    group: TElement[];
    pointerStart: DragRuntimePoint;
    itemOffset: DragRuntimePoint;
  }): void {
    this.active = null;
    this.initialPositions.clear();
    this.pending = {
      kind: 'item',
      item: params.item,
      group: this.unique(params.group),
      pointerStart: params.pointerStart,
      itemOffset: params.itemOffset,
    };
  }

  /**
   * Arms pending drag for an explicit group of elements.
   */
  public armGroup(params: {
    group: TElement[];
    pointerStart: DragRuntimePoint;
    clickTarget?: TElement | null;
  }): void {
    this.active = null;
    this.initialPositions.clear();
    this.pending = {
      kind: 'group',
      group: this.unique(params.group),
      pointerStart: params.pointerStart,
      clickTarget: params.clickTarget ?? null,
    };
  }

  /**
   * Returns whether runtime is armed but drag is not active yet.
   */
  public hasPending(): boolean {
    return this.pending !== null;
  }

  /**
   * Returns click target for pending group drag (if any).
   */
  public getPendingGroupClickTarget(): TElement | null {
    if (!this.pending || this.pending.kind !== 'group') return null;
    return this.pending.clickTarget;
  }

  /**
   * Clears pending (not yet activated) drag state.
   */
  public clearPending(): void {
    this.pending = null;
  }

  /**
   * Activates pending drag once movement threshold is reached.
   */
  public tryActivate(params: {
    pointer: DragRuntimePoint;
    scale: number;
    thresholdPx: number;
  }): boolean {
    if (!this.pending) return false;
    if (!this.passedThreshold(params.pointer, params.scale, params.thresholdPx)) {
      return false;
    }
    if (this.pending.kind === 'group') {
      this.active = {
        kind: 'group',
        group: this.pending.group,
        pointerStart: this.pending.pointerStart,
      };
      this.captureInitialPositions(this.pending.group);
    } else {
      this.active = {
        kind: 'item',
        item: this.pending.item,
        group: this.pending.group,
        pointerStart: this.pending.pointerStart,
        itemOffset: this.pending.itemOffset,
      };
      this.captureInitialPositions(this.pending.group);
    }
    this.pending = null;
    return true;
  }

  /**
   * Returns whether drag is currently active.
   */
  public isDragging(): boolean {
    return this.active !== null;
  }

  /**
   * Returns currently active drag kind or `null`.
   */
  public getActiveKind(): DragRuntimeActiveKind | null {
    return this.active?.kind ?? null;
  }

  /**
   * Returns dragged item for item drag mode.
   */
  public getDraggingItem(): TElement | null {
    if (!this.active || this.active.kind !== 'item') return null;
    return this.active.item;
  }

  /**
   * Returns active drag group for item/group drag.
   */
  public getDraggingGroup(): TElement[] | null {
    if (!this.active) return null;
    return this.active.group;
  }

  /**
   * Returns initial positions captured at drag activation.
   */
  public getInitialPositions(): ReadonlyMap<string, DragRuntimePoint> {
    return this.initialPositions;
  }

  /**
   * Updates active drag positions using current pointer.
   */
  public updateActive(
    pointer: DragRuntimePoint,
    setPosition: (element: TElement, position: DragRuntimePoint) => void
  ): boolean {
    if (!this.active) return false;
    if (this.active.kind === 'group') {
      const dx = pointer.x - this.active.pointerStart.x;
      const dy = pointer.y - this.active.pointerStart.y;
      this.active.group.forEach((element) => {
        const initial = this.initialPositions.get(element.id);
        if (!initial) return;
        setPosition(element, { x: initial.x + dx, y: initial.y + dy });
      });
      return true;
    }
    const anchor = this.initialPositions.get(this.active.item.id);
    if (!anchor) return false;
    const dx = pointer.x - (anchor.x + this.active.itemOffset.x);
    const dy = pointer.y - (anchor.y + this.active.itemOffset.y);
    this.active.group.forEach((element) => {
      const initial = this.initialPositions.get(element.id);
      if (!initial) return;
      setPosition(element, { x: initial.x + dx, y: initial.y + dy });
    });
    return true;
  }

  /**
   * Captures current positions for active drag group.
   */
  public snapshotFinalPositions(
    getPosition: (element: TElement) => DragRuntimePoint
  ): Map<string, DragRuntimePoint> {
    const finalPositions = new Map<string, DragRuntimePoint>();
    if (!this.active) return finalPositions;
    this.active.group.forEach((element) => {
      finalPositions.set(element.id, getPosition(element));
    });
    return finalPositions;
  }

  /**
   * Clears active drag state and cached initial positions.
   */
  public resetDragState(): void {
    this.active = null;
    this.initialPositions.clear();
  }

  private passedThreshold(
    pointer: DragRuntimePoint,
    scale: number,
    thresholdPx: number
  ): boolean {
    if (!this.pending) return false;
    const dx = pointer.x - this.pending.pointerStart.x;
    const dy = pointer.y - this.pending.pointerStart.y;
    const threshold = thresholdPx / scale;
    return dx * dx + dy * dy >= threshold * threshold;
  }

  private captureInitialPositions(group: TElement[]): void {
    this.initialPositions.clear();
    group.forEach((element) => {
      this.initialPositions.set(element.id, this.getPosition(element));
    });
  }

  private unique(group: TElement[]): TElement[] {
    const deduped = new Map<string, TElement>();
    group.forEach((element) => deduped.set(element.id, element));
    return Array.from(deduped.values());
  }
}
