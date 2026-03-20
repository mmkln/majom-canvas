import type { CanvasPositionReadDTO } from '../../../majom-wrapper/data-access/canvas-position-dto.ts';
import type { Habit } from '../../../majom-wrapper/interfaces/index.ts';
import { mapStatus } from '../../../majom-wrapper/utils/statusMapping.ts';
import { RoutineElement } from '../elements/RoutineElement.ts';

const DEFAULT_X = 0;
const DEFAULT_Y = 0;

function getHabitUuid(habit: Habit): string {
  const rawUuid = (habit as Habit & { uuid?: unknown }).uuid;
  if (typeof rawUuid === 'string' && rawUuid.trim().length > 0) {
    return rawUuid;
  }
  return `habit-${habit.id}`;
}

export function mapRoutine(
  dto: Habit,
  layout: CanvasPositionReadDTO[]
): RoutineElement {
  const routineUuid = getHabitUuid(dto);
  const pos = layout.find(
    (entry) =>
      entry.element_type === 'routine' && entry.element_uuid === routineUuid
  );
  return new RoutineElement({
    id: routineUuid,
    uuid: routineUuid,
    backendId: dto.id,
    x: pos?.x ?? DEFAULT_X,
    y: pos?.y ?? DEFAULT_Y,
    title: dto.title,
    description: dto.description,
    status: mapStatus(dto.status),
  });
}
