// @vitest-environment jsdom
import { Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Scene } from '../core/scene/Scene.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { StoryQuickCreateAction } from './StoryQuickCreateAction.ts';

function createCanvasManagerStub(
  canvas: HTMLCanvasElement,
  options: { scale?: number } = {}
): {
  canvasManager: CanvasManager;
  viewChanges: Subject<void>;
} {
  const viewChanges = new Subject<void>();
  const panZoom = {
    scale: options.scale ?? 1,
    scrollX: 0,
    scrollY: 0,
    renderFlags: undefined,
    viewChanges,
  } as CanvasManager['getPanZoomManager'] extends () => infer T ? T : never;

  return {
    viewChanges,
    canvasManager: {
      getCanvas: () => canvas,
      getPanZoomManager: () => panZoom,
      isDraggingElements: false,
      isResizingStory: false,
      draw: () => {},
    } as unknown as CanvasManager,
  };
}

describe('StoryQuickCreateAction', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('shows for a hovered story even when story details are zoom-hidden', () => {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    Object.defineProperty(canvas, 'getBoundingClientRect', {
      value: () => ({
        left: 100,
        top: 80,
        right: 900,
        bottom: 680,
        width: 800,
        height: 600,
        x: 100,
        y: 80,
        toJSON: () => ({}),
      }),
    });

    const scene = new Scene();
    const story = new StoryElement({ x: 120, y: 160, title: 'Story' });
    scene.addElement(story);
    const { canvasManager } = createCanvasManagerStub(canvas, { scale: 0.3 });
    const action = new StoryQuickCreateAction(scene, canvasManager);

    action.mount(document.body);
    (story as StoryElement & { isHovered?: boolean }).isHovered = true;
    canvas.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }));

    const button = document.querySelector<HTMLButtonElement>(
      '[data-role="story-quick-create-action"]'
    );
    expect(button).not.toBeNull();
    expect(button?.parentElement?.getAttribute('aria-hidden')).toBe('false');

    action.unmount();
  });

  it('stays hidden below 20% zoom', () => {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    Object.defineProperty(canvas, 'getBoundingClientRect', {
      value: () => ({
        left: 100,
        top: 80,
        right: 900,
        bottom: 680,
        width: 800,
        height: 600,
        x: 100,
        y: 80,
        toJSON: () => ({}),
      }),
    });

    const scene = new Scene();
    const story = new StoryElement({ x: 120, y: 160, title: 'Story' });
    scene.addElement(story);
    const { canvasManager } = createCanvasManagerStub(canvas, { scale: 0.19 });
    const action = new StoryQuickCreateAction(scene, canvasManager);

    action.mount(document.body);
    scene.setSelected([story]);
    (story as StoryElement & { isHovered?: boolean }).isHovered = true;
    canvas.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }));

    const button = document.querySelector<HTMLButtonElement>(
      '[data-role="story-quick-create-action"]'
    );
    expect(button?.parentElement?.getAttribute('aria-hidden')).toBe('true');

    action.unmount();
  });

  it('shows for a selected story', () => {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    Object.defineProperty(canvas, 'getBoundingClientRect', {
      value: () => ({
        left: 100,
        top: 80,
        right: 900,
        bottom: 680,
        width: 800,
        height: 600,
        x: 100,
        y: 80,
        toJSON: () => ({}),
      }),
    });

    const scene = new Scene();
    const story = new StoryElement({ x: 120, y: 160, title: 'Story' });
    scene.addElement(story);
    const { canvasManager } = createCanvasManagerStub(canvas);
    const action = new StoryQuickCreateAction(scene, canvasManager);

    action.mount(document.body);
    scene.setSelected([story]);

    const button = document.querySelector<HTMLButtonElement>(
      '[data-role="story-quick-create-action"]'
    );
    expect(button?.parentElement?.getAttribute('aria-hidden')).toBe('false');

    action.unmount();
  });

  it('hides while the viewport is moving and reappears after settling', () => {
    vi.useFakeTimers();

    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    Object.defineProperty(canvas, 'getBoundingClientRect', {
      value: () => ({
        left: 100,
        top: 80,
        right: 900,
        bottom: 680,
        width: 800,
        height: 600,
        x: 100,
        y: 80,
        toJSON: () => ({}),
      }),
    });

    const scene = new Scene();
    const story = new StoryElement({ x: 120, y: 160, title: 'Story' });
    scene.addElement(story);
    const { canvasManager, viewChanges } = createCanvasManagerStub(canvas);
    const action = new StoryQuickCreateAction(scene, canvasManager);

    action.mount(document.body);
    scene.setSelected([story]);

    const button = document.querySelector<HTMLButtonElement>(
      '[data-role="story-quick-create-action"]'
    );
    expect(button?.parentElement?.getAttribute('aria-hidden')).toBe('false');

    viewChanges.next();

    expect(button?.parentElement?.getAttribute('aria-hidden')).toBe('true');

    vi.advanceTimersByTime(139);
    expect(button?.parentElement?.getAttribute('aria-hidden')).toBe('true');

    vi.advanceTimersByTime(1);
    expect(button?.parentElement?.getAttribute('aria-hidden')).toBe('false');

    action.unmount();
  });
});
