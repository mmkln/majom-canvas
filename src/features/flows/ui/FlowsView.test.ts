// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRuntime } from '../../../app-runtime/index.ts';
import {
  Priority,
  Status,
  type Flow,
} from '../../../majom-wrapper/interfaces/index.ts';
import type { FlowsState } from '../domain/types.ts';
import { FlowsView } from './FlowsView.ts';

function createRuntime(): AppRuntime {
  return new AppRuntime({
    initialLocale: 'en',
    energyService: null,
  });
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function createDragEvent(
  type: string,
  options: { clientY?: number; data?: string } = {}
): DragEvent {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  }) as DragEvent;
  const dataTransfer = {
    dropEffect: '',
    effectAllowed: '',
    getData: vi.fn(() => options.data ?? ''),
    setData: vi.fn(),
  };
  Object.defineProperty(event, 'clientY', {
    value: options.clientY ?? 0,
  });
  Object.defineProperty(event, 'dataTransfer', {
    value: dataTransfer,
  });
  return event;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FlowsView', () => {
  it('saves the selected theme color into flow meta from the edit modal', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onPatchFlow = vi.fn(async () => undefined);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow,
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>('.flows-column-menu-trigger')
      ?.click();
    root
      .querySelectorAll<HTMLButtonElement>('.flows-column-menu-item')[0]
      ?.click();

    const colorInput = root.querySelector<HTMLInputElement>(
      'input[name="color"][value="fuchsia"]'
    );
    const initialColorInput = root.querySelector<HTMLInputElement>(
      'input[name="color"][value="indigo"]'
    );
    expect(colorInput).not.toBeNull();
    expect(root.querySelector('.flows-edit-color.is-selected')).toBeNull();
    expect(
      root.querySelector<HTMLButtonElement>('.flows-edit-primary')?.textContent
    ).toBe('Save');
    colorInput!.closest<HTMLLabelElement>('.flows-edit-color')?.click();
    expect(colorInput!.checked).toBe(true);
    expect(initialColorInput?.checked).toBe(false);

    const form = root.querySelector<HTMLFormElement>('.flows-edit-dialog');
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    await flushPromises();

    expect(onPatchFlow).toHaveBeenCalledWith(1, {
      title: 'Launch flow',
      meta: {
        existing: 'kept',
        presentation: {
          color: 'fuchsia',
          timeProfile: null,
          riskLevel: 'stable',
          priority: null,
          collapsed: null,
        },
      },
    });
    expect(root.querySelector('.flows-edit-modal')).toBeNull();
    view.destroy();
  });

  it('patches flow status and priority from the column controls', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onPatchFlow = vi.fn(async () => undefined);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow,
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render(createState());

    const selects = root.querySelectorAll<HTMLSelectElement>(
      '.flows-column-meta-select'
    );
    const statusSelect = selects[0];
    const prioritySelect = selects[1];
    expect(statusSelect).toBeDefined();
    expect(prioritySelect).toBeDefined();

    statusSelect!.value = Status.Completed;
    statusSelect!.dispatchEvent(new Event('change', { bubbles: true }));
    prioritySelect!.value = Priority.High;
    prioritySelect!.dispatchEvent(new Event('change', { bubbles: true }));
    await flushPromises();

    expect(onPatchFlow).toHaveBeenCalledWith(1, {
      status: Status.Completed,
    });
    expect(onPatchFlow).toHaveBeenCalledWith(1, {
      meta: {
        existing: 'kept',
        presentation: {
          color: null,
          timeProfile: null,
          riskLevel: null,
          priority: Priority.High,
          collapsed: null,
        },
      },
    });
    view.destroy();
  });

  it('persists column collapse state in flow meta', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onPatchFlow = vi.fn(async () => undefined);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow,
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>('button[aria-label="Collapse flow"]')
      ?.click();
    await flushPromises();

    expect(onPatchFlow).toHaveBeenCalledWith(1, {
      meta: {
        existing: 'kept',
        presentation: {
          color: null,
          timeProfile: null,
          riskLevel: null,
          priority: null,
          collapsed: true,
        },
      },
    });

    view.render(
      createState({
        meta: {
          existing: 'kept',
          presentation: { collapsed: true },
        },
      })
    );
    expect(root.querySelector('.flows-column.is-collapsed')).not.toBeNull();

    root.querySelector<HTMLButtonElement>('.flows-column-collapsed')?.click();
    await flushPromises();

    expect(onPatchFlow).toHaveBeenCalledWith(1, {
      meta: {
        existing: 'kept',
        presentation: {
          collapsed: false,
          color: null,
          priority: null,
          riskLevel: null,
          timeProfile: null,
        },
      },
    });
    view.destroy();
  });

  it('opens the create modal from the header and creates a new flow on submit', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onCreateFlow = vi.fn(async () => undefined);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow,
      onPatchFlow: vi.fn(),
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render(createState());

    const header = root.querySelector<HTMLElement>('.flows-header');
    const collapseButton = root.querySelector<HTMLButtonElement>(
      'button[aria-label="Collapse flow"]'
    );
    const columnMenuTrigger = root.querySelector<HTMLButtonElement>(
      '.flows-column-menu-trigger'
    );
    const createButton = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.flows-header-action')
    ).find((button) => button.textContent?.includes('New flow'));
    const organizeButton = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.flows-header-action')
    ).find((button) => button.textContent?.includes('Organize'));

    expect(header).not.toBeNull();
    expect(collapseButton?.querySelector('svg')?.dataset.iconName).toBe(
      'shrink'
    );
    expect(
      collapseButton?.closest('.flows-column-title-actions')?.children[0]
    ).toBe(collapseButton);
    expect(
      collapseButton?.closest('.flows-column-title-actions')?.children[1]
    ).toBe(columnMenuTrigger?.closest('.flows-column-menu-container'));
    expect(columnMenuTrigger?.querySelector('svg')?.dataset.iconName).toBe(
      'ellipsis-horizontal'
    );
    expect(createButton?.querySelector('svg')?.dataset.iconName).toBe('plus');
    expect(organizeButton?.querySelector('svg')?.dataset.iconName).toBe(
      'bars-3'
    );
    expect(organizeButton?.closest('.flows-header-title-row')).not.toBeNull();
    expect(organizeButton?.closest('.flows-header-actions')).toBeNull();

    createButton?.click();
    expect(onCreateFlow).not.toHaveBeenCalled();
    expect(
      root.querySelector<HTMLElement>('.flows-edit-title')?.textContent
    ).toBe('New flow');

    const titleInput = root.querySelector<HTMLInputElement>(
      '.flows-edit-dialog input[name="title"]'
    );
    expect(titleInput?.value).toBe('');
    titleInput!.value = 'Customer onboarding';

    const colorInput = root.querySelector<HTMLInputElement>(
      'input[name="color"][value="fuchsia"]'
    );
    colorInput!.closest<HTMLLabelElement>('.flows-edit-color')?.click();

    const form = root.querySelector<HTMLFormElement>('.flows-edit-dialog');
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    await flushPromises();

    expect(onCreateFlow).toHaveBeenCalledWith({
      title: 'Customer onboarding',
      meta: {
        presentation: {
          color: 'fuchsia',
          timeProfile: null,
          riskLevel: 'stable',
          priority: null,
          collapsed: null,
        },
      },
    });
    expect(root.querySelector('.flows-edit-modal')).toBeNull();
    view.destroy();
  });

  it('renames a flow title inline from the column header', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onPatchFlow = vi.fn();
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow,
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>('button[aria-label="Rename flow"]')
      ?.click();
    const titleInput = root.querySelector<HTMLInputElement>(
      'input[aria-label="Flow name"]'
    );
    expect(titleInput).not.toBeNull();
    titleInput!.value = 'Retention flow';
    titleInput!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(onPatchFlow).toHaveBeenCalledWith(1, {
      title: 'Retention flow',
    });
    view.destroy();
  });

  it('opens the organize modal and reorders a flow column with row controls', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onReorderFlow = vi.fn(async () => undefined);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow: vi.fn(),
      onReorderFlow,
      onDeleteFlow: vi.fn(),
    });
    view.render(
      createStateFromFlows([
        createFlow({ id: 1, title: 'Freelance Auto' }),
        createFlow({ id: 2, title: 'qwert' }),
        createFlow({ id: 3, title: 'iuytr' }),
      ])
    );

    const organizeButton = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.flows-header-action')
    ).find((button) => button.textContent?.includes('Organize'));
    organizeButton?.click();

    const modal = root.querySelector<HTMLElement>('.flows-organize-modal');
    expect(modal).not.toBeNull();
    expect(
      root.querySelector<HTMLElement>('.flows-organize-title')?.textContent
    ).toBe('Organize Lines');
    expect(
      Array.from(root.querySelectorAll('.flows-organize-label')).map(
        (label) => label.textContent
      )
    ).toEqual(['Freelance Auto', 'qwert', 'iuytr']);
    expect(
      root
        .querySelector('.flows-organize-drag-handle svg')
        ?.getAttribute('data-icon-name')
    ).toBe('drag-handle');

    const qwertRow = root.querySelectorAll<HTMLElement>(
      '.flows-organize-row'
    )[1];

    qwertRow
      ?.querySelector<HTMLButtonElement>('button[aria-label="Move qwert up"]')
      ?.click();
    await flushPromises();

    expect(onReorderFlow).toHaveBeenCalledWith(2, 0);

    root.querySelector<HTMLButtonElement>('.flows-organize-done')?.click();
    expect(root.querySelector('.flows-organize-modal')).toBeNull();
    view.destroy();
  });

  it('renames a flow title inline from the organize modal row', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onPatchFlow = vi.fn();
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow,
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render(
      createStateFromFlows([
        createFlow({ id: 1, title: 'Freelance Auto' }),
        createFlow({ id: 2, title: 'qwert' }),
        createFlow({ id: 3, title: 'iuytr' }),
      ])
    );

    Array.from(root.querySelectorAll<HTMLButtonElement>('.flows-header-action'))
      .find((button) => button.textContent?.includes('Organize'))
      ?.click();
    const modal = root.querySelector<HTMLElement>('.flows-organize-modal');
    modal
      ?.querySelectorAll<HTMLButtonElement>(
        'button[aria-label="Rename flow"]'
      )[1]
      ?.click();

    const titleInput = root.querySelector<HTMLInputElement>(
      '.flows-organize-modal input[aria-label="Flow name"]'
    );
    expect(titleInput).not.toBeNull();
    titleInput!.value = 'Partner ops';
    titleInput!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(onPatchFlow).toHaveBeenCalledWith(2, {
      title: 'Partner ops',
    });
    view.destroy();
  });

  it('reorders flow columns by dragging rows inside the organize modal', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onReorderFlow = vi.fn(async () => undefined);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow: vi.fn(),
      onReorderFlow,
      onDeleteFlow: vi.fn(),
    });
    view.render(
      createStateFromFlows([
        createFlow({ id: 1, title: 'Freelance Auto' }),
        createFlow({ id: 2, title: 'qwert' }),
        createFlow({ id: 3, title: 'iuytr' }),
      ])
    );

    Array.from(root.querySelectorAll<HTMLButtonElement>('.flows-header-action'))
      .find((button) => button.textContent?.includes('Organize'))
      ?.click();

    const rows = root.querySelectorAll<HTMLElement>('.flows-organize-row');
    const sourceHandle = rows[0]?.querySelector<HTMLElement>(
      '.flows-organize-drag-handle'
    );
    const targetRow = rows[2];
    targetRow!.getBoundingClientRect = () =>
      ({
        top: 0,
        bottom: 100,
        height: 100,
        left: 0,
        right: 320,
        width: 320,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    sourceHandle?.dispatchEvent(createDragEvent('dragstart'));
    targetRow?.dispatchEvent(createDragEvent('dragover', { clientY: 80 }));
    targetRow?.dispatchEvent(
      createDragEvent('drop', { clientY: 80, data: '1' })
    );
    await flushPromises();

    expect(onReorderFlow).toHaveBeenCalledWith(1, 2);
    view.destroy();
  });

  it('keeps organize row drag working when drop dataTransfer is empty', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onReorderFlow = vi.fn(async () => undefined);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow: vi.fn(),
      onReorderFlow,
      onDeleteFlow: vi.fn(),
    });
    view.render(
      createStateFromFlows([
        createFlow({ id: 1, title: 'Freelance Auto' }),
        createFlow({ id: 2, title: 'qwert' }),
        createFlow({ id: 3, title: 'iuytr' }),
      ])
    );

    Array.from(root.querySelectorAll<HTMLButtonElement>('.flows-header-action'))
      .find((button) => button.textContent?.includes('Organize'))
      ?.click();

    const rows = root.querySelectorAll<HTMLElement>('.flows-organize-row');
    const sourceHandle = rows[0]?.querySelector<HTMLElement>(
      '.flows-organize-drag-handle'
    );
    const targetRow = rows[2];
    targetRow!.getBoundingClientRect = () =>
      ({
        top: 0,
        bottom: 100,
        height: 100,
        left: 0,
        right: 320,
        width: 320,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    sourceHandle?.dispatchEvent(createDragEvent('dragstart'));
    targetRow?.dispatchEvent(createDragEvent('dragover', { clientY: 80 }));
    targetRow?.dispatchEvent(createDragEvent('drop', { clientY: 80 }));
    await flushPromises();

    expect(onReorderFlow).toHaveBeenCalledWith(1, 2);
    view.destroy();
  });

  it('ignores organize row drops that keep the same column position', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onReorderFlow = vi.fn(async () => undefined);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow: vi.fn(),
      onReorderFlow,
      onDeleteFlow: vi.fn(),
    });
    view.render(
      createStateFromFlows([
        createFlow({ id: 1, title: 'Freelance Auto' }),
        createFlow({ id: 2, title: 'qwert' }),
        createFlow({ id: 3, title: 'iuytr' }),
      ])
    );

    Array.from(root.querySelectorAll<HTMLButtonElement>('.flows-header-action'))
      .find((button) => button.textContent?.includes('Organize'))
      ?.click();

    const rows = root.querySelectorAll<HTMLElement>('.flows-organize-row');
    const sourceHandle = rows[1]?.querySelector<HTMLElement>(
      '.flows-organize-drag-handle'
    );
    const targetRow = rows[0];
    targetRow!.getBoundingClientRect = () =>
      ({
        top: 0,
        bottom: 100,
        height: 100,
        left: 0,
        right: 320,
        width: 320,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    sourceHandle?.dispatchEvent(createDragEvent('dragstart'));
    targetRow?.dispatchEvent(createDragEvent('dragover', { clientY: 80 }));
    targetRow?.dispatchEvent(
      createDragEvent('drop', { clientY: 80, data: '2' })
    );
    await flushPromises();

    expect(onReorderFlow).not.toHaveBeenCalled();
    view.destroy();
  });
});

function createState(flowOverrides: Partial<Flow> = {}): FlowsState {
  return createStateFromFlows([createFlow(flowOverrides)]);
}

function createStateFromFlows(flows: Flow[]): FlowsState {
  return {
    status: 'ready',
    error: null,
    columns: flows.map((flow) => ({
      flow,
      tasks: [
        {
          id: 10,
          uuid: '00000000-0000-4000-8000-000000000010',
          title: 'Open task',
          status: Status.Active,
          priority: Priority.Medium,
          due_date: null,
          is_completed: false,
        },
      ],
      taskStatus: 'ready',
      taskError: null,
      openTaskCount: 1,
    })),
  };
}

function createFlow(overrides: Partial<Flow> = {}): Flow {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? 'Launch flow',
    status: overrides.status ?? Status.Active,
    meta: overrides.meta ?? { existing: 'kept' },
    tasks: overrides.tasks ?? [],
  };
}
