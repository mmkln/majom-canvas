export type SelectionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SelectionBounds = SelectionRect;

export type SelectionElement = {
  id: string;
  selected: boolean;
};

export type SelectionRuntimeOptions<TElement extends SelectionElement> = {
  setSelected: (elements: TElement[]) => void;
  toggleSelected: (elements: TElement[]) => void;
};

/**
 * Stateless selection helpers for click and region-select workflows.
 */
export class SelectionRuntime<TElement extends SelectionElement> {
  private regionSelecting = false;
  private regionStartX = 0;
  private regionStartY = 0;
  private regionCurrentX = 0;
  private regionCurrentY = 0;

  constructor(private readonly options: SelectionRuntimeOptions<TElement>) {}

  /**
   * Applies single-click selection semantics with optional shift-toggle.
   */
  public selectOnClick(target: TElement | null, shiftKey: boolean): void {
    if (!target) {
      this.options.setSelected([]);
      return;
    }
    if (shiftKey) {
      this.options.toggleSelected([target]);
      return;
    }
    this.options.setSelected([target]);
  }

  /**
   * Starts region-select drag at scene coordinates.
   */
  public startRegion(x: number, y: number): void {
    this.regionSelecting = true;
    this.regionStartX = x;
    this.regionStartY = y;
    this.regionCurrentX = x;
    this.regionCurrentY = y;
    this.options.setSelected([]);
  }

  /**
   * Updates region rectangle and returns matching selected elements.
   */
  public updateRegion(
    x: number,
    y: number,
    elements: TElement[],
    resolveBounds: (element: TElement) => SelectionBounds
  ): TElement[] {
    if (!this.regionSelecting) return [];
    this.regionCurrentX = x;
    this.regionCurrentY = y;
    const rect = this.getRegionRect();
    if (!rect) return [];
    const selected = elements.filter((element) =>
      this.intersects(rect, resolveBounds(element))
    );
    this.options.setSelected(selected);
    return selected;
  }

  /**
   * Finalizes region selection and returns selected elements.
   */
  public finishRegion(
    elements: TElement[],
    resolveBounds: (element: TElement) => SelectionBounds
  ): TElement[] {
    if (!this.regionSelecting) return [];
    const rect = this.getRegionRect();
    this.regionSelecting = false;
    if (!rect) return [];
    const selected = elements.filter((element) =>
      this.intersects(rect, resolveBounds(element))
    );
    this.options.setSelected(selected);
    return selected;
  }

  /**
   * Cancels active region selection.
   */
  public cancelRegion(): void {
    this.regionSelecting = false;
  }

  /**
   * Returns whether region-select drag is active.
   */
  public isRegionSelecting(): boolean {
    return this.regionSelecting;
  }

  /**
   * Returns normalized region rectangle or `null` when inactive.
   */
  public getRegionRect(): SelectionRect | null {
    if (!this.regionSelecting) return null;
    const x = Math.min(this.regionStartX, this.regionCurrentX);
    const y = Math.min(this.regionStartY, this.regionCurrentY);
    const width = Math.abs(this.regionCurrentX - this.regionStartX);
    const height = Math.abs(this.regionCurrentY - this.regionStartY);
    return { x, y, width, height };
  }

  private intersects(a: SelectionRect, b: SelectionRect): boolean {
    const aRight = a.x + a.width;
    const aBottom = a.y + a.height;
    const bRight = b.x + b.width;
    const bBottom = b.y + b.height;
    return (
      bRight >= a.x && b.x <= aRight && bBottom >= a.y && b.y <= aBottom
    );
  }
}
