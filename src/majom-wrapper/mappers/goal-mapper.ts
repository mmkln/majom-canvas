import { Goal as GoalDto } from '../interfaces/index.ts';
import { CanvasPositionDTO } from '../data-access/canvas-position-dto.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { mapStatus } from '../utils/statusMapping.ts';

const DEFAULT_X = 0;
const DEFAULT_Y = 0;

/**
 * Map a Goal DTO into a canvas Goal element with position.
 */
export function mapGoal(
  dto: GoalDto,
  layout: CanvasPositionDTO[]
): GoalElement {
  const pos = layout.find((l) => {
    if (l.element_type !== 'goal') return false;
    if (dto.uuid && (l.element_uuid === dto.uuid || l.object_uuid === dto.uuid)) {
      return true;
    }
    return (l.element_id ?? l.object_id) === dto.id;
  });
  return new GoalElement({
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
