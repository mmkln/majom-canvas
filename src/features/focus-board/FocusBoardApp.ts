import { Subscription } from 'rxjs';
import { environment } from '../../config/environment.ts';
import { HttpInterceptorClient } from '../../majom-wrapper/data-access/http-interceptor.ts';
import { TasksApiService } from '../../majom-wrapper/data-access/tasks-api-service.ts';
import { HabitsApiService } from '../../majom-wrapper/data-access/habits-api-service.ts';
import { FocusBoardApiService } from '../../majom-wrapper/data-access/focus-board-api-service.ts';
import { BacklogApiService } from '../../majom-wrapper/data-access/backlog-api-service.ts';
import { GoalsApiService } from '../../majom-wrapper/data-access/goals-api-service.ts';
import { StoriesApiService } from '../../majom-wrapper/data-access/stories-api-service.ts';
import { FocusBoardStore } from './state/FocusBoardStore.ts';
import { FocusBoardView } from './ui/FocusBoardView.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import type { FocusBoardRepository } from './data/FocusBoardRepository.ts';
import { ApiFocusBoardRepository } from './data/ApiFocusBoardRepository.ts';

type FocusBoardAppOptions = {
  onOpenWallpaperPicker?: () => void;
};

export class FocusBoardApp {
  private root: HTMLDivElement | null = null;
  private store: FocusBoardStore | null = null;
  private view: FocusBoardView | null = null;
  private subscriptions = new Subscription();

  constructor(
    private readonly runtime: AppRuntime = createAppRuntime(),
    private readonly repository: FocusBoardRepository = new ApiFocusBoardRepository(
      (() => {
        const http = new HttpInterceptorClient(environment.apiUrl);
        return {
          focusBoardApi: new FocusBoardApiService(http),
          backlogApi: new BacklogApiService(http),
          tasksApi: new TasksApiService(http),
          goalsApi: new GoalsApiService(http),
          storiesApi: new StoriesApiService(http),
          habitsApi: new HabitsApiService(http),
        };
      })()
    ),
    private readonly options: FocusBoardAppOptions = {}
  ) {}

  public mount(parent: HTMLElement): void {
    if (this.root) return;

    const root = document.createElement('div');
    root.style.width = '100%';
    root.style.height = '100%';
    parent.appendChild(root);
    this.root = root;

    const store = new FocusBoardStore(undefined, this.repository);
    this.store = store;

    const view = new FocusBoardView(
      root,
      {
        onToggleBacklog: () => store.toggleBacklog(),
        onCloseBacklog: () => store.closeBacklog(),
        onOpenGoalModal: () => store.openGoalModal(),
        onCloseGoalModal: () => store.closeGoalModal(),
        onSetGoalModalDraft: (goal, cycleLength) =>
          store.setGoalModalDraft(goal, cycleLength),
        onSaveGoalAndCycle: (goal) => store.saveGoalAndCycle(goal),
        onOpenHabitDay: (dayIndex) => store.openHabitDay(dayIndex),
        onCloseHabitDay: () => store.closeHabitDay(),
        onUpdateDailyGoal: (dayIndex, goal) =>
          store.updateDailyGoal(dayIndex, goal),
        onToggleTask: (containerId, taskId) =>
          store.toggleTask(containerId, taskId),
        onMoveTask: (sourceId, targetId, taskId) =>
          store.moveTask(sourceId, targetId, taskId),
        onToggleHabit: (dayIndex, habitId) =>
          store.toggleHabit(dayIndex, habitId),
        onSetBacklogSearchQuery: (query) => store.setBacklogSearchQuery(query),
        onOpenTaskPicker: () => store.openTaskPicker(),
        onCloseTaskPicker: () => store.closeTaskPicker(),
        onSetTaskPickerQuery: (query) => store.setTaskPickerQuery(query),
        onSetTaskPickerStatus: (status) => store.setTaskPickerStatus(status),
        onSetTaskPickerGoal: (goal) => store.setTaskPickerGoal(goal),
        onSetTaskPickerStory: (story) => store.setTaskPickerStory(story),
        onLoadMoreTaskPicker: () => store.loadMoreTaskPicker(),
        onAddTaskToBacklog: (taskId) => store.addTaskToBacklog(taskId),
        searchTaskPickerGoals: (params) => this.repository.searchGoals(params),
        searchTaskPickerStories: (params) =>
          this.repository.searchStories(params),
        onOpenTaskComposer: (target) => store.openTaskComposer(target),
        onCloseTaskComposer: () => store.closeTaskComposer(),
        onSetTaskComposerTitle: (title) => store.setTaskComposerTitle(title),
        onSubmitTaskComposer: () => store.submitTaskComposer(),
        onOpenWallpaperPicker: this.options.onOpenWallpaperPicker ?? (() => {}),
        onUpdateCycleGoal: (goal) => store.updateCycleGoal(goal),
      },
      this.runtime
    );
    this.view = view;

    this.subscriptions.add(
      store.state$.subscribe((state) => view.render(state))
    );
    this.subscriptions.add(
      this.runtime.subscribe(() => {
        view.render(store.getSnapshot());
      })
    );
  }

  public unmount(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.store?.destroy();
    this.store = null;
    this.view?.destroy();
    this.view = null;
    this.root?.remove();
    this.root = null;
  }
}
