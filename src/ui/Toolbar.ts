// ui/Toolbar.ts
import Circle from '../core/shapes/Circle.ts';
import Octagon from '../core/shapes/Octagon.ts';
import Square from '../core/shapes/Square.ts';
import { Scene } from '../core/scene/Scene.ts';
import { ComponentFactory } from '../ui-lib/src/index.ts';
import { TaskSearchComponent } from './components/TaskSearch.ts';
import { dummyTasksForSelect } from './dummyData.ts';

export class Toolbar {
  private readonly container: HTMLDivElement;

  constructor(private scene: Scene) {
    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.left = '10px';
    this.container.style.top = '10px';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.gap = '8px';
    this.container.style.padding = '8px';
    this.container.style.background = '#f4f4f4';
    this.container.style.borderRadius = '8px';
    this.container.style.boxShadow = '0 0 5px rgba(0,0,0,0.1)';
  }

  public init(): void {
    const addCircleBtn = ComponentFactory.createButton({
      text: 'Circle',
      onClick: () => {
        const circle = new Circle({ x: 400, y: 400, radius: 50 });
        this.scene.addElement(circle);
      },
      variant: 'default', // updated from 'primary'
      size: 'default',
    });

    const addOctagonBtn = ComponentFactory.createButton({
      text: 'Octagon',
      onClick: () => {
        const octagon = new Octagon({ x: 450, y: 450, radius: 50 });
        this.scene.addElement(octagon);
      },
      variant: 'secondary',
      size: 'sm',
    });

    const addSquareBtn = ComponentFactory.createButton({
      text: 'Square',
      onClick: () => {
        const square = new Square({ x: 500, y: 500, radius: 50 });
        this.scene.addElement(square);
      },
      variant: 'outline',
      size: 'lg',
    });

    const taskList = new TaskSearchComponent({
      tasks: dummyTasksForSelect,
      onSelect: (value) => {
        console.log('selected', {value}); // TODO: remove
      }
    })

    addCircleBtn.render(this.container);
    addOctagonBtn.render(this.container);
    addSquareBtn.render(this.container);
    taskList.render(this.container);

    document.body.appendChild(this.container);
  }
}
