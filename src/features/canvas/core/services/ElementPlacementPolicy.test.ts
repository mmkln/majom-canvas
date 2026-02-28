import { describe, expect, it } from 'vitest';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { ElementPlacementPolicy } from './ElementPlacementPolicy.ts';

describe('ElementPlacementPolicy', () => {
  it('limits drag translation to avoid overlapping sibling elements with minimum gap', () => {
    const policy = new ElementPlacementPolicy(24);
    const movingTask = new TaskElement({ id: 'moving', x: 0, y: 0 });
    const staticTask = new TaskElement({ id: 'static', x: 330, y: 0 });
    const initialPositions = new Map<string, { x: number; y: number }>([
      [movingTask.id, { x: movingTask.x, y: movingTask.y }],
    ]);

    const resolved = policy.resolveDragTranslation({
      movingElements: [movingTask],
      initialPositions,
      proposedDx: 80,
      proposedDy: 0,
      sceneElements: [movingTask, staticTask],
    });

    expect(resolved.dx).toBeLessThanOrEqual(34.1);
    expect(resolved.dx).toBeGreaterThan(33);
    expect(resolved.dy).toBe(0);
  });

  it('allows moving a task inside a story container', () => {
    const policy = new ElementPlacementPolicy(24);
    const task = new TaskElement({ id: 'task', x: 0, y: 0 });
    const story = new StoryElement({
      id: 'story',
      x: 100,
      y: 80,
      width: 500,
      height: 300,
    });
    const initialPositions = new Map<string, { x: number; y: number }>([
      [task.id, { x: task.x, y: task.y }],
    ]);

    const resolved = policy.resolveDragTranslation({
      movingElements: [task],
      initialPositions,
      proposedDx: 180,
      proposedDy: 120,
      sceneElements: [task, story],
    });

    expect(resolved.dx).toBe(180);
    expect(resolved.dy).toBe(120);
  });

  it('repositions newly added element to the nearest free spot', () => {
    const policy = new ElementPlacementPolicy(24);
    const existingStory = new StoryElement({ id: 'existing', x: 0, y: 0 });
    const newStory = new StoryElement({ id: 'new', x: 0, y: 0 });

    policy.placeElements([newStory], [existingStory]);

    const intersectsWithGap =
      newStory.x < existingStory.x + existingStory.width + 24 &&
      newStory.x + newStory.width + 24 > existingStory.x &&
      newStory.y < existingStory.y + existingStory.height + 24 &&
      newStory.y + newStory.height + 24 > existingStory.y;

    expect(intersectsWithGap).toBe(false);
  });

  it('clamps story resize rect along movement path when target collides', () => {
    const policy = new ElementPlacementPolicy(24);
    const resizingStory = new StoryElement({
      id: 'resizing',
      x: 0,
      y: 0,
      width: 344,
      height: 240,
    });
    const blockingStory = new StoryElement({
      id: 'blocking',
      x: 420,
      y: 0,
      width: 344,
      height: 240,
    });

    const resolved = policy.resolveElementRectAlongPath({
      element: resizingStory,
      startRect: {
        x: resizingStory.x,
        y: resizingStory.y,
        width: resizingStory.width,
        height: resizingStory.height,
      },
      targetRect: {
        x: 0,
        y: 0,
        width: 520,
        height: 240,
      },
      sceneElements: [resizingStory, blockingStory],
      movingIds: new Set([resizingStory.id]),
    });

    expect(resolved.width).toBeLessThanOrEqual(396.2);
    expect(resolved.width).toBeGreaterThan(390);
  });
});
