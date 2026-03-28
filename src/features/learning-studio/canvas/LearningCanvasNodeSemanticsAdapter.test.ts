import { describe, expect, it, vi } from 'vitest';
import { LearningCanvasNodeSemanticsAdapter } from './LearningCanvasNodeSemanticsAdapter.ts';
import { LearningExerciseNode } from './LearningExerciseNode.ts';
import { LearningLessonNode } from './LearningLessonNode.ts';
import { LearningModuleNode } from './LearningModuleNode.ts';
import {
  LEARNING_MODULE_HEIGHT,
  LEARNING_MODULE_WIDTH,
} from './LearningCanvasRenderConstants.ts';

describe('LearningCanvasNodeSemanticsAdapter', () => {
  it('treats module and unit nodes as scene elements', () => {
    const adapter = new LearningCanvasNodeSemanticsAdapter();
    const moduleNode = new LearningModuleNode({ id: 'module-1' });
    const lessonNode = new LearningLessonNode({
      id: 'lesson-1',
      moduleId: 'module-1',
      parentLessonId: null,
    });
    const exerciseNode = new LearningExerciseNode({
      id: 'exercise-1',
      moduleId: 'module-1',
      parentLessonId: 'lesson-1',
    });

    expect(adapter.getElements([moduleNode, lessonNode, exerciseNode])).toEqual([
      moduleNode,
      lessonNode,
      exerciseNode,
    ]);
  });

  it('persists layout only for modules and keeps unit nodes transient', () => {
    const adapter = new LearningCanvasNodeSemanticsAdapter();
    const moduleNode = new LearningModuleNode({
      id: 'module-1',
      width: 720,
      height: 280,
    });
    const lessonNode = new LearningLessonNode({
      id: 'lesson-1',
      moduleId: 'module-1',
      parentLessonId: null,
    });
    const scene = {
      isFocused: vi.fn((element) => element === moduleNode),
      isHighlighted: vi.fn(() => false),
    };

    expect(adapter.getLayoutPersistenceKind(moduleNode)).toBe('module');
    expect(adapter.getLayoutPersistenceKind(lessonNode)).toBeNull();
    expect(
      adapter.getLayoutPersistenceMeta(
        scene as unknown as Parameters<
          LearningCanvasNodeSemanticsAdapter['getLayoutPersistenceMeta']
        >[0],
        moduleNode
      )
    ).toEqual({
      width: LEARNING_MODULE_WIDTH,
      height: LEARNING_MODULE_HEIGHT,
      focused: true,
      highlighted: false,
    });
  });

  it('fails fast on malformed or unsupported learning records', () => {
    const adapter = new LearningCanvasNodeSemanticsAdapter();

    expect(() =>
      adapter.materializeNode({
        id: 'lesson-1',
        kind: 'lesson',
        x: 0,
        y: 0,
        width: 18,
        height: 18,
        title: 'Lesson',
        description: '',
      })
    ).toThrow('Learning record lesson-1 is missing required containerId.');

    expect(() =>
      adapter.materializeNode({
        id: 'exercise-1',
        kind: 'exercise',
        x: 0,
        y: 0,
        width: 18,
        height: 18,
        title: 'Exercise',
        description: '',
        containerId: 'module-1',
      })
    ).toThrow('Learning record exercise-1 is missing required parentId.');

    expect(() =>
      adapter.materializeNode({
        id: 'mystery-1',
        kind: 'mystery',
        x: 0,
        y: 0,
        width: 18,
        height: 18,
        title: 'Mystery',
        description: '',
        containerId: 'module-1',
      })
    ).toThrow('Unsupported learning record kind: mystery');
  });
});
