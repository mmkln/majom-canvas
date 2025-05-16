import { ICanvasElement } from '../../core/interfaces/canvasElement.ts';

/**
 * Service to buffer user actions on the canvas before synchronization.
 */
export class OfflineCanvasService {
  private buffer: any[] = [];

  /**
   * Add new element to buffer if unique.
   */
  public addElement(el: any): boolean {
    if (!this.validateUniqueness(el)) return false;
    this.buffer.push(el);
    return true;
  }

  /** Remove an element by id. */
  public removeElement(elementId: string): void {
    this.buffer = this.buffer.filter((e) => e.id !== elementId);
  }

  /** Retrieve all buffered elements. */
  public getElements(): any[] {
    return [...this.buffer];
  }

  /** Clear buffer after successful sync. */
  public clearElements(): void {
    this.buffer = [];
  }

  /** Ensure no duplicate element ids in buffer. */
  public validateUniqueness(el: any): boolean {
    return !this.buffer.some((b) => b.id === el.id);
  }
}
