import type { PlatformTask } from '../../../majom-wrapper/interfaces/index.ts';
import type { TaskEditPatch } from '../domain/index.ts';

export type TaskEditApiPatch = Partial<
  Pick<
    PlatformTask,
    | 'title'
    | 'description'
    | 'status'
    | 'priority'
    | 'due_date'
    | 'is_completed'
    | 'goal_id'
    | 'story_id'
  >
>;

export function taskEditPatchToPlatformTaskPatch(
  patch: TaskEditPatch
): TaskEditApiPatch {
  const payload: TaskEditApiPatch = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.priority !== undefined) payload.priority = patch.priority;
  if (patch.dueDate !== undefined) payload.due_date = patch.dueDate;
  if (patch.isCompleted !== undefined) {
    payload.is_completed = patch.isCompleted;
  }
  if (patch.goalId !== undefined) payload.goal_id = patch.goalId;
  if (patch.storyId !== undefined) payload.story_id = patch.storyId;
  return payload;
}
