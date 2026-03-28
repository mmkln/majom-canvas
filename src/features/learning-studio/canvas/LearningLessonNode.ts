import type { ElementStatus } from '../../canvas-core/elements/ElementStatus.ts';
import type { CanvasInteractionState } from '../../canvas-core/elements/interfaces/structuredCanvasNode.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import { LearningUnitNode } from './LearningUnitNode.ts';

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
};

export class LearningLessonNode extends LearningUnitNode {
  constructor(options: LearningLessonNodeOptions) {
    super('lesson', options);
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
    });
  }
}
