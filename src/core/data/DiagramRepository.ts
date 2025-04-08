// src/core/data/DiagramRepository.ts

import { Scene } from '../scene/Scene.ts';
import { Task, TaskDependency } from '../interfaces/interfaces.ts';
import { IDataProvider } from '../interfaces/dataProvider.ts';
import Connection from '../shapes/Connection.ts';
import Circle from '../shapes/Circle.ts';
import Octagon from '../shapes/Octagon.ts';
import Square from '../shapes/Square.ts';

export class DiagramRepository {
  constructor(private dataProvider: IDataProvider) {}

  async loadDiagram(scene: Scene): Promise<void> {
    const tasks: Task[] = await this.dataProvider.loadTasks();
    const dependencies: TaskDependency[] =
      await this.dataProvider.loadDependencies();

    tasks.forEach((task) => {
      const shape = new Octagon({ x: task.x, y: task.y, id: task.id });
      scene.addElement(shape);
    });

    dependencies.forEach((dep) => {
      console.log({ dep });
      const fromShape = scene
        .getShapes()
        .find((el) => el.id === dep.fromTaskId);
      const toShape = scene.getShapes().find((el) => el.id === dep.toTaskId);
      if (fromShape && toShape) {
        const line = new Connection(fromShape.id, toShape.id);
        console.log({ line });
        scene.addElement(line);
      }
    });
  }
}
