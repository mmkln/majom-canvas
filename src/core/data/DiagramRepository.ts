// src/core/data/DiagramRepository.ts

import { Scene } from '../scene/Scene.ts';
import { ITask, TaskDependency, IStory } from '../interfaces/interfaces.ts';
import { IDataProvider } from '../interfaces/dataProvider.ts';
import Connection from '../shapes/Connection.ts';
import Circle from '../shapes/Circle.ts';
import Octagon from '../shapes/Octagon.ts';
import Square from '../shapes/Square.ts';
import { ICanvasElement } from '../interfaces/canvasElement.ts';
import { Task } from '../../elements/Task.ts';
import { Story } from '../../elements/Story.ts';

export class DiagramRepository {
  constructor(private dataProvider: IDataProvider) {}

  async loadDiagram(scene: Scene): Promise<void> {
    const tasks: ITask[] = await this.dataProvider.loadTasks();
    const dependencies: TaskDependency[] =
      await this.dataProvider.loadDependencies();

    tasks.forEach((task) => {
      const taskElement = new Task({
        id: task.id,
        x: task.x,
        y: task.y,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate),
      });
      scene.addElement(taskElement);
    });

    dependencies.forEach((dep) => {
      console.log({ dep });
      const fromElement = scene
        .getElements()
        .find((el) => el.id === dep.fromTaskId);
      const toElement = scene.getElements().find((el) => el.id === dep.toTaskId);
      if (fromElement && toElement) {
        const line = new Connection(fromElement.id, toElement.id);
        console.log({ line });
        scene.addElement(line);
      }
    });

    // load stories
    const storiesDto: IStory[] = await this.dataProvider.loadStories();
    storiesDto.forEach((storyDto) => {
      // use indexOf for compatibility
      const storyTasks = scene.getElements().filter(
        (el) => el instanceof Task && storyDto.tasks.indexOf(el.id) !== -1
      ) as Task[];
      const storyElement = new Story({
        id: storyDto.id,
        x: storyDto.x,
        y: storyDto.y,
        width: storyDto.width,
        height: storyDto.height,
        title: storyDto.title,
        description: storyDto.description,
        status: storyDto.status,
        borderColor: storyDto.borderColor,
        tasks: storyTasks,
      });
      scene.addElement(storyElement);
    });
  }

  /** Save current scene tasks and dependencies via dataProvider */
  async saveDiagram(scene: Scene): Promise<void> {
    // serialize tasks
    const tasks: ITask[] = scene
      .getElements()
      .filter(el => el instanceof Task)
      .map((t: Task) => ({
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
    const deps: TaskDependency[] = scene
      .getConnections()
      .map(c => ({ fromTaskId: c.fromId, toTaskId: c.toId, type: 'dependsOn' }));
    await this.dataProvider.saveDependencies(deps);

    // serialize stories
    const storyElements = scene.getElements().filter(
      (el) => el instanceof Story
    ) as Story[];
    const storiesToSave: IStory[] = storyElements.map((s) => ({
      id: s.id,
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
      title: s.title,
      description: s.description,
      status: s.status,
      borderColor: s.borderColor,
      tasks: s.tasks.map((t) => t.id),
    }));
    await this.dataProvider.saveStories(storiesToSave);
  }
}
