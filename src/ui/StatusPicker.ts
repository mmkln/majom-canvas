import { Subscription } from 'rxjs';
import { Scene } from '../core/scene/Scene.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import {
  ElementStatus,
  ELEMENT_STATUS_OPTIONS,
} from '../elements/ElementStatus.ts';
import {
  SelectionContext,
  PlanningElement,
} from '../core/services/SelectionContext.ts';
import { BulkActionsController } from '../core/services/BulkActionsController.ts';
import { positionFixedElement } from './overlayPosition.ts';
import { createHudDropdownItem } from './primitives/index.ts';

type StatusOption = {
  value: ElementStatus;
  label: string;
};

export class StatusPicker {
  private readonly container: HTMLDivElement;
  private readonly list: HTMLDivElement;
  private visible = false;
  private activeElement: PlanningElement | null = null;
  private activeElements: PlanningElement[] = [];
  private subscriptions: Subscription[] = [];
  private outsideHandler: ((event: MouseEvent) => void) | null = null;
  private eventHandler: ((event: Event) => void) | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager,
    private readonly bulkActions: BulkActionsController
  ) {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.display = 'none';
    this.container.style.minWidth = '180px';
    this.container.style.background = 'rgba(255,255,255,0.96)';
    this.container.style.border = '1px solid #e2e8f0';
    this.container.style.borderRadius = '12px';
    this.container.style.boxShadow = '0 18px 42px rgba(15,23,42,0.18)';
    this.container.style.padding = '4px';
    this.container.style.zIndex = '120';

    this.list = document.createElement('div');
    this.list.style.display = 'flex';
    this.list.style.flexDirection = 'column';
    this.list.style.gap = '2px';
    this.container.appendChild(this.list);
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.subscriptions.push(
      this.scene.changes.subscribe(() => this.onSceneChange())
    );
    this.subscriptions.push(
      this.canvasManager
        .getPanZoomManager()
        .viewChanges.subscribe(() => this.updatePosition())
    );
    this.eventHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        element?: ICanvasElement;
        elements?: PlanningElement[];
        bounds?: { x: number; y: number; width: number; height: number };
      }>;
      const elements = customEvent.detail?.elements ?? [];
      const element = customEvent.detail?.element ?? null;
      if (elements.length > 0) {
        if (!elements.every((el) => SelectionContext.isPlanningElement(el))) {
          return;
        }
        this.activeElements = elements;
        this.activeElement = elements[0];
      } else {
        if (!element || !SelectionContext.isPlanningElement(element)) return;
        this.activeElements = [element];
        this.activeElement = element;
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
    if (!SelectionContext.isSelectionMatch(selected, this.activeElements)) {
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
        ? SelectionContext.getSelectionBounds(this.activeElements)
        : this.getElementBounds(this.activeElement);
    const anchorX = bounds.x + bounds.width / 2;
    const anchorY = bounds.y + bounds.height;
    const screenX = anchorX * panZoom.scale - panZoom.scrollX + rect.left;
    const screenY = anchorY * panZoom.scale - panZoom.scrollY + rect.top;
    positionFixedElement(this.container, {
      anchorX: screenX,
      anchorY: screenY,
      alignX: 'center',
      alignY: 'top',
      offsetY: 52,
    });
  }

  private renderList(): void {
    this.list.innerHTML = '';
    if (this.activeElements.length === 0) return;
    const currentStatus = SelectionContext.getMixedStatus(this.activeElements);
    ELEMENT_STATUS_OPTIONS.forEach((option: StatusOption) => {
      const isActive = currentStatus === option.value;
      const btn = createHudDropdownItem({
        label: option.label,
        variant: isActive ? 'emphasis' : 'default',
        className: this.getStatusItemClasses(option.value, isActive),
        onClick: () => this.applyStatus(option.value),
      });
      this.list.appendChild(btn);
    });
  }

  private applyStatus(status: ElementStatus): void {
    if (this.activeElements.length === 0) return;
    const currentStatus = SelectionContext.getMixedStatus(this.activeElements);
    if (currentStatus === status) {
      this.hide();
      return;
    }
    this.bulkActions.updateStatus(this.activeElements, status);
    this.hide();
  }

  private getStatusItemClasses(
    status: ElementStatus,
    active: boolean
  ): string {
    switch (status) {
      case ElementStatus.InProgress:
        return active
          ? 'bg-blue-50 text-blue-700'
          : 'text-blue-700 hover:bg-blue-50/70 hover:text-blue-800';
      case ElementStatus.Pending:
        return active
          ? 'bg-amber-50 text-amber-700'
          : 'text-amber-700 hover:bg-amber-50/70 hover:text-amber-800';
      case ElementStatus.Done:
        return active
          ? 'bg-emerald-50 text-emerald-700'
          : 'text-emerald-700 hover:bg-emerald-50/70 hover:text-emerald-800';
      case ElementStatus.Defined:
      default:
        return active
          ? 'bg-slate-100 text-slate-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800';
    }
  }

  private getElementBounds(element: PlanningElement): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    return {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    };
  }
}
