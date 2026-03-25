// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { WorkspaceControlsBar } from './WorkspaceControlsBar.ts';

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

    const canvasButton = bar.element.querySelector(
      'button[data-view="canvas"]'
    ) as HTMLButtonElement | null;
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

    const chatButton = getButtonByAriaLabel(
      bar.element,
      'Toggle AI assistant panel'
    );
    expect(chatButton).not.toBeNull();
    expect(chatButton?.dataset.active).toBe('true');

    const dividers = bar.element.querySelectorAll(
      '[data-component="HudSidebarDivider"]'
    );
    expect(dividers).toHaveLength(2);
  });

  it('updates sidebar active state via shared data attributes instead of inline styles', () => {
    const bar = new WorkspaceControlsBar({
      initialView: 'canvas',
      initialChatOpen: false,
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
    const chatButton = getButtonByAriaLabel(
      bar.element,
      'Toggle AI assistant panel'
    ) as HTMLButtonElement;

    bar.setActiveView('kanban');
    bar.setChatOpen(true);

    expect(canvasButton.dataset.active).toBe('false');
    expect(canvasButton.getAttribute('aria-checked')).toBe('false');
    expect(kanbanButton.dataset.active).toBe('true');
    expect(kanbanButton.getAttribute('aria-checked')).toBe('true');
    expect(chatButton.dataset.active).toBe('true');
    expect(kanbanButton.style.background).toBe('');
    expect(chatButton.style.color).toBe('');
  });
});

describe('WorkspaceControlsBar floating variant', () => {
  it('uses indigo active styles for selected controls', () => {
    const bar = new WorkspaceControlsBar({
      initialView: 'kanban',
      initialChatOpen: true,
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

    expect(kanbanButton.dataset.active).toBe('true');
    expect(kanbanButton.style.background).toBe('rgb(238, 242, 255)');
    expect(kanbanButton.style.color).toBe('rgb(67, 56, 202)');
    expect(canvasButton.dataset.active).toBe('false');
    expect(canvasButton.style.background).toBe('transparent');
    expect(chatButton.dataset.active).toBe('true');
    expect(chatButton.style.background).toBe('rgb(238, 242, 255)');
    expect(chatButton.style.color).toBe('rgb(67, 56, 202)');
  });
});
