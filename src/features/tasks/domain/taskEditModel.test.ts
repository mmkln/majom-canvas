import { describe, expect, it } from 'vitest';
import { Priority, Status } from '../../../majom-wrapper/interfaces/index.ts';
import {
  createTaskEditPatch,
  setTaskEditGoal,
  setTaskEditStory,
  normalizeTaskEditPatch,
  type TaskEditModel,
  type TaskEditRelationOption,
} from './taskEditModel.ts';

describe('task edit model', () => {
  it('creates minimal patches and derives completion from completed status', () => {
    const original = createTask({ title: 'Original' });
    const next = createTask({
      title: '  Updated  ',
      status: Status.Completed,
    });

    expect(createTaskEditPatch(original, next)).toEqual({
      title: 'Updated',
      status: Status.Completed,
      isCompleted: true,
    });
  });

  it('keeps explicit completion values when normalizing patches', () => {
    expect(
      normalizeTaskEditPatch({
        status: Status.Completed,
        isCompleted: false,
      })
    ).toEqual({
      status: Status.Completed,
      isCompleted: false,
    });
  });

  it('includes goal and story relation changes in patches', () => {
    expect(
      createTaskEditPatch(
        createTask({ goalId: 1, storyId: 10 }),
        createTask({ goalId: 2, storyId: null })
      )
    ).toEqual({
      goalId: 2,
      storyId: null,
    });
  });

  it('clears a story when selecting a different goal', () => {
    const task = createTask({
      goalId: 1,
      goal: createRelation({ id: 1, title: 'Old goal' }),
      storyId: 10,
      story: createRelation({ id: 10, title: 'Story', goalId: 1 }),
    });

    expect(
      setTaskEditGoal(task, createRelation({ id: 2, title: 'New goal' }))
    ).toMatchObject({
      goalId: 2,
      storyId: null,
      story: null,
    });
  });

  it('selects a story and carries its goal relation into the task draft', () => {
    const goal = createRelation({ id: 7, title: 'Launch goal' });
    const story = createRelation({
      id: 17,
      title: 'Story',
      goalId: 7,
      goal,
    });

    expect(setTaskEditStory(createTask(), story)).toMatchObject({
      goalId: 7,
      goal,
      storyId: 17,
      story,
    });
  });
});

function createRelation(
  overrides: Partial<TaskEditRelationOption> = {}
): TaskEditRelationOption {
  return {
    id: overrides.id ?? 1,
    uuid: overrides.uuid,
    title: overrides.title ?? 'Relation',
    status: overrides.status,
    goalId: overrides.goalId,
    goal: overrides.goal,
  };
}

function createTask(overrides: Partial<TaskEditModel> = {}): TaskEditModel {
  return {
    id: overrides.id ?? 1,
    uuid: overrides.uuid ?? 'task-1',
    title: overrides.title ?? 'Task',
    description: overrides.description ?? '',
    status: overrides.status ?? Status.Active,
    priority: overrides.priority ?? Priority.Medium,
    dueDate: overrides.dueDate ?? null,
    isCompleted: overrides.isCompleted ?? false,
    goalId: overrides.goalId ?? null,
    goal: overrides.goal ?? null,
    storyId: overrides.storyId ?? null,
    story: overrides.story ?? null,
  };
}
