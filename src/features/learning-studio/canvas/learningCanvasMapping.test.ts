import { describe, expect, it } from 'vitest';
import Connection from '../../canvas-core/core/shapes/Connection.ts';
import {
  ConnectionLineType,
  ConnectionRelationType,
} from '../../canvas-core/core/interfaces/connection.ts';
import {
  buildLearningCanvasScene,
  mergeElementsIntoLearningContent,
} from './learningCanvasMapping.ts';
import type { LearningCourseContent } from '../domain/types.ts';
import { isLearningModuleNode } from './learningCanvasNodes.ts';

function createContent(): LearningCourseContent {
  return {
    title: 'Course',
    description: 'Description',
    audience: 'Audience',
    outcomes: [],
    estimatedDurationMinutes: null,
    modules: [
      {
        id: 'module-1',
        title: 'Module 1',
        description: 'First module',
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
        description: 'Intro lesson',
        objective: '',
        estimatedDurationMinutes: null,
        prerequisiteLessonIds: [],
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
        description: 'Practice',
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
        description: 'Second lesson',
        objective: '',
        estimatedDurationMinutes: null,
        prerequisiteLessonIds: ['lesson-1'],
        blocks: [],
        createdAt: '2026-03-28T10:00:00.000Z',
        updatedAt: '2026-03-28T10:00:00.000Z',
      },
    ],
    moduleLayouts: [
      {
        moduleId: 'module-1',
        x: 120,
        y: 160,
        collapsed: false,
      },
    ],
  };
}

describe('learningCanvasMapping', () => {
  it('maps learning content into module stories, unit tasks and prerequisite connections', () => {
    const snapshot = buildLearningCanvasScene(createContent());

    const stories = snapshot.elements.filter((element) => element.id === 'module-1');
    const tasks = snapshot.elements.filter((element) =>
      ['lesson-1', 'exercise-1', 'lesson-2'].includes(element.id)
    );

    expect(stories).toHaveLength(1);
    expect(tasks).toHaveLength(3);
    expect(stories[0]?.nodeKind).toBe('module');
    expect(tasks.map((element) => element.nodeKind)).toEqual([
      'lesson',
      'exercise',
      'lesson',
    ]);
    expect(snapshot.connections.map((connection) => connection.id)).toEqual([
      'learning-prerequisite:lesson-1:lesson-2',
    ]);
  });

  it('merges canvas positions, lesson order and prerequisite links back into learning content', () => {
    const content = createContent();
    const snapshot = buildLearningCanvasScene(content);
    const story = snapshot.elements.find((element) => element.id === 'module-1');
    const lesson1 = snapshot.elements.find((element) => element.id === 'lesson-1');
    const lesson2 = snapshot.elements.find((element) => element.id === 'lesson-2');
    const exercise = snapshot.elements.find((element) => element.id === 'exercise-1');

    if (
      !story ||
      !isLearningModuleNode(story) ||
      !lesson1 ||
      !lesson2 ||
      !exercise
    ) {
      throw new Error('Expected story and tasks to exist in canvas snapshot.');
    }

    story.x = 480;
    story.y = 320;
    story.replaceOrderedLayoutChildren([lesson2 as any, lesson1 as any, exercise as any]);

    const merged = mergeElementsIntoLearningContent(
      content,
      [story as any],
      [lesson1 as any, lesson2 as any, exercise as any],
      [
        new Connection(
          'lesson-2',
          'lesson-1',
          'learning-prerequisite:lesson-2:lesson-1',
          ConnectionLineType.SShaped,
          ConnectionRelationType.Blocks
        ),
      ]
    );

    expect(merged.modules[0]?.lessonIds).toEqual(['lesson-2', 'lesson-1']);
    expect(
      merged.moduleLayouts.find((layout) => layout.moduleId === 'module-1')
    ).toMatchObject({
      x: 480,
      y: 320,
    });
    expect(
      merged.units.find((unit) => unit.id === 'lesson-1')?.prerequisiteLessonIds
    ).toEqual(['lesson-2']);
    expect(
      merged.units.find((unit) => unit.id === 'exercise-1')?.parentLessonId
    ).toBe('lesson-1');
  });
});
