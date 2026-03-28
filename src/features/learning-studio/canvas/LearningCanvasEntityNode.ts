import { StructuredCanvasNode } from '../../canvas-core/elements/StructuredCanvasNode.ts';
import { ElementStatus } from '../../canvas-core/elements/ElementStatus.ts';
import type {
  CanvasInteractionState,
  IStructuredCanvasNode,
} from '../../canvas-core/elements/interfaces/structuredCanvasNode.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import { emitLearningCanvasEditorRequested } from './LearningCanvasEditorEvents.ts';

type LearningCanvasEntityNodeOptions = {
  nodeKind: string;
  id?: string;
  uuid?: string;
  backendId?: number | string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  fillColor?: string;
  lineWidth?: number;
  title?: string;
  description?: string;
  status?: ElementStatus;
  selected?: boolean;
  interactionStates?: Iterable<CanvasInteractionState>;
  priority?: UiPriority;
};

export abstract class LearningCanvasEntityNode extends StructuredCanvasNode {
  public status: ElementStatus;
  public priority: UiPriority;
  public backendId?: number | string;
  public uuid?: string;

  protected constructor(options: LearningCanvasEntityNodeOptions) {
    super({
      nodeKind: options.nodeKind,
      id: options.id,
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      fillColor: options.fillColor,
      lineWidth: options.lineWidth,
      title: options.title,
      description: options.description,
      interactionStates: options.interactionStates,
    });
    this.status = options.status ?? ElementStatus.Defined;
    this.priority = options.priority ?? 'low';
    this.selected = options.selected ?? false;
    this.backendId = options.backendId;
    this.uuid = options.uuid;
  }

  public override onDoubleClick(): void {
    emitLearningCanvasEditorRequested({
      kind: this.nodeKind === 'module' ? 'module' : 'unit',
      id: this.id,
    });
  }

  public abstract clone(): IStructuredCanvasNode;
}
