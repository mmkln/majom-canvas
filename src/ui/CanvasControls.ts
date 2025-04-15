// ui/CanvasControls.ts
import { CanvasManager } from '../managers/CanvasManager.ts';
import { ComponentFactory } from '../ui-library/src/index.ts';
import { ButtonVariant } from '../ui-library/src/components/Button.js';

export class CanvasControls {
  private readonly container: HTMLDivElement;

  constructor(private canvasManager: CanvasManager) {
    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.right = '24px';
    this.container.style.bottom = '24px';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.gap = '12px';
    this.container.style.background = 'rgba(255,255,255,0.95)';
    this.container.style.borderRadius = '12px';
    this.container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
    this.container.style.padding = '12px';

    const buttonVariant: ButtonVariant = 'secondary';

    const zoomInBtn = ComponentFactory.createButton({
      text: '+',
      variant: buttonVariant,
      size: 'icon',
      onClick: () => this.canvasManager.zoomIn(),
      tooltip: 'Zoom In',
    }).createElement();

    const zoomOutBtn = ComponentFactory.createButton({
      text: '-',
      variant: buttonVariant,
      size: 'icon',
      onClick: () => this.canvasManager.zoomOut(),
      tooltip: 'Zoom Out',
    }).createElement();

    const centerBtn = ComponentFactory.createButton({
      text: '⦿',
      variant: buttonVariant,
      size: 'icon',
      onClick: () => this.canvasManager.centerCanvas(),
      tooltip: 'Center Canvas',
    }).createElement();

    this.container.appendChild(zoomInBtn);
    this.container.appendChild(zoomOutBtn);
    this.container.appendChild(centerBtn);
  }

  public mount(parent: HTMLElement = document.body) {
    parent.appendChild(this.container);
  }

  public unmount() {
    this.container.remove();
  }
}
