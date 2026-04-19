import { Subscription } from 'rxjs';
import {
  createAppRuntime,
  type AppRuntime,
} from '../../../app-runtime/index.ts';
import { DropdownSelectBase } from '../../../ui-lib/src/components/DropdownSelectBase.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import type { IConnectable } from '../core/interfaces/connectable.ts';
import {
  ConnectionRelationType,
  type IConnection,
} from '../core/interfaces/connection.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import { Scene } from '../core/scene/Scene.ts';
import { BulkActionsController } from '../core/services/BulkActionsController.ts';
import { isConnection } from '../core/utils/typeGuards.ts';
import { getViewBounds, isRectVisible } from '../core/utils/viewBounds.ts';
import { createIcon, type IconName } from './icons.ts';
import { positionFixedElement } from './overlayPosition.ts';
import {
  createIconButton,
  createSurface,
} from './primitives/index.ts';

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ConnectionRelationPresentation = {
  icon: IconName;
  label: string;
  chipClassName: string;
};

type ActionButtonVariant = 'default' | 'danger';

const ACTION_BUTTON_VARIANT_CLASS: Record<ActionButtonVariant, string> = {
  default: '!text-slate-500 hover:!bg-slate-100 hover:!text-slate-700',
  danger: '!text-rose-500 hover:!bg-rose-50 hover:!text-rose-600',
};

const RELATION_TRIGGER_PALETTE_CLASSES = [
  '!bg-blue-50',
  '!text-blue-700',
  'hover:!bg-blue-100',
  '!bg-rose-50',
  '!text-rose-700',
  'hover:!bg-rose-100',
  '!bg-violet-50',
  '!text-violet-700',
  'hover:!bg-violet-100',
];

function isConnectable(element: ICanvasElement): element is IConnectable {
  return (
    typeof element === 'object' &&
    element !== null &&
    'getConnectionPoints' in element &&
    typeof element.getConnectionPoints === 'function'
  );
}

function buildConnectableLookup(scene: Scene): Map<string, IConnectable> {
  const lookup = new Map<string, IConnectable>();
  scene.getElements().forEach((element) => {
    if (!isConnectable(element)) return;
    lookup.set(element.id, element);
    const uuid = (element as { uuid?: string }).uuid;
    if (typeof uuid === 'string' && uuid.length > 0) {
      lookup.set(uuid, element);
    }
  });
  return lookup;
}

function getConnectionBounds(
  connection: IConnection,
  lookup: ReadonlyMap<string, IConnectable>
): Rect | null {
  const from = lookup.get(connection.fromId);
  const to = lookup.get(connection.toId);
  if (!from || !to) return null;

  const curveConnection = connection as IConnection & {
    getCurvePoints?: (
      source: IConnectable,
      target: IConnectable
    ) => {
      start: { x: number; y: number };
      end: { x: number; y: number };
      cp1: { x: number; y: number };
      cp2: { x: number; y: number };
      isBezier: boolean;
    };
  };

  if (typeof curveConnection.getCurvePoints !== 'function') {
    const fromPoints = from.getConnectionPoints();
    const toPoints = to.getConnectionPoints();
    const xs = [...fromPoints, ...toPoints].map((point) => point.x);
    const ys = [...fromPoints, ...toPoints].map((point) => point.y);
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(1, Math.max(...xs) - Math.min(...xs)),
      height: Math.max(1, Math.max(...ys) - Math.min(...ys)),
    };
  }

  const curve = curveConnection.getCurvePoints(from, to);
  const controlPoints =
    connection.relationType === ConnectionRelationType.LeadsTo ||
    connection.relationType === ConnectionRelationType.ParentChild
      ? [curve.start, curve.end]
      : [curve.start, curve.end, curve.cp1, curve.cp2];
  const xs = controlPoints.map((point) => point.x);
  const ys = controlPoints.map((point) => point.y);

  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(1, Math.max(...xs) - Math.min(...xs)),
    height: Math.max(1, Math.max(...ys) - Math.min(...ys)),
  };
}

export class SelectedConnectionActionMenu {
  private readonly container: HTMLDivElement;
  private readonly actionDivider: HTMLDivElement;
  private readonly deleteEverywhereButton: HTMLButtonElement;
  private readonly deleteCanvasOnlyButton: HTMLButtonElement;
  private readonly relationTypeSelect: DropdownSelectBase<ConnectionRelationType>;
  private readonly subscriptions: Subscription[] = [];
  private readonly resizeHandler = (): void => this.requestUpdate();
  private readonly interactionStartHandler = (): void => {
    this.suspendUpdates = true;
    this.hide();
  };
  private readonly interactionEndHandler = (): void => {
    this.suspendUpdates = false;
    this.update();
  };
  private disposeRuntimeSubscription: (() => void) | null = null;
  private suspendUpdates = false;
  private activeConnection: IConnection | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager,
    private readonly bulkActions: BulkActionsController,
    private readonly runtime: AppRuntime = createAppRuntime()
  ) {
    this.container = createSurface({
      className:
        'fixed z-40 hidden translate-x-0 items-center gap-1 rounded-full! p-1.5 pr-2.5',
    });
    this.container.dataset.selectedConnectionMenu = 'true';

    this.actionDivider = document.createElement('div');
    this.actionDivider.className = 'mx-1 h-4 w-px shrink-0 bg-slate-200/70';

    this.deleteEverywhereButton = this.createActionButton({
      dataAttribute: 'data-selected-connection-delete-fully',
      icon: 'trash',
      isDanger: true,
      onClick: () => {
        if (!this.activeConnection) return;
        this.bulkActions.removeConnection(this.activeConnection);
      },
    });
    this.deleteCanvasOnlyButton = this.createActionButton({
      dataAttribute: 'data-selected-connection-delete-canvas',
      icon: 'minus',
      onClick: () => {
        if (!this.activeConnection) return;
        this.bulkActions.removeConnectionFromCanvas(this.activeConnection);
      },
    });
    this.relationTypeSelect = new DropdownSelectBase({
      size: 'sm',
      value: null,
      placeholder: this.runtime.i18n.t('selectionMenu.changeConnectionRelation'),
      portalTarget: document.body,
      hideChevron: true,
      getKey: (item) => item,
      getLabel: (item) => this.getRelationPresentation(item).label,
      ariaLabel: this.runtime.i18n.t('selectionMenu.changeConnectionRelation'),
      renderTriggerLeading: (item) =>
        item ? this.createRelationLeading(item) : null,
      renderOptionLeading: (item) => this.createRelationLeading(item),
      onSelect: (relationType) => {
        if (!this.activeConnection) return;
        this.bulkActions.updateConnectionRelationType(
          this.activeConnection,
          relationType
        );
      },
    });
    this.decorateRelationTypeTrigger();

    this.container.append(
      this.relationTypeSelect.element,
      this.actionDivider,
      this.deleteCanvasOnlyButton,
      this.deleteEverywhereButton
    );
    this.refreshLabels();
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.subscriptions.push(
      this.scene.changes.subscribe(() => this.requestUpdate())
    );
    this.subscriptions.push(
      this.canvasManager
        .getPanZoomManager()
        .viewChanges.subscribe(() => this.requestUpdate())
    );
    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener(
      'canvasInteractionStart',
      this.interactionStartHandler
    );
    window.addEventListener('canvasInteractionEnd', this.interactionEndHandler);
    this.disposeRuntimeSubscription = this.runtime.subscribe(
      () => {
        this.refreshLabels();
        this.requestUpdate();
      },
      { emitCurrent: true }
    );
    this.requestUpdate();
  }

  public unmount(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.length = 0;
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener(
      'canvasInteractionStart',
      this.interactionStartHandler
    );
    window.removeEventListener(
      'canvasInteractionEnd',
      this.interactionEndHandler
    );
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.relationTypeSelect.destroy();
    this.container.remove();
  }

  private requestUpdate(): void {
    if (this.suspendUpdates) return;
    this.update();
  }

  private update(): void {
    if (
      this.canvasManager.isDraggingElements ||
      this.canvasManager.isResizingStory
    ) {
      this.hide();
      return;
    }

    const selected = this.scene.getSelectedElements();
    if (selected.length !== 1 || !isConnection(selected[0])) {
      this.hide();
      return;
    }

    const connection = selected[0];
    const bounds = getConnectionBounds(
      connection,
      buildConnectableLookup(this.scene)
    );
    if (!bounds || !this.isBoundsVisible(bounds)) {
      this.hide();
      return;
    }

    this.activeConnection = connection;
    this.syncRelationTypeControl(connection);
    this.show();
    this.positionUnderBounds(bounds);
  }

  private show(): void {
    if (this.container.classList.contains('hidden')) {
      this.container.classList.remove('hidden');
      this.container.classList.add('flex');
    }
  }

  private hide(): void {
    this.activeConnection = null;
    this.relationTypeSelect.close();
    if (!this.container.classList.contains('hidden')) {
      this.container.classList.remove('flex');
      this.container.classList.add('hidden');
    }
  }

  private refreshLabels(): void {
    this.deleteEverywhereButton.setAttribute(
      'aria-label',
      this.runtime.i18n.t('selectionMenu.removeConnectionEverywhere')
    );
    this.deleteEverywhereButton.setAttribute(
      'title',
      this.runtime.i18n.t('selectionMenu.removeConnectionEverywhere')
    );
    this.deleteCanvasOnlyButton.setAttribute(
      'aria-label',
      this.runtime.i18n.t('selectionMenu.removeConnectionFromCanvas')
    );
    this.deleteCanvasOnlyButton.setAttribute(
      'title',
      this.runtime.i18n.t('selectionMenu.removeConnectionFromCanvas')
    );
    const relationTypeTrigger = this.getRelationTypeTrigger();
    relationTypeTrigger?.setAttribute(
      'aria-label',
      this.runtime.i18n.t('selectionMenu.changeConnectionRelation')
    );
    relationTypeTrigger?.setAttribute(
      'title',
      this.runtime.i18n.t('selectionMenu.changeConnectionRelation')
    );
  }

  private syncRelationTypeControl(connection: IConnection): void {
    const options =
      this.bulkActions.getAvailableConnectionRelationTypes(connection);
    const canChangeRelationType =
      options.length > 0 &&
      this.bulkActions.canUpdateConnectionRelationType(connection);
    this.relationTypeSelect.element.style.display = canChangeRelationType
      ? 'block'
      : 'none';
    this.actionDivider.style.display = canChangeRelationType ? 'block' : 'none';
    if (!canChangeRelationType) {
      this.relationTypeSelect.close();
      return;
    }

    this.relationTypeSelect.setItems([...options]);
    this.relationTypeSelect.setSelected(connection.relationType);
    this.syncRelationTypeTriggerPresentation(connection.relationType);
  }

  private createActionButton(options: {
    dataAttribute: string;
    icon: IconName;
    isDanger?: boolean;
    onClick: () => void;
  }): HTMLButtonElement {
    const button = createIconButton({
      icon: options.icon,
      size: 'sm',
      tone: 'text',
      title: '',
      ariaLabel: '',
      className: 'rounded-lg border border-transparent bg-transparent',
    });
    this.setButtonVariant(button, options.isDanger ? 'danger' : 'default');
    button.setAttribute(options.dataAttribute, 'true');
    button.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      this.relationTypeSelect.close();
      options.onClick();
    });
    return button;
  }

  private setButtonVariant(
    button: HTMLButtonElement,
    variant: ActionButtonVariant
  ): void {
    button.classList.remove(
      '!text-slate-500',
      'hover:!bg-slate-100',
      'hover:!text-slate-700',
      '!text-rose-500',
      'hover:!bg-rose-50',
      'hover:!text-rose-600'
    );
    ACTION_BUTTON_VARIANT_CLASS[variant]
      .split(' ')
      .filter(Boolean)
      .forEach((token) => button.classList.add(token));
  }

  private decorateRelationTypeTrigger(): void {
    const trigger = this.getRelationTypeTrigger();
    if (!trigger) return;
    trigger.dataset.selectedConnectionRelationTrigger = 'true';
    trigger.classList.add(
      '!h-8',
      '!min-h-0',
      '!gap-2',
      '!rounded-full',
      '!border-transparent',
      '!px-3',
      '!py-1',
      'hover:!border-transparent'
    );
    trigger.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });
  }

  private syncRelationTypeTriggerPresentation(
    relationType: ConnectionRelationType
  ): void {
    const trigger = this.getRelationTypeTrigger();
    if (!trigger) return;
    const presentation = this.getRelationPresentation(relationType);
    trigger.classList.remove(...RELATION_TRIGGER_PALETTE_CLASSES);
    presentation.chipClassName
      .split(' ')
      .filter(Boolean)
      .forEach((token) => trigger.classList.add(token));
    trigger
      .querySelectorAll<HTMLDivElement>('div')
      .forEach((element) => {
        element.classList.remove('font-medium', 'text-slate-800');
        element.classList.add('!font-normal', '!text-slate-600');
      });
  }

  private getRelationPresentation(
    relationType: ConnectionRelationType
  ): ConnectionRelationPresentation {
    switch (relationType) {
      case ConnectionRelationType.LeadsTo:
        return {
          icon: 'arrow-right',
          label: this.runtime.i18n.t(
            'planningDetails.goal.relatedGoals.relation.leadsTo'
          ),
          chipClassName: '!bg-blue-50 !text-blue-700 hover:!bg-blue-100',
        };
      case ConnectionRelationType.Blocks:
        return {
          icon: 'slash',
          label: this.runtime.i18n.t(
            'planningDetails.goal.relatedGoals.relation.blocks'
          ),
          chipClassName: '!bg-rose-50 !text-rose-700 hover:!bg-rose-100',
        };
      case ConnectionRelationType.RelatesTo:
      default:
        return {
          icon: 'link',
          label: this.runtime.i18n.t(
            'planningDetails.goal.relatedGoals.relation.relatesTo'
          ),
          chipClassName:
            '!bg-violet-50 !text-violet-700 hover:!bg-violet-100',
        };
    }
  }

  private createRelationLeading(
    relationType: ConnectionRelationType
  ): HTMLElement {
    const presentation = this.getRelationPresentation(relationType);
    const icon = createIcon(presentation.icon, {
      size: 12,
      strokeWidth: 1.9,
    });
    icon.classList.add('shrink-0');
    presentation.chipClassName
      .split(' ')
      .filter((token) => !token.startsWith('hover:') && !token.startsWith('!bg-'))
      .forEach((token) => icon.classList.add(token));
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  private getRelationTypeTrigger(): HTMLButtonElement | null {
    return this.relationTypeSelect.element.querySelector('button');
  }

  private positionUnderBounds(bounds: Rect): void {
    const panZoom = this.canvasManager.getPanZoomManager();
    const rect = this.canvasManager.getCanvas().getBoundingClientRect();
    const anchorX = bounds.x + bounds.width / 2;
    const anchorY = bounds.y + bounds.height;
    const screenX = anchorX * panZoom.scale - panZoom.scrollX + rect.left;
    const screenY = anchorY * panZoom.scale - panZoom.scrollY + rect.top;
    positionFixedElement(this.container, {
      anchorX: screenX,
      anchorY: screenY,
      alignX: 'center',
      alignY: 'top',
      offsetY: 10,
    });
  }

  private isBoundsVisible(bounds: Rect): boolean {
    const panZoom = this.canvasManager.getPanZoomManager();
    const canvas = this.canvasManager.getCanvas();
    const viewBounds = panZoom.viewBounds ?? getViewBounds(panZoom, canvas);
    return isRectVisible(
      viewBounds,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height
    );
  }
}
