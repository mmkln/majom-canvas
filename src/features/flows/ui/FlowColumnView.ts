import type { FlowColumn } from '../domain/types.ts';

export type FlowColumnViewKeys = {
  root: string;
  collapsed: string;
  header: string;
  focus: string;
  tasks: string;
};

export type FlowColumnViewRenderer = {
  getKeys: (column: FlowColumn) => FlowColumnViewKeys;
  isCollapsed: (column: FlowColumn) => boolean;
  renderCollapsed: (column: FlowColumn) => HTMLElement;
  renderHeader: (column: FlowColumn) => HTMLElement;
  renderFocus: (column: FlowColumn) => HTMLElement;
  renderTasksInto: (parent: HTMLElement, column: FlowColumn) => void;
};

export class FlowColumnView {
  public readonly element: HTMLElement;
  private readonly expandedElement: HTMLElement;
  private readonly taskListElement: HTMLElement;
  private keys: FlowColumnViewKeys | null = null;
  private collapsedElement: HTMLElement | null = null;
  private headerElement: HTMLElement | null = null;
  private focusElement: HTMLElement | null = null;

  constructor(private readonly renderer: FlowColumnViewRenderer) {
    this.element = document.createElement('section');
    this.expandedElement = document.createElement('div');
    this.expandedElement.className = 'flows-column-expanded';
    this.taskListElement = document.createElement('div');
    this.taskListElement.className = 'flows-column-task-list';
    this.expandedElement.appendChild(this.taskListElement);
    this.element.appendChild(this.expandedElement);
  }

  public update(column: FlowColumn): void {
    const nextKeys = this.renderer.getKeys(column);
    this.element.className = `flows-column${
      this.renderer.isCollapsed(column) ? ' is-collapsed' : ''
    }`;
    this.element.dataset.flowId = String(column.flow.id);
    this.element.dataset.flowColumnDraggable = 'true';

    if (this.keys?.collapsed !== nextKeys.collapsed) {
      this.updateCollapsed(column);
    }
    if (this.keys?.header !== nextKeys.header) {
      this.updateHeader(column);
    }
    if (this.keys?.focus !== nextKeys.focus) {
      this.updateFocus(column);
    }
    if (this.keys?.tasks !== nextKeys.tasks) {
      this.updateTasks(column);
    }
    this.keys = nextKeys;
  }

  public destroy(): void {
    this.element.remove();
    this.keys = null;
    this.collapsedElement = null;
    this.headerElement = null;
    this.focusElement = null;
  }

  private updateCollapsed(column: FlowColumn): void {
    const nextCollapsed = this.renderer.renderCollapsed(column);
    if (this.collapsedElement) {
      this.collapsedElement.replaceWith(nextCollapsed);
    } else {
      this.element.insertBefore(nextCollapsed, this.expandedElement);
    }
    this.collapsedElement = nextCollapsed;
  }

  private updateHeader(column: FlowColumn): void {
    const nextHeader = this.renderer.renderHeader(column);
    if (this.headerElement) {
      this.headerElement.replaceWith(nextHeader);
    } else {
      this.expandedElement.insertBefore(nextHeader, this.taskListElement);
    }
    this.headerElement = nextHeader;
  }

  private updateFocus(column: FlowColumn): void {
    const nextFocus = this.renderer.renderFocus(column);
    if (this.focusElement) {
      this.focusElement.replaceWith(nextFocus);
    } else {
      this.expandedElement.insertBefore(nextFocus, this.taskListElement);
    }
    this.focusElement = nextFocus;
  }

  private updateTasks(column: FlowColumn): void {
    this.taskListElement.replaceChildren();
    this.renderer.renderTasksInto(this.taskListElement, column);
  }
}
