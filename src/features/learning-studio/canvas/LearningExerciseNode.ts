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

type LearningExerciseNodeOptions = {
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

export class LearningExerciseNode extends LearningCourseUnitNodeBase {
  /*
   * UX contract from docs:
   * - This is a secondary practice unit owned by a lesson.
   * - Structural ownership is direct: exercise is a child of a lesson, not a
   *   sibling of lessons and not a direct child of the module.
   * - It should read as a practical follow-up step, not as a peer to lesson.
   * - It should read as lighter than the lesson and clearly subordinate to it.
   * - Surface should be a smaller card than lesson, with a slightly cooler tint
   *   and lighter border / text hierarchy.
   * - Desktop default target size: `288px x 72px`, with `14px` corner radius.
   * - It should stay in the shared node grammar:
   *   type cue, title, optional short supporting text.
   * - Typography should stay one step below lesson title in the hierarchy.
   * - Content should stay compact: type cue `Exercise`, title, optional
   *   one-line helper text.
   * - Copy density should stay in the child-unit range: one strong title and at
   *   most one short supporting line.
   * - When selected it should show a clean selected ring and expose `Edit`.
   * - Primary action after selection: `Edit`.
   * - Secondary actions: context-menu actions and selection-menu actions.
   * - Default state should stay visually quiet; hover should only slightly
   *   reinforce clickability.
   * - Any selected-state action should appear only on the active exercise and
   *   should never turn all child units into mini toolbars.
   * - Selected affordances should stay close to the node and avoid layout jump.
   * - It must keep the same modal-based deep edit model, while remaining
   *   visually secondary to the parent lesson.
   *
   * Current implementation state:
   * - exercise now renders as a smaller cool-tinted child card with its own
   *   type cue, title, and helper line
   * - selected-state attached `Edit` still comes from the shared selection
   *   overlay rather than from inline node chrome
   */
  constructor(options: LearningExerciseNodeOptions) {
    super('exercise', {
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
          : '#bfdbd6';
    const outerX = this.x;
    const outerY = this.y;
    const radius = 14;
    const cardPaddingX = 12;
    const typePillWidth = 72;
    const typePillHeight = 20;

    this.fillColor = '#f4fffd';
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
    ctx.fillStyle = '#f4fffd';
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = this.selected ? 2 : 1;
    ctx.stroke();

    ctx.fillStyle = '#d9f7f1';
    ctx.beginPath();
    ctx.roundRect(outerX + 12, outerY + 10, typePillWidth, typePillHeight, 10);
    ctx.fill();

    ctx.fillStyle = '#0f766e';
    ctx.font = '700 10px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXERCISE', outerX + 22, outerY + 20);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 13px Arial';
    ctx.fillText(
      this.clampText(ctx, this.title || 'Untitled exercise', this.width - cardPaddingX * 2 - 36),
      outerX + 12,
      outerY + 44
    );

    const helperText = this.description?.trim() || 'Practice step';
    ctx.fillStyle = '#52796f';
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

  public override clone(): LearningExerciseNode {
    return new LearningExerciseNode({
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
