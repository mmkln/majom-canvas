import type { KanbanTaskAction } from './types.ts';

export const KANBAN_REFRESH_REQUEST_EVENT = 'kanbanRefreshRequested';
export const KANBAN_ENTITY_CREATED_EVENT = 'kanbanEntityCreated';
export const KANBAN_TASK_ACTION_EVENT = 'kanbanTaskActionRequested';

export type KanbanTaskActionDetail = {
  action: KanbanTaskAction;
  taskId: number;
};

export function emitKanbanTaskActionRequested(
  action: KanbanTaskAction,
  taskId: number
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<KanbanTaskActionDetail>(KANBAN_TASK_ACTION_EVENT, {
      detail: { action, taskId },
    })
  );
}
