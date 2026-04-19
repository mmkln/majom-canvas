// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Scene } from '../scene/Scene.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { KeyboardManager } from './KeyboardManager.ts';
import { ConnectionCreationService } from '../services/ConnectionCreationService.ts';
import { ConnectionRelationType } from '../interfaces/connection.ts';
import {
  CANVAS_LINK_LIFECYCLE_EVENT,
  type CanvasLinkLifecycleDetail,
} from '../canvasLinkLifecycle.ts';
import { historyService } from '../services/HistoryService.ts';

describe('KeyboardManager goal-link removal', () => {
  beforeEach(() => {
    historyService.reset();
  });

  afterEach(() => {
    historyService.reset();
  });

  it('emits a goal-link remove lifecycle event when Backspace deletes a selected goal connection', () => {
    const scene = new Scene();
    const goalA = new GoalElement({ id: 'goal-a', uuid: 'goal-a-uuid' });
    const goalB = new GoalElement({ id: 'goal-b', uuid: 'goal-b-uuid' });
    scene.addElement(goalA);
    scene.addElement(goalB);

    const creationService = new ConnectionCreationService(scene);
    creationService.createWithRelationType(
      goalA,
      goalB,
      ConnectionRelationType.LeadsTo
    );
    historyService.reset();

    const connection = scene.getConnections()[0];
    expect(connection).toBeDefined();
    scene.setSelected([connection!]);

    const lifecycleDetails: CanvasLinkLifecycleDetail[] = [];
    const onLifecycle = (event: Event): void => {
      lifecycleDetails.push(
        (event as CustomEvent<CanvasLinkLifecycleDetail>).detail
      );
    };

    window.addEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
    const keyboardManager = new KeyboardManager(scene, {
      getInteractionManager: () => ({
        cancelConnectionCreation: vi.fn(),
      }),
    } as any);

    try {
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Backspace',
          bubbles: true,
          cancelable: true,
        })
      );

      expect(scene.getConnections()).toHaveLength(0);
      expect(lifecycleDetails).toHaveLength(1);
      expect(lifecycleDetails[0]).toMatchObject({
        kind: 'goal-link',
        action: 'remove',
        goalLink: {
          fromGoalRef: goalA.uuid,
          toGoalRef: goalB.uuid,
          relationType: ConnectionRelationType.LeadsTo,
        },
      });
    } finally {
      keyboardManager.destroy();
      window.removeEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
    }
  });
});
