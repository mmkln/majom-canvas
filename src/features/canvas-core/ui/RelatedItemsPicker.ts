import { Subscription } from 'rxjs';
import { Scene } from '../core/scene/Scene.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import type { IPlanningElement } from '../elements/interfaces/planningElement.ts';
import type {
  CanvasRelatedItem,
  CanvasRelatedItemsAdapter,
  CanvasRelatedItemsTab,
} from '../adapters/CanvasRelatedItemsAdapter.ts';
import type { CanvasLookupAdapter } from '../adapters/CanvasLookupAdapter.ts';
import { positionFixedElement } from './overlayPosition.ts';
import {
  createDivider,
  createIconButton,
  createInputBase,
  createSegmentedControl,
  createSurface,
  createTextButton,
  type SegmentedControl,
} from './primitives/index.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import { isPlanningCanvasElement } from '../elements/utils/planningNodeSemantics.ts';

type RelatedItemsPickerOptions = {
  adapter?: CanvasRelatedItemsAdapter | null;
};

export class RelatedItemsPicker {
  private readonly container: HTMLDivElement;
  private readonly header: HTMLDivElement;
  private readonly titleEl: HTMLSpanElement;
  private readonly closeBtn: HTMLButtonElement;
  private readonly searchInput: HTMLInputElement;
  private readonly tabsRow: HTMLDivElement;
  private readonly goalTabControl: SegmentedControl<CanvasRelatedItemsTab>;
  private readonly actionsRow: HTMLDivElement;
  private readonly addAllBtn: HTMLButtonElement;
  private readonly list: HTMLDivElement;
  private visible = false;
  private loading = false;
  private activeElement: IPlanningElement | null = null;
  private filteredItems: CanvasRelatedItem[] = [];
  private taskItems: CanvasRelatedItem[] = [];
  private storyItems: CanvasRelatedItem[] = [];
  private availableTabs: CanvasRelatedItemsTab[] = ['tasks'];
  private activeTab: CanvasRelatedItemsTab = 'tasks';
  private currentTitle: string | null = null;
  private subscriptions: Subscription[] = [];
  private outsideHandler: ((event: MouseEvent) => void) | null = null;
  private eventHandler: ((event: Event) => void) | null = null;
  private disposeRuntimeSubscription: (() => void) | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager,
    private readonly lookupAdapter: CanvasLookupAdapter,
    private readonly runtime: AppRuntime = createAppRuntime(),
    private readonly options: RelatedItemsPickerOptions = {}
  ) {
    this.container = createSurface({
      elevated: true,
      className:
        'fixed z-[130] hidden w-[320px] max-w-[calc(100vw-1rem)] max-h-[320px] overflow-hidden p-2.5',
    });
    this.container.style.position = 'fixed';
    this.container.style.display = 'none';
    this.container.style.maxHeight = '320px';

    this.header = document.createElement('div');
    this.header.className = 'mb-2 flex items-center justify-between';

    this.titleEl = document.createElement('span');
    this.titleEl.textContent = this.runtime.i18n.t('relatedItems.title.default');
    this.titleEl.className = 'text-sm font-semibold text-slate-900';

    this.closeBtn = createIconButton({
      icon: 'x-mark',
      size: 'sm',
      tone: 'text',
      title: this.runtime.i18n.t('relatedItems.close'),
      ariaLabel: this.runtime.i18n.t('relatedItems.close'),
      onClick: () => this.hide(),
    });

    this.header.appendChild(this.titleEl);
    this.header.appendChild(this.closeBtn);
    this.container.appendChild(this.header);

    this.searchInput = createInputBase({
      type: 'search',
      placeholder: this.runtime.i18n.t('relatedItems.searchPlaceholder'),
      className: 'mb-2 h-9',
    });
    this.searchInput.addEventListener('input', () => this.applyFilter());
    this.container.appendChild(this.searchInput);

    this.container.appendChild(createDivider({ inset: false }));

    this.tabsRow = document.createElement('div');
    this.tabsRow.className = 'mb-2 mt-2 hidden';
    this.goalTabControl = createSegmentedControl<CanvasRelatedItemsTab>({
      size: 'sm',
      fullWidth: true,
      ariaLabel: this.runtime.i18n.t('relatedItems.itemType'),
      options: [
        {
          id: 'related-tab-tasks',
          value: 'tasks',
          label: this.runtime.i18n.t('relatedItems.tab.tasks'),
        },
        {
          id: 'related-tab-stories',
          value: 'stories',
          label: this.runtime.i18n.t('relatedItems.tab.stories'),
        },
      ],
      value: this.activeTab,
      onChange: (tab) => this.setActiveTab(tab),
    });
    this.tabsRow.appendChild(this.goalTabControl.element);
    this.container.appendChild(this.tabsRow);

    this.actionsRow = document.createElement('div');
    this.actionsRow.className = 'mb-2 mt-1 flex justify-end';

    this.addAllBtn = createTextButton({
      text: this.runtime.i18n.t('relatedItems.addAll'),
      tone: 'text',
      className: 'px-2 py-1 text-xs font-medium',
      onClick: () => this.handleAddAllClick(),
    });
    this.actionsRow.appendChild(this.addAllBtn);
    this.container.appendChild(this.actionsRow);

    this.list = document.createElement('div');
    this.list.className =
      'flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-0.5';
    this.container.appendChild(this.list);
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.disposeRuntimeSubscription = this.runtime.subscribe(() => {
      this.refreshTranslations();
    }, { emitCurrent: true });
    this.subscriptions.push(
      this.scene.changes.subscribe(() => this.onSceneChange())
    );
    this.subscriptions.push(
      this.canvasManager
        .getPanZoomManager()
        .viewChanges.subscribe(() => this.updatePosition())
    );
    this.eventHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{ element?: ICanvasElement }>;
      const element = customEvent.detail?.element ?? null;
      if (!element || !this.isSupportedElement(element)) return;
      this.activeElement = element;
      this.searchInput.value = '';
      void this.loadRelatedItems();
      this.show();
    };
    window.addEventListener('relatedItemsPickerRequested', this.eventHandler);
  }

  public unmount(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    if (this.eventHandler) {
      window.removeEventListener(
        'relatedItemsPickerRequested',
        this.eventHandler
      );
      this.eventHandler = null;
    }
    this.detachOutsideHandler();
    this.goalTabControl.destroy();
    this.container.remove();
  }

  private get adapter(): CanvasRelatedItemsAdapter | null {
    return this.options.adapter ?? null;
  }

  private onSceneChange(): void {
    if (!this.visible) return;
    const selected = this.scene.getSelectedElements();
    if (
      !this.activeElement ||
      selected.length !== 1 ||
      selected[0] !== this.activeElement
    ) {
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
    this.loading = false;
    this.activeElement = null;
    this.currentTitle = null;
    this.taskItems = [];
    this.storyItems = [];
    this.filteredItems = [];
    this.availableTabs = ['tasks'];
    this.activeTab = 'tasks';
    this.titleEl.textContent = this.runtime.i18n.t('relatedItems.title.default');
    this.renderList();
    this.updateGoalTabsUi();
    this.updateAddAllButton();
    this.detachOutsideHandler();
  }

  private attachOutsideHandler(): void {
    if (this.outsideHandler) return;
    this.outsideHandler = (event: MouseEvent) => {
      if (!this.container.contains(event.target as Node)) {
        this.hide();
      }
      event.stopPropagation();
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
    const bounds = this.getElementBounds(this.activeElement);
    const anchorX = bounds.x + bounds.width / 2;
    const anchorY = bounds.y + bounds.height;
    const screenX = anchorX * panZoom.scale - panZoom.scrollX + rect.left;
    const screenY = anchorY * panZoom.scale - panZoom.scrollY + rect.top;
    positionFixedElement(this.container, {
      anchorX: screenX,
      anchorY: screenY,
      alignX: 'center',
      alignY: 'top',
      offsetY: 46,
    });
  }

  private async loadRelatedItems(): Promise<void> {
    if (!this.activeElement || !this.adapter) {
      this.loading = false;
      this.renderEmpty(this.runtime.i18n.t('relatedItems.empty.noRelatedItems'));
      this.updateAddAllButton();
      return;
    }
    this.loading = true;
    this.currentTitle = null;
    this.taskItems = [];
    this.storyItems = [];
    this.filteredItems = [];
    this.availableTabs = ['tasks'];
    this.activeTab = 'tasks';
    this.renderList(true);
    this.updateGoalTabsUi();
    this.updateAddAllButton();

    try {
      const result = await this.adapter.loadRelatedItems({
        host: this.activeElement,
        scene: this.scene,
        lookupAdapter: this.lookupAdapter,
        runtime: this.runtime,
      });
      if (!this.activeElement) return;
      this.loading = false;
      this.currentTitle = result.title;
      this.taskItems = result.tasks;
      this.storyItems = result.stories;
      this.availableTabs = result.availableTabs;
      this.activeTab = result.availableTabs.includes(result.defaultTab)
        ? result.defaultTab
        : result.availableTabs[0] ?? 'tasks';
      this.syncItemsFromContext();
      this.applyFilter();
    } catch {
      this.loading = false;
      this.renderEmpty(this.runtime.i18n.t('relatedItems.error.loadRelatedItems'));
      this.updateAddAllButton();
    }
  }

  private setActiveTab(tab: CanvasRelatedItemsTab): void {
    if (!this.availableTabs.includes(tab)) return;
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.syncItemsFromContext();
    this.applyFilter();
  }

  private syncItemsFromContext(): void {
    this.filteredItems = this.activeTab === 'stories'
      ? [...this.storyItems]
      : [...this.taskItems];
  }

  private applyFilter(): void {
    const sourceItems =
      this.activeTab === 'stories' ? this.storyItems : this.taskItems;
    const term = this.searchInput.value.trim().toLowerCase();
    if (!term) {
      this.filteredItems = [...sourceItems];
    } else {
      this.filteredItems = sourceItems.filter((item) => {
        return (
          item.title.toLowerCase().includes(term) ||
          (item.description || '').toLowerCase().includes(term)
        );
      });
    }
    this.renderList();
    this.updateGoalTabsUi();
    this.updateAddAllButton();
  }

  private renderList(loading: boolean = false): void {
    this.list.innerHTML = '';
    if (loading) {
      const row = document.createElement('div');
      row.textContent = this.runtime.i18n.t('relatedItems.loading');
      row.className = 'px-2 py-2 text-sm text-slate-500';
      this.list.appendChild(row);
      return;
    }
    if (this.filteredItems.length === 0) {
      this.renderEmpty(this.runtime.i18n.t('relatedItems.empty.noItemsFound'));
      return;
    }
    this.filteredItems.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className =
        'flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5';

      const label = document.createElement('div');
      label.className = 'flex min-w-0 flex-col gap-0.5';
      const title = document.createElement('span');
      title.textContent = item.title;
      title.className = 'truncate text-[13px] font-semibold text-slate-800';
      const meta = document.createElement('span');
      meta.textContent =
        item.description && item.description.length > 0
          ? item.description
          : item.fallbackMeta;
      meta.className = 'truncate text-[11px] text-slate-500';
      label.appendChild(title);
      label.appendChild(meta);

      const addBtn = createTextButton({
        text: this.runtime.i18n.t('relatedItems.add'),
        tone: 'soft',
        className: 'px-2 py-1 text-xs font-semibold',
        onClick: () => {
          this.addItemToCanvas(item, idx);
        },
      });

      row.appendChild(label);
      row.appendChild(addBtn);
      this.list.appendChild(row);
    });
  }

  private renderEmpty(message: string): void {
    this.list.innerHTML = '';
    const row = document.createElement('div');
    row.textContent = message;
    row.className = 'px-2 py-2 text-sm text-slate-500';
    this.list.appendChild(row);
  }

  private addItemToCanvas(item: CanvasRelatedItem, index: number): void {
    if (!this.activeElement || !this.adapter) return;
    this.adapter.addItemToCanvas({
      host: this.activeElement,
      item,
      index,
      scene: this.scene,
      canvasManager: this.canvasManager,
    });
    this.removeItemFromCaches(item);
    this.syncItemsFromContext();
    this.applyFilter();
  }

  private handleAddAllClick(): void {
    if (!this.activeElement || !this.adapter) return;
    const items = this.activeTab === 'stories' ? this.storyItems : this.taskItems;
    if (this.loading || items.length === 0) return;
    this.adapter.addAllToCanvas({
      host: this.activeElement,
      tab: this.activeTab,
      items,
      scene: this.scene,
      canvasManager: this.canvasManager,
    });
    if (this.activeTab === 'stories') {
      this.storyItems = [];
    } else {
      this.taskItems = [];
    }
    this.syncItemsFromContext();
    this.applyFilter();
  }

  private removeItemFromCaches(item: CanvasRelatedItem): void {
    this.taskItems = this.taskItems.filter(
      (candidate) => candidate.key !== item.key
    );
    this.storyItems = this.storyItems.filter(
      (candidate) => candidate.key !== item.key
    );
  }

  private updateGoalTabsUi(): void {
    const showTabs = this.availableTabs.length > 1;
    this.tabsRow.style.display = showTabs ? 'block' : 'none';
    this.goalTabControl.setValue(this.activeTab);
    const buttons = this.goalTabControl.element.querySelectorAll('button');
    const tasksButton = buttons[0];
    const storiesButton = buttons[1];
    if (tasksButton) {
      tasksButton.style.display = this.availableTabs.includes('tasks')
        ? ''
        : 'none';
    }
    if (storiesButton) {
      storiesButton.style.display = this.availableTabs.includes('stories')
        ? ''
        : 'none';
    }
  }

  private updateAddAllButton(): void {
    if (!this.activeElement || !this.adapter) {
      this.actionsRow.style.display = 'none';
      return;
    }
    this.actionsRow.style.display = 'flex';
    const count = this.activeTab === 'stories'
      ? this.storyItems.length
      : this.taskItems.length;
    this.addAllBtn.textContent =
      this.activeTab === 'stories'
        ? this.runtime.i18n.t('relatedItems.addAllMissingStories', { count })
        : this.runtime.i18n.t('relatedItems.addAllMissingTasks', { count });
    this.addAllBtn.disabled = this.loading || count === 0;
  }

  private refreshTranslations(): void {
    this.titleEl.textContent = this.getCurrentTitle();
    this.closeBtn.title = this.runtime.i18n.t('relatedItems.close');
    this.closeBtn.setAttribute(
      'aria-label',
      this.runtime.i18n.t('relatedItems.close')
    );
    this.searchInput.placeholder = this.runtime.i18n.t(
      'relatedItems.searchPlaceholder'
    );
    this.goalTabControl.element.setAttribute(
      'aria-label',
      this.runtime.i18n.t('relatedItems.itemType')
    );
    this.updateGoalTabLabels();
    if (this.visible) {
      this.renderList(this.loading);
      this.updateAddAllButton();
    }
  }

  private updateGoalTabLabels(): void {
    const buttons = this.goalTabControl.element.querySelectorAll('button');
    const tasksButton = buttons[0];
    const storiesButton = buttons[1];
    if (tasksButton) {
      tasksButton.textContent = this.runtime.i18n.t('relatedItems.tab.tasks');
    }
    if (storiesButton) {
      storiesButton.textContent = this.runtime.i18n.t('relatedItems.tab.stories');
    }
  }

  private getCurrentTitle(): string {
    return (
      this.currentTitle ?? this.runtime.i18n.t('relatedItems.title.default')
    );
  }

  private isSupportedElement(element: ICanvasElement): element is IPlanningElement {
    return (
      isPlanningCanvasElement(element) &&
      (this.adapter?.isSupportedHost(element) ?? false)
    );
  }

  private getElementBounds(element: IPlanningElement): {
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
