// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FocusStatus,
  FocusType,
  Status,
  type Flow,
  type FlowFocus,
} from '../../../majom-wrapper/interfaces/index.ts';
import type { FlowColumn } from '../domain/types.ts';
import { FlowColumnView } from './FlowColumnView.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FlowColumnView', () => {
  it('skips DOM rendering while column section keys are unchanged', () => {
    const renderer = createRenderer();
    const view = new FlowColumnView(renderer);

    view.update(createColumn(createFlow({ title: 'Launch flow' })));
    const initialElement = view.element;
    view.update(createColumn(createFlow({ title: 'Launch flow' })));

    expect(view.element).toBe(initialElement);
    expect(renderer.renderCollapsed).toHaveBeenCalledTimes(1);
    expect(renderer.renderHeader).toHaveBeenCalledTimes(1);
    expect(renderer.renderFocus).toHaveBeenCalledTimes(1);
    expect(renderer.renderTasksInto).toHaveBeenCalledTimes(1);
    expect(view.element.textContent).toContain('Launch flow');
  });

  it('renders changed column sections without replacing the root element', () => {
    const renderer = createRenderer();
    const view = new FlowColumnView(renderer);

    view.update(createColumn(createFlow({ title: 'Launch flow' })));
    const initialElement = view.element;
    view.update(createColumn(createFlow({ title: 'Renamed flow' })));

    expect(view.element).toBe(initialElement);
    expect(renderer.renderCollapsed).toHaveBeenCalledTimes(2);
    expect(renderer.renderHeader).toHaveBeenCalledTimes(2);
    expect(renderer.renderFocus).toHaveBeenCalledTimes(1);
    expect(renderer.renderTasksInto).toHaveBeenCalledTimes(1);
    expect(view.element.textContent).toContain('Renamed flow');
  });

  it('updates task content without replacing the header host', () => {
    const renderer = createRenderer();
    const view = new FlowColumnView(renderer);

    view.update(createColumn(createFlow(), { openTaskCount: 1 }));
    const header = view.element.querySelector('.flows-column-header');
    const taskList = view.element.querySelector('.flows-column-task-list');
    view.update(createColumn(createFlow(), { openTaskCount: 2 }));

    expect(view.element.querySelector('.flows-column-header')).toBe(header);
    expect(view.element.querySelector('.flows-column-task-list')).toBe(
      taskList
    );
    expect(renderer.renderHeader).toHaveBeenCalledTimes(1);
    expect(renderer.renderFocus).toHaveBeenCalledTimes(1);
    expect(renderer.renderTasksInto).toHaveBeenCalledTimes(2);
    expect(taskList?.textContent).toBe('Tasks: 2');
  });

  it('updates focus content without replacing header or task hosts', () => {
    const renderer = createRenderer();
    const view = new FlowColumnView(renderer);

    view.update(createColumn(createFlow(), { openTaskCount: 1 }));
    const header = view.element.querySelector('.flows-column-header');
    const taskList = view.element.querySelector('.flows-column-task-list');
    view.update(
      createColumn(
        createFlow({ currentFocus: createFocus({ title: 'Proof case' }) }),
        {
          openTaskCount: 1,
        }
      )
    );

    expect(view.element.querySelector('.flows-column-header')).toBe(header);
    expect(view.element.querySelector('.flows-column-task-list')).toBe(
      taskList
    );
    expect(renderer.renderHeader).toHaveBeenCalledTimes(1);
    expect(renderer.renderFocus).toHaveBeenCalledTimes(2);
    expect(renderer.renderTasksInto).toHaveBeenCalledTimes(1);
    expect(view.element.querySelector('.flows-column-focus')?.textContent).toBe(
      'Focus: Proof case'
    );
  });

  it('owns the flow column root attributes and collapsed state', () => {
    const renderer = createRenderer();
    const view = new FlowColumnView(renderer);

    view.update(createColumn(createFlow({ id: 42 })));
    expect(view.element.className).toBe('flows-column');
    expect(view.element.dataset.flowId).toBe('42');
    expect(view.element.dataset.flowColumnDraggable).toBe('true');

    view.update(
      createColumn(createFlow({ id: 42, meta: { collapsed: true } }))
    );
    expect(view.element.className).toBe('flows-column is-collapsed');
  });

  it('removes its mounted element on destroy', () => {
    const view = new FlowColumnView(createRenderer());
    document.body.appendChild(view.element);

    view.update(createColumn(createFlow()));
    view.destroy();

    expect(document.body.contains(view.element)).toBe(false);
  });
});

function createRenderer() {
  return {
    getKeys: vi.fn((column: FlowColumn) => ({
      root: `${column.flow.id}:${String(Boolean(column.flow.meta))}`,
      collapsed: `${column.flow.id}:${column.flow.title}`,
      header: `${column.flow.id}:${column.flow.title}`,
      focus: `${column.flow.id}:${column.flow.currentFocus?.title ?? ''}`,
      tasks: `${column.flow.id}:${column.openTaskCount}`,
    })),
    isCollapsed: vi.fn((column: FlowColumn) => column.flow.meta !== null),
    renderCollapsed: vi.fn((column: FlowColumn) => {
      const collapsed = document.createElement('button');
      collapsed.className = 'flows-column-collapsed';
      collapsed.textContent = column.flow.title;
      return collapsed;
    }),
    renderHeader: vi.fn((column: FlowColumn) => {
      const header = document.createElement('header');
      header.className = 'flows-column-header';
      header.textContent = column.flow.title;
      return header;
    }),
    renderFocus: vi.fn((column: FlowColumn) => {
      const focus = document.createElement('div');
      focus.className = 'flows-column-focus';
      focus.textContent = `Focus: ${column.flow.currentFocus?.title ?? ''}`;
      return focus;
    }),
    renderTasksInto: vi.fn((parent: HTMLElement, column: FlowColumn) => {
      const tasks = document.createElement('p');
      tasks.textContent = `Tasks: ${column.openTaskCount}`;
      parent.appendChild(tasks);
    }),
  };
}

function createColumn(
  flow: Flow,
  overrides: Partial<Omit<FlowColumn, 'flow'>> = {}
): FlowColumn {
  return {
    flow,
    tasks: overrides.tasks ?? [],
    taskStatus: overrides.taskStatus ?? 'ready',
    taskError: overrides.taskError ?? null,
    openTaskCount: overrides.openTaskCount ?? 0,
  };
}

function createFlow(overrides: Partial<Flow> = {}): Flow {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? 'Launch flow',
    status: overrides.status ?? Status.Active,
    meta: overrides.meta ?? null,
    tasks: overrides.tasks ?? [],
    currentFocus: overrides.currentFocus ?? null,
  };
}

function createFocus(overrides: Partial<FlowFocus> = {}): FlowFocus {
  return {
    id: overrides.id ?? '11111111-1111-4111-8111-111111111111',
    flowId: overrides.flowId ?? '22222222-2222-4222-8222-222222222222',
    type: overrides.type ?? FocusType.Mission,
    title: overrides.title ?? 'Focus',
    description: overrides.description ?? '',
    status: overrides.status ?? FocusStatus.Active,
    startDate: overrides.startDate ?? null,
    endDate: overrides.endDate ?? null,
    successCriteria: overrides.successCriteria ?? 'Criteria',
    evidenceRequired: overrides.evidenceRequired ?? null,
    evidence: overrides.evidence ?? null,
    closeReason: overrides.closeReason ?? null,
    isPrimary: overrides.isPrimary ?? true,
    createdAt: overrides.createdAt ?? '2026-05-18T00:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-05-18T00:00:00Z',
  };
}
