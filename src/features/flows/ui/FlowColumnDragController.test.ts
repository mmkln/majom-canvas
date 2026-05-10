// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { Status, type Flow } from '../../../majom-wrapper/interfaces/index.ts';
import type { FlowColumn, FlowsState } from '../domain/types.ts';
import { FlowColumnDragController } from './FlowColumnDragController.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FlowColumnDragController', () => {
  it('emits the moved flow id and insertion index on column drop', () => {
    const root = document.createElement('div');
    const body = document.createElement('main');
    body.className = 'flows-body';
    setRect(body, 0, 0, 360, 240);
    const board = document.createElement('div');
    board.dataset.flowBoard = 'true';
    const columns = [
      createColumnElement(1, 0),
      createColumnElement(2, 110),
      createColumnElement(3, 220),
    ];
    board.append(...columns);
    body.appendChild(board);
    root.appendChild(body);
    document.body.appendChild(root);

    const onDrop = vi.fn();
    const controller = new FlowColumnDragController({
      root,
      getState: () => createState([1, 2, 3]),
      onDrop,
    });
    controller.mount();

    columns[2]!.dispatchEvent(createPointerEvent('pointerdown', 260, 20));
    window.dispatchEvent(createPointerEvent('pointermove', 10, 20));
    window.dispatchEvent(createPointerEvent('pointerup', 10, 20));

    expect(onDrop).toHaveBeenCalledWith(3, 0);
    controller.unmount();
  });

  it('supports dragging from a collapsed column button without expanding it', () => {
    const root = document.createElement('div');
    const body = document.createElement('main');
    body.className = 'flows-body';
    setRect(body, 0, 0, 360, 240);
    const board = document.createElement('div');
    board.dataset.flowBoard = 'true';
    const columns = [
      createColumnElement(1, 0),
      createColumnElement(2, 110),
      createColumnElement(3, 220, { collapsed: true }),
    ];
    board.append(...columns);
    body.appendChild(board);
    root.appendChild(body);
    document.body.appendChild(root);

    const collapsedButton = columns[2]!.querySelector<HTMLButtonElement>(
      '.flows-column-collapsed'
    )!;
    const onExpand = vi.fn();
    collapsedButton.addEventListener('click', onExpand);
    const onDrop = vi.fn();
    const controller = new FlowColumnDragController({
      root,
      getState: () => createState([1, 2, 3]),
      onDrop,
    });
    controller.mount();

    collapsedButton.dispatchEvent(createPointerEvent('pointerdown', 260, 20));
    window.dispatchEvent(createPointerEvent('pointermove', 10, 20));
    const placeholder = document.querySelector<HTMLElement>(
      '.flows-column-drag-placeholder'
    );
    expect(placeholder?.style.width).toBe('56px');
    expect(placeholder?.style.flexBasis).toBe('56px');
    window.dispatchEvent(createPointerEvent('pointerup', 10, 20));
    collapsedButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onDrop).toHaveBeenCalledWith(3, 0);
    expect(onExpand).not.toHaveBeenCalled();
    controller.unmount();
  });
});

function createColumnElement(
  flowId: Flow['id'],
  left: number,
  options: { collapsed?: boolean } = {}
): HTMLElement {
  const column = document.createElement('section');
  column.dataset.flowId = String(flowId);
  column.dataset.flowColumnDraggable = 'true';
  setRect(column, left, 0, options.collapsed ? 56 : 100, 200);
  if (options.collapsed) {
    const collapsedButton = document.createElement('button');
    collapsedButton.className = 'flows-column-collapsed';
    column.appendChild(collapsedButton);
  }
  return column;
}

function createPointerEvent(
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  clientX: number,
  clientY: number
): PointerEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    button: 0,
  });
  Object.defineProperties(event, {
    pointerId: { value: 1 },
    isPrimary: { value: true },
  });
  return event as PointerEvent;
}

function setRect(
  element: HTMLElement,
  left: number,
  top: number,
  width: number,
  height: number
): void {
  element.getBoundingClientRect = () =>
    ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
}

function createState(flowIds: Flow['id'][]): FlowsState {
  return {
    status: 'ready',
    error: null,
    columns: flowIds.map((id) => createColumn(id)),
  };
}

function createColumn(flowId: Flow['id']): FlowColumn {
  return {
    flow: {
      id: flowId,
      title: `Flow ${flowId}`,
      status: Status.Active,
      meta: null,
      tasks: [],
    },
    tasks: [],
    taskStatus: 'ready',
    taskError: null,
    openTaskCount: 0,
  };
}
