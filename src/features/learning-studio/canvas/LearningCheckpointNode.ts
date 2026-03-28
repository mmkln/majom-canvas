import type { ElementStatus } from '../../canvas-core/elements/ElementStatus.ts';
import type { CanvasInteractionState } from '../../canvas-core/elements/interfaces/structuredCanvasNode.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import { LearningUnitNode } from './LearningUnitNode.ts';

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
};

export class LearningCheckpointNode extends LearningUnitNode {
  constructor(options: LearningCheckpointNodeOptions) {
    super('checkpoint', options);
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
    });
  }
}
