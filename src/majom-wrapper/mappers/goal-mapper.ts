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
  const pos = layout.find(
    l => l.element_type === 'goal' && l.object_id === dto.id
  );
  return new GoalElement({
    id: dto.id.toString(),
    x: pos?.x ?? DEFAULT_X,
    y: pos?.y ?? DEFAULT_Y,
    title: dto.title,
    status: mapStatus(dto.status),
    description: dto.description,
  });
}
