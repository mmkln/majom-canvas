import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { Scene } from '../../core/scene/Scene.ts';
import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../../ui-lib/src/components/Modal.ts';
import { createTextButton } from '../primitives/index.ts';
import {
  ElementDetailsService,
  type StoryListItemVM,
  type TaskListItemVM,
} from '../../core/services/ElementDetailsService.ts';
import { environment } from '../../../../config/environment.ts';
import { HttpInterceptorClient } from '../../../../majom-wrapper/data-access/http-interceptor.ts';
import { GoalsApiService } from '../../../../majom-wrapper/data-access/goals-api-service.ts';
import { StoriesApiService } from '../../../../majom-wrapper/data-access/stories-api-service.ts';
import { Subscription } from 'rxjs';

type CanvasElement = TaskElement | StoryElement | GoalElement;

export class ElementDetailsModal {
  private modal: HTMLDivElement | null = null;
  private readonly detailsService: ElementDetailsService;
  private subscriptions: Subscription[] = [];

  constructor(
    private readonly element: CanvasElement,
    private readonly scene: Scene
  ) {
    const http = new HttpInterceptorClient(environment.apiUrl);
    this.detailsService = new ElementDetailsService(
      scene,
      new GoalsApiService(http),
      new StoriesApiService(http)
    );
  }

  public show(): void {
    const { overlay, container, body, footer } = createModalShell(
      `${this.getTypeLabel()} details`,
      {
        onClose: () => this.close(),
        intent: 'info',
      }
    );
    this.modal = overlay;
    container.classList.add('max-w-6xl');

    const root = document.createElement('div');
    root.className = 'grid grid-cols-1 gap-3 md:grid-cols-3';
    body.appendChild(root);

    const summaryCol = this.createColumn('Element');
    summaryCol.content.appendChild(this.renderSummary());
    root.appendChild(summaryCol.element);

    const storiesCol = this.createColumn('Stories');
    const tasksCol = this.createColumn('Tasks');
    root.append(storiesCol.element, tasksCol.element);

    const actions = createModalActionRow({ variant: 'form' });
    const closeBtn = createTextButton({
      text: 'Close',
      tone: 'primary',
      size: 'md',
      className: getModalActionButtonClass('default'),
      onClick: () => this.close(),
    });
    actions.appendChild(closeBtn);
    footer.appendChild(actions);

    const renderTasks = (stories: StoryListItemVM[]): void => {
      if (stories.length === 0) {
        this.renderMessage(tasksCol.content, 'No tasks to display');
        return;
      }
      const first = stories[0];
      this.renderMessage(tasksCol.content, 'Loading tasks...');
      const sub = this.detailsService
        .loadTasksForStory({ id: first.id, uuid: first.uuid ?? null })
        .subscribe((tasks) => this.renderTaskList(tasksCol.content, tasks));
      this.subscriptions.push(sub);
    };

    if (this.element instanceof StoryElement) {
      this.renderMessage(storiesCol.content, 'Current story');
      const refId = Number.isFinite(this.element.backendId)
        ? (this.element.backendId as number)
        : null;
      if (refId === null) {
        this.renderMessage(tasksCol.content, 'Story is not linked to backend yet');
      } else {
        const sub = this.detailsService
          .loadTasksForStory({ id: refId, uuid: this.element.uuid ?? null })
          .subscribe((tasks) => this.renderTaskList(tasksCol.content, tasks));
        this.subscriptions.push(sub);
      }
      return;
    }

    this.renderMessage(storiesCol.content, 'Loading stories...');
    this.renderMessage(tasksCol.content, 'Select a story');
    const storiesSub = this.detailsService
      .loadStoriesForElement(this.element)
      .subscribe((stories) => {
        this.renderStoriesList(storiesCol.content, stories, (story) => {
          this.renderMessage(tasksCol.content, 'Loading tasks...');
          const sub = this.detailsService
            .loadTasksForStory({ id: story.id, uuid: story.uuid ?? null })
            .subscribe((tasks) => this.renderTaskList(tasksCol.content, tasks));
          this.subscriptions.push(sub);
        });
        renderTasks(stories);
      });
    this.subscriptions.push(storiesSub);
  }

  private renderSummary(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'space-y-2 text-sm';
    const rows: Array<[string, string]> = [
      ['Type', this.getTypeLabel()],
      ['Title', this.element.title],
      ['Status', this.element.status],
      ['Description', this.element.description || '—'],
    ];
    rows.forEach(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'rounded-md bg-slate-50 p-2';
      row.innerHTML = `<div class="text-xs uppercase text-slate-500">${label}</div><div class="text-slate-900">${value}</div>`;
      wrap.appendChild(row);
    });
    return wrap;
  }

  private renderStoriesList(
    container: HTMLElement,
    stories: StoryListItemVM[],
    onSelect: (story: StoryListItemVM) => void
  ): void {
    container.innerHTML = '';
    if (stories.length === 0) {
      this.renderMessage(container, 'No related stories');
      return;
    }
    const list = document.createElement('div');
    list.className = 'space-y-1';
    stories.forEach((story, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'w-full rounded-md border border-slate-200 px-2 py-2 text-left text-sm hover:bg-slate-50';
      btn.innerHTML = `<div class="font-medium text-slate-900">${story.title}</div><div class="text-xs text-slate-500">Tasks: ${story.tasksCount} · ${story.isOnCanvas ? 'On canvas' : 'Not on canvas'}</div>`;
      btn.addEventListener('click', () => onSelect(story));
      if (index === 0) {
        btn.classList.add('bg-indigo-50', 'border-indigo-200');
      }
      list.appendChild(btn);
    });
    container.appendChild(list);
  }

  private renderTaskList(container: HTMLElement, tasks: TaskListItemVM[]): void {
    container.innerHTML = '';
    if (tasks.length === 0) {
      this.renderMessage(container, 'No tasks in this story');
      return;
    }
    const list = document.createElement('div');
    list.className = 'space-y-1';
    tasks.forEach((task) => {
      const item = document.createElement('div');
      item.className = 'rounded-md border border-slate-200 px-2 py-2 text-sm';
      item.innerHTML = `<div class="font-medium text-slate-900">${task.title}</div><div class="text-xs text-slate-500">${task.isOnCanvas ? 'On canvas' : 'Not on canvas'}</div>`;
      list.appendChild(item);
    });
    container.appendChild(list);
  }

  private renderMessage(container: HTMLElement, text: string): void {
    container.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500';
    empty.textContent = text;
    container.appendChild(empty);
  }

  private createColumn(title: string): { element: HTMLDivElement; content: HTMLDivElement } {
    const element = document.createElement('div');
    element.className = 'rounded-xl border border-slate-200 p-3';
    const heading = document.createElement('h3');
    heading.className = 'mb-2 text-sm font-semibold text-slate-900';
    heading.textContent = title;
    const content = document.createElement('div');
    content.className = 'min-h-[220px]';
    element.append(heading, content);
    return { element, content };
  }

  private getTypeLabel(): string {
    if (this.element instanceof TaskElement) return 'Task';
    if (this.element instanceof StoryElement) return 'Story';
    return 'Goal';
  }

  private close(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
}
