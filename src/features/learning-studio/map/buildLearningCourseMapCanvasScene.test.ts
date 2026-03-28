import { describe, expect, it } from 'vitest';
import {
  buildLearningCourseMapCanvasScene,
  createDefaultLearningCourseMapPresentation,
} from './index.ts';

describe('buildLearningCourseMapCanvasScene', () => {
  it('builds canvas-core nodes and prerequisite/child connections from map model', () => {
    const snapshot = buildLearningCourseMapCanvasScene({
      model: {
        layoutMode: 'auto',
        presentation: createDefaultLearningCourseMapPresentation(),
        nodes: [
          {
            id: 'module-1',
            kind: 'module',
            title: 'Module 1',
            moduleId: 'module-1',
            parentId: null,
            state: 'none',
            isFocused: false,
            isRecommended: false,
            childCount: 1,
            hiddenChildCount: 0,
            position: null,
          },
          {
            id: 'lesson-1',
            kind: 'lesson',
            title: 'Lesson 1',
            moduleId: 'module-1',
            parentId: 'module-1',
            state: 'available',
            isFocused: true,
            isRecommended: true,
            childCount: 1,
            hiddenChildCount: 0,
            position: null,
          },
          {
            id: 'exercise-1',
            kind: 'exercise',
            title: 'Exercise 1',
            moduleId: 'module-1',
            parentId: 'lesson-1',
            state: 'completed',
            isFocused: false,
            isRecommended: false,
            childCount: 0,
            hiddenChildCount: 0,
            position: null,
          },
          {
            id: 'lesson-2',
            kind: 'lesson',
            title: 'Lesson 2',
            moduleId: 'module-1',
            parentId: 'module-1',
            state: 'locked',
            isFocused: false,
            isRecommended: false,
            childCount: 0,
            hiddenChildCount: 0,
            position: null,
          },
        ],
        edges: [
          {
            id: 'module-1->lesson-1:contains',
            kind: 'contains',
            fromId: 'module-1',
            toId: 'lesson-1',
          },
          {
            id: 'lesson-1->exercise-1:contains',
            kind: 'contains',
            fromId: 'lesson-1',
            toId: 'exercise-1',
          },
          {
            id: 'lesson-1->lesson-2:prerequisite',
            kind: 'prerequisite',
            fromId: 'lesson-1',
            toId: 'lesson-2',
          },
        ],
        focusedNodeId: 'lesson-1',
        recommendedNodeId: 'lesson-1',
      },
      labels: {
        structural: 'Structural',
        available: 'Available',
        inProgress: 'In progress',
        completed: 'Completed',
        locked: 'Locked',
        review: 'Review',
        hiddenChildren: (count) => `${count} hidden`,
      },
    });

    expect(snapshot.nodes.map((node) => node.id)).toEqual([
      'module-1',
      'lesson-1',
      'exercise-1',
      'lesson-2',
    ]);
    expect(snapshot.connections.map((connection) => connection.id)).toEqual([
      'lesson-1->exercise-1:contains',
      'lesson-1->lesson-2:prerequisite',
    ]);
    expect(snapshot.bounds.width).toBeGreaterThan(0);
    expect(snapshot.bounds.height).toBeGreaterThan(0);

    const focusedLesson = snapshot.nodes.find((node) => node.id === 'lesson-1');
    expect(focusedLesson?.selected).toBe(true);
    expect(focusedLesson?.focused).toBe(true);
  });
});
