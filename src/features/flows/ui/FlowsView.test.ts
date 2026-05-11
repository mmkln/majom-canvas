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
    document
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
          hidden: null,
        },
      },
    });
    expect(root.querySelector('.flows-edit-modal')).toBeNull();
    view.destroy();
  });

  it('saves flow status, priority, and risk from the settings dropdowns', async () => {
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
    const riskDropdown = root.querySelector<HTMLButtonElement>(
      '.flows-edit-dropdown > button[aria-label="Risk Level"]'
    );
    expect(statusDropdown).toBeDefined();
    expect(priorityDropdown).toBeDefined();
    expect(riskDropdown).toBeDefined();
    if (!statusDropdown || !priorityDropdown || !riskDropdown) {
      throw new Error('Expected flow settings dropdown controls');
    }

    statusDropdown.click();
    clickOpenDropdownOption(Status.Completed);

    priorityDropdown.click();
    clickOpenDropdownOption(Priority.High);

    riskDropdown.click();
    clickOpenDropdownOption('high');

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
          color: 'indigo',
          timeProfile: null,
          riskLevel: 'high',
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
          color: null,
          priority: null,
          riskLevel: null,
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
          color: 'rose',
          timeProfile: null,
          riskLevel: null,
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
          color: null,
          timeProfile: null,
          riskLevel: null,
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
