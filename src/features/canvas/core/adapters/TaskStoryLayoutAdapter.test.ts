import { describe, expect, it } from 'vitest';
import {
  NoopTaskStoryLayoutAdapter,
  createEmptyTaskStoryLayoutChanges,
} from './TaskStoryLayoutAdapter.ts';

describe('TaskStoryLayoutAdapter', () => {
  it('noop adapter always returns empty changes', () => {
    const adapter = new NoopTaskStoryLayoutAdapter();
    const result = adapter.compute({
      mode: 'group',
      draggingItem: null,
      selectedElements: [],
      sceneElements: [],
      draggedElementIds: new Set(),
      dropPlans: new Map(),
    });
    expect(result).toEqual(createEmptyTaskStoryLayoutChanges());
  });
});
