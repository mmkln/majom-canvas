import { firstValueFrom, Subscription } from 'rxjs';
import { environment } from '../../config/environment.ts';
import { HttpInterceptorClient } from '../../majom-wrapper/data-access/http-interceptor.ts';
import { BoardsApiService } from '../../majom-wrapper/data-access/boards-api-service.ts';
import { TasksApiService } from '../../majom-wrapper/data-access/tasks-api-service.ts';
import { StoriesApiService } from '../../majom-wrapper/data-access/stories-api-service.ts';
import { GoalsApiService } from '../../majom-wrapper/data-access/goals-api-service.ts';
import { getDefaultTagColor } from '../../majom-wrapper/utils/tagColor.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import { BoardsStore } from './state/BoardsStore.ts';
import { BoardsCommandService } from './state/BoardsCommandService.ts';
import { BoardsEntityLinkUseCases } from './state/BoardsEntityLinkUseCases.ts';
import { BoardsView } from './ui/BoardsView.ts';
import type { BoardEntityLinkSearchItem } from './domain/types.ts';

type BoardsAppOptions = {
  runtime?: AppRuntime;
};

type EntitySearchDto = {
  id: number | string;
  uuid?: string;
  title: string;
  status?: string | null;
};

function mapEntitySearchItem(
  entity: EntitySearchDto
): BoardEntityLinkSearchItem {
  return {
    id: entity.uuid ?? String(entity.id),
    title: entity.title,
    status: entity.status ?? null,
  };
}

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
    const tasksApi = new TasksApiService(http);
    const storiesApi = new StoriesApiService(http);
    const goalsApi = new GoalsApiService(http);
    const boardsApi = new BoardsApiService(http);
    const store = new BoardsStore(boardsApi);
    const commands = new BoardsCommandService(boardsApi, store);
    const entityLinkUseCases = new BoardsEntityLinkUseCases({
      createTask: (payload) => firstValueFrom(tasksApi.createTask(payload)),
      createStory: (payload) => firstValueFrom(storiesApi.createStory(payload)),
      createGoal: (payload) => firstValueFrom(goalsApi.createGoal(payload)),
      deleteTask: async (id) => {
        await firstValueFrom(tasksApi.deleteTask(id));
      },
      deleteStory: async (id) => {
        await firstValueFrom(storiesApi.deleteStory(id));
      },
      deleteGoal: async (id) => {
        await firstValueFrom(goalsApi.deleteGoal(id));
      },
      createCardEntityLink: (cardId, entityType, entityId) =>
        store.createCardEntityLink(cardId, entityType, entityId),
      reloadBoards: () => store.load(),
    });
    const view = new BoardsView(root, {
      runtime: this.runtime,
      tagCatalog: {
        loadTags: () => firstValueFrom(tasksApi.getTags()),
        createTag: (title, color) =>
          firstValueFrom(
            tasksApi.createTag({
              title,
              color: color ?? getDefaultTagColor(title),
            })
          ),
        updateTag: (id, patch) => firstValueFrom(tasksApi.updateTag(id, patch)),
        deleteTag: async (id) => {
          await firstValueFrom(tasksApi.deleteTag(id));
        },
      },
      entityCatalog: {
        searchTasks: async (query) => {
          const response = await firstValueFrom(
            tasksApi.fetchTasks({ search: query, page: 1, pageSize: 20 })
          );
          return response.results.map(mapEntitySearchItem);
        },
        searchStories: async (query) => {
          const response = await firstValueFrom(
            storiesApi.fetchStories({ search: query, page: 1, pageSize: 20 })
          );
          return response.results.map(mapEntitySearchItem);
        },
        searchGoals: async (query) => {
          const response = await firstValueFrom(
            goalsApi.searchGoalsForPicker({
              search: query,
              page: 1,
              pageSize: 20,
            })
          );
          return response.results.map(mapEntitySearchItem);
        },
      },
      handlers: {
        onRefresh: () => void store.load(),
        onSelectBoard: (boardId) => store.selectBoard(boardId),
        onCreateBoard: (title) => commands.createBoard(title),
        onPatchBoard: (boardId, patch) => commands.patchBoard(boardId, patch),
        onToggleBoardStar: (boardId) => store.toggleBoardStar(boardId),
        onUpdateBoardGroup: (boardId, group) =>
          store.updateBoardGroup(boardId, group),
        onDeleteBoard: (boardId) => commands.deleteBoard(boardId),
        onCreateColumn: (boardId, title) =>
          commands.createColumn(boardId, title),
        onPatchColumn: (columnId, patch) =>
          commands.patchColumn(columnId, patch),
        onDeleteColumn: (columnId) => commands.deleteColumn(columnId),
        onCreateCard: (columnId, title, description) =>
          commands.createCard(columnId, title, description),
        onPatchCard: (cardId, patch) => commands.patchCard(cardId, patch),
        onLoadCardChecklists: (cardId) => store.loadCardChecklists(cardId),
        onCreateCardChecklist: (cardId, title) =>
          store.createCardChecklist(cardId, title),
        onDeleteCardChecklist: (checklistId) =>
          store.deleteCardChecklist(checklistId),
        onCreateCardCheckItem: (checklistId, title) =>
          store.createCardCheckItem(checklistId, title),
        onPatchCardCheckItem: (itemId, patch) =>
          store.patchCardCheckItem(itemId, patch),
        onDeleteCardCheckItem: (itemId) => store.deleteCardCheckItem(itemId),
        onCreateCardEntityLink: (cardId, entityType, entityId) =>
          store.createCardEntityLink(cardId, entityType, entityId),
        onCreateCardEntityFromCard: (card, entityType) =>
          entityLinkUseCases.createEntityFromCard(card, entityType),
        onDeleteCardEntityLink: (linkId) => store.deleteCardEntityLink(linkId),
        onDeleteLinkedEntity: (_card, link) =>
          entityLinkUseCases.deleteLinkedEntity(link),
        onCreateCardMirror: (cardId, columnId, target) =>
          commands.createCardMirror(cardId, columnId, target),
        onPatchCardPlacement: (placementId, patch) =>
          commands.patchCardPlacement(placementId, patch),
        onDeleteCardPlacement: (placementId) =>
          commands.deleteCardPlacement(placementId),
        onDeleteCard: (cardId) => commands.deleteCard(cardId),
        onPreviewImport: (request) => store.previewImport(request),
        onExportData: (request) => store.exportData(request),
        onApplyImport: (request) => store.applyImport(request),
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
