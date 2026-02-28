import { Priority, Status } from '../../../../majom-wrapper/interfaces/index.ts';
import type { KanbanTaskCard } from '../../types.ts';
import type { KanbanViewHandlers } from './types.ts';

const STATUS_OPTIONS: Status[] = [
  Status.Active,
  Status.Described,
  Status.Draft,
  Status.Completed,
  Status.Archived,
  Status.Cancelled,
];

const PRIORITY_OPTIONS: Priority[] = [
  Priority.Lowest,
  Priority.Low,
  Priority.Medium,
  Priority.High,
  Priority.Highest,
];

function formatStatus(value: Status): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatPriority(value: Priority): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateSelectorParts(
  date: Date | null
): { day: string; month: string } {
  if (!date) return { day: 'No', month: 'date' };
  const day = String(date.getDate());
  const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date);
  return { day, month };
}

function createTaskActionButton(
  label: string,
  action: 'open' | 'clone' | 'add-subtask',
  taskId: number,
  handlers: KanbanViewHandlers,
  className: string
): HTMLElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.textContent = label;
  btn.addEventListener('click', () => {
    handlers.onTaskAction(action, taskId);
  });
  return btn;
}

type RenderTaskCardOptions = {
  isInGroup?: boolean;
};

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isOverdue(taskCard: KanbanTaskCard): { today: boolean; past: boolean } {
  if (!taskCard.dueDate) return { today: false, past: false };
  if (
    taskCard.status === Status.Completed ||
    taskCard.status === Status.Cancelled
  ) {
    return { today: false, past: false };
  }

  const nowDay = startOfLocalDay(new Date()).getTime();
  const dueDay = startOfLocalDay(taskCard.dueDate).getTime();
  if (dueDay < nowDay) return { today: false, past: true };
  if (dueDay === nowDay) return { today: true, past: false };
  return { today: false, past: false };
}

function resolveStatusClass(taskCard: KanbanTaskCard): string {
  const overdue = isOverdue(taskCard);
  if (taskCard.status === Status.Completed) return 'kb-card-status-completed';
  if (taskCard.status === Status.Cancelled) return 'kb-card-status-cancelled';
  if (overdue.past) return 'kb-card-status-overdue-past';
  if (overdue.today) return 'kb-card-status-overdue-today';
  if (taskCard.status === Status.Active || taskCard.status === Status.Archived) {
    return 'kb-card-status-active';
  }
  return 'kb-card-status-default';
}

function buildSubtaskProgress(taskCard: KanbanTaskCard): {
  total: number;
  completed: number;
  percent: number;
} | null {
  const subtasks = taskCard.source.subtasks ?? [];
  if (!subtasks.length) return null;
  const completed = subtasks.filter((item) => item.is_completed).length;
  const total = subtasks.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percent };
}

export function renderKanbanTaskCard(
  taskCard: KanbanTaskCard,
  handlers: KanbanViewHandlers,
  options: RenderTaskCardOptions = {}
): HTMLElement {
  const card = document.createElement('article');
  card.className = `kb-card group px-3 py-3.5 rounded-md shadow-sm ${resolveStatusClass(taskCard)}`;
  if (options.isInGroup) card.classList.add('kb-card-in-group');

  const metaRow = document.createElement('div');
  metaRow.className = 'kb-task-meta-row flex items-center justify-between pb-2';
  const leftMeta = document.createElement('div');
  leftMeta.className = 'kb-task-meta-list';
  const metaParts: string[] = [];
  if (taskCard.storyTitle) metaParts.push(taskCard.storyTitle);
  if (taskCard.isChallenge) metaParts.push('Challenge');
  if (metaParts.length > 0) {
    leftMeta.textContent = metaParts.join(' | ');
    metaRow.appendChild(leftMeta);
  }

  const titleRow = document.createElement('div');
  titleRow.className = 'kb-task-title-row flex items-center justify-between pb-2';
  const titleInput = document.createElement('input');
  titleInput.className = 'kb-title-input text-sm font-medium';
  titleInput.value = taskCard.title;
  titleInput.placeholder = 'Task title';
  titleInput.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    titleInput.blur();
  });
  titleInput.addEventListener('blur', () => {
    const next = titleInput.value.trim();
    if (!next || next === taskCard.title) return;
    handlers.onTaskPatch(taskCard.taskId, { title: next });
  });
  titleRow.appendChild(titleInput);

  const statusTopRow = document.createElement('div');
  statusTopRow.className = 'kb-task-status-top-row';

  const controlsRow = document.createElement('div');
  controlsRow.className = 'kb-task-controls-row flex justify-between items-center h-5';
  const leftControls = document.createElement('div');
  leftControls.className = 'kb-row';
  const statusSelect = document.createElement('select');
  statusSelect.className = 'kb-select';
  STATUS_OPTIONS.forEach((statusValue) => {
    const option = document.createElement('option');
    option.value = statusValue;
    option.textContent = formatStatus(statusValue);
    option.selected = taskCard.status === statusValue;
    statusSelect.appendChild(option);
  });
  statusSelect.addEventListener('change', () => {
    const nextStatus = statusSelect.value as Status;
    if (nextStatus === taskCard.status) return;
    handlers.onTaskPatch(taskCard.taskId, { status: nextStatus });
  });
  statusTopRow.appendChild(statusSelect);

  const prioritySelect = document.createElement('select');
  prioritySelect.className = 'kb-select';
  PRIORITY_OPTIONS.forEach((priorityValue) => {
    const option = document.createElement('option');
    option.value = priorityValue;
    option.textContent = formatPriority(priorityValue);
    option.selected = taskCard.priority === priorityValue;
    prioritySelect.appendChild(option);
  });
  prioritySelect.addEventListener('change', () => {
    const nextPriority = prioritySelect.value as Priority;
    if (nextPriority === taskCard.priority) return;
    handlers.onTaskPatch(taskCard.taskId, { priority: nextPriority });
  });
  leftControls.append(prioritySelect);

  const rightControls = document.createElement('div');
  rightControls.className = 'kb-row';

  const dueDateLabel = document.createElement('button');
  dueDateLabel.type = 'button';
  dueDateLabel.className = 'kb-date-label';
  const dateParts = formatDateSelectorParts(taskCard.dueDate);
  const dueDateDay = document.createElement('span');
  dueDateDay.className = 'kb-date-day';
  dueDateDay.textContent = dateParts.day;
  const dueDateMonth = document.createElement('span');
  dueDateMonth.className = 'kb-date-month';
  dueDateMonth.textContent = ` ${dateParts.month}`;
  dueDateLabel.append(dueDateDay, dueDateMonth);

  const dueDateSelector = document.createElement('div');
  dueDateSelector.className = 'kb-date-selector';

  const dueDateInput = document.createElement('input');
  dueDateInput.type = 'date';
  dueDateInput.className = 'kb-date-input';
  dueDateInput.value = taskCard.dueDateInput;

  dueDateInput.addEventListener('change', () => {
    const nextValue = dueDateInput.value.trim();
    const normalized = nextValue.length > 0 ? nextValue : null;
    if (
      normalized === taskCard.dueDateInput ||
      (!normalized && !taskCard.dueDateInput)
    ) {
      return;
    }
    handlers.onTaskPatch(taskCard.taskId, { dueDate: normalized });
  });
  dueDateSelector.append(dueDateLabel, dueDateInput);
  rightControls.appendChild(dueDateSelector);

  const actions = document.createElement('div');
  actions.className = 'kb-card-actions';
  const openBtn = createTaskActionButton(
    'Open',
    'open',
    taskCard.taskId,
    handlers,
    'kb-link kb-link-open'
  );
  const secondaryActions = document.createElement('div');
  secondaryActions.className = 'kb-card-secondary-actions hidden group-hover:flex';
  secondaryActions.append(
    createTaskActionButton(
      'Clone',
      'clone',
      taskCard.taskId,
      handlers,
      'kb-link kb-link-muted'
    ),
    createTaskActionButton(
      '+Subtask',
      'add-subtask',
      taskCard.taskId,
      handlers,
      'kb-link kb-link-muted'
    )
  );
  actions.append(openBtn, secondaryActions);
  rightControls.appendChild(actions);
  controlsRow.append(leftControls, rightControls);

  const progress = buildSubtaskProgress(taskCard);
  const subtaskProgress = document.createElement('div');
  subtaskProgress.className = 'kb-task-subtasks mt-2';
  if (progress) {
    const label = document.createElement('div');
    label.className = 'kb-task-subtasks-label';
    label.textContent = `${progress.completed}/${progress.total} subtasks`;
    const bar = document.createElement('div');
    bar.className = 'kb-task-subtasks-bar';
    const fill = document.createElement('div');
    fill.className = 'kb-task-subtasks-fill';
    fill.style.width = `${progress.percent}%`;
    bar.appendChild(fill);
    subtaskProgress.append(label, bar);
  }

  if (metaParts.length > 0) {
    card.appendChild(metaRow);
  }
  card.append(statusTopRow, titleRow, controlsRow);
  if (progress) {
    card.appendChild(subtaskProgress);
  }
  return card;
}
