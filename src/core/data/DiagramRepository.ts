// src/core/data/DiagramRepository.ts

import { Scene } from '../scene/Scene.ts';
import {
  ITask,
  TaskDependency,
  IStory,
  IGoal,
} from '../interfaces/interfaces.ts';
import { IDataProvider } from '../interfaces/dataProvider.ts';
import Connection from '../shapes/Connection.ts';
import Circle from '../shapes/Circle.ts';
import Octagon from '../shapes/Octagon.ts';
import Square from '../shapes/Square.ts';
import { ICanvasElement } from '../interfaces/canvasElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';

export class DiagramRepository {
  constructor(private dataProvider: IDataProvider) {}

  async loadDiagram(scene: Scene): Promise<void> {
    const tasks: ITask[] = await this.dataProvider.loadTasks();
    const dependencies: TaskDependency[] =
      await this.dataProvider.loadDependencies();

    tasks.forEach((task) => {
      const taskElement = new TaskElement({
        id: task.id,
        x: task.x,
        y: task.y,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate:
          task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate),
      });
      scene.addElement(taskElement);
    });

    // load stories
    const storiesDto: IStory[] = await this.dataProvider.loadStories();
    storiesDto.forEach((storyDto) => {
      // use indexOf for compatibility
      const storyTasks = scene
        .getElements()
        .filter(
          (el) =>
            el instanceof TaskElement && storyDto.tasks.indexOf(el.id) !== -1
        ) as TaskElement[];
      const storyElement = new StoryElement({
        id: storyDto.id,
        x: storyDto.x,
        y: storyDto.y,
        width: storyDto.width,
        height: storyDto.height,
        title: storyDto.title,
        description: storyDto.description,
        status: storyDto.status,
        priority: storyDto.priority,
        tasks: storyTasks,
      });
      scene.addElement(storyElement);
    });

    // load goals
    const goalsDto: IGoal[] = await this.dataProvider.loadGoals();
    goalsDto.forEach((goalDto) => {
      const goalElement = new GoalElement({
        id: goalDto.id,
        x: goalDto.x,
        y: goalDto.y,
        width: goalDto.width,
        height: goalDto.height,
        title: goalDto.title,
        status: goalDto.status,
        priority: goalDto.priority,
      });
      goalElement.progress = goalDto.progress;
      goalElement.links = goalDto.links;
      scene.addElement(goalElement);
    });

    // process all connections after tasks and stories added
    dependencies.forEach((dep) => {
      const fromElement = scene
        .getElements()
        .find((el) => el.id === dep.fromTaskId);
      const toElement = scene
        .getElements()
        .find((el) => el.id === dep.toTaskId);
      if (fromElement && toElement) {
        const line = new Connection(fromElement.id, toElement.id);
        scene.addElement(line);
      }
    });
  }

  /** Save current scene tasks and dependencies via dataProvider */
  async saveDiagram(scene: Scene): Promise<void> {
    // serialize tasks
    const tasks: ITask[] = scene
      .getElements()
      .filter((el) => el instanceof TaskElement)
      .map((t: TaskElement) => ({
        id: t.id,
        x: t.x,
        y: t.y,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
      }));
    await this.dataProvider.saveTasks(tasks);
    // serialize dependencies
    const deps: TaskDependency[] = scene.getConnections().map((c) => ({
      fromTaskId: c.fromId,
      toTaskId: c.toId,
      type: 'dependsOn',
    }));
    await this.dataProvider.saveDependencies(deps);

    // serialize stories
    const storyElements = scene
      .getElements()
      .filter((el) => el instanceof StoryElement) as StoryElement[];
    const storiesToSave: IStory[] = storyElements.map((s) => ({
      id: s.id,
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
      title: s.title,
      description: s.description,
      status: s.status,
      priority: s.priority,
      tasks: s.tasks.map((t) => t.id),
    }));
    await this.dataProvider.saveStories(storiesToSave);

    // serialize goals
    const goalElements = scene
      .getElements()
      .filter((el) => el instanceof GoalElement) as GoalElement[];
    const goalsToSave: IGoal[] = goalElements.map((g) => ({
      id: g.id,
      x: g.x,
      y: g.y,
      width: g.width,
      height: g.height,
      title: g.title,
      status: g.status,
      priority: g.priority,
      progress: g.progress,
      links: g.links,
    }));
    await this.dataProvider.saveGoals(goalsToSave);
  }
}
