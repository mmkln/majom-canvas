import { describe, expect, it } from 'vitest';
import { LearningCanvasRuntimeSemanticsAdapter } from './LearningCanvasRuntimeSemanticsAdapter.ts';
import { LearningLessonNode } from './LearningLessonNode.ts';
import { LearningModuleNode } from './LearningModuleNode.ts';

describe('LearningCanvasRuntimeSemanticsAdapter', () => {
  it('treats current learning bridge nodes as interactive layout nodes', () => {
    const adapter = new LearningCanvasRuntimeSemanticsAdapter();
    const moduleNode = new LearningModuleNode({});
    const lessonNode = new LearningLessonNode({
      moduleId: 'module-1',
      parentLessonId: null,
    });

    expect(adapter.isLayoutContainer(moduleNode)).toBe(true);
    expect(adapter.isLayoutChild(lessonNode)).toBe(true);
    expect(adapter.canResizeElement(moduleNode)).toBe(true);
  });

  it('prioritizes lesson nodes over modules for hit testing', () => {
    const adapter = new LearningCanvasRuntimeSemanticsAdapter();
    const moduleNode = new LearningModuleNode({});
    const lessonNode = new LearningLessonNode({
      moduleId: 'module-1',
      parentLessonId: null,
    });

    expect(adapter.getHitTestPriority(lessonNode)).toBeGreaterThan(
      adapter.getHitTestPriority(moduleNode)
    );
  });
});
