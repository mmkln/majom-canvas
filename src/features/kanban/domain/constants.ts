import type { KanbanColumnId } from '../types.ts';

export const KANBAN_COLUMN_ORDER: KanbanColumnId[] = [
  'today',
  'tomorrow',
  'soon',
  'overdue',
  'planned',
  'todo',
  'done',
  'cancelled',
];

export const KANBAN_COLUMN_TITLES: Record<KanbanColumnId, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  soon: 'Soon',
  overdue: 'Overdue',
  planned: 'Planned',
  todo: 'Todo',
  done: 'Done',
  cancelled: 'Cancelled',
};

export const KANBAN_SOON_DAY_LIMIT = 5;
