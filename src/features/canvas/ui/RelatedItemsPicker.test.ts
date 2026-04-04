// @vitest-environment jsdom

import { Subject, of } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { createAppRuntime } from '../../../app-runtime/index.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { IViewState } from '../core/interfaces/interfaces.ts';
import { Scene } from '../core/scene/Scene.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import type { Goal, Story } from '../../../majom-wrapper/interfaces/index.ts';
import {
  RelatedItemsPicker,
  type RelatedItemsLookupPort,
} from './RelatedItemsPicker.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

function createCanvasManagerStub(): CanvasManager {
  type PanZoomLike = ReturnType<CanvasManager['getPanZoomManager']>;
  const panZoomChanges = new Subject<IViewState>();
  const panZoomStub = {
    scrollX: 0,
    scrollY: 0,
    scale: 1,
    viewBounds: {
      minX: -100,
      minY: -100,
      maxX: 2000,
      maxY: 2000,
    },
    viewChanges: panZoomChanges,
  } as unknown as PanZoomLike;

  return {
    draw(): void {},
    getCanvas: () =>
      ({
        getBoundingClientRect: () => new DOMRect(0, 0, 1200, 800),
      }) as unknown as HTMLCanvasElement,
    getPanZoomManager: () => panZoomStub,
    isDraggingElements: false,
    isResizingStory: false,
  } as unknown as CanvasManager;
}

function createGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 1,
    uuid: '11111111-1111-4111-8111-111111111111',
    title: 'Goal A',
    description: 'Goal description',
    created_at: '2026-04-04T00:00:00Z',
    scale: 1,
    tasks: [],
    stories: [],
    subgoals: {
      items: [],
      total_count: 0,
      completed_count: 0,
      is_draft: false,
    },
    priority: 'medium',
    status: 'todo',
    strategies: [],
    milestones: {
      items: [],
      total_count: 0,
      completed_count: 0,
      is_draft: false,
    },
    tags: [],
    ...overrides,
  };
}

function createLookupPort(relatedGoals: Goal[]): RelatedItemsLookupPort {
  return {
    getStory: () =>
      of({
        id: 1,
        title: 'Story',
        description: '',
        status: 'todo',
        priority: 'medium',
        tasks: [],
      } as Story),
    getGoalRelatedItems: () =>
      of({
        tasks: [],
        stories: [],
        goals: relatedGoals,
      }),
  };
}

describe('legacy RelatedItemsPicker', () => {
  it('shows goals tab and filters out goals already on canvas', () => {
    const scene = new Scene();
    const activeGoal = new GoalElement({
      id: 'goal-a',
      backendId: 1,
      uuid: '11111111-1111-4111-8111-111111111111',
      title: 'Goal A',
    });
    const existingGoal = new GoalElement({
      id: 'goal-b',
      backendId: 2,
      uuid: '22222222-2222-4222-8222-222222222222',
      title: 'Goal B',
    });
    scene.addElement(activeGoal);
    scene.addElement(existingGoal);
    scene.setSelected([activeGoal]);

    const picker = new RelatedItemsPicker(
      scene,
      createCanvasManagerStub(),
      createLookupPort([
        createGoal({
          id: 2,
          uuid: '22222222-2222-4222-8222-222222222222',
          title: 'Goal B',
        }),
        createGoal({
          id: 3,
          uuid: '33333333-3333-4333-8333-333333333333',
          title: 'Goal C',
        }),
      ]),
      createAppRuntime({ initialLocale: 'en' })
    );

    const container = document.createElement('div');
    document.body.appendChild(container);
    picker.mount(container);

    try {
      window.dispatchEvent(
        new CustomEvent('relatedItemsPickerRequested', {
          detail: { element: activeGoal },
        })
      );

      const goalsButton = Array.from(
        container.querySelectorAll<HTMLButtonElement>('button')
      ).find((button) => button.textContent === 'Goals');
      expect(goalsButton).toBeTruthy();
      goalsButton?.click();

      expect(container.textContent).toContain('Goal C');
      expect(container.textContent).not.toContain('Goal B');
    } finally {
      picker.unmount();
      container.remove();
    }
  });
});
