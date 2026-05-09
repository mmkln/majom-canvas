import { firstValueFrom, Subscription } from 'rxjs';
import { environment } from '../../config/environment.ts';
import { HttpInterceptorClient } from '../../majom-wrapper/data-access/http-interceptor.ts';
import { BoardsApiService } from '../../majom-wrapper/data-access/boards-api-service.ts';
import { TasksApiService } from '../../majom-wrapper/data-access/tasks-api-service.ts';
import { getDefaultTagColor } from '../../majom-wrapper/utils/tagColor.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import { BoardsStore } from './state/BoardsStore.ts';
import { BoardsView } from './ui/BoardsView.ts';

type BoardsAppOptions = {
  runtime?: AppRuntime;
};

export class BoardsApp {
  private root: HTMLDivElement | null = null;
  private store: BoardsStore | null = null;
  private view: BoardsView | null = null;
  private subscriptions = new Subscription();
  private readonly runtime: AppRuntime;

  constructor(options: BoardsAppOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
  }

  public mount(parent: HTMLElement): void {
    if (this.root) return;

    const root = document.createElement('div');
    root.dataset.module = 'boards';
    root.className = 'h-full w-full';
    parent.appendChild(root);
    this.root = root;

    const http = new HttpInterceptorClient(environment.apiUrl);
    const tagsApi = new TasksApiService(http);
    const store = new BoardsStore(new BoardsApiService(http));
    const view = new BoardsView(root, {
      runtime: this.runtime,
      tagCatalog: {
        loadTags: () => firstValueFrom(tagsApi.getTags()),
        createTag: (title, color) =>
          firstValueFrom(
            tagsApi.createTag({
              title,
              color: color ?? getDefaultTagColor(title),
            })
          ),
        updateTag: (id, patch) => firstValueFrom(tagsApi.updateTag(id, patch)),
        deleteTag: async (id) => {
          await firstValueFrom(tagsApi.deleteTag(id));
        },
      },
      handlers: {
        onRefresh: () => void store.load(),
        onSelectBoard: (boardId) => store.selectBoard(boardId),
        onCreateBoard: (title) => void store.createBoard(title),
        onPatchBoard: (boardId, patch) => void store.patchBoard(boardId, patch),
        onToggleBoardStar: (boardId) => store.toggleBoardStar(boardId),
        onUpdateBoardGroup: (boardId, group) =>
          store.updateBoardGroup(boardId, group),
        onDeleteBoard: (boardId) => void store.deleteBoard(boardId),
        onCreateColumn: (boardId, title) =>
          void store.createColumn(boardId, title),
        onPatchColumn: (columnId, patch) =>
          void store.patchColumn(columnId, patch),
        onDeleteColumn: (columnId) => void store.deleteColumn(columnId),
        onCreateCard: (columnId, title, description) =>
          void store.createCard(columnId, title, description),
        onPatchCard: (cardId, patch) => void store.patchCard(cardId, patch),
        onCreateCardMirror: (cardId, columnId, target) =>
          void store.createCardMirror(cardId, columnId, target),
        onPatchCardPlacement: (placementId, patch) =>
          void store.patchCardPlacement(placementId, patch),
        onDeleteCardPlacement: (placementId) =>
          void store.deleteCardPlacement(placementId),
        onDeleteCard: (cardId) => void store.deleteCard(cardId),
      },
    });
    this.store = store;
    this.view = view;
    this.subscriptions.add(
      store.state$.subscribe((state) => view.render(state))
    );
    void store.load();
  }

  public unmount(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.view?.destroy();
    this.view = null;
    this.store?.destroy();
    this.store = null;
    this.root?.remove();
    this.root = null;
  }
}
