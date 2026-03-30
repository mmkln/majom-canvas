import { describe, expect, it, vi } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { CanvasDataService } from './CanvasDataService.ts';
import { GoalElement } from '../../features/canvas/elements/GoalElement.ts';
import { Priority, Status, type Goal } from '../interfaces/index.ts';
import { ElementStatus } from '../../features/canvas/elements/ElementStatus.ts';

function createGoalDto(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 42,
    uuid: 'goal-uuid-42',
    title: 'Ship v2',
    description: 'Reach the next product milestone.',
    subgoals: {
      items: [],
      total_count: 0,
      completed_count: 0,
      is_draft: false,
    },
    tasks: [],
    stories: [],
    strategies: [],
    milestones: {
      items: [],
      total_count: 0,
      completed_count: 0,
      is_draft: false,
    },
    priority: Priority.Low,
    scale: 2,
    status: Status.Active,
    created_at: '2026-03-01T09:00:00Z',
    tags: [],
    ...overrides,
  };
}

describe('CanvasDataService goal updates', () => {
  it('serializes goal tag ids into the backend create payload', async () => {
    const created = createGoalDto({
      tags: [
        {
          id: 1,
          title: 'Focus',
          slug: 'focus',
          color: '#2563eb',
          description: null,
        },
      ],
      tag_ids: [1],
    });
    const goalsApi = {
      createGoal: vi.fn(() => of(created)),
    };
    const service = new CanvasDataService(
      {} as any,
      {} as any,
      goalsApi as any,
      {} as any,
      {} as any,
      {} as any
    );
    const goal = new GoalElement({
      title: 'Ship v2',
      description: 'Reach the next product milestone.',
      status: ElementStatus.InProgress,
      priority: 'low',
      tagIds: [1],
      tags: ['Focus'],
    });

    await firstValueFrom((service as any).ensureElementsPersisted([goal]));

    expect(goalsApi.createGoal).toHaveBeenCalledWith({
      title: 'Ship v2',
      description: 'Reach the next product milestone.',
      status: Status.Active,
      priority: Priority.Low,
      tag_ids: [1],
    });
  });

  it('serializes goal tag ids into the backend patch payload', async () => {
    const updated = createGoalDto({
      tags: [
        {
          id: 1,
          title: 'Focus',
          slug: 'focus',
          color: '#2563eb',
          description: null,
        },
        {
          id: 2,
          title: 'Strategy',
          slug: 'strategy',
          color: '#7c3aed',
          description: null,
        },
      ],
      tag_ids: [1, 2],
    });
    const goalsApi = {
      patchGoal: vi.fn(() => of(updated)),
    };
    const service = new CanvasDataService(
      {} as any,
      {} as any,
      goalsApi as any,
      {} as any,
      {} as any,
      {} as any
    );
    const goal = new GoalElement({
      title: 'Ship v2',
      backendId: 42,
      uuid: 'goal-uuid-42',
      tags: ['Focus'],
      tagIds: [1],
    });

    await firstValueFrom(
      (service as any).persistElementUpdate({
        key: 'goal:goal-uuid-42',
        element: goal,
        patch: { tagIds: [1, 2] },
      })
    );

    expect(goalsApi.patchGoal).toHaveBeenCalledWith('goal-uuid-42', {
      tag_ids: [1, 2],
    });
  });
});
