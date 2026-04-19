// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { CanvasApp } from './CanvasApp.ts';
import { Scene } from './core/scene/Scene.ts';
import { GoalElement } from './elements/GoalElement.ts';
import { ConnectionRelationType } from './core/interfaces/connection.ts';
import {
  CANVAS_LINK_LIFECYCLE_EVENT,
  type CanvasLinkLifecycleDetail,
} from './core/canvasLinkLifecycle.ts';
import { ConnectionCreationService } from './core/services/ConnectionCreationService.ts';
import { ConnectionRemovalService } from './core/services/ConnectionRemovalService.ts';
import { historyService } from './core/services/HistoryService.ts';

describe('Canvas goal-link removal flow', () => {
  beforeEach(() => {
    vi.stubGlobal('window', new EventTarget() as Window & typeof globalThis);
    historyService.reset();
  });

  afterEach(() => {
    historyService.reset();
    vi.unstubAllGlobals();
  });

  it('emits a goal-link remove lifecycle event when a goal-to-goal canvas connection is removed', () => {
    const scene = new Scene();
    const goalA = new GoalElement({ id: 'goal-a', uuid: 'goal-a-uuid' });
    const goalB = new GoalElement({ id: 'goal-b', uuid: 'goal-b-uuid' });
    scene.addElement(goalA);
    scene.addElement(goalB);

    const creationService = new ConnectionCreationService(scene);
    creationService.createWithRelationType(
      goalA,
      goalB,
      ConnectionRelationType.Blocks
    );
    historyService.reset();

    const lifecycleDetails: CanvasLinkLifecycleDetail[] = [];
    const onLifecycle = (event: Event): void => {
      lifecycleDetails.push(
        (event as CustomEvent<CanvasLinkLifecycleDetail>).detail
      );
    };

    window.addEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
    try {
      const removalService = new ConnectionRemovalService(scene);
      removalService.removeConnectionsBetweenElementAndTargets(goalA, [goalB]);

      expect(lifecycleDetails).toHaveLength(1);
      expect(lifecycleDetails[0]).toMatchObject({
        kind: 'goal-link',
        action: 'remove',
        goalLink: {
          fromGoalRef: goalA.uuid,
          toGoalRef: goalB.uuid,
          fromGoalUuid: goalA.uuid,
          toGoalUuid: goalB.uuid,
          relationType: ConnectionRelationType.Blocks,
        },
      });
    } finally {
      window.removeEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
    }
  });

  it('routes goal-link remove lifecycle requests to deleteGoalRelation in the old canvas app', () => {
    const scene = new Scene();
    const goalA = new GoalElement({ id: 'goal-a', uuid: 'goal-a-uuid' });
    const goalB = new GoalElement({ id: 'goal-b', uuid: 'goal-b-uuid' });
    scene.addElement(goalA);
    scene.addElement(goalB);

    const deleteGoalRelation = vi.fn(() => of(undefined));
    const app = Object.create(CanvasApp.prototype) as {
      scene: Scene;
      canvasDataService: {
        createGoalRelation: ReturnType<typeof vi.fn>;
        deleteGoalRelation: typeof deleteGoalRelation;
        updateGoalRelation: ReturnType<typeof vi.fn>;
      };
    };
    app.scene = scene;
    app.canvasDataService = {
      createGoalRelation: vi.fn(),
      deleteGoalRelation,
      updateGoalRelation: vi.fn(),
    };

    const request = (
      CanvasApp.prototype as unknown as {
        buildGoalLinkRequest: (
          detail: Extract<CanvasLinkLifecycleDetail, { kind: 'goal-link' }>
        ) => unknown;
      }
    ).buildGoalLinkRequest.call(app, {
      kind: 'goal-link',
      action: 'remove',
      goalLink: {
        connectionId: 'conn-1',
        lineType: 'solid',
        fromGoalRef: goalA.id,
        toGoalRef: goalB.id,
        fromGoalUuid: goalA.uuid ?? null,
        toGoalUuid: goalB.uuid ?? null,
        relationType: ConnectionRelationType.Blocks,
      },
    });

    expect(request).not.toBeNull();
    expect(deleteGoalRelation).toHaveBeenCalledWith({
      fromGoal: goalA,
      toGoal: goalB,
      relationType: ConnectionRelationType.Blocks,
    });
  });
});
