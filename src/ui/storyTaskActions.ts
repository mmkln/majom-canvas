import { StoryElement } from '../elements/StoryElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { Scene } from '../core/scene/Scene.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import { StoryLayoutService } from '../core/services/StoryLayoutService.ts';
import { historyService } from '../core/services/HistoryService.ts';
import { AddElementCommand } from '../core/commands/AddElementCommand.ts';
import { ResizeCommand } from '../core/commands/ResizeCommand.ts';
import { emitTaskStoryLinkSet } from '../core/canvasLinkLifecycle.ts';

type AddTaskToStoryArgs = {
  story: StoryElement;
  scene: Scene;
  canvasManager: CanvasManager;
  layoutService: StoryLayoutService;
};

export const addTaskToStory = ({
  story,
  scene,
  canvasManager,
  layoutService,
}: AddTaskToStoryArgs): TaskElement => {
  const tasks = scene
    .getElements()
    .filter((el) => el instanceof TaskElement) as TaskElement[];
  const plan = layoutService.planAddTask(story, tasks);
  const task = new TaskElement({
    x: plan.position.x,
    y: plan.position.y,
  });
  if (plan.nextHeight > story.height) {
    const initial = new Map<
      string,
      { x: number; y: number; width: number; height: number }
    >();
    initial.set(story.id, {
      x: story.x,
      y: story.y,
      width: story.width,
      height: story.height,
    });
    const final = new Map<
      string,
      { x: number; y: number; width: number; height: number }
    >();
    final.set(story.id, {
      x: story.x,
      y: story.y,
      width: story.width,
      height: plan.nextHeight,
    });
    historyService.execute(new ResizeCommand(scene, initial, final));
  }
  historyService.execute(new AddElementCommand(scene, task));
  story.addTask(task);
  scene.setSelected([task]);
  canvasManager.draw();
  emitTaskStoryLinkSet(task, story);
  return task;
};
