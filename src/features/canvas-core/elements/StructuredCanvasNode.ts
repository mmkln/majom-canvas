import { CanvasElement } from '../core/elements/CanvasElement.ts';
import type { IConnectable } from '../core/interfaces/connectable.ts';
import type { ConnectionPoint } from '../core/interfaces/shape.ts';
import type { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { SELECT_COLOR } from '../core/constants.ts';
import type {
  CanvasAppearanceAdapter,
  CanvasAppearanceContext,
  CanvasElementAppearance,
} from '../adapters/CanvasAppearanceAdapter.ts';
import {
  CANVAS_INTERACTION_STATES,
  type CanvasInteractionState,
  type CanvasInteractionStateScope,
  type IStructuredCanvasNode,
} from './interfaces/structuredCanvasNode.ts';

export abstract class StructuredCanvasNode
  extends CanvasElement
  implements IStructuredCanvasNode, IConnectable
{
  public readonly nodeKind: string;
  public width: number;
  public height: number;
  public fillColor: string;
  public lineWidth: number;
  public title: string;
  public description: string;
  public appearanceAdapter: CanvasAppearanceAdapter | null = null;
  private readonly coreInteractionStates = new Set<CanvasInteractionState>();
  private readonly externalInteractionStates = new Set<CanvasInteractionState>();

  constructor(options: {
    nodeKind: string;
    id?: string;
    x?: number;
    y?: number;
    width: number;
    height: number;
    fillColor?: string;
    lineWidth?: number;
    title?: string;
    description?: string;
    interactionStates?: Iterable<CanvasInteractionState>;
  }) {
    super(options.x ?? 0, options.y ?? 0);
    if (options.id) this.id = options.id;
    this.nodeKind = options.nodeKind;
    this.width = options.width;
    this.height = options.height;
    this.fillColor = options.fillColor ?? '#e6f7ff';
    this.lineWidth = options.lineWidth ?? 2;
    this.title = options.title ?? '';
    this.description = options.description ?? '';
    this.replaceInteractionStates(options.interactionStates ?? [], 'external');
  }

  public get focused(): boolean {
    return this.hasInteractionState(CANVAS_INTERACTION_STATES.focused);
  }

  public set focused(value: boolean) {
    this.setInteractionState(CANVAS_INTERACTION_STATES.focused, value, 'core');
  }

  public get highlighted(): boolean {
    return this.hasInteractionState(CANVAS_INTERACTION_STATES.highlighted);
  }

  public set highlighted(value: boolean) {
    this.setInteractionState(
      CANVAS_INTERACTION_STATES.highlighted,
      value,
      'core'
    );
  }

  public getInteractionStates(): ReadonlySet<CanvasInteractionState> {
    return new Set([
      ...this.coreInteractionStates,
      ...this.externalInteractionStates,
    ]);
  }

  public hasInteractionState(state: CanvasInteractionState): boolean {
    return (
      this.coreInteractionStates.has(state) ||
      this.externalInteractionStates.has(state)
    );
  }

  public setInteractionState(
    state: CanvasInteractionState,
    active: boolean,
    scope: CanvasInteractionStateScope = 'external'
  ): void {
    const target = this.getInteractionStateBucket(scope);
    if (active) {
      target.add(state);
      return;
    }
    target.delete(state);
  }

  public replaceInteractionStates(
    states: Iterable<CanvasInteractionState>,
    scope: CanvasInteractionStateScope = 'external'
  ): void {
    const target = this.getInteractionStateBucket(scope);
    target.clear();
    for (const state of states) {
      target.add(state);
    }
  }

  public clearInteractionStates(
    scope: CanvasInteractionStateScope = 'external'
  ): void {
    this.getInteractionStateBucket(scope).clear();
  }

  protected resolveAppearance<TAppearance extends CanvasElementAppearance>(
    fallback: TAppearance,
    context: Omit<CanvasAppearanceContext, 'interactionStates' | 'selected'> = {}
  ): TAppearance {
    const resolved = this.appearanceAdapter?.resolveElementAppearance?.(this, {
      ...context,
      interactionStates: this.getInteractionStates(),
      selected: this.selected,
    });
    if (!resolved) {
      return fallback;
    }
    return { ...fallback, ...resolved };
  }

  public abstract draw(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager
  ): void;

  public abstract contains(px: number, py: number): boolean;

  public abstract getBoundaryPoint(angle: number): { x: number; y: number };

  public abstract getConnectionPoints(): ConnectionPoint[];

  public abstract clone(): IStructuredCanvasNode;

  public getNearestPoint(px: number, py: number): { x: number; y: number } {
    const points = this.getConnectionPoints();
    let nearest = points[0];
    let minDist = Infinity;
    for (const point of points) {
      const distance = (point.x - px) ** 2 + (point.y - py) ** 2;
      if (distance < minDist) {
        minDist = distance;
        nearest = point;
      }
    }
    return { x: nearest.x, y: nearest.y };
  }

  public drawAnchors(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager
  ): void {
    if (this.selected || this.isHovered) {
      const points = this.getConnectionPoints();
      for (const point of points) {
        if (point.isVisible === false) continue;
        ctx.save();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 / panZoom.scale, 0, 2 * Math.PI);
        ctx.fillStyle = point.isHovered ? SELECT_COLOR : '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1 / panZoom.scale;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  public drawConnectionLine(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    target: IConnectable
  ): void {
    const start = this.getNearestPoint(target.x, target.y);
    const end = target.getNearestPoint(this.x, this.y);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1 / panZoom.scale;
    ctx.stroke();
    ctx.restore();
  }

  private getInteractionStateBucket(
    scope: CanvasInteractionStateScope
  ): Set<CanvasInteractionState> {
    return scope === 'core'
      ? this.coreInteractionStates
      : this.externalInteractionStates;
  }
}
