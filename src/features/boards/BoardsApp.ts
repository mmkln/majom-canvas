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

function mapEntitySearchItem(entity: EntitySearchDto): BoardEntityLinkSearchItem {
  return {
    id: entity.uuid ?? String(entity.id),
    title: entity.title,
    status: entity.status ?? null,
  };
}

function getCardEntityDescription(description: string | null | undefined): string {
  return description?.trim() ?? '';
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
    const store = new BoardsStore(new BoardsApiService(http));
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
            goalsApi.searchGoalsForPicker({ search: query, page: 1, pageSize: 20 })
          );
          return response.results.map(mapEntitySearchItem);
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
        onLoadCardChecklists: (cardId) => store.loadCardChecklists(cardId),
        onCreateCardChecklist: (cardId, title) =>
          store.createCardChecklist(cardId, title),
        onDeleteCardChecklist: (checklistId) =>
          store.deleteCardChecklist(checklistId),
        onCreateCardCheckItem: (checklistId, title) =>
          store.createCardCheckItem(checklistId, title),
        onPatchCardCheckItem: (itemId, patch) =>
          store.patchCardCheckItem(itemId, patch),
        onDeleteCardCheckItem: (itemId) =>
          store.deleteCardCheckItem(itemId),
        onCreateCardEntityLink: (cardId, entityType, entityId) =>
          store.createCardEntityLink(cardId, entityType, entityId),
        onCreateCardEntityFromCard: async (card, entityType) => {
          if (entityType === 'task') {
            const task = await firstValueFrom(
              tasksApi.createTask({
                title: card.title.trim(),
                description: getCardEntityDescription(card.description),
                is_standalone: true,
              })
            );
            return store.createCardEntityLink(
              card.id,
              entityType,
              task.uuid ?? String(task.id)
            );
          }
          if (entityType === 'story') {
            const story = await firstValueFrom(
              storiesApi.createStory({
                title: card.title.trim(),
                description: getCardEntityDescription(card.description),
              })
            );
            return store.createCardEntityLink(
              card.id,
              entityType,
              story.uuid ?? String(story.id)
            );
          }
          const goal = await firstValueFrom(
            goalsApi.createGoal({
              title: card.title.trim(),
              description: getCardEntityDescription(card.description),
            })
          );
          return store.createCardEntityLink(
            card.id,
            entityType,
            goal.uuid ?? String(goal.id)
          );
        },
        onDeleteCardEntityLink: (linkId) =>
          store.deleteCardEntityLink(linkId),
        onDeleteLinkedEntity: async (_card, link) => {
          if (link.entity_type === 'task') {
            await firstValueFrom(tasksApi.deleteTask(link.entity_id));
          } else if (link.entity_type === 'story') {
            await firstValueFrom(storiesApi.deleteStory(link.entity_id));
          } else {
            await firstValueFrom(goalsApi.deleteGoal(link.entity_id));
          }
          await store.load();
        },
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
