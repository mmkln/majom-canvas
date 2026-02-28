// core/scene/Scene.ts
import { Subject } from 'rxjs';
import { ICanvasElement } from '../interfaces/canvasElement.ts';
import { IShape } from '../interfaces/shape.ts';
import { isConnection, isShape } from '../utils/typeGuards.ts';
import { IConnection } from '../interfaces/connection.ts';

export class Scene {
  private elements: ICanvasElement[] = [];
  private elementsVersion = 0;
  private selectedMap: Map<string, ICanvasElement> = new Map<
    string,
    ICanvasElement
  >();
  private focusedElementId: string | null = null;
  private highlightedElementIds: Set<string> = new Set<string>();
  public changes: Subject<void> = new Subject<void>();
  public focusChanges: Subject<{
    previousId: string | null;
    currentId: string | null;
  }> = new Subject<{
    previousId: string | null;
    currentId: string | null;
  }>();
  public highlightChanges: Subject<{
    addedIds: string[];
    removedIds: string[];
  }> = new Subject<{
    addedIds: string[];
    removedIds: string[];
  }>();

  constructor() {}

  // TODO: change to addElements
  public addElement(element: ICanvasElement): void {
    this.elements.push(element);
    this.elementsVersion += 1;
    if (element.selected) {
      this.selectedMap.set(element.id, element);
    }
    this.changes.next();
  }

  public removeElements(elements: ICanvasElement[]): void {
    let focusChanged = false;
    const previousFocusId = this.focusedElementId;
    const removedHighlightedIds: string[] = [];
    elements.forEach((element) => {
      const index = this.elements.indexOf(element);
      const elementId = element.id;
      if (index > -1) {
        this.elements.splice(index, 1);
      }
      if (this.selectedMap.has(elementId)) {
        this.selectedMap.delete(elementId);
        // element.selected = false; TODO: check if this is needed or not
      }
      if (this.focusedElementId === elementId) {
        this.focusedElementId = null;
        focusChanged = true;
      }
      if (this.highlightedElementIds.delete(elementId)) {
        removedHighlightedIds.push(elementId);
      }
    });
    if (elements.length > 0) {
      this.elementsVersion += 1;
    }
    this.changes.next();
    if (focusChanged) {
      this.focusChanges.next({
        previousId: previousFocusId,
        currentId: this.focusedElementId,
      });
    }
    if (removedHighlightedIds.length > 0) {
      this.highlightChanges.next({
        addedIds: [],
        removedIds: removedHighlightedIds,
      });
    }
  }

  public replaceElements(
    shouldReplace: (element: ICanvasElement) => boolean,
    replacements: ICanvasElement[]
  ): void {
    const keptElements = this.elements.filter(
      (element) => !shouldReplace(element)
    );
    const replacedCount = this.elements.length - keptElements.length;
    if (replacedCount === 0 && replacements.length === 0) return;

    const previousFocusId = this.focusedElementId;
    const previousHighlightedIds = new Set(this.highlightedElementIds);
    const nextElements = [...keptElements, ...replacements];
    this.elements = nextElements;
    this.selectedMap.clear();
    nextElements.forEach((element) => {
      if (element.selected) {
        this.selectedMap.set(element.id, element);
      }
    });

    const nextFocusId =
      previousFocusId &&
      nextElements.some((element) => element.id === previousFocusId)
        ? previousFocusId
        : null;
    const nextElementIds = new Set(nextElements.map((element) => element.id));
    const nextHighlightedIds = new Set<string>();
    this.highlightedElementIds.forEach((id) => {
      if (nextElementIds.has(id)) {
        nextHighlightedIds.add(id);
      }
    });
    const removedHighlightedIds = Array.from(previousHighlightedIds).filter(
      (id) => !nextHighlightedIds.has(id)
    );
    this.focusedElementId = nextFocusId;
    this.highlightedElementIds = nextHighlightedIds;

    this.elementsVersion += 1;
    this.changes.next();
    if (previousFocusId !== nextFocusId) {
      this.focusChanges.next({
        previousId: previousFocusId,
        currentId: nextFocusId,
      });
    }
    if (removedHighlightedIds.length > 0) {
      this.highlightChanges.next({
        addedIds: [],
        removedIds: removedHighlightedIds,
      });
    }
  }

  public getElements(): ICanvasElement[] {
    return this.elements;
  }

  public getElementsVersion(): number {
    return this.elementsVersion;
  }

  public getShapes(): IShape[] {
    return this.elements.filter(isShape);
  }

  public getConnections(): IConnection[] {
    return this.elements.filter(isConnection);
  }

  public setSelected(elements: ICanvasElement[]): void {
    this.clearSelected();

    elements.forEach((selectable) => {
      selectable.selected = true;
      this.selectedMap.set(selectable.id, selectable);
    });

    this.changes.next();
  }

  public addToSelected(elements: ICanvasElement[]): void {
    let changed = false;
    elements.forEach((selectable) => {
      if (!selectable.selected) {
        selectable.selected = true;
        this.selectedMap.set(selectable.id, selectable);
        changed = true;
      } else if (!this.selectedMap.has(selectable.id)) {
        // keep map in sync if selection was changed outside Scene APIs
        this.selectedMap.set(selectable.id, selectable);
      }
    });
    if (changed) {
      this.changes.next();
    }
  }

  public removeFromSelected(elements: ICanvasElement[]): void {
    let changed = false;
    elements.forEach((selectable) => {
      if (selectable.selected) {
        selectable.selected = false;
        this.selectedMap.delete(selectable.id);
        changed = true;
      } else if (this.selectedMap.has(selectable.id)) {
        // keep map in sync if selection was changed outside Scene APIs
        this.selectedMap.delete(selectable.id);
      }
    });
    if (changed) {
      this.changes.next();
    }
  }

  public clearSelected(): void {
    for (const [_, el] of this.selectedMap) {
      el.selected = false;
    }
    this.selectedMap.clear();
    this.changes.next();
  }

  public toggleSelected(elements: ICanvasElement[]): void {
    console.log({ elements });
    let changed = false;
    elements.forEach((selectable) => {
      if (selectable.selected) {
        selectable.selected = false;
        this.selectedMap.delete(selectable.id);
        changed = true;
      } else {
        selectable.selected = true;
        this.selectedMap.set(selectable.id, selectable);
        changed = true;
      }
    });
    if (changed) {
      this.changes.next();
    }
  }

  public getSelectedElements(): ICanvasElement[] {
    return Array.from(this.selectedMap.values());
  }

  public getSelectedShapes(): IShape[] {
    return this.getShapes().filter((shape) => shape.selected);
  }

  public clear(): void {
    const previousFocusId = this.focusedElementId;
    const removedHighlightedIds = Array.from(this.highlightedElementIds);
    this.elements = [];
    this.selectedMap.clear();
    this.focusedElementId = null;
    this.highlightedElementIds.clear();
    this.elementsVersion += 1;
    this.changes.next();
    if (previousFocusId !== null) {
      this.focusChanges.next({
        previousId: previousFocusId,
        currentId: null,
      });
    }
    if (removedHighlightedIds.length > 0) {
      this.highlightChanges.next({
        addedIds: [],
        removedIds: removedHighlightedIds,
      });
    }
  }

  public setFocusedElement(element: ICanvasElement | null): void {
    this.setFocusedElementById(element?.id ?? null);
  }

  public setFocusedElementById(id: string | null): void {
    const normalizedId =
      id && this.elements.some((element) => element.id === id) ? id : null;
    const previousId = this.focusedElementId;
    if (previousId === normalizedId) return;
    this.focusedElementId = normalizedId;
    this.focusChanges.next({
      previousId,
      currentId: normalizedId,
    });
  }

  public clearFocusedElement(): void {
    this.setFocusedElementById(null);
  }

  public getFocusedElementId(): string | null {
    return this.focusedElementId;
  }

  public getFocusedElement(): ICanvasElement | null {
    if (!this.focusedElementId) return null;
    return (
      this.elements.find((element) => element.id === this.focusedElementId) ??
      null
    );
  }

  public isFocused(element: ICanvasElement | null): boolean {
    if (!element) return false;
    return this.focusedElementId === element.id;
  }

  public setHighlightedElementById(id: string, highlighted: boolean): void {
    const exists = this.elements.some((element) => element.id === id);
    if (!exists) return;
    const wasHighlighted = this.highlightedElementIds.has(id);
    if (highlighted) {
      if (wasHighlighted) return;
      this.highlightedElementIds.add(id);
      this.highlightChanges.next({
        addedIds: [id],
        removedIds: [],
      });
      return;
    }
    if (!wasHighlighted) return;
    this.highlightedElementIds.delete(id);
    this.highlightChanges.next({
      addedIds: [],
      removedIds: [id],
    });
  }

  public setHighlightedElementIds(ids: string[]): void {
    const existingIds = new Set(this.elements.map((element) => element.id));
    const nextIds = new Set<string>();
    ids.forEach((id) => {
      if (existingIds.has(id)) {
        nextIds.add(id);
      }
    });
    const addedIds = Array.from(nextIds).filter(
      (id) => !this.highlightedElementIds.has(id)
    );
    const removedIds = Array.from(this.highlightedElementIds).filter(
      (id) => !nextIds.has(id)
    );
    if (addedIds.length === 0 && removedIds.length === 0) return;
    this.highlightedElementIds = nextIds;
    this.highlightChanges.next({
      addedIds,
      removedIds,
    });
  }

  public clearHighlightedElements(): void {
    if (this.highlightedElementIds.size === 0) return;
    const removedIds = Array.from(this.highlightedElementIds);
    this.highlightedElementIds.clear();
    this.highlightChanges.next({
      addedIds: [],
      removedIds,
    });
  }

  public getHighlightedElementIds(): string[] {
    return Array.from(this.highlightedElementIds);
  }

  public isHighlightedById(id: string | null): boolean {
    if (!id) return false;
    return this.highlightedElementIds.has(id);
  }

  public isHighlighted(element: ICanvasElement | null): boolean {
    if (!element) return false;
    return this.highlightedElementIds.has(element.id);
  }
}
