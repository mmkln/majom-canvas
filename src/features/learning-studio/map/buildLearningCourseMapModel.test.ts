import { describe, expect, it } from 'vitest';
import type { LearningCourseContent } from '../domain/types.ts';
import { buildLearningCourseMapModel } from './buildLearningCourseMapModel.ts';

function createContent(): LearningCourseContent {
  return {
    title: 'Course',
    description: '',
    audience: '',
    outcomes: [],
    estimatedDurationMinutes: null,
    modules: [
      {
        id: 'module-1',
        title: 'Module 1',
        description: '',
        order: 0,
        lessonIds: ['lesson-1', 'lesson-2'],
      },
    ],
    units: [
      {
        id: 'lesson-1',
        moduleId: 'module-1',
        parentLessonId: null,
        order: 0,
        type: 'lesson',
        title: 'Lesson 1',
        description: '',
        objective: '',
        estimatedDurationMinutes: null,
        prerequisiteLessonIds: [],
        blocks: [],
        createdAt: '2026-03-28T10:00:00.000Z',
        updatedAt: '2026-03-28T10:00:00.000Z',
      },
      {
        id: 'lesson-2',
        moduleId: 'module-1',
        parentLessonId: null,
        order: 1,
        type: 'lesson',
        title: 'Lesson 2',
        description: '',
        objective: '',
        estimatedDurationMinutes: null,
        prerequisiteLessonIds: ['lesson-1'],
        blocks: [],
        createdAt: '2026-03-28T10:00:00.000Z',
        updatedAt: '2026-03-28T10:00:00.000Z',
      },
      {
        id: 'exercise-1',
        moduleId: 'module-1',
        parentLessonId: 'lesson-1',
        order: 0,
        type: 'exercise',
        title: 'Exercise 1',
        description: '',
        objective: '',
        estimatedDurationMinutes: null,
        prerequisiteLessonIds: [],
        blocks: [],
        createdAt: '2026-03-28T10:00:00.000Z',
        updatedAt: '2026-03-28T10:00:00.000Z',
      },
      {
        id: 'checkpoint-1',
        moduleId: 'module-1',
        parentLessonId: 'lesson-1',
        order: 1,
        type: 'checkpoint',
        title: 'Checkpoint 1',
        description: '',
        objective: '',
        estimatedDurationMinutes: null,
        prerequisiteLessonIds: [],
        blocks: [],
        createdAt: '2026-03-28T10:00:00.000Z',
        updatedAt: '2026-03-28T10:00:00.000Z',
      },
    ],
    moduleLayouts: [],
  };
}

const labels = {
  module: 'Module',
  lesson: 'Lesson',
  exercise: 'Exercise',
  checkpoint: 'Checkpoint',
};

describe('buildLearningCourseMapModel', () => {
  it('derives a lesson-first map by default', () => {
    const model = buildLearningCourseMapModel({
      content: createContent(),
      progressByUnitId: {
        'lesson-1': 'completed',
        'lesson-2': 'available',
      },
      focusedUnitId: 'lesson-2',
      recommendedUnitId: 'lesson-2',
      labels,
    });

    expect(model.nodes.map((node) => node.id)).toEqual([
      'module-1',
      'lesson-1',
      'lesson-2',
    ]);
    expect(
      model.edges.find((edge) => edge.kind === 'prerequisite')
    ).toMatchObject({
      fromId: 'lesson-1',
      toId: 'lesson-2',
    });
    expect(model.focusedNodeId).toBe('lesson-2');
    expect(model.recommendedNodeId).toBe('lesson-2');
  });

  it('promotes checkpoints when important-only visibility is enabled', () => {
    const model = buildLearningCourseMapModel({
      content: createContent(),
      progressByUnitId: {},
      focusedUnitId: 'checkpoint-1',
      recommendedUnitId: null,
      labels,
      presentation: {
        childUnitVisibility: 'important_only',
      },
    });

    expect(model.nodes.some((node) => node.id === 'checkpoint-1')).toBe(true);
    expect(model.nodes.some((node) => node.id === 'exercise-1')).toBe(false);
    expect(model.focusedNodeId).toBe('checkpoint-1');
  });

  it('falls back focus to the parent lesson when a child node stays hidden', () => {
    const model = buildLearningCourseMapModel({
      content: createContent(),
      progressByUnitId: {},
      focusedUnitId: 'exercise-1',
      recommendedUnitId: 'exercise-1',
      labels,
    });

    expect(model.focusedNodeId).toBe('lesson-1');
    expect(model.recommendedNodeId).toBe('lesson-1');
  });
});
