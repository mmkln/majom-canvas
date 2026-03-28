// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { Scene } from '../../core/scene/Scene.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { HabitElement } from '../../elements/HabitElement.ts';
import { EditElementModal } from './EditElementModal.ts';
import { Status } from '../../../../majom-wrapper/interfaces/index.ts';
import { vi } from 'vitest';

describe('EditElementModal', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders status as a segmented control instead of a dropdown select', () => {
    const scene = new Scene();
    const task = new TaskElement({
      id: 'task-1',
      uuid: 'task-uuid-1',
      title: 'Task title',
    });
    const modal = new EditElementModal(task, scene);

    modal.show();

    const statusControl = Array.from(
      document.body.querySelectorAll<HTMLDivElement>(
        '[data-component="HudSegmentedControl"]'
      )
    ).find((element) => element.getAttribute('aria-label') === 'Status');

    expect(statusControl).not.toBeNull();
    expect(statusControl?.querySelectorAll('button')).toHaveLength(4);
    expect(statusControl?.textContent).toContain('Defined');
    expect(statusControl?.textContent).toContain('Pending');
    expect(statusControl?.textContent).toContain('In progress');
    expect(statusControl?.textContent).toContain('Done');
    expect(document.body.querySelector('select')).toBeNull();
  });

  it('renders routines with a 10-day completion grid and a routine-only status switch', () => {
    const scene = new Scene();
    const routine = new HabitElement({
      id: 'routine-1',
      uuid: 'routine-uuid-1',
      title: 'Morning review',
      habitStatus: Status.Active,
      completionHistory: [
        ['2026-03-20', true],
        ['2026-03-26', true],
      ],
    });
    const modal = new EditElementModal(routine, scene);

    modal.show();

    const statusControl = Array.from(
      document.body.querySelectorAll<HTMLDivElement>(
        '[data-component="HudSegmentedControl"]'
      )
    ).find(
      (element) => element.getAttribute('aria-label') === 'Routine status'
    );

    expect(statusControl).not.toBeNull();
    expect(statusControl?.querySelectorAll('button')).toHaveLength(2);
    expect(statusControl?.textContent).toContain('Active');
    expect(statusControl?.textContent).toContain('Archived');
    expect(document.body.textContent).toContain('Last 10 days');
    expect(
      document.body.querySelectorAll('input[type="checkbox"]')
    ).toHaveLength(10);

    const priorityControl = Array.from(
      document.body.querySelectorAll<HTMLDivElement>(
        '[data-component="HudSegmentedControl"]'
      )
    ).find((element) => element.getAttribute('aria-label') === 'Priority');

    expect(priorityControl).not.toBeNull();
    expect(priorityControl?.querySelectorAll('button')).toHaveLength(5);
    expect(priorityControl?.textContent).toContain('Lowest');
    expect(priorityControl?.textContent).toContain('Highest');

    const archivedButton = Array.from(
      statusControl?.querySelectorAll<HTMLButtonElement>('button') ?? []
    ).find((button) => button.textContent?.includes('Archived'));
    const archivedIcon = archivedButton?.querySelector('svg');

    expect(archivedIcon?.getAttribute('data-icon-name')).toBe('archive-box');
  });

  it('saves habit priority changes through the element details patch', () => {
    const scene = new Scene();
    const routine = new HabitElement({
      id: 'routine-2',
      uuid: 'routine-uuid-2',
      title: 'Daily reading',
      priority: 'low',
      habitStatus: Status.Active,
    });
    const detailsEdited = vi.fn();
    window.addEventListener('elementDetailsEdited', detailsEdited as EventListener);
    const modal = new EditElementModal(routine, scene);

    modal.show();

    const priorityControl = Array.from(
      document.body.querySelectorAll<HTMLDivElement>(
        '[data-component="HudSegmentedControl"]'
      )
    ).find((element) => element.getAttribute('aria-label') === 'Priority');
    const highButton = Array.from(
      priorityControl?.querySelectorAll<HTMLButtonElement>('button') ?? []
    ).find((button) => button.textContent?.trim() === 'High');
    const saveButton = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent === 'Save');

    highButton?.click();
    saveButton?.click();

    expect(routine.priority).toBe('high');
    expect(detailsEdited).toHaveBeenCalledTimes(1);
    const event = detailsEdited.mock.calls[0]?.[0] as CustomEvent<{
      patch: { priority?: string };
    }>;
    expect(event.detail.patch.priority).toBe('high');

    window.removeEventListener(
      'elementDetailsEdited',
      detailsEdited as EventListener
    );
  });
});
