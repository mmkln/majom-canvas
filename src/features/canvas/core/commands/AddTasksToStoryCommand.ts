import { Command } from './Command.ts';
import { Scene } from '../scene/Scene.ts';
import { AddElementCommand } from './AddElementCommand.ts';
import { ResizeCommand } from './ResizeCommand.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';

export class AddTasksToStoryCommand extends Command {
  private readonly addCommand: AddElementCommand;
  private readonly resizeCommand: ResizeCommand | null;

  constructor(
    scene: Scene,
    private readonly story: StoryElement,
    private readonly tasks: TaskElement[],
    nextHeight: number
  ) {
    super();
    this.addCommand = new AddElementCommand(scene, tasks);
    if (nextHeight > story.height) {
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
        height: nextHeight,
      });
      this.resizeCommand = new ResizeCommand(scene, initial, final);
    } else {
      this.resizeCommand = null;
    }
  }

  public execute(): void {
    this.resizeCommand?.execute();
    this.addCommand.execute();
    this.tasks.forEach((task) => this.story.addTask(task));
  }

  public undo(): void {
    this.addCommand.undo();
    this.tasks.forEach((task) => this.story.removeTask(task.id));
    this.resizeCommand?.undo();
  }
}
