import type { PanZoomManager } from '../../canvas-core/core/managers/PanZoomManager.ts';
import type { ElementStatus } from '../../canvas-core/elements/ElementStatus.ts';
import type { CanvasInteractionState } from '../../canvas-core/elements/interfaces/structuredCanvasNode.ts';
import { FOCUS_COLOR, HIGHLIGHT_COLOR, SELECT_COLOR } from '../../canvas-core/core/constants.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import { LearningCourseUnitNodeBase } from './LearningCourseUnitNodeBase.ts';
import {
  LEARNING_CHILD_UNIT_HEIGHT,
  LEARNING_CHILD_UNIT_WIDTH,
} from './LearningCanvasRenderConstants.ts';

type LearningCheckpointNodeOptions = {
  id?: string;
  uuid?: string;
  x?: number;
  y?: number;
  title?: string;
  description?: string;
  status?: ElementStatus;
  selected?: boolean;
  interactionStates?: Iterable<CanvasInteractionState>;
  priority?: UiPriority;
  dueDate?: Date | null;
  backendId?: number;
  moduleId: string;
  parentLessonId: string;
  prerequisiteLessonIds?: readonly string[];
};

export class LearningCheckpointNode extends LearningCourseUnitNodeBase {
  /*
   * UX contract from docs:
   * - This is a secondary confirmation / evaluation unit under a lesson.
   * - Structural ownership is direct: checkpoint is a child of a lesson, not a
   *   sibling of lessons and not a direct child of the module.
   * - It should not look like the same thing as `Exercise`.
   * - Surface should stay in the same size family as exercise, but use a
   *   distinct, warmer evaluative tint family.
   * - Desktop default target size: `288px x 72px`, with `14px` corner radius.
   * - It should stay in the shared node grammar:
   *   type cue, title, optional short supporting text.
   * - Typography should stay one step below lesson title in the hierarchy,
   *   parallel to exercise.
   * - Content should remain compact: type cue `Checkpoint`, title, optional
   *   one-line helper text.
   * - Copy density should stay in the child-unit range: one strong title and at
   *   most one short supporting line.
   * - When selected it should expose `Edit` and keep the same interaction model
   *   as exercise, while staying visually distinct by color and type cue.
   * - Primary action after selection: `Edit`.
   * - Secondary actions: context-menu actions and selection-menu actions.
   * - Default and hover states should stay restrained; validation tone should
   *   come from color/type cue, not from noisy chrome.
   * - Selected-state affordances should appear only on the active checkpoint
   *   and remain visually subordinate to parent lesson structure.
   * - Selected affordances should stay close to the node and avoid layout jump.
   * - Deep edit belongs in the details modal, not inline on the canvas.
   *
   * Current implementation state:
   * - checkpoint now renders as a smaller warm evaluative child card with its
   *   own type cue, title, and helper line
   * - selected-state attached `Edit` still comes from the shared selection
   *   overlay rather than from inline node chrome
   */
  constructor(options: LearningCheckpointNodeOptions) {
    super('checkpoint', {
      ...options,
      width: LEARNING_CHILD_UNIT_WIDTH,
      height: LEARNING_CHILD_UNIT_HEIGHT,
    });
  }

  public draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    const stroke = this.focused
      ? FOCUS_COLOR
      : this.highlighted
        ? HIGHLIGHT_COLOR
        : this.selected
          ? SELECT_COLOR
          : '#e8cda8';
    const outerX = this.x;
    const outerY = this.y;
    const radius = 14;
    const cardPaddingX = 12;
    const typePillWidth = 90;
    const typePillHeight = 20;

    this.fillColor = '#fff9f0';
    this.borderColor = stroke;

    ctx.save();
    ctx.setLineDash([]);

    if (this.selected) {
      ctx.beginPath();
      ctx.roundRect(outerX - 2, outerY - 2, this.width + 4, this.height + 4, 16);
      ctx.fillStyle = 'rgba(29,78,216,0.06)';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.roundRect(outerX, outerY, this.width, this.height, radius);
    ctx.fillStyle = '#fff9f0';
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = this.selected ? 2 : 1;
    ctx.stroke();

    ctx.fillStyle = '#fef0d7';
    ctx.beginPath();
    ctx.roundRect(outerX + 12, outerY + 10, typePillWidth, typePillHeight, 10);
    ctx.fill();

    ctx.fillStyle = '#b45309';
    ctx.font = '700 10px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText('CHECKPOINT', outerX + 20, outerY + 20);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 13px Arial';
    ctx.fillText(
      this.clampText(ctx, this.title || 'Untitled checkpoint', this.width - cardPaddingX * 2 - 36),
      outerX + 12,
      outerY + 44
    );

    const helperText = this.description?.trim() || 'Validation step';
    ctx.fillStyle = '#7c5a2a';
    ctx.font = '500 11px Arial';
    ctx.fillText(
      this.clampText(ctx, helperText, this.width - cardPaddingX * 2),
      outerX + 12,
      outerY + 61
    );

    ctx.restore();
    this.drawConnectionPorts(ctx, panZoom);
  }

  private clampText(
    ctx: CanvasRenderingContext2D,
    value: string,
    maxWidth: number
  ): string {
    if (ctx.measureText(value).width <= maxWidth) return value;
    let next = value;
    while (next.length > 1 && ctx.measureText(`${next}…`).width > maxWidth) {
      next = next.slice(0, -1);
    }
    return `${next}…`;
  }

  public override clone(): LearningCheckpointNode {
    return new LearningCheckpointNode({
      x: this.x,
      y: this.y,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate,
      moduleId: this.moduleId,
      parentLessonId: this.parentLessonId ?? '',
      prerequisiteLessonIds: this.prerequisiteLessonIds,
    });
  }
}
