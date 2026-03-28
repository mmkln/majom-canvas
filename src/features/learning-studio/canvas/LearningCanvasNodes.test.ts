import { describe, expect, it, vi } from 'vitest';
import { SELECT_COLOR } from '../../canvas-core/core/constants.ts';
import {
  LEARNING_MODULE_HEIGHT,
  LEARNING_MODULE_WIDTH,
  LEARNING_LESSON_HEIGHT,
  LEARNING_LESSON_WIDTH,
  LEARNING_CHILD_UNIT_HEIGHT,
  LEARNING_CHILD_UNIT_WIDTH,
} from './LearningCanvasRenderConstants.ts';

import { LearningCheckpointNode } from './LearningCheckpointNode.ts';
import { LearningExerciseNode } from './LearningExerciseNode.ts';
import { LearningLessonNode } from './LearningLessonNode.ts';
import { LearningModuleNode } from './LearningModuleNode.ts';

function createCanvasContextSpy() {
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    setLineDash: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    translate: vi.fn(),
    closePath: vi.fn(),
    measureText: vi.fn((text: string) => ({
      width: Math.max(8, text.length * 7),
    })),
    fillText: vi.fn(),
    roundRect: vi.fn(),
  };

  Object.assign(ctx, {
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineJoin: '',
    lineCap: '',
    textBaseline: '',
    globalAlpha: 1,
    shadowColor: '',
    shadowBlur: 0,
  });

  return {
    ctx: ctx as unknown as CanvasRenderingContext2D,
  };
}

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
      prerequisiteLessonIds: ['lesson-0'],
    });
    const exercise = new LearningExerciseNode({
      id: 'exercise-1',
      moduleId: 'module-1',
      parentLessonId: 'lesson-1',
    });

    expect(lesson.moduleId).toBe('module-1');
    expect(lesson.parentLessonId).toBeNull();
    expect(lesson.prerequisiteLessonIds).toEqual(['lesson-0']);
    expect(lesson.clone().prerequisiteLessonIds).toEqual(['lesson-0']);
    expect(exercise.moduleId).toBe('module-1');
    expect(exercise.parentLessonId).toBe('lesson-1');
  });

  it('renders module, lesson and child units with distinct visual roles', () => {
    const moduleNode = new LearningModuleNode({
      title: 'Module title',
      description: 'Module description',
      units: [],
    });
    const lessonNode = new LearningLessonNode({
      title: 'Lesson title',
      description: 'Lesson description',
      prerequisiteLessonIds: ['lesson-0'],
      moduleId: 'module-1',
      parentLessonId: null,
    });
    const exerciseNode = new LearningExerciseNode({
      title: 'Exercise title',
      description: 'Practice step',
      moduleId: 'module-1',
      parentLessonId: 'lesson-1',
    });
    const checkpointNode = new LearningCheckpointNode({
      title: 'Checkpoint title',
      description: 'Validation step',
      moduleId: 'module-1',
      parentLessonId: 'lesson-1',
    });
    const { ctx } = createCanvasContextSpy();
    const panZoom = {
      scale: 1,
      renderFlags: {
        showDetails: true,
        showAnim: false,
      },
      timeMs: 0,
      viewBounds: { x: 0, y: 0, width: 1200, height: 800 },
    } as any;

    moduleNode.draw(ctx, panZoom);
    lessonNode.draw(ctx, panZoom);
    exerciseNode.draw(ctx, panZoom);
    checkpointNode.draw(ctx, panZoom);

    expect(moduleNode.width).toBe(LEARNING_MODULE_WIDTH);
    expect(moduleNode.height).toBe(LEARNING_MODULE_HEIGHT);
    expect(lessonNode.width).toBe(LEARNING_LESSON_WIDTH);
    expect(lessonNode.height).toBe(LEARNING_LESSON_HEIGHT);
    expect(exerciseNode.width).toBe(LEARNING_CHILD_UNIT_WIDTH);
    expect(exerciseNode.height).toBe(LEARNING_CHILD_UNIT_HEIGHT);
    expect(checkpointNode.width).toBe(LEARNING_CHILD_UNIT_WIDTH);
    expect(checkpointNode.height).toBe(LEARNING_CHILD_UNIT_HEIGHT);
    expect(moduleNode.fillColor).toBe('#f8fafc');
    expect(lessonNode.fillColor).toBe('#ffffff');
    expect(exerciseNode.fillColor).toBe('#f4fffd');
    expect(checkpointNode.fillColor).toBe('#fff9f0');
    expect(ctx.roundRect).toHaveBeenCalled();
    expect(ctx.arc).not.toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith('MODULE', expect.any(Number), expect.any(Number));
    expect(ctx.fillText).toHaveBeenCalledWith('LESSON', expect.any(Number), expect.any(Number));
    expect(ctx.fillText).toHaveBeenCalledWith('EXERCISE', expect.any(Number), expect.any(Number));
    expect(ctx.fillText).toHaveBeenCalledWith('CHECKPOINT', expect.any(Number), expect.any(Number));
  });

  it('renders module header text and empty-module hint', () => {
    const moduleNode = new LearningModuleNode({
      title: 'Module title',
      description: 'Module description',
      units: [],
    });
    const { ctx } = createCanvasContextSpy();
    const panZoom = {
      scale: 1,
      renderFlags: {
        showDetails: true,
        showAnim: false,
      },
      timeMs: 0,
      viewBounds: { x: 0, y: 0, width: 1200, height: 800 },
    } as any;

    moduleNode.draw(ctx, panZoom);

    expect(ctx.roundRect).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith('MODULE', expect.any(Number), expect.any(Number));
    expect(ctx.fillText).toHaveBeenCalledWith('No lessons yet', expect.any(Number), expect.any(Number));
    expect(ctx.fillText).toHaveBeenCalledWith('Add lesson', expect.any(Number), expect.any(Number));
  });

  it('uses only a simple selected stroke for modules', () => {
    const moduleNode = new LearningModuleNode({
      selected: true,
    });
    const { ctx } = createCanvasContextSpy();
    const panZoom = {
      scale: 1,
      renderFlags: {
        showDetails: false,
        showAnim: false,
      },
      timeMs: 0,
      viewBounds: { x: 0, y: 0, width: 1200, height: 800 },
    } as any;

    moduleNode.draw(ctx, panZoom);

    expect(moduleNode.borderColor).toBe(SELECT_COLOR);
  });
});
