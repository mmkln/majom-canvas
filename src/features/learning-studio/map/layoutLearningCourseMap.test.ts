import { describe, expect, it } from 'vitest';
import type { LearningCourseMapModel } from './courseMapModel.ts';
import { layoutLearningCourseMap } from './layoutLearningCourseMap.ts';

function createModel(): LearningCourseMapModel {
  return {
    layoutMode: 'auto',
    presentation: {
      layoutMode: 'auto',
      showModules: true,
      childUnitVisibility: 'important_only',
      promotedUnitIds: [],
      hiddenNodeIds: [],
      manualNodePositions: {},
    },
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
        childCount: 2,
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
        isFocused: false,
        isRecommended: true,
        childCount: 2,
        hiddenChildCount: 1,
        position: null,
      },
      {
        id: 'checkpoint-1',
        kind: 'checkpoint',
        title: 'Checkpoint 1',
        moduleId: 'module-1',
        parentId: 'lesson-1',
        state: 'locked',
        isFocused: true,
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
        id: 'lesson-1->checkpoint-1:contains',
        kind: 'contains',
        fromId: 'lesson-1',
        toId: 'checkpoint-1',
      },
      {
        id: 'lesson-1->lesson-2:prerequisite',
        kind: 'prerequisite',
        fromId: 'lesson-1',
        toId: 'lesson-2',
      },
    ],
    focusedNodeId: 'checkpoint-1',
    recommendedNodeId: 'lesson-1',
  };
}

describe('layoutLearningCourseMap', () => {
  it('assigns visible frames to nodes and a bounded viewport', () => {
    const layout = layoutLearningCourseMap(createModel());

    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
    expect(layout.nodes).toHaveLength(4);
    expect(layout.nodes[0]?.frame.width).toBeGreaterThan(0);
  });

  it('keeps child nodes visually below their parent lesson', () => {
    const layout = layoutLearningCourseMap(createModel());
    const lesson = layout.nodes.find((node) => node.id === 'lesson-1');
    const checkpoint = layout.nodes.find((node) => node.id === 'checkpoint-1');

    expect(lesson).toBeDefined();
    expect(checkpoint).toBeDefined();
    expect(checkpoint!.frame.y).toBeGreaterThan(lesson!.frame.y + lesson!.frame.height);
    expect(checkpoint!.frame.x).toBeGreaterThan(lesson!.frame.x);
  });

  it('builds renderable paths for visible edges', () => {
    const layout = layoutLearningCourseMap(createModel());

    expect(layout.edges).toHaveLength(2);
    expect(layout.edges.every((edge) => edge.path.startsWith('M '))).toBe(true);
  });
});
