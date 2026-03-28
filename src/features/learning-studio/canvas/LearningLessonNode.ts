import type { PanZoomManager } from '../../canvas-core/core/managers/PanZoomManager.ts';
import type { ElementStatus } from '../../canvas-core/elements/ElementStatus.ts';
import type { CanvasInteractionState } from '../../canvas-core/elements/interfaces/structuredCanvasNode.ts';
import { FOCUS_COLOR, HIGHLIGHT_COLOR, SELECT_COLOR } from '../../canvas-core/core/constants.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import { LearningCourseUnitNodeBase } from './LearningCourseUnitNodeBase.ts';
import {
  LEARNING_LESSON_HEIGHT,
  LEARNING_LESSON_WIDTH,
} from './LearningCanvasRenderConstants.ts';

type LearningLessonNodeOptions = {
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
  parentLessonId: null;
  prerequisiteLessonIds?: readonly string[];
};

export class LearningLessonNode extends LearningCourseUnitNodeBase {
  /*
   * UX contract from docs:
   * - This is the primary authoring node and the core content step.
   * - It should receive the most creator attention inside the module.
   * - Structural ownership is direct: a lesson is a child of a module and the
   *   parent container for exercises and checkpoints.
   * - Surface should be clean white, with a crisp but soft border and enough
   *   padding for title, short supporting text, and local actions.
   * - Desktop default target size: `376px x 112px`, with `18px` corner radius.
   * - It should stay in the shared node grammar:
   *   type cue, title, optional short supporting text, local actions only when relevant.
   * - Lesson title should be the second-strongest typography in the node system,
   *   right after the module title.
   * - Content should stay concise: type cue `Lesson`, title, short description
   *   or objective snippet, and an optional tiny prerequisite indicator.
   * - Exercises and checkpoints should appear as nested child units under the
   *   lesson, not as sibling nodes at the same reading level.
   * - The type cue should stay quiet and compact; long titles should truncate
   *   cleanly instead of expanding the card indefinitely.
   * - Node copy must stay dense and short; long content belongs in the modal.
   * - When selected it should expose a compact local action row:
   *   `Add exercise`, `Add checkpoint`, `Edit`.
   * - Selected state should get the clearest ring in the primary node layer.
   * - That action row should read as lesson-local UI, not as a full toolbar.
   * - The row should sit close to the node and avoid shifting the surrounding
   *   layout when it appears.
   * - `Edit` must be clearly visible but not louder than structural next-step
   *   actions.
   * - `Edit` should feel deliberate, obvious, and one click away even though
   *   double click still exists as the faster shortcut.
   * - Secondary actions: prerequisite editing, future quick lesson preview,
   *   context-menu actions, selection-menu actions.
   * - Default state should remain quiet and readable; hover should only
   *   confirm clickability with a small visual lift.
   * - Selected-state actions should appear only for the active lesson, should
   *   stay visually attached to the card, and should not shift layout.
   * - The lesson card must remain the main object; local actions are
   *   supportive, not louder than the lesson title.
   * - Dense editing belongs in the details modal; double click is a shortcut,
   *   not the only discoverable edit path.
   * - On canvas should stay only selection, structure reading, and local
   *   continuation; long text, lesson blocks, and prerequisite management move
   *   into the details modal.
   *
   * Current implementation state:
   * - lesson now renders as the primary white card with title, supporting text,
   *   and a small prerequisite badge
   * - selected-state attached actions are still delegated to the selection
   *   overlay rather than rendered directly inside the node
   */
  constructor(options: LearningLessonNodeOptions) {
    super('lesson', {
      ...options,
      width: LEARNING_LESSON_WIDTH,
      height: LEARNING_LESSON_HEIGHT,
    });
  }

  public draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    const stroke = this.focused
      ? FOCUS_COLOR
      : this.highlighted
        ? HIGHLIGHT_COLOR
        : this.selected
          ? SELECT_COLOR
          : '#d7deea';
    const outerX = this.x;
    const outerY = this.y;
    const radius = 18;
    const actionReserveWidth = 96;
    const cardPaddingX = 16;
    const titleX = outerX + cardPaddingX;
    const titleWidth = this.width - cardPaddingX * 2 - actionReserveWidth;
    const descriptionX = titleX;
    const descriptionY = outerY + 66;

    this.fillColor = '#ffffff';
    this.borderColor = stroke;

    ctx.save();
    ctx.setLineDash([]);

    if (this.selected) {
      ctx.beginPath();
      ctx.roundRect(outerX - 2, outerY - 2, this.width + 4, this.height + 4, 20);
      ctx.fillStyle = 'rgba(29,78,216,0.08)';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.roundRect(outerX, outerY, this.width, this.height, radius);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = this.selected ? 2 : 1;
    ctx.stroke();

    ctx.fillStyle = '#eef2ff';
    ctx.beginPath();
    ctx.roundRect(outerX + 16, outerY + 14, 62, 22, 11);
    ctx.fill();

    ctx.fillStyle = '#4338ca';
    ctx.font = '700 11px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText('LESSON', outerX + 28, outerY + 25);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 16px Arial';
    ctx.fillText(this.clampText(ctx, this.title || 'Untitled lesson', titleWidth), titleX, outerY + 50);

    const supportingText =
      this.description?.trim() ||
      'Add a short description or objective in the details modal.';
    ctx.fillStyle = '#475569';
    ctx.font = '500 12px Arial';
    ctx.fillText(
      this.clampText(ctx, supportingText, this.width - cardPaddingX * 2),
      descriptionX,
      descriptionY
    );

    if (this.prerequisiteLessonIds.length > 0) {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(outerX + this.width - 64, outerY + 16, 36, 20, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(100,116,139,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#475569';
      ctx.font = '700 11px Arial';
      ctx.fillText('PR', outerX + this.width - 52, outerY + 26);
    }

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

  public override clone(): LearningLessonNode {
    return new LearningLessonNode({
      x: this.x,
      y: this.y,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate,
      moduleId: this.moduleId,
      parentLessonId: null,
      prerequisiteLessonIds: this.prerequisiteLessonIds,
    });
  }
}
