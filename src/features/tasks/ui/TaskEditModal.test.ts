// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { Priority, Status } from '../../../majom-wrapper/interfaces/index.ts';
import type { TaskEditModel } from '../domain/index.ts';
import { TaskEditModal } from './TaskEditModal.ts';

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('TaskEditModal', () => {
  it('loads full task details and saves a patch through the injected port', async () => {
    const saveTaskPatch = vi.fn(async () => undefined);
    const modal = new TaskEditModal({
      task: createTask({ title: 'Summary title' }),
      port: {
        loadTask: async () =>
          createTask({
            title: 'Loaded title',
            description: 'Loaded details',
          }),
        saveTaskPatch,
      },
    });

    modal.show();
    await flushPromises();

    expect(
      document.querySelector<HTMLTextAreaElement>(
        '.task-edit-modal-textarea'
      )?.value
    ).toBe('Loaded details');

    const title = document.querySelector<HTMLInputElement>(
      '.task-edit-modal-input'
    );
    title!.value = 'Next title';
    title!.dispatchEvent(new Event('input', { bubbles: true }));

    getButton('Save')?.click();
    await flushPromises();

    expect(saveTaskPatch).toHaveBeenCalledWith({ title: 'Next title' });
    expect(document.querySelector('.task-edit-modal-form')).toBeNull();
  });

  it('keeps the modal open and marks title invalid when title is blank', async () => {
    const saveTaskPatch = vi.fn();
    const modal = new TaskEditModal({
      task: createTask(),
      port: { saveTaskPatch },
    });

    modal.show();
    const title = document.querySelector<HTMLInputElement>(
      '.task-edit-modal-input'
    );
    title!.value = '   ';
    title!.dispatchEvent(new Event('input', { bubbles: true }));

    getButton('Save')?.click();
    await flushPromises();

    expect(saveTaskPatch).not.toHaveBeenCalled();
    expect(document.querySelector('[aria-invalid="true"]')).not.toBeNull();
  });

  it('searches and saves selected goal and story relations', async () => {
    vi.useFakeTimers();
    const goal = { id: 7, title: 'Launch goal' };
    const story = {
      id: 17,
      title: 'Pilot story',
      goalId: 7,
      goal,
    };
    const saveTaskPatch = vi.fn(async () => undefined);
    const searchGoals = vi.fn(async () => ({
      items: [goal],
      nextPage: null,
    }));
    const searchStories = vi.fn(async () => ({
      items: [story],
      nextPage: null,
    }));
    const modal = new TaskEditModal({
      task: createTask(),
      port: {
        saveTaskPatch,
        searchGoals,
        searchStories,
      },
    });

    modal.show();
    document.querySelector<HTMLButtonElement>('button[aria-label="Goal"]')?.click();
    await vi.advanceTimersByTimeAsync(181);
    document
      .querySelector<HTMLButtonElement>('[data-dropdown-select-item="7"]')
      ?.click();

    document
      .querySelector<HTMLButtonElement>('button[aria-label="Story"]')
      ?.click();
    await vi.advanceTimersByTimeAsync(181);
    document
      .querySelector<HTMLButtonElement>('[data-dropdown-select-item="17"]')
      ?.click();

    getButton('Save')?.click();
    await flushPromises();

    expect(searchStories).toHaveBeenCalledWith({
      query: '',
      page: 1,
      pageSize: 20,
      goalId: 7,
    });
    expect(saveTaskPatch).toHaveBeenCalledWith({
      goalId: 7,
      storyId: 17,
    });
  });
});

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function getButton(text: string): HTMLButtonElement | undefined {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (button) => button.textContent === text
  );
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
