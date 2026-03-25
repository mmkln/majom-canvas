// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { WorkspaceControlsBar } from './WorkspaceControlsBar.ts';
import {
  TIME_CLUSTERING_TOGGLE_REQUEST_EVENT,
  WORKSPACE_VIEW_CHANGE_REQUEST_EVENT,
  isTimeClusteringToggleRequestDetail,
  isWorkspaceViewChangeRequestDetail,
} from './workspaceEvents.ts';

function getButtonByAriaLabel(
  root: HTMLElement,
  ariaLabel: string
): HTMLButtonElement | null {
  return root.querySelector(`button[aria-label="${ariaLabel}"]`);
}

describe('WorkspaceControlsBar sidebar variant', () => {
  it('uses shared sidebar rail buttons and dividers', () => {
    const bar = new WorkspaceControlsBar({
      initialView: 'canvas',
      initialChatOpen: true,
      initialTimeClusteringOpen: false,
      showKanban: true,
      showTimeClustering: true,
      showRoutines: true,
      showChat: true,
      variant: 'sidebar',
    });

    expect(bar.element.className).toContain('w-full');
    expect(bar.element.className).toContain('gap-1.5');

    const viewGroup = bar.element.querySelector('[role="radiogroup"]');
    expect(viewGroup).not.toBeNull();

    const canvasButton = bar.element.querySelector<HTMLButtonElement>(
      'button[data-view="canvas"]'
    );
    expect(canvasButton).not.toBeNull();
    expect(canvasButton?.getAttribute('data-component')).toBe('HudIconButton');
    expect(canvasButton?.getAttribute('data-sidebar-rail-button')).toBe('true');
    expect(canvasButton?.className).toContain('focus-visible:ring-slate-300');
    expect(canvasButton?.dataset.active).toBe('true');
    expect(canvasButton?.getAttribute('aria-checked')).toBe('true');
    expect(canvasButton?.style.background).toBe('');

    const routinesButton = getButtonByAriaLabel(bar.element, 'Open routines');
    expect(routinesButton).not.toBeNull();
    expect(routinesButton?.getAttribute('data-component')).toBe(
      'HudIconButton'
    );

    const timeButton = getButtonByAriaLabel(
      bar.element,
      'Toggle time clustering panel'
    );
    expect(timeButton).not.toBeNull();
    expect(timeButton?.dataset.active).toBe('false');

    const chatButton = getButtonByAriaLabel(
      bar.element,
      'Toggle AI assistant panel'
    );
    expect(chatButton).not.toBeNull();
    expect(chatButton?.dataset.active).toBe('true');

    const dividers = bar.element.querySelectorAll(
      '[data-component="HudSidebarDivider"]'
    );
    expect(dividers).toHaveLength(3);
  });

  it('updates sidebar active state via shared data attributes instead of inline styles', () => {
    const bar = new WorkspaceControlsBar({
      initialView: 'canvas',
      initialChatOpen: false,
      initialTimeClusteringOpen: false,
      showKanban: true,
      showTimeClustering: true,
      showRoutines: true,
      showChat: true,
      variant: 'sidebar',
    });

    const canvasButton = bar.element.querySelector(
      'button[data-view="canvas"]'
    ) as HTMLButtonElement;
    const kanbanButton = bar.element.querySelector(
      'button[data-view="kanban"]'
    ) as HTMLButtonElement;
    const timeButton = getButtonByAriaLabel(
      bar.element,
      'Toggle time clustering panel'
    ) as HTMLButtonElement;
    const chatButton = getButtonByAriaLabel(
      bar.element,
      'Toggle AI assistant panel'
    ) as HTMLButtonElement;

    bar.setActiveView('kanban');
    bar.setChatOpen(true);
    bar.setTimeClusteringOpen(true);

    expect(canvasButton.dataset.active).toBe('false');
    expect(canvasButton.getAttribute('aria-checked')).toBe('false');
    expect(kanbanButton.dataset.active).toBe('true');
    expect(kanbanButton.getAttribute('aria-checked')).toBe('true');
    expect(timeButton.dataset.active).toBe('true');
    expect(chatButton.dataset.active).toBe('true');
    expect(kanbanButton.style.background).toBe('');
    expect(timeButton.style.background).toBe('');
    expect(chatButton.style.color).toBe('');
  });

  it('suppresses the base view active style when time clustering is fullscreen', () => {
    const bar = new WorkspaceControlsBar({
      initialView: 'canvas',
      initialTimeClusteringOpen: true,
      initialTimeClusteringLayoutMode: 'docked-left',
      showKanban: true,
      showTimeClustering: true,
      showRoutines: false,
      showChat: false,
      variant: 'sidebar',
    });

    const canvasButton = bar.element.querySelector(
      'button[data-view="canvas"]'
    ) as HTMLButtonElement;
    const timeButton = getButtonByAriaLabel(
      bar.element,
      'Toggle time clustering panel'
    ) as HTMLButtonElement;

    expect(canvasButton.dataset.active).toBe('true');
    expect(timeButton.dataset.active).toBe('true');

    bar.setTimeClusteringLayoutMode('fullscreen');

    expect(canvasButton.dataset.active).toBe('false');
    expect(canvasButton.getAttribute('aria-checked')).toBe('false');
    expect(timeButton.dataset.active).toBe('true');
  });

  it('requests a time clustering toggle without changing the base view', () => {
    const bar = new WorkspaceControlsBar({
      initialView: 'canvas',
      initialTimeClusteringOpen: true,
      showKanban: true,
      showTimeClustering: true,
      showRoutines: false,
      showChat: false,
      variant: 'sidebar',
    });

    const events: string[] = [];
    const handler = (event: Event): void => {
      const customEvent = event as CustomEvent<unknown>;
      if (!isTimeClusteringToggleRequestDetail(customEvent.detail)) return;
      events.push(
        typeof customEvent.detail.open === 'boolean'
          ? String(customEvent.detail.open)
          : 'toggle'
      );
    };
    window.addEventListener(TIME_CLUSTERING_TOGGLE_REQUEST_EVENT, handler);

    const timeButton = getButtonByAriaLabel(
      bar.element,
      'Toggle time clustering panel'
    ) as HTMLButtonElement;
    timeButton.click();

    window.removeEventListener(TIME_CLUSTERING_TOGGLE_REQUEST_EVENT, handler);

    expect(events).toEqual(['toggle']);
  });

  it('lets the active canvas button request a base view change while time clustering is open', () => {
    const bar = new WorkspaceControlsBar({
      initialView: 'canvas',
      initialTimeClusteringOpen: true,
      showKanban: true,
      showTimeClustering: true,
      showRoutines: false,
      showChat: false,
      variant: 'sidebar',
    });

    const events: string[] = [];
    const handler = (event: Event): void => {
      const customEvent = event as CustomEvent<unknown>;
      if (!isWorkspaceViewChangeRequestDetail(customEvent.detail)) return;
      events.push(customEvent.detail.view);
    };
    window.addEventListener(WORKSPACE_VIEW_CHANGE_REQUEST_EVENT, handler);

    const canvasButton = bar.element.querySelector(
      'button[data-view="canvas"]'
    ) as HTMLButtonElement;
    canvasButton.click();

    window.removeEventListener(WORKSPACE_VIEW_CHANGE_REQUEST_EVENT, handler);

    expect(events).toEqual(['canvas']);
  });
});

describe('WorkspaceControlsBar floating variant', () => {
  it('uses indigo active styles for selected controls', () => {
    const bar = new WorkspaceControlsBar({
      initialView: 'kanban',
      initialChatOpen: true,
      initialTimeClusteringOpen: true,
      showKanban: true,
      showTimeClustering: true,
      showRoutines: false,
      showChat: true,
      variant: 'floating',
    });

    const kanbanButton = bar.element.querySelector(
      'button[data-view="kanban"]'
    ) as HTMLButtonElement;
    const canvasButton = bar.element.querySelector(
      'button[data-view="canvas"]'
    ) as HTMLButtonElement;
    const chatButton = getButtonByAriaLabel(
      bar.element,
      'Toggle AI assistant panel'
    ) as HTMLButtonElement;
    const timeButton = getButtonByAriaLabel(
      bar.element,
      'Toggle time clustering panel'
    ) as HTMLButtonElement;

    expect(kanbanButton.dataset.active).toBe('true');
    expect(kanbanButton.style.background).toBe('rgb(238, 242, 255)');
    expect(kanbanButton.style.color).toBe('rgb(67, 56, 202)');
    expect(canvasButton.dataset.active).toBe('false');
    expect(canvasButton.style.background).toBe('transparent');
    expect(timeButton.dataset.active).toBe('true');
    expect(timeButton.style.background).toBe('rgb(238, 242, 255)');
    expect(chatButton.dataset.active).toBe('true');
    expect(chatButton.style.background).toBe('rgb(238, 242, 255)');
    expect(chatButton.style.color).toBe('rgb(67, 56, 202)');
  });
});
