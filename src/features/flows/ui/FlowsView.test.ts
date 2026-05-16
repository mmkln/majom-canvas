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

function clickOpenDropdownOption(value: string): void {
  const option = Array.from(
    document.querySelectorAll<HTMLElement>(
      `[data-dropdown-select-item="${value}"]`
    )
  ).find((element) => !element.closest('.hidden'));
  expect(option).toBeDefined();
  if (!option) {
    throw new Error(`Expected open dropdown option "${value}"`);
  }
  option.click();
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
  it('preserves flow column DOM nodes when collapse state changes', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow: vi.fn(),
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });

    view.render(
      createStateFromFlows([
        createFlow({ id: 1, title: 'First flow' }),
        createFlow({ id: 2, title: 'Second flow' }),
      ])
    );
    const firstColumn = root.querySelector<HTMLElement>('[data-flow-id="1"]');
    const secondColumn = root.querySelector<HTMLElement>('[data-flow-id="2"]');
    const firstTitle = firstColumn?.querySelector<HTMLElement>(
      '.flows-column-title-button'
    );

    view.render(
      createStateFromFlows([
        createFlow({ id: 1, title: 'First flow' }),
        createFlow({
          id: 2,
          title: 'Second flow',
          meta: { presentation: { collapsed: true } },
        }),
      ])
    );

    expect(root.querySelector<HTMLElement>('[data-flow-id="1"]')).toBe(
      firstColumn
    );
    expect(root.querySelector<HTMLElement>('[data-flow-id="2"]')).toBe(
      secondColumn
    );
    expect(
      root
        .querySelector<HTMLElement>('[data-flow-id="1"]')
        ?.querySelector<HTMLElement>('.flows-column-title-button')
    ).toBe(firstTitle);
    expect(secondColumn?.classList.contains('is-collapsed')).toBe(true);
    view.destroy();
  });

  it('moves existing flow column DOM nodes when order changes', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow: vi.fn(),
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });

    view.render(
      createStateFromFlows([
        createFlow({ id: 1, title: 'First flow' }),
        createFlow({ id: 2, title: 'Second flow' }),
        createFlow({ id: 3, title: 'Third flow' }),
      ])
    );
    const firstColumn = root.querySelector<HTMLElement>('[data-flow-id="1"]');
    const secondColumn = root.querySelector<HTMLElement>('[data-flow-id="2"]');
    const firstTitle = firstColumn?.querySelector<HTMLElement>(
      '.flows-column-title-button'
    );
    const secondTitle = secondColumn?.querySelector<HTMLElement>(
      '.flows-column-title-button'
    );

    view.render(
      createStateFromFlows([
        createFlow({ id: 2, title: 'Second flow' }),
        createFlow({ id: 1, title: 'First flow' }),
        createFlow({ id: 3, title: 'Third flow' }),
      ])
    );

    expect(
      Array.from(root.querySelectorAll<HTMLElement>('.flows-column')).map(
        (column) => column.dataset.flowId
      )
    ).toEqual(['2', '1', '3']);
    expect(root.querySelector<HTMLElement>('[data-flow-id="1"]')).toBe(
      firstColumn
    );
    expect(root.querySelector<HTMLElement>('[data-flow-id="2"]')).toBe(
      secondColumn
    );
    expect(
      root
        .querySelector<HTMLElement>('[data-flow-id="1"]')
        ?.querySelector<HTMLElement>('.flows-column-title-button')
    ).toBe(firstTitle);
    expect(
      root
        .querySelector<HTMLElement>('[data-flow-id="2"]')
        ?.querySelector<HTMLElement>('.flows-column-title-button')
    ).toBe(secondTitle);
    view.destroy();
  });

  it('keeps an open column menu across unrelated column updates', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow: vi.fn(),
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });

    view.render(
      createStateFromFlows([
        createFlow({ id: 1, title: 'First flow' }),
        createFlow({ id: 2, title: 'Second flow' }),
      ])
    );
    root
      .querySelector<HTMLElement>('[data-flow-id="1"]')
      ?.querySelector<HTMLButtonElement>('.flows-column-menu-trigger')
      ?.click();

    expect(document.querySelector('.flows-column-menu')).not.toBeNull();

    view.render(
      createStateFromFlows([
        createFlow({ id: 1, title: 'First flow' }),
        createFlow({
          id: 2,
          title: 'Second flow',
          meta: { presentation: { collapsed: true } },
        }),
      ])
    );

    expect(document.querySelector('.flows-column-menu')).not.toBeNull();
    expect(
      root
        .querySelector<HTMLElement>('[data-flow-id="1"]')
        ?.querySelector<HTMLButtonElement>('.flows-column-menu-trigger')
        ?.getAttribute('aria-expanded')
    ).toBe('true');
    view.destroy();
  });

  it('hides a flow from the column header menu', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onPatchFlow = vi.fn(async () => undefined);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow,
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render(
      createStateFromFlows([
        createFlow({
          id: 1,
          title: 'Visible flow',
          meta: { existing: 'kept', presentation: { color: 'rose' } },
        }),
      ])
    );

    root
      .querySelector<HTMLButtonElement>('.flows-column-menu-trigger')
      ?.click();
    Array.from(
      document.querySelectorAll<HTMLButtonElement>('.flows-column-menu-item')
    )
      .find((button) => button.textContent === 'Hide flow')
      ?.click();
    await flushPromises();

    expect(onPatchFlow).toHaveBeenCalledWith(1, {
      meta: {
        existing: 'kept',
        presentation: {
          icon: null,
          color: 'rose',
          timeProfile: null,
          priority: null,
          collapsed: null,
          hidden: true,
        },
      },
    });

    view.render(
      createStateFromFlows([
        createFlow({
          id: 1,
          title: 'Visible flow',
          meta: { existing: 'kept', presentation: { hidden: true } },
        }),
      ])
    );
    expect(root.querySelector('.flows-column[data-flow-id="1"]')).toBeNull();
    view.destroy();
  });

  it('updates a flow task list without replacing the column header', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow: vi.fn(),
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    const initialState = createStateFromFlows([
      createFlow({ id: 1, title: 'First flow' }),
    ]);
    initialState.columns[0]!.tasks = [createTask({ title: 'Initial task' })];
    initialState.columns[0]!.openTaskCount = 1;

    view.render(initialState);
    const header = root.querySelector<HTMLElement>('.flows-column-header');
    const taskList = root.querySelector<HTMLElement>('.flows-column-task-list');
    const nextState = createStateFromFlows([
      createFlow({ id: 1, title: 'First flow' }),
    ]);
    nextState.columns[0]!.tasks = [createTask({ title: 'Updated task' })];
    nextState.columns[0]!.openTaskCount = 1;

    view.render(nextState);

    expect(root.querySelector<HTMLElement>('.flows-column-header')).toBe(
      header
    );
    expect(root.querySelector<HTMLElement>('.flows-column-task-list')).toBe(
      taskList
    );
    expect(root.querySelector('.flows-task-title')?.textContent).toBe(
      'Updated task'
    );
    view.destroy();
  });

  it('applies theme icon and color immediately from the modal title button', async () => {
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
    document
      .querySelectorAll<HTMLButtonElement>('.flows-column-menu-item')[0]
      ?.click();

    const appearanceButton = root.querySelector<HTMLButtonElement>(
      '.flows-edit-title-icon-button'
    );
    expect(appearanceButton).not.toBeNull();
    expect(
      appearanceButton?.closest('.flows-edit-title-control-row')?.children[0]
    ).toBe(appearanceButton);
    expect(
      root.querySelector<HTMLButtonElement>('.flows-edit-primary')?.textContent
    ).toBe('Save');

    appearanceButton?.click();
    expect(document.querySelector('.flows-appearance-popover')).not.toBeNull();
    document
      .querySelector<HTMLButtonElement>(
        '[data-flow-appearance-icon-option="heart"]'
      )
      ?.click();
    await flushPromises();

    expect(onPatchFlow).toHaveBeenCalledWith(1, {
      meta: {
        existing: 'kept',
        presentation: {
          icon: 'heart',
          color: 'slate',
          timeProfile: null,
          priority: null,
          collapsed: null,
          hidden: null,
        },
      },
    });

    document
      .querySelector<HTMLButtonElement>(
        '[data-flow-appearance-color-option="fuchsia"]'
      )
      ?.click();
    await flushPromises();

    expect(onPatchFlow).toHaveBeenLastCalledWith(1, {
      meta: {
        existing: 'kept',
        presentation: {
          icon: 'heart',
          color: 'fuchsia',
          timeProfile: null,
          priority: null,
          collapsed: null,
          hidden: null,
        },
      },
    });
    view.destroy();
  });

  it('saves flow status and priority from the settings dropdowns', async () => {
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

    expect(root.querySelector('.flows-column-meta-row')).toBeNull();

    root
      .querySelector<HTMLButtonElement>('.flows-column-menu-trigger')
      ?.click();
    document
      .querySelectorAll<HTMLButtonElement>('.flows-column-menu-item')[0]
      ?.click();

    const statusDropdown = root.querySelector<HTMLButtonElement>(
      '.flows-edit-dropdown > button[aria-label="Status"]'
    );
    const priorityDropdown = root.querySelector<HTMLButtonElement>(
      '.flows-edit-dropdown > button[aria-label="Priority"]'
    );
    expect(statusDropdown).toBeDefined();
    expect(priorityDropdown).toBeDefined();
    expect(
      root.querySelector<HTMLButtonElement>(
        '.flows-edit-dropdown > button[aria-label="Risk Level"]'
      )
    ).toBeNull();
    if (!statusDropdown || !priorityDropdown) {
      throw new Error('Expected flow settings dropdown controls');
    }

    statusDropdown.click();
    clickOpenDropdownOption(Status.Completed);

    priorityDropdown.click();
    clickOpenDropdownOption(Priority.High);

    const form = root.querySelector<HTMLFormElement>('.flows-edit-dialog');
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    await flushPromises();

    expect(onPatchFlow).toHaveBeenCalledWith(1, {
      title: 'Launch flow',
      status: Status.Completed,
      meta: {
        existing: 'kept',
        presentation: {
          icon: 'folder',
          color: 'slate',
          timeProfile: null,
          priority: Priority.High,
          collapsed: null,
          hidden: null,
        },
      },
    });
    view.destroy();
  });

  it('shows add task at the end of the flow task list instead of an empty state', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow: vi.fn(),
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render({
      status: 'ready',
      error: null,
      columns: [
        {
          flow: createFlow(),
          tasks: [],
          taskStatus: 'ready',
          taskError: null,
          openTaskCount: 0,
        },
      ],
    });

    const addTaskButton = root.querySelector<HTMLButtonElement>(
      '.flows-add-task-button'
    );
    expect(addTaskButton?.textContent).toBe('Add Task');
    expect(addTaskButton?.querySelector('svg')?.dataset.iconName).toBe('plus');
    expect(root.querySelector('.flows-column-state')?.textContent).not.toBe(
      'Empty flow'
    );
    view.destroy();
  });

  it('opens the add task composer and submits a trimmed title', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onCreateTask = vi.fn(async () => undefined);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onCreateTask,
      onPatchFlow: vi.fn(),
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render(
      createStateFromFlows([createFlow({ id: 7, title: 'Customer flow' })])
    );

    root.querySelector<HTMLButtonElement>('.flows-add-task-button')?.click();
    const title = root.querySelector<HTMLTextAreaElement>(
      '.flows-task-composer-textarea'
    );
    expect(title).not.toBeNull();
    title!.value = '  Follow up with lead  ';
    title!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      })
    );
    await flushPromises();

    expect(onCreateTask).toHaveBeenCalledWith(7, 'Follow up with lead');
    expect(root.querySelector('.flows-task-composer-textarea')).toBeNull();
    view.destroy();
  });

  it('keeps the add task composer open when task creation fails', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onCreateTask = vi.fn(async () => {
      throw new Error('network');
    });
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onCreateTask,
      onPatchFlow: vi.fn(),
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render(createState());

    root.querySelector<HTMLButtonElement>('.flows-add-task-button')?.click();
    const title = root.querySelector<HTMLTextAreaElement>(
      '.flows-task-composer-textarea'
    );
    title!.value = 'Retry task';
    root
      .querySelector<HTMLButtonElement>('.flows-task-composer-submit')
      ?.click();
    await flushPromises();

    expect(
      root.querySelector<HTMLTextAreaElement>('.flows-task-composer-textarea')
        ?.value
    ).toBe('Retry task');
    expect(root.querySelector('.flows-task-composer-error')?.textContent).toBe(
      'Could not create task.'
    );
    view.destroy();
  });

  it('opens a shared task edit modal from a flow task card and saves changes', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onLoadTask = vi.fn(async () => ({
      id: 10,
      uuid: '00000000-0000-4000-8000-000000000010',
      title: 'Open task',
      description: 'Existing details',
      status: Status.Active,
      priority: Priority.Medium,
      dueDate: null,
      isCompleted: false,
      goalId: null,
      goal: null,
      storyId: null,
      story: null,
    }));
    const onPatchTask = vi.fn(async () => ({
      id: 10,
      uuid: '00000000-0000-4000-8000-000000000010',
      title: 'Updated task',
      description: 'Existing details',
      status: Status.Active,
      priority: Priority.Medium,
      dueDate: null,
      isCompleted: false,
      goalId: null,
      goal: null,
      storyId: null,
      story: null,
    }));
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onCreateTask: vi.fn(),
      onLoadTask,
      onPatchTask,
      onPatchFlow: vi.fn(),
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render(createState());

    root.querySelector<HTMLButtonElement>('.flows-task-card')?.click();
    await flushPromises();

    expect(onLoadTask).toHaveBeenCalledWith(
      1,
      '00000000-0000-4000-8000-000000000010'
    );
    expect(document.querySelector('.task-edit-modal-form')).not.toBeNull();

    const titleInput = document.querySelector<HTMLInputElement>(
      '.task-edit-modal-input'
    );
    titleInput!.value = 'Updated task';
    titleInput!.dispatchEvent(new Event('input', { bubbles: true }));

    Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent === 'Save')
      ?.click();
    await flushPromises();

    expect(onPatchTask).toHaveBeenCalledWith(
      1,
      '00000000-0000-4000-8000-000000000010',
      { title: 'Updated task' }
    );
    expect(document.querySelector('.task-edit-modal-form')).toBeNull();
    view.destroy();
  });

  it('renders default and persisted visual icons without random column fallbacks', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow: vi.fn(),
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });

    view.render(createState());

    const expandedIcon = root.querySelector<SVGSVGElement>(
      '.flows-column-title-icon'
    );
    expect(expandedIcon?.dataset.iconName).toBe('folder');
    expect(expandedIcon?.classList.contains('flows-flow-icon--slate')).toBe(
      true
    );

    view.render(
      createState({
        meta: {
          presentation: { icon: 'heart', color: 'rose', collapsed: true },
        },
      })
    );

    const collapsedIcon = root.querySelector<SVGSVGElement>(
      '.flows-column-collapsed-icon'
    );
    expect(collapsedIcon?.dataset.iconName).toBe('heart');
    expect(collapsedIcon?.classList.contains('flows-flow-icon--rose')).toBe(
      true
    );
    view.destroy();
  });

  it('applies theme changes immediately from the column header icon button', async () => {
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

    const headerButton = root.querySelector<HTMLButtonElement>(
      '.flows-column-title-icon-button'
    );
    expect(headerButton?.querySelector('svg')?.dataset.iconName).toBe('folder');
    headerButton?.click();
    document
      .querySelector<HTMLButtonElement>(
        '[data-flow-appearance-icon-option="brain"]'
      )
      ?.click();
    document
      .querySelector<HTMLButtonElement>(
        '[data-flow-appearance-color-option="violet"]'
      )
      ?.click();
    await flushPromises();

    expect(onPatchFlow).toHaveBeenLastCalledWith(1, {
      meta: {
        existing: 'kept',
        presentation: {
          icon: 'brain',
          color: 'violet',
          timeProfile: null,
          priority: null,
          collapsed: null,
          hidden: null,
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
          icon: null,
          color: null,
          timeProfile: null,
          priority: null,
          collapsed: true,
          hidden: null,
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
          icon: null,
          color: null,
          priority: null,
          timeProfile: null,
          hidden: null,
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
    columnMenuTrigger?.click();
    expect(columnMenuTrigger?.getAttribute('aria-expanded')).toBe('true');
    expect(
      document.querySelector('.flows-column-menu')?.closest('#flows-root')
    ).toBeNull();
    document
      .querySelector<HTMLButtonElement>('.flows-column-menu-item')
      ?.click();
    expect(createButton?.querySelector('svg')?.dataset.iconName).toBe('plus');
    expect(organizeButton?.querySelector('svg')?.dataset.iconName).toBe(
      'bars-3'
    );
    expect(organizeButton?.closest('.flows-header-title-row')).not.toBeNull();
    expect(createButton?.closest('.flows-header-title-row')).not.toBeNull();
    expect(
      Array.from(
        header?.querySelectorAll<HTMLButtonElement>('.flows-header-action') ??
          []
      ).map((button) => button.textContent)
    ).toEqual(['Organize', 'New flow']);

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

    root
      .querySelector<HTMLButtonElement>('.flows-edit-title-icon-button')
      ?.click();
    document
      .querySelector<HTMLButtonElement>(
        '[data-flow-appearance-color-option="fuchsia"]'
      )
      ?.click();

    const form = root.querySelector<HTMLFormElement>('.flows-edit-dialog');
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    await flushPromises();

    expect(onCreateFlow).toHaveBeenCalledWith({
      title: 'Customer onboarding',
      meta: {
        presentation: {
          icon: 'folder',
          color: 'fuchsia',
          timeProfile: null,
          priority: null,
          collapsed: null,
          hidden: null,
        },
      },
    });
    expect(root.querySelector('.flows-edit-modal')).toBeNull();
    view.destroy();
  });

  it('opens the create modal from the add flow composer at the end of columns', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow: vi.fn(),
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render(createState());

    const board = root.querySelector<HTMLElement>('.flows-board');
    const addFlowButton = root.querySelector<HTMLButtonElement>(
      '.flows-add-flow-button'
    );

    expect(addFlowButton?.textContent).toBe('Add Flow');
    expect(addFlowButton?.querySelector('svg')?.dataset.iconName).toBe('plus');
    expect(board?.lastElementChild).toBe(
      addFlowButton?.closest('.flows-add-flow-panel')
    );

    addFlowButton?.click();
    expect(
      root.querySelector<HTMLElement>('.flows-edit-title')?.textContent
    ).toBe('New flow');
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

  it('opens the organize modal with drag-only flow rows', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow: vi.fn(),
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
    expect(root.querySelector('.flows-organize-row-actions')).toBeNull();

    root.querySelector<HTMLButtonElement>('.flows-organize-done')?.click();
    expect(root.querySelector('.flows-organize-modal')).toBeNull();
    view.destroy();
  });

  it('hides hidden flows from the page while keeping them in organize lines', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow: vi.fn(),
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render(
      createStateFromFlows([
        createFlow({ id: 1, title: 'Visible flow' }),
        createFlow({
          id: 2,
          title: 'Hidden flow',
          meta: { presentation: { hidden: true } },
        }),
      ])
    );

    expect(
      root.querySelector('.flows-column[data-flow-id="1"]')
    ).not.toBeNull();
    expect(root.querySelector('.flows-column[data-flow-id="2"]')).toBeNull();

    Array.from(root.querySelectorAll<HTMLButtonElement>('.flows-header-action'))
      .find((button) => button.textContent?.includes('Organize'))
      ?.click();

    expect(
      Array.from(root.querySelectorAll('.flows-organize-label')).map(
        (label) => label.textContent
      )
    ).toEqual(['Visible flow', 'Hidden flow']);
    expect(
      root
        .querySelectorAll<HTMLButtonElement>('.flows-organize-hide')[1]
        ?.querySelector('svg')?.dataset.iconName
    ).toBe('eye');
    expect(
      root
        .querySelectorAll<HTMLElement>('.flows-organize-row')[1]
        ?.classList.contains('is-hidden')
    ).toBe(true);
    expect(
      root
        .querySelectorAll<HTMLButtonElement>('.flows-organize-hide')[1]
        ?.getAttribute('aria-label')
    ).toBe('Show');
    expect(
      root.querySelectorAll<HTMLButtonElement>('.flows-organize-hide')[1]
        ?.disabled
    ).toBe(false);
    view.destroy();
  });

  it('patches flow visibility from the organize row hide button', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onPatchFlow = vi.fn(async () => undefined);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow,
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render(
      createStateFromFlows([
        createFlow({
          id: 1,
          title: 'Visible flow',
          meta: { existing: 'kept', presentation: { color: 'rose' } },
        }),
      ])
    );

    Array.from(root.querySelectorAll<HTMLButtonElement>('.flows-header-action'))
      .find((button) => button.textContent?.includes('Organize'))
      ?.click();
    const hideButton = root.querySelector<HTMLButtonElement>(
      '.flows-organize-hide'
    );
    expect(hideButton?.textContent).toBe('');
    expect(hideButton?.querySelector('svg')?.dataset.iconName).toBe(
      'eye-slash'
    );
    expect(hideButton?.getAttribute('aria-label')).toBe('Hide');
    hideButton?.click();
    await flushPromises();

    expect(onPatchFlow).toHaveBeenCalledWith(1, {
      meta: {
        existing: 'kept',
        presentation: {
          icon: null,
          color: 'rose',
          timeProfile: null,
          priority: null,
          collapsed: null,
          hidden: true,
        },
      },
    });
    view.destroy();
  });

  it('patches hidden flow visibility from the organize row show button', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onPatchFlow = vi.fn(async () => undefined);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow,
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render(
      createStateFromFlows([
        createFlow({
          id: 1,
          title: 'Hidden flow',
          meta: { existing: 'kept', presentation: { hidden: true } },
        }),
      ])
    );

    Array.from(root.querySelectorAll<HTMLButtonElement>('.flows-header-action'))
      .find((button) => button.textContent?.includes('Organize'))
      ?.click();
    const showButton = root.querySelector<HTMLButtonElement>(
      '.flows-organize-hide'
    );
    expect(showButton?.querySelector('svg')?.dataset.iconName).toBe('eye');
    expect(showButton?.getAttribute('aria-label')).toBe('Show');
    showButton?.click();
    await flushPromises();

    expect(onPatchFlow).toHaveBeenCalledWith(1, {
      meta: {
        existing: 'kept',
        presentation: {
          hidden: false,
          icon: null,
          color: null,
          timeProfile: null,
          priority: null,
          collapsed: null,
        },
      },
    });
    view.destroy();
  });

  it('uses a multi-column organize layout for long flow lists', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const view = new FlowsView(root, createRuntime(), {
      onCreateFlow: vi.fn(),
      onPatchFlow: vi.fn(),
      onReorderFlow: vi.fn(),
      onDeleteFlow: vi.fn(),
    });
    view.render(
      createStateFromFlows(
        Array.from({ length: 9 }, (_, index) =>
          createFlow({ id: index + 1, title: `Flow ${index + 1}` })
        )
      )
    );

    Array.from(root.querySelectorAll<HTMLButtonElement>('.flows-header-action'))
      .find((button) => button.textContent?.includes('Organize'))
      ?.click();

    expect(
      root
        .querySelector<HTMLElement>('.flows-organize-dialog')
        ?.classList.contains('flows-organize-dialog--multi-column')
    ).toBe(true);
    expect(
      root
        .querySelector<HTMLElement>('.flows-organize-body')
        ?.classList.contains('flows-organize-body--multi-column')
    ).toBe(true);
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
    expect(
      root.querySelector('.flows-organize-drop-placeholder')
    ).not.toBeNull();
    expect(targetRow?.classList.contains('is-drag-over')).toBe(false);
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
    expect(
      root.querySelector('.flows-organize-drop-placeholder')
    ).not.toBeNull();
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
    expect(root.querySelector('.flows-organize-drop-placeholder')).toBeNull();
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

function createTask(
  overrides: Partial<FlowsState['columns'][number]['tasks'][number]> = {}
): FlowsState['columns'][number]['tasks'][number] {
  return {
    id: overrides.id ?? 10,
    uuid: overrides.uuid ?? '00000000-0000-4000-8000-000000000010',
    title: overrides.title ?? 'Open task',
    status: overrides.status ?? Status.Active,
    priority: overrides.priority ?? Priority.Medium,
    due_date: overrides.due_date ?? null,
    is_completed: overrides.is_completed ?? false,
  };
}
