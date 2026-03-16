import { PlatformTask } from '../../../majom-wrapper/interfaces/index.ts';
import { CanvasPositionReadDTO } from '../../../majom-wrapper/data-access/canvas-position-dto.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { mapStatus } from '../../../majom-wrapper/utils/statusMapping.ts';
import { normalizeUiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';

const DEFAULT_X = 0;
const DEFAULT_Y = 0;

/**
 * Map a PlatformTask DTO into a canvas Task element with position.
 */
export function mapTask(
  dto: PlatformTask,
  layout: CanvasPositionReadDTO[]
): TaskElement {
  const pos = layout.find((l) => {
    if (l.element_type !== 'task') return false;
    if (!dto.uuid) return false;
    return l.element_uuid === dto.uuid;
  });
  const dueDate =
    dto.due_date instanceof Date
      ? dto.due_date
      : dto.due_date
        ? new Date(dto.due_date)
        : null;
  return new TaskElement({
    id: dto.uuid ?? dto.id.toString(),
    x: pos?.x ?? DEFAULT_X,
    y: pos?.y ?? DEFAULT_Y,
    backendId: dto.id,
    uuid: dto.uuid,
    title: dto.title,
    status: mapStatus(dto.status),
    description: dto.description,
    priority: normalizeUiPriority(dto.priority),
    dueDate: Number.isNaN(dueDate?.getTime()) ? null : dueDate,
  });
}
