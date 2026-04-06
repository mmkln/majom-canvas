// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { Scene } from '../scene/Scene.ts';
import { historyService } from './HistoryService.ts';
import { SelectionRotationService } from './SelectionRotationService.ts';

describe('SelectionRotationService', () => {
  beforeEach(() => {
    historyService.reset();
  });

  afterEach(() => {
    historyService.reset();
  });

  it('rotates top-level selected elements clockwise and supports undo', () => {
    const scene = new Scene();
    const left = new TaskElement({ id: 'left', x: 100, y: 100 });
    const right = new TaskElement({ id: 'right', x: 400, y: 100 });

    scene.addElement(left);
    scene.addElement(right);

    expect(SelectionRotationService.canRotate(scene, [left, right])).toBe(true);
    expect(SelectionRotationService.rotateClockwise(scene, [left, right])).toBe(
      true
    );

    expect(left.x).toBe(250);
    expect(left.y).toBe(-50);
    expect(right.x).toBe(250);
    expect(right.y).toBe(250);
    expect(historyService.canUndo()).toBe(true);

    historyService.undo();

    expect(left.x).toBe(100);
    expect(left.y).toBe(100);
    expect(right.x).toBe(400);
    expect(right.y).toBe(100);
  });

  it('treats a selected story as a rigid group and moves its tasks by the same delta', () => {
    const scene = new Scene();
    const story = new StoryElement({ id: 'story-1', x: 100, y: 100 });
    const storyTask = new TaskElement({ id: 'task-1', x: 136, y: 192 });
    const goal = new GoalElement({ id: 'goal-1', x: 600, y: 100 });

    story.addTask(storyTask);
    scene.addElement(story);
    scene.addElement(storyTask);
    scene.addElement(goal);

    const initialOffset = {
      x: storyTask.x - story.x,
      y: storyTask.y - story.y,
    };

    expect(
      SelectionRotationService.canRotate(scene, [story, storyTask, goal])
    ).toBe(true);
    expect(
      SelectionRotationService.rotateClockwise(scene, [story, storyTask, goal])
    ).toBe(true);

    expect(story.x).toBe(338);
    expect(story.y).toBe(-98);
    expect(goal.x).toBe(350);
    expect(goal.y).toBe(350);
    expect(storyTask.x - story.x).toBe(initialOffset.x);
    expect(storyTask.y - story.y).toBe(initialOffset.y);

    historyService.undo();

    expect(story.x).toBe(100);
    expect(story.y).toBe(100);
    expect(storyTask.x).toBe(136);
    expect(storyTask.y).toBe(192);
    expect(goal.x).toBe(600);
    expect(goal.y).toBe(100);
  });

  it('blocks rotation when a selected task belongs to an unselected story', () => {
    const scene = new Scene();
    const story = new StoryElement({ id: 'story-1', x: 100, y: 100 });
    const storyTask = new TaskElement({ id: 'task-1', x: 136, y: 192 });
    const goal = new GoalElement({ id: 'goal-1', x: 600, y: 100 });

    story.addTask(storyTask);
    scene.addElement(story);
    scene.addElement(storyTask);
    scene.addElement(goal);

    expect(
      SelectionRotationService.canRotate(scene, [storyTask, goal])
    ).toBe(false);
    expect(
      SelectionRotationService.rotateClockwise(scene, [storyTask, goal])
    ).toBe(false);
    expect(storyTask.x).toBe(136);
    expect(storyTask.y).toBe(192);
    expect(goal.x).toBe(600);
    expect(goal.y).toBe(100);
    expect(historyService.canUndo()).toBe(false);
  });
});
