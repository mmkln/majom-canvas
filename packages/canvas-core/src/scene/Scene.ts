import { Subject } from 'rxjs';
import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import type { IConnection } from '../interfaces/connection.ts';
import { isConnectable, isConnection } from '../utils/typeGuards.ts';

/**
 * Mutable scene container with selection, focus and highlight state.
 */
export class Scene<TElement extends ICanvasElement = ICanvasElement> {
  private elements: TElement[] = [];
  private elementsVersion = 0;
  private selectedMap = new Map<string, TElement>();
  private focusedElementId: string | null = null;
  private highlightedElementIds = new Set<string>();

  public readonly changes = new Subject<void>();
  public readonly focusChanges = new Subject<{
    previousId: string | null;
    currentId: string | null;
  }>();
  public readonly highlightChanges = new Subject<{
    addedIds: string[];
    removedIds: string[];
  }>();

  /**
   * Appends one element to the scene.
   */
  public addElement(element: TElement): void {
    this.elements.push(element);
    this.elementsVersion += 1;
    if (element.selected) {
      this.selectedMap.set(element.id, element);
    }
    this.changes.next();
  }

  /**
   * Appends multiple elements to the scene in one update.
   */
  public addElements(elements: TElement[]): void {
    if (elements.length === 0) return;
    elements.forEach((element) => {
      this.elements.push(element);
      if (element.selected) {
        this.selectedMap.set(element.id, element);
      }
    });
    this.elementsVersion += 1;
    this.changes.next();
  }

  /**
   * Removes provided elements by id and updates focus/highlight state.
   */
  public removeElements(elements: TElement[]): void {
    if (elements.length === 0) return;
    const idsToRemove = new Set(elements.map((element) => element.id));
    const previousFocusId = this.focusedElementId;
    const removedHighlightedIds = Array.from(this.highlightedElementIds).filter(
      (id) => idsToRemove.has(id)
    );

    this.elements = this.elements.filter((element) => !idsToRemove.has(element.id));
    elements.forEach((element) => {
      this.selectedMap.delete(element.id);
      if (this.focusedElementId === element.id) {
        this.focusedElementId = null;
      }
      this.highlightedElementIds.delete(element.id);
    });

    this.elementsVersion += 1;
    this.changes.next();

    if (previousFocusId !== this.focusedElementId) {
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

  /**
   * Replaces all elements matching predicate with provided replacements.
   */
  public replaceElements(
    shouldReplace: (element: TElement) => boolean,
    replacements: TElement[]
  ): void {
    const keptElements = this.elements.filter((element) => !shouldReplace(element));
    const replacedCount = this.elements.length - keptElements.length;
    if (replacedCount === 0 && replacements.length === 0) return;

    const previousFocusId = this.focusedElementId;
    const previousHighlightedIds = new Set(this.highlightedElementIds);
    const nextElements = [...keptElements, ...replacements];
    const nextElementIds = new Set(nextElements.map((element) => element.id));
    const nextFocusId =
      previousFocusId && nextElementIds.has(previousFocusId) ? previousFocusId : null;
    const nextHighlightedIds = new Set<string>();

    this.highlightedElementIds.forEach((id) => {
      if (nextElementIds.has(id)) {
        nextHighlightedIds.add(id);
      }
    });
    this.elements = nextElements;
    this.selectedMap.clear();
    nextElements.forEach((element) => {
      if (element.selected) {
        this.selectedMap.set(element.id, element);
      }
    });
    this.focusedElementId = nextFocusId;
    this.highlightedElementIds = nextHighlightedIds;

    const removedHighlightedIds = Array.from(previousHighlightedIds).filter(
      (id) => !nextHighlightedIds.has(id)
    );

    this.elementsVersion += 1;
    this.changes.next();
    if (previousFocusId !== nextFocusId) {
      this.focusChanges.next({ previousId: previousFocusId, currentId: nextFocusId });
    }
    if (removedHighlightedIds.length > 0) {
      this.highlightChanges.next({ addedIds: [], removedIds: removedHighlightedIds });
    }
  }

  /**
   * Returns scene element array (mutable reference).
   */
  public getElements(): TElement[] {
    return this.elements;
  }

  /**
   * Returns monotonically increasing element-version marker.
   */
  public getElementsVersion(): number {
    return this.elementsVersion;
  }

  /**
   * Returns all elements that satisfy connectable contract.
   */
  public getConnectables(): IConnectable[] {
    return this.elements.filter(
      (element): element is TElement & IConnectable => isConnectable(element)
    );
  }

  /**
   * Returns all elements that satisfy connection contract.
   */
  public getConnections(): IConnection[] {
    return this.elements.filter(
      (element): element is TElement & IConnection => isConnection(element)
    );
  }

  /**
   * Replaces current selection with provided elements.
   */
  public setSelected(elements: TElement[]): void {
    let changed = false;
    if (this.selectedMap.size > 0) {
      this.selectedMap.forEach((element) => {
        element.selected = false;
      });
      this.selectedMap.clear();
      changed = true;
    }

    elements.forEach((element) => {
      if (!element.selected || !this.selectedMap.has(element.id)) {
        changed = true;
      }
      element.selected = true;
      this.selectedMap.set(element.id, element);
    });

    if (changed) {
      this.changes.next();
    }
  }

  /**
   * Adds elements to selection preserving existing selected items.
   */
  public addToSelected(elements: TElement[]): void {
    let changed = false;
    elements.forEach((element) => {
      if (!element.selected || !this.selectedMap.has(element.id)) {
        element.selected = true;
        this.selectedMap.set(element.id, element);
        changed = true;
      }
    });
    if (changed) {
      this.changes.next();
    }
  }

  /**
   * Removes elements from current selection.
   */
  public removeFromSelected(elements: TElement[]): void {
    let changed = false;
    elements.forEach((element) => {
      if (element.selected || this.selectedMap.has(element.id)) {
        element.selected = false;
        this.selectedMap.delete(element.id);
        changed = true;
      }
    });
    if (changed) {
      this.changes.next();
    }
  }

  /**
   * Clears selection for all elements.
   */
  public clearSelected(): void {
    if (this.selectedMap.size === 0) return;
    this.selectedMap.forEach((element) => {
      element.selected = false;
    });
    this.selectedMap.clear();
    this.changes.next();
  }

  /**
   * Toggles selected state for provided elements.
   */
  public toggleSelected(elements: TElement[]): void {
    let changed = false;
    elements.forEach((element) => {
      if (element.selected) {
        element.selected = false;
        this.selectedMap.delete(element.id);
      } else {
        element.selected = true;
        this.selectedMap.set(element.id, element);
      }
      changed = true;
    });
    if (changed) {
      this.changes.next();
    }
  }

  /**
   * Returns currently selected elements.
   */
  public getSelectedElements(): TElement[] {
    return Array.from(this.selectedMap.values());
  }

  /**
   * Clears full scene including selection, focus and highlights.
   */
  public clear(): void {
    if (
      this.elements.length === 0 &&
      this.selectedMap.size === 0 &&
      this.focusedElementId === null &&
      this.highlightedElementIds.size === 0
    ) {
      return;
    }

    const previousFocusId = this.focusedElementId;
    const removedHighlightedIds = Array.from(this.highlightedElementIds);
    this.elements = [];
    this.selectedMap.clear();
    this.focusedElementId = null;
    this.highlightedElementIds.clear();
    this.elementsVersion += 1;
    this.changes.next();

    if (previousFocusId !== null) {
      this.focusChanges.next({ previousId: previousFocusId, currentId: null });
    }
    if (removedHighlightedIds.length > 0) {
      this.highlightChanges.next({ addedIds: [], removedIds: removedHighlightedIds });
    }
  }

  /**
   * Sets focused element using direct reference.
   */
  public setFocusedElement(element: TElement | null): void {
    this.setFocusedElementById(element?.id ?? null);
  }

  /**
   * Sets focused element by id (or clears when id is missing/not found).
   */
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

  /**
   * Clears focused element.
   */
  public clearFocusedElement(): void {
    this.setFocusedElementById(null);
  }

  /**
   * Returns focused element id or `null`.
   */
  public getFocusedElementId(): string | null {
    return this.focusedElementId;
  }

  /**
   * Returns focused element object or `null`.
   */
  public getFocusedElement(): TElement | null {
    if (!this.focusedElementId) return null;
    return this.elements.find((element) => element.id === this.focusedElementId) ?? null;
  }

  /**
   * Checks whether provided element is focused.
   */
  public isFocused(element: TElement | null): boolean {
    if (!element) return false;
    return this.focusedElementId === element.id;
  }

  /**
   * Sets highlight state for one element by id.
   */
  public setHighlightedElementById(id: string, highlighted: boolean): void {
    const exists = this.elements.some((element) => element.id === id);
    if (!exists) return;
    const wasHighlighted = this.highlightedElementIds.has(id);
    if (highlighted) {
      if (wasHighlighted) return;
      this.highlightedElementIds.add(id);
      this.highlightChanges.next({ addedIds: [id], removedIds: [] });
      return;
    }
    if (!wasHighlighted) return;
    this.highlightedElementIds.delete(id);
    this.highlightChanges.next({ addedIds: [], removedIds: [id] });
  }

  /**
   * Replaces highlighted ids with provided list (existing elements only).
   */
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
    this.highlightChanges.next({ addedIds, removedIds });
  }

  /**
   * Clears all highlighted elements.
   */
  public clearHighlightedElements(): void {
    if (this.highlightedElementIds.size === 0) return;
    const removedIds = Array.from(this.highlightedElementIds);
    this.highlightedElementIds.clear();
    this.highlightChanges.next({ addedIds: [], removedIds });
  }

  /**
   * Returns highlighted element ids.
   */
  public getHighlightedElementIds(): string[] {
    return Array.from(this.highlightedElementIds);
  }

  /**
   * Checks highlight state by element id.
   */
  public isHighlightedById(id: string | null): boolean {
    if (!id) return false;
    return this.highlightedElementIds.has(id);
  }

  /**
   * Checks highlight state for an element reference.
   */
  public isHighlighted(element: TElement | null): boolean {
    if (!element) return false;
    return this.highlightedElementIds.has(element.id);
  }
}
