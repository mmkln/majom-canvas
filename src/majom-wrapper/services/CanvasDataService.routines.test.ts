import { describe, expect, it, vi } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { CanvasDataService } from './CanvasDataService.ts';
import { HabitElement } from '../../features/canvas/elements/HabitElement.ts';
import { Priority, Status, type Habit } from '../interfaces/index.ts';

function createHabitDto(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'routine-uuid-42',
    uuid: 'routine-uuid-42',
    title: 'Morning review',
    description: 'Review the daily plan.',
    created_at: new Date('2026-03-01T09:00:00'),
    priority: Priority.Low,
    status: Status.Active,
    last_checked: new Date('2026-03-27T09:00:00'),
    meta: null,
    is_due_today: true,
    weekly_completions: [],
    completions: [],
    ...overrides,
  };
}

describe('CanvasDataService routine completion', () => {
  it('updates a specific history day even when today already has the same checked state', async () => {
    const updated = createHabitDto({
      completions: [['2026-03-25', false]],
    });
    const habitsApi = {
      toggleHabitCompletion: vi.fn(() => of(updated)),
      patchHabit: vi.fn(),
      createHabit: vi.fn(),
    };
    const service = new CanvasDataService(
      {} as any,
      {} as any,
      {} as any,
      habitsApi as any,
      {} as any,
      {} as any
    );
    const routine = new HabitElement({
      title: 'Morning review',
      habitStatus: Status.Active,
      completedToday: false,
      completionHistory: [['2026-03-25', true]],
      backendId: 'routine-uuid-42',
      uuid: 'routine-uuid-42',
    });
    (service as any).habitsCache = [createHabitDto()];

    await firstValueFrom(
      service.setHabitCompletionToday(
        routine,
        false,
        new Date('2026-03-25T12:00:00')
      )
    );

    expect(habitsApi.toggleHabitCompletion).toHaveBeenCalledWith(
      'routine-uuid-42',
      new Date('2026-03-25T12:00:00')
    );
  });

  it('deletes routines through habits api when permanent delete is requested', async () => {
    const habitsApi = {
      toggleHabitCompletion: vi.fn(),
      patchHabit: vi.fn(),
      createHabit: vi.fn(),
      deleteHabit: vi.fn(() => of(undefined)),
    };
    const service = new CanvasDataService(
      {} as any,
      {} as any,
      {} as any,
      habitsApi as any,
      {
        deleteCanvasPosition: vi.fn(() => of(undefined)),
      } as any,
      {} as any
    );
    const routine = new HabitElement({
      title: 'Morning review',
      habitStatus: Status.Active,
      backendId: 'routine-uuid-42',
      uuid: 'routine-uuid-42',
    });

    await firstValueFrom(service.deleteElement(routine));

    expect(habitsApi.deleteHabit).toHaveBeenCalledWith('routine-uuid-42');
  });
});
