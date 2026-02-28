// src/core/commands/ResizeCommand.ts
import { Command } from './Command.ts';
import { Scene } from '../scene/Scene.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';
import type { IPlanningElement } from '../../elements/interfaces/planningElement.ts';

/**
 * Command to resize elements: supports undo/redo of size and position changes.
 */
export class ResizeCommand extends Command {
  private scene: Scene;
  private initial: Map<
    string,
    { x: number; y: number; width: number; height: number }
  >;
  private final: Map<
    string,
    { x: number; y: number; width: number; height: number }
  >;

  constructor(
    scene: Scene,
    initial: Map<
      string,
      { x: number; y: number; width: number; height: number }
    >,
    final: Map<string, { x: number; y: number; width: number; height: number }>
  ) {
    super();
    this.scene = scene;
    this.initial = new Map(initial);
    this.final = new Map(final);
  }

  public execute(): void {
    this.apply(this.final);
    this.notifyPositionsDirty(this.final.keys());
    this.scene.changes.next();
  }

  public undo(): void {
    this.apply(this.initial);
    this.notifyPositionsDirty(this.initial.keys());
    this.scene.changes.next();
  }

  private apply(
    map: Map<string, { x: number; y: number; width: number; height: number }>
  ): void {
    map.forEach((val, id) => {
      const el = this.scene.getElements().find((e) => e.id === id) as any;
      if (el) {
        el.x = val.x;
        el.y = val.y;
        el.width = val.width;
        el.height = val.height;
      }
    });
  }

  private notifyPositionsDirty(ids: Iterable<string>): void {
    if (typeof window === 'undefined') return;
    const elements = Array.from(ids)
      .map((id) => this.scene.getElements().find((e) => e.id === id))
      .filter(
        (el): el is IPlanningElement => Boolean(el) && isPlanningElement(el)
      );
    if (elements.length === 0) return;
    window.dispatchEvent(
      new CustomEvent('canvasPositionsDirty', {
        detail: { elements },
      })
    );
  }
}
