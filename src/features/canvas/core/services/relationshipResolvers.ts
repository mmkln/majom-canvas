import type {
  Goal,
  PlatformTask,
  Story,
} from '../../../../majom-wrapper/interfaces/index.ts';

export type BackendRef = {
  id: number | null;
  uuid: string | null;
};

export const normalizeBackendRef = (input: Partial<BackendRef>): BackendRef => ({
  id: Number.isFinite(input.id) ? (input.id as number) : null,
  uuid:
    typeof input.uuid === 'string' && input.uuid.trim().length > 0
      ? input.uuid
      : null,
});

export const collectStoriesFromGoalTasks = (goal: Goal): Story[] => {
  const stories: Story[] = [];
  const seenIds = new Set<number>();
  const tasks = Array.isArray(goal.tasks) ? goal.tasks : [];
  tasks.forEach((task) => {
    const story = (task as PlatformTask).story;
    if (!story || !Number.isFinite(story.id)) return;
    if (seenIds.has(story.id)) return;
    seenIds.add(story.id);
    stories.push(story);
  });
  return stories;
};

export const mergeStoriesDedup = (
  primary: Story[],
  secondary: Story[]
): Story[] => {
  const merged = new Map<number, Story>();
  primary.forEach((story) => merged.set(story.id, story));
  secondary.forEach((story) => merged.set(story.id, story));
  return Array.from(merged.values());
};

export const matchesRef = (
  item: { id?: number; uuid?: string },
  ref: BackendRef
): boolean => {
  if (ref.uuid && item.uuid === ref.uuid) return true;
  if (ref.id !== null && Number.isFinite(item.id) && item.id === ref.id) {
    return true;
  }
  return false;
};
