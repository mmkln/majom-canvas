import type { ICanvasElement } from '../../canvas-core/core/interfaces/canvasElement.ts';
import { LearningCheckpointNode } from './LearningCheckpointNode.ts';
import { LearningExerciseNode } from './LearningExerciseNode.ts';
import { LearningLessonNode } from './LearningLessonNode.ts';
import { LearningModuleNode } from './LearningModuleNode.ts';
import { LearningUnitNode } from './LearningUnitNode.ts';

export type LearningCanvasNode =
  | LearningModuleNode
  | LearningLessonNode
  | LearningExerciseNode
  | LearningCheckpointNode;

export function isLearningModuleNode(
  element: ICanvasElement | null | undefined
): element is LearningModuleNode {
  return element instanceof LearningModuleNode;
}

export function isLearningUnitNode(
  element: ICanvasElement | null | undefined
): element is LearningUnitNode {
  return element instanceof LearningUnitNode;
}

export function isLearningLessonNode(
  element: ICanvasElement | null | undefined
): element is LearningLessonNode {
  return element instanceof LearningLessonNode;
}

export function getLearningModuleId(element: ICanvasElement | null): string | null {
  if (isLearningModuleNode(element)) {
    return element.id;
  }
  if (isLearningUnitNode(element)) {
    return element.moduleId;
  }
  return null;
}
