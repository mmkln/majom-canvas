import { PlatformTask } from '../interfaces/index.ts';
import { CanvasPositionDTO } from '../data-access/canvas-position-dto.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { mapStatus } from '../utils/statusMapping.ts';

const DEFAULT_X = 0;
const DEFAULT_Y = 0;

/**
 * Map a PlatformTask DTO into a canvas Task element with position.
 */
export function mapTask(
  dto: PlatformTask,
  layout: CanvasPositionDTO[]
): TaskElement {
  const pos = layout.find((l) => {
    if (l.element_type !== 'task') return false;
    if (dto.uuid && (l.element_uuid === dto.uuid || l.object_uuid === dto.uuid)) {
      return true;
    }
    return (l.element_id ?? l.object_id) === dto.id;
  });
  return new TaskElement({
    id: dto.uuid ?? dto.id.toString(),
    x: pos?.x ?? DEFAULT_X,
    y: pos?.y ?? DEFAULT_Y,
    backendId: dto.id,
    uuid: dto.uuid,
    title: dto.title,
    status: mapStatus(dto.status),
    description: dto.description,
  });
}
