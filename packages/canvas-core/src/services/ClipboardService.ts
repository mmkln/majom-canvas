export type ClipboardPoint = {
  x: number;
  y: number;
};

export type ClipboardBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export interface ClipboardCloneable {
  id: string;
  x: number;
  y: number;
  clone(): ClipboardCloneable;
  width?: number;
  height?: number;
}

export interface ClipboardTarget<TElement extends ClipboardCloneable> {
  addElement(element: TElement): void;
}

export type ClipboardPasteOptions<TElement extends ClipboardCloneable> = {
  afterPaste?: (elements: TElement[]) => void;
};

export type ClipboardIdFactory = () => string;

export type ClipboardBoundsResolver<TElement extends ClipboardCloneable> = (
  element: TElement
) => ClipboardBounds;

const defaultIdFactory: ClipboardIdFactory = () => {
  const cryptoObject = globalThis.crypto as Crypto | undefined;
  if (cryptoObject && typeof cryptoObject.randomUUID === 'function') {
    return cryptoObject.randomUUID();
  }
  return `clip-${Math.random().toString(36).slice(2, 11)}`;
};

const defaultBoundsResolver = <TElement extends ClipboardCloneable>(
  element: TElement
): ClipboardBounds => ({
  x: element.x,
  y: element.y,
  width: typeof element.width === 'number' ? element.width : 0,
  height: typeof element.height === 'number' ? element.height : 0,
});

/**
 * In-memory clipboard for cloneable canvas elements.
 */
export class ClipboardService<TElement extends ClipboardCloneable> {
  private items: TElement[] = [];

  constructor(
    private readonly createId: ClipboardIdFactory = defaultIdFactory,
    private readonly resolveBounds: ClipboardBoundsResolver<TElement> = defaultBoundsResolver
  ) {}

  /**
   * Stores cloned copies of provided elements in clipboard memory.
   */
  public copy(elements: TElement[]): void {
    this.items = elements.map((element) => this.cloneWithNewId(element));
  }

  /**
   * Pastes clipboard elements around target scene position.
   */
  public paste(
    target: ClipboardTarget<TElement>,
    position?: ClipboardPoint,
    options: ClipboardPasteOptions<TElement> = {}
  ): TElement[] {
    if (!position || this.items.length === 0) {
      return [];
    }
    const bounds = this.getSelectionBounds(this.items);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const offsetX = position.x - centerX;
    const offsetY = position.y - centerY;

    const clones = this.items.map((element) => {
      const clone = this.cloneWithNewId(element);
      clone.x = element.x + offsetX;
      clone.y = element.y + offsetY;
      target.addElement(clone);
      return clone;
    });

    options.afterPaste?.(clones);
    return clones;
  }

  /**
   * Clears clipboard content.
   */
  public clear(): void {
    this.items = [];
  }

  /**
   * Returns current clipboard items.
   */
  public getItems(): TElement[] {
    return this.items;
  }

  private cloneWithNewId(element: TElement): TElement {
    const clone = element.clone() as TElement;
    clone.id = this.createId();
    return clone;
  }

  private getSelectionBounds(elements: TElement[]): ClipboardBounds {
    const first = this.resolveBounds(elements[0]);
    let minX = first.x;
    let minY = first.y;
    let maxX = first.x + first.width;
    let maxY = first.y + first.height;

    for (let i = 1; i < elements.length; i += 1) {
      const bounds = this.resolveBounds(elements[i]);
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
}
