import { Subscription } from 'rxjs';
import {
  KANBAN_ENTITY_CREATED_EVENT,
  KANBAN_REFRESH_REQUEST_EVENT,
  emitKanbanTaskActionRequested,
} from './kanbanEvents.ts';
import { KanbanDataService } from './services/KanbanDataService.ts';
import { KanbanStore } from './state/KanbanStore.ts';
import type { KanbanTaskAction } from './types.ts';
import { KanbanView } from './ui/KanbanView.ts';

export function refreshKanbanData(
  store: Pick<KanbanStore, 'requestRefresh'>
): void {
  store.requestRefresh('manual', true);
}

export class KanbanApp {
  private root: HTMLDivElement | null = null;
  private store: KanbanStore | null = null;
  private view: KanbanView | null = null;
  private subscriptions = new Subscription();
  private refreshRequestHandler: ((event: Event) => void) | null = null;
  private entityCreatedHandler: ((event: Event) => void) | null = null;
  private visibilityHandler: (() => void) | null = null;

  public mount(parent: HTMLElement): void {
    if (this.root) return;

    const root = document.createElement('div');
    root.dataset.module = 'kanban';
    root.style.width = '100%';
    root.style.height = '100%';
    root.style.display = 'block';
    parent.appendChild(root);
    this.root = root;

    const store = new KanbanStore(new KanbanDataService());
    this.store = store;

    const view = new KanbanView(root, {
      onTaskPatch: (taskId, patch) => store.patchTask(taskId, patch),
      onStoryGroupToggle: (columnId, storyKey) =>
        store.toggleStoryGroup(columnId, storyKey),
      onStoryGroupsToggleAll: (columnId, collapsed) =>
        store.setAllStoryGroupsCollapsed(columnId, collapsed),
      onTaskAction: (action, taskId) => this.emitTaskAction(action, taskId),
      onHabitToggle: (habitId, completed) =>
        store.toggleHabitCompleted(habitId, completed),
      onHabitTitlePatch: (habitId, title) =>
        store.patchHabitTitle(habitId, title),
      onHabitUpdate: () => refreshKanbanData(store),
    });
    this.view = view;

    this.subscriptions.add(
      store.state$.subscribe((state) => view.render(state))
    );
    store.start();
    this.bindGlobalRefreshTriggers(store);
  }

  public unmount(): void {
    this.unbindGlobalRefreshTriggers();
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.store?.destroy();
    this.store = null;
    this.view?.destroy();
    this.view = null;
    this.root?.remove();
    this.root = null;
  }

  private emitTaskAction(action: KanbanTaskAction, taskId: number): void {
    emitKanbanTaskActionRequested(action, taskId);
  }

  private bindGlobalRefreshTriggers(store: KanbanStore): void {
    this.refreshRequestHandler = () => {
      store.requestRefresh('external');
    };
    this.entityCreatedHandler = () => {
      store.requestRefresh('external', true);
    };
    this.visibilityHandler = () => {
      if (document.visibilityState !== 'visible') return;
      store.requestRefresh('external', true);
    };

    window.addEventListener(
      KANBAN_REFRESH_REQUEST_EVENT,
      this.refreshRequestHandler
    );
    window.addEventListener(
      KANBAN_ENTITY_CREATED_EVENT,
      this.entityCreatedHandler
    );
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private unbindGlobalRefreshTriggers(): void {
    if (this.refreshRequestHandler) {
      window.removeEventListener(
        KANBAN_REFRESH_REQUEST_EVENT,
        this.refreshRequestHandler
      );
      this.refreshRequestHandler = null;
    }
    if (this.entityCreatedHandler) {
      window.removeEventListener(
        KANBAN_ENTITY_CREATED_EVENT,
        this.entityCreatedHandler
      );
      this.entityCreatedHandler = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }
}
