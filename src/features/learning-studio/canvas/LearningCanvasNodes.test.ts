import { describe, expect, it } from 'vitest';
import { StoryElement } from '../../canvas-core/elements/StoryElement.ts';
import { TaskElement } from '../../canvas-core/elements/TaskElement.ts';

import { LearningCheckpointNode } from './LearningCheckpointNode.ts';
import { LearningExerciseNode } from './LearningExerciseNode.ts';
import { LearningLessonNode } from './LearningLessonNode.ts';
import { LearningModuleNode } from './LearningModuleNode.ts';

describe('LearningCanvas nodes', () => {
  it('exposes learning-specific node kinds', () => {
    expect(new LearningModuleNode({}).nodeKind).toBe('module');
    expect(
      new LearningLessonNode({
        moduleId: 'module-1',
        parentLessonId: null,
      }).nodeKind
    ).toBe('lesson');
    expect(
      new LearningExerciseNode({
        moduleId: 'module-1',
        parentLessonId: 'lesson-1',
      }).nodeKind
    ).toBe('exercise');
    expect(
      new LearningCheckpointNode({
        moduleId: 'module-1',
        parentLessonId: 'lesson-1',
      }).nodeKind
    ).toBe('checkpoint');
  });

  it('preserves learning hierarchy metadata on unit nodes', () => {
    const lesson = new LearningLessonNode({
      id: 'lesson-1',
      moduleId: 'module-1',
      parentLessonId: null,
    });
    const exercise = new LearningExerciseNode({
      id: 'exercise-1',
      moduleId: 'module-1',
      parentLessonId: 'lesson-1',
    });

    expect(lesson.moduleId).toBe('module-1');
    expect(lesson.parentLessonId).toBeNull();
    expect(exercise.moduleId).toBe('module-1');
    expect(exercise.parentLessonId).toBe('lesson-1');
  });

  it('does not inherit planning story/task primitives anymore', () => {
    const moduleNode = new LearningModuleNode({});
    const lessonNode = new LearningLessonNode({
      id: 'lesson-1',
      moduleId: 'module-1',
      parentLessonId: null,
    });

    expect(moduleNode).not.toBeInstanceOf(StoryElement);
    expect(lessonNode).not.toBeInstanceOf(TaskElement);
  });
});
