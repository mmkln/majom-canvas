// ui/Toolbar.ts
import { Scene } from '../core/scene/Scene';
import Circle from '../core/shapes/Circle';
import Octagon from '../core/shapes/Octagon';
import Square from '../core/shapes/Square';
import { ComponentFactory } from '../ui-library/src/core/ComponentFactory';

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
      text: 'Add Circle',
      onClick: () => {
        const circle = new Circle({ x: 400, y: 400, radius: 50 });
        this.scene.addElement(circle);
      },
      variant: 'primary',
    });

    const addOctagonBtn = ComponentFactory.createButton({
      text: 'Add Octagon',
      onClick: () => {
        const octagon = new Octagon({ x: 450, y: 450, radius: 50 });
        this.scene.addElement(octagon);
      },
      variant: 'secondary',
    });

    const addSquareBtn = ComponentFactory.createButton({
      text: 'Add Square',
      onClick: () => {
        const square = new Square({ x: 500, y: 500, radius: 50 });
        this.scene.addElement(square);
      },
      variant: 'primary',
    });

    addCircleBtn.render(this.container);
    addOctagonBtn.render(this.container);
    addSquareBtn.render(this.container);

    document.body.appendChild(this.container);
  }
}
