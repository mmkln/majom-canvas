// @vitest-environment jsdom
import { Subject } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';

import { Scene } from '../core/scene/Scene.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { StoryQuickCreateAction } from './StoryQuickCreateAction.ts';

function createCanvasManagerStub(canvas: HTMLCanvasElement): CanvasManager {
  const viewChanges = new Subject<void>();
  return {
    getCanvas: () => canvas,
    getPanZoomManager: () =>
      ({
        scale: 1,
        scrollX: 0,
        scrollY: 0,
        renderFlags: undefined,
        viewChanges,
      }) as CanvasManager['getPanZoomManager'] extends () => infer T ? T : never,
    isDraggingElements: false,
    isResizingStory: false,
    draw: () => {},
  } as unknown as CanvasManager;
}

describe('StoryQuickCreateAction', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows for a hovered story and hides when a selection exists', () => {
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
    const action = new StoryQuickCreateAction(
      scene,
      createCanvasManagerStub(canvas)
    );

    action.mount(document.body);
    (story as StoryElement & { isHovered?: boolean }).isHovered = true;
    canvas.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }));

    const button = document.querySelector<HTMLButtonElement>(
      '[data-role="story-quick-create-action"]'
    );
    expect(button).not.toBeNull();
    expect(button?.parentElement?.getAttribute('aria-hidden')).toBe('false');

    scene.setSelected([story]);

    expect(button?.parentElement?.getAttribute('aria-hidden')).toBe('true');

    action.unmount();
  });
});
