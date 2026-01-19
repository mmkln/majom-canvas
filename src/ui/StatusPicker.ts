import { Subscription } from 'rxjs';
import { Scene } from '../core/scene/Scene.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import {
  ElementStatus,
  ELEMENT_STATUS_OPTIONS,
} from '../elements/ElementStatus.ts';

type StatusOption = {
  value: ElementStatus;
  label: string;
};

export class StatusPicker {
  private readonly container: HTMLDivElement;
  private readonly list: HTMLDivElement;
  private visible = false;
  private activeElement: ICanvasElement | null = null;
  private activeElements: Array<TaskElement | StoryElement | GoalElement> = [];
  private anchorBounds:
    | { x: number; y: number; width: number; height: number }
    | null = null;
  private subscriptions: Subscription[] = [];
  private outsideHandler: ((event: MouseEvent) => void) | null = null;
  private eventHandler: ((event: Event) => void) | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager
  ) {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.display = 'none';
    this.container.style.minWidth = '180px';
    this.container.style.background = 'white';
    this.container.style.border = '1px solid #e5e7eb';
    this.container.style.borderRadius = '10px';
    this.container.style.boxShadow = '0 10px 30px rgba(0,0,0,0.14)';
    this.container.style.padding = '6px';
    this.container.style.zIndex = '120';

    this.list = document.createElement('div');
    this.list.style.display = 'flex';
    this.list.style.flexDirection = 'column';
    this.list.style.gap = '4px';
    this.container.appendChild(this.list);
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.subscriptions.push(this.scene.changes.subscribe(() => this.onSceneChange()));
    this.subscriptions.push(
      this.canvasManager.getPanZoomManager().viewChanges.subscribe(() =>
        this.updatePosition()
      )
    );
    this.eventHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        element?: ICanvasElement;
        elements?: Array<TaskElement | StoryElement | GoalElement>;
        bounds?: { x: number; y: number; width: number; height: number };
      }>;
      const elements = customEvent.detail?.elements ?? [];
      const element = customEvent.detail?.element ?? null;
      const bounds = customEvent.detail?.bounds ?? null;
      if (elements.length > 0) {
        if (!elements.every((el) => this.isPlanningElement(el))) return;
        this.activeElements = elements;
        this.activeElement = elements[0];
        this.anchorBounds = bounds;
      } else {
        if (!element || !this.isPlanningElement(element)) return;
        this.activeElements = [element];
        this.activeElement = element;
        this.anchorBounds = bounds;
      }
      this.renderList();
      this.show();
    };
    window.addEventListener('statusPickerRequested', this.eventHandler);
  }

  public unmount(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    if (this.eventHandler) {
      window.removeEventListener('statusPickerRequested', this.eventHandler);
      this.eventHandler = null;
    }
    this.detachOutsideHandler();
    this.container.remove();
  }

  private onSceneChange(): void {
    if (!this.visible) return;
    const selected = this.scene.getSelectedElements();
    if (this.activeElements.length === 0) {
      this.hide();
      return;
    }
    if (!this.isSelectionValid(selected)) {
      this.hide();
      return;
    }
    this.updatePosition();
  }

  private show(): void {
    if (!this.activeElement) return;
    this.visible = true;
    this.container.style.display = 'block';
    this.updatePosition();
    this.attachOutsideHandler();
  }

  private hide(): void {
    this.visible = false;
    this.container.style.display = 'none';
    this.activeElement = null;
    this.activeElements = [];
    this.anchorBounds = null;
    this.list.innerHTML = '';
    this.detachOutsideHandler();
  }

  private attachOutsideHandler(): void {
    if (this.outsideHandler) return;
    this.outsideHandler = (event: MouseEvent) => {
      if (!this.container.contains(event.target as Node)) {
        this.hide();
      }
    };
    window.addEventListener('mousedown', this.outsideHandler);
  }

  private detachOutsideHandler(): void {
    if (!this.outsideHandler) return;
    window.removeEventListener('mousedown', this.outsideHandler);
    this.outsideHandler = null;
  }

  private updatePosition(): void {
    if (!this.visible || !this.activeElement) return;
    const panZoom = this.canvasManager.getPanZoomManager();
    const rect = this.canvasManager.getCanvas().getBoundingClientRect();
    const bounds =
      this.activeElements.length > 1
        ? this.getSelectionBounds(this.activeElements)
        : this.anchorBounds ?? this.getElementBounds(this.activeElement);
    const anchorX = bounds.x + bounds.width / 2;
    const anchorY = bounds.y + bounds.height;
    const screenX = anchorX * panZoom.scale - panZoom.scrollX + rect.left;
    const screenY = anchorY * panZoom.scale - panZoom.scrollY + rect.top + 52;
    this.container.style.left = `${screenX}px`;
    this.container.style.top = `${screenY}px`;
    this.container.style.transform = 'translate(-50%, 0)';
  }

  private renderList(): void {
    this.list.innerHTML = '';
    if (this.activeElements.length === 0) return;
    const currentStatus = this.getCurrentStatus();
    ELEMENT_STATUS_OPTIONS.forEach((option: StatusOption) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = option.label;
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'space-between';
      btn.style.width = '100%';
      btn.style.border = '1px solid transparent';
      btn.style.borderRadius = '8px';
      btn.style.padding = '6px 10px';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '13px';
      const styles = this.getStatusStyles(option.value);
      btn.style.color = styles.text;
      const isActive = currentStatus === option.value;
      btn.style.background = isActive ? styles.bg : 'white';
      btn.style.borderColor = isActive ? styles.border : 'transparent';
      btn.addEventListener('mouseenter', () => {
        if (!isActive) {
          btn.style.background = '#f3f4f6';
        }
      });
      btn.addEventListener('mouseleave', () => {
        if (!isActive) {
          btn.style.background = 'white';
        }
      });
      btn.addEventListener('click', () => this.applyStatus(option.value));
      this.list.appendChild(btn);
    });
  }

  private applyStatus(status: ElementStatus): void {
    if (this.activeElements.length === 0) return;
    const currentStatus = this.getCurrentStatus();
    if (currentStatus === status) {
      this.hide();
      return;
    }
    // TODO: replace per-element PATCH with bulk endpoints:
    // /tasks/bulk/, /stories/bulk/, /goals/bulk/ (ids + patch payload).
    this.activeElements.forEach((element) => {
      element.status = status;
      window.dispatchEvent(
        new CustomEvent('elementDetailsEdited', {
          detail: { element, patch: { status } },
        })
      );
    });
    this.scene.changes.next();
    this.hide();
  }

  private getStatusStyles(status: ElementStatus): {
    bg: string;
    text: string;
    border: string;
  } {
    switch (status) {
      case ElementStatus.InProgress:
        return { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' };
      case ElementStatus.Pending:
        return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' };
      case ElementStatus.Done:
        return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
      case ElementStatus.Defined:
      default:
        return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' };
    }
  }

  private getElementBounds(element: ICanvasElement): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const el = element as any;
    if (typeof el.width === 'number' && typeof el.height === 'number') {
      return { x: el.x, y: el.y, width: el.width, height: el.height };
    }
    if (typeof el.radius === 'number') {
      return {
        x: el.x - el.radius,
        y: el.y - el.radius,
        width: el.radius * 2,
        height: el.radius * 2,
      };
    }
    return { x: el.x, y: el.y, width: 0, height: 0 };
  }

  private isPlanningElement(
    element: ICanvasElement
  ): element is TaskElement | StoryElement | GoalElement {
    return (
      element instanceof TaskElement ||
      element instanceof StoryElement ||
      element instanceof GoalElement
    );
  }

  private getCurrentStatus(): ElementStatus | null {
    if (this.activeElements.length === 0) return null;
    const statusSet = new Set(this.activeElements.map((el) => el.status));
    if (statusSet.size !== 1) return null;
    return this.activeElements[0].status;
  }

  private isSelectionValid(selected: ICanvasElement[]): boolean {
    if (this.activeElements.length === 0) return false;
    if (selected.length !== this.activeElements.length) return false;
    const selectedIds = new Set(selected.map((el) => (el as any).id));
    return this.activeElements.every((el) => selectedIds.has(el.id));
  }

  private getSelectionBounds(
    elements: Array<TaskElement | StoryElement | GoalElement>
  ): { x: number; y: number; width: number; height: number } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    elements.forEach((el) => {
      const bounds = this.getElementBounds(el);
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });
    if (!Number.isFinite(minX)) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}
