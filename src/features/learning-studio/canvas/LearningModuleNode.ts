import type { ElementStatus } from '../../canvas-core/elements/ElementStatus.ts';
import type { IStructuredCanvasNode } from '../../canvas-core/elements/interfaces/structuredCanvasNode.ts';
import type { CanvasInteractionState } from '../../canvas-core/elements/interfaces/structuredCanvasNode.ts';
import type { ConnectionPoint } from '../../canvas-core/core/interfaces/shape.ts';
import type {
  CanvasLayoutMetrics,
  ICanvasLayoutContainer,
} from '../../canvas-core/elements/interfaces/canvasLayoutContainer.ts';
import type { PanZoomManager } from '../../canvas-core/core/managers/PanZoomManager.ts';
import { FOCUS_COLOR, HIGHLIGHT_COLOR, SELECT_COLOR } from '../../canvas-core/core/constants.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import { LearningCanvasEntityNode } from './LearningCanvasEntityNode.ts';
import { LearningCheckpointNode } from './LearningCheckpointNode.ts';
import { LearningExerciseNode } from './LearningExerciseNode.ts';
import { LearningLessonNode } from './LearningLessonNode.ts';
import {
  LEARNING_MODULE_HEIGHT,
  LEARNING_MODULE_WIDTH,
  LEARNING_LESSON_HEIGHT,
  LEARNING_LESSON_WIDTH,
} from './LearningCanvasRenderConstants.ts';

type LearningCanvasUnitNode =
  | LearningLessonNode
  | LearningExerciseNode
  | LearningCheckpointNode;

function isLearningCanvasUnitNode(
  element: IStructuredCanvasNode
): element is LearningCanvasUnitNode {
  return (
    element instanceof LearningLessonNode ||
    element instanceof LearningExerciseNode ||
    element instanceof LearningCheckpointNode
  );
}

type LearningModuleNodeOptions = {
  id?: string;
  uuid?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  title?: string;
  description?: string;
  status?: ElementStatus;
  priority?: UiPriority;
  units?: LearningCanvasUnitNode[];
  selected?: boolean;
  interactionStates?: Iterable<CanvasInteractionState>;
  backendId?: number;
};

export class LearningModuleNode
  extends LearningCanvasEntityNode
  implements ICanvasLayoutContainer<LearningCanvasUnitNode>
{
  /*
   * UX contract from docs:
   * - This is the strongest container on the course canvas.
   * - It should read as a structural section and as the owner of the lessons.
   * - Structural ownership is direct: modules contain lessons, not exercises or
   *   checkpoints at the top level.
   * - Surface should be slightly heavier than unit nodes, with a clear border
   *   and broader internal padding than any other node.
   * - Desktop default target size: `520px` width, `180px` minimum height,
   *   `56px` header, `24px` corner radius.
   * - It should stay in the shared node grammar:
   *   type cue, title, optional short supporting text, local actions only when relevant.
   * - The container should reserve enough visual space to frame lessons inside
   *   it, even before dense content exists.
   * - Header should show: compact type cue `Module`, strong title, optional
   *   one-line description.
   * - The type cue should stay quiet and compact; long titles should truncate
   *   cleanly instead of turning the header into metadata-heavy chrome.
   * - Body should feel like one owned region that visually gathers lessons.
   * - Lesson stacking/order should stay obvious inside that owned region.
   * - Child units of lessons should read as nested under their lesson inside the
   *   module, not as peers of the lessons.
   * - The internal body should also leave room for a selected-state
   *   `Add lesson` affordance without collapsing the composition.
   * - Selected state should expose a local `Add lesson` affordance attached to
   *   the module itself, not floating in page chrome.
   * - That affordance should sit close to the module and remain visually
   *   supportive, not louder than the module title.
   * - Selected state should be the clearest container-layer accent and can
   *   slightly strengthen the background or ring.
   * - Empty module state should show one short hint and one clear local
   *   `Add lesson`, without looking broken or error-like.
   * - Primary action after selection: `Add lesson`.
   * - Secondary actions: `Edit`, context-menu actions, selection-menu actions.
   * - Default state should stay quiet; hover should only slightly strengthen
   *   the module without creating a large visual jump.
   * - Selected-state actions should appear only on the active node, should
   *   disappear again when selection changes, and should not shift layout.
   * - Deep edit should open in the details modal; canvas should stay focused on
   *   structure and local continuation.
   *
   * Current implementation state:
   * - module now renders as a real container surface with header, title,
   *   optional supporting text, and empty-module hint
   * - selected-state attached actions are still delegated to the selection
   *   overlay rather than rendered directly inside the node
   */
  public static readonly width = LEARNING_MODULE_WIDTH;
  public static readonly height = LEARNING_MODULE_HEIGHT;
  public static readonly HANDLE_SIZE = 8;
  public static readonly layoutMetrics: CanvasLayoutMetrics = {
    paddingX: 24,
    paddingY: 20,
    gap: 20,
    header: 56,
    childWidth: LEARNING_LESSON_WIDTH,
    childHeight: LEARNING_LESSON_HEIGHT,
  };

  public units: LearningCanvasUnitNode[] = [];
  public borderColor = '#64748b';
  public hoveredResizeHandle: 'nw' | 'ne' | 'se' | 'sw' | null = null;

  constructor(options: LearningModuleNodeOptions) {
    super({
      nodeKind: 'module',
      id: options.id,
      uuid: options.uuid,
      backendId: options.backendId,
      x: options.x,
      y: options.y,
      width: LearningModuleNode.width,
      height: LearningModuleNode.height,
      fillColor: '#cbd5e1',
      lineWidth: 1,
      title: options.title,
      description: options.description,
      status: options.status,
      selected: options.selected,
      interactionStates: options.interactionStates,
      priority: options.priority,
    });
    this.zIndex = 1;
    this.units = options.units ?? [];
    this.borderColor = '#64748b';
  }

  public draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    void panZoom;
    const stroke = this.focused
      ? FOCUS_COLOR
      : this.highlighted
        ? HIGHLIGHT_COLOR
        : this.selected
          ? SELECT_COLOR
          : '#cbd5e1';
    const radius = 24;
    const headerHeight = 56;
    const headerPaddingX = 24;
    const headerTitleX = this.x + 106;
    const headerTitleWidth = this.width - 130;

    this.fillColor = '#f8fafc';
    this.borderColor = stroke;

    ctx.save();
    ctx.setLineDash([]);

    if (this.selected) {
      ctx.beginPath();
      ctx.roundRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4, 28);
      ctx.fillStyle = 'rgba(29,78,216,0.05)';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, radius);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = this.selected ? 2 : 1;
    ctx.stroke();

    ctx.fillStyle = '#eef2ff';
    ctx.beginPath();
    ctx.roundRect(this.x + 1, this.y + 1, this.width - 2, headerHeight, radius - 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(148,163,184,0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x + 16, this.y + headerHeight + 0.5);
    ctx.lineTo(this.x + this.width - 16, this.y + headerHeight + 0.5);
    ctx.stroke();

    ctx.fillStyle = '#e0e7ff';
    ctx.beginPath();
    ctx.roundRect(this.x + headerPaddingX, this.y + 18, 70, 22, 11);
    ctx.fill();

    ctx.fillStyle = '#4338ca';
    ctx.font = '700 11px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText('MODULE', this.x + 36, this.y + 29);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 18px Arial';
    ctx.fillText(
      this.clampText(ctx, this.title || 'Untitled module', headerTitleWidth),
      headerTitleX,
      this.y + 28
    );

    const description = this.description?.trim();
    if (description) {
      ctx.fillStyle = '#475569';
      ctx.font = '500 12px Arial';
      ctx.fillText(
        this.clampText(ctx, description, headerTitleWidth),
        headerTitleX,
        this.y + 45
      );
    }

    if (this.units.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '500 13px Arial';
      ctx.fillText('No lessons yet', this.x + 24, this.y + headerHeight + 34);

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(this.x + 24, this.y + headerHeight + 46, 108, 28, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(148,163,184,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.font = '600 12px Arial';
      ctx.fillText('Add lesson', this.x + 46, this.y + headerHeight + 64);
    }

    ctx.restore();
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

  public contains(px: number, py: number): boolean {
    return (
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.height
    );
  }

  public addUnit(unit: LearningCanvasUnitNode): void {
    if (!this.units.some((candidate) => candidate.id === unit.id)) {
      this.units = [...this.units, unit];
    }
  }

  public removeUnit(unitId: string): void {
    this.units = this.units.filter((unit) => unit.id !== unitId);
  }

  public getLayoutMetrics(): CanvasLayoutMetrics {
    return LearningModuleNode.layoutMetrics;
  }

  public getOrderedLayoutChildren(): LearningCanvasUnitNode[] {
    return [...this.units];
  }

  public replaceOrderedLayoutChildren(children: LearningCanvasUnitNode[]): void {
    this.units = [...children];
  }

  public acceptsLayoutChild(
    element: IStructuredCanvasNode
  ): element is LearningCanvasUnitNode {
    return isLearningCanvasUnitNode(element);
  }

  public getBoundaryPoint(_angle: number): { x: number; y: number } {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }

  public getConnectionPoints(): ConnectionPoint[] {
    return [
      {
        x: this.x + this.width / 2,
        y: this.y,
        angle: -Math.PI / 2,
        isHovered: false,
        direction: 'top',
        isVisible: false,
        isInteractive: false,
      },
      {
        x: this.x + this.width,
        y: this.y + this.height / 2,
        angle: 0,
        isHovered: false,
        direction: 'right',
        isVisible: false,
        isInteractive: false,
      },
      {
        x: this.x + this.width / 2,
        y: this.y + this.height,
        angle: Math.PI / 2,
        isHovered: false,
        direction: 'bottom',
        isVisible: false,
        isInteractive: false,
      },
      {
        x: this.x,
        y: this.y + this.height / 2,
        angle: Math.PI,
        isHovered: false,
        direction: 'left',
        isVisible: false,
        isInteractive: false,
      },
    ];
  }

  public onDrag(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.hoveredResizeHandle = null;
  }

  public getResizeHandles(
    _panZoom: PanZoomManager
  ): { x: number; y: number; direction: 'nw' | 'ne' | 'se' | 'sw' }[] {
    return [];
  }

  public getResizeHandleDirectionAt(
    px: number,
    py: number,
    panZoom: PanZoomManager
  ): 'nw' | 'ne' | 'se' | 'sw' | null {
    void px;
    void py;
    void panZoom;
    return null;
  }

  public override clone(): LearningModuleNode {
    return new LearningModuleNode({
      x: this.x,
      y: this.y,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      units: [],
    });
  }
}
