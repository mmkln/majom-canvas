// core/shapes/PlanningElement.ts
import { IPlanningElement } from './interfaces/planningElement.ts';
import { StructuredCanvasNode } from './StructuredCanvasNode.ts';
import type { CanvasInteractionState } from './interfaces/structuredCanvasNode.ts';

export abstract class PlanningElement
  extends StructuredCanvasNode
  implements IPlanningElement
{
  dueDate?: Date | null;
  tags?: string[];
  tagIds?: number[];
  /** Backend persistent ref; numeric for legacy entities, string for UUID-first ones */
  backendId?: number | string;
  /** Backend UUID (new) */
  uuid?: string;

  constructor({
    nodeKind = 'planning',
    id,
    x = 0,
    y = 0,
    width,
    height,
    fillColor = '#e6f7ff',
    lineWidth = 2,
    title = '',
    description = '',
    interactionStates,
    dueDate,
    tags,
    tagIds,
    backendId,
    uuid,
  }: {
    nodeKind?: string;
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
    dueDate?: Date | null;
    tags?: string[];
    tagIds?: number[];
    backendId?: number | string;
    uuid?: string;
  }) {
    super({
      nodeKind,
      id,
      x,
      y,
      width,
      height,
      fillColor,
      lineWidth,
      title,
      description,
      interactionStates,
    });
    this.backendId = backendId;
    this.uuid = uuid;
    this.dueDate = dueDate ?? null;
    this.tags = tags;
    this.tagIds = tagIds;
  }
}
