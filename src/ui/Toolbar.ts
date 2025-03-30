// ui/Toolbar.ts
import { Scene } from '../core/scene/Scene';
import Circle from '../core/shapes/Circle';
import Octagon from '../core/shapes/Octagon';
import Square from '../core/shapes/Square';

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
    const addCircleBtn = document.createElement('button');
    addCircleBtn.textContent = 'Add Circle';
    addCircleBtn.style.cursor = 'pointer';
    addCircleBtn.style.padding = '6px 12px';
    addCircleBtn.style.border = '1px solid #ccc';
    addCircleBtn.style.borderRadius = '4px';
    addCircleBtn.style.background = '#fff';
    addCircleBtn.style.fontSize = '14px';

    addCircleBtn.onclick = () => {
      const circle = new Circle({ x: 400, y: 400, radius: 50 });
      this.scene.addElement(circle);
    };

    const addOctagonBtn = document.createElement('button');
    addOctagonBtn.textContent = 'Add Octagon';
    addOctagonBtn.style.cursor = 'pointer';
    addOctagonBtn.style.padding = '6px 12px';
    addOctagonBtn.style.border = '1px solid #ccc';
    addOctagonBtn.style.borderRadius = '4px';
    addOctagonBtn.style.background = '#fff';
    addOctagonBtn.style.fontSize = '14px';

    addOctagonBtn.onclick = () => {
      const hexagon = new Octagon({ x: 450, y: 450, radius: 50 });
      this.scene.addElement(hexagon);
    };

    const addSquareBtn = document.createElement('button');
    addSquareBtn.textContent = 'Add Square';
    addSquareBtn.style.cursor = 'pointer';
    addSquareBtn.style.padding = '6px 12px';
    addSquareBtn.style.border = '1px solid #ccc';
    addSquareBtn.style.borderRadius = '4px';
    addSquareBtn.style.background = '#fff';
    addSquareBtn.style.fontSize = '14px';

    addSquareBtn.onclick = () => {
      const square = new Square({ x: 500, y: 500, radius: 50 });
      this.scene.addElement(square);
    };

    this.container.appendChild(addCircleBtn);
    this.container.appendChild(addOctagonBtn);
    this.container.appendChild(addSquareBtn);

    document.body.appendChild(this.container);
  }
}
