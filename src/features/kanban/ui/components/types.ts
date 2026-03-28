import type {
  KanbanColumnId,
  KanbanTaskAction,
  KanbanTaskPatch,
} from '../../types.ts';

export type KanbanViewHandlers = {
  onTaskPatch: (taskId: number, patch: KanbanTaskPatch) => void;
  onStoryGroupToggle: (columnId: KanbanColumnId, storyKey: string) => void;
  onStoryGroupsToggleAll: (
    columnId: KanbanColumnId,
    collapsed: boolean
  ) => void;
  onTaskAction: (action: KanbanTaskAction, taskId: number) => void;
  onHabitToggle: (habitUuid: string, completed: boolean) => Promise<boolean>;
  onHabitTitlePatch: (habitUuid: string, title: string) => Promise<boolean>;
  onHabitUpdate: () => void;
};
