// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { Scene } from '../../core/scene/Scene.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { EditElementModal } from './EditElementModal.ts';

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
});
