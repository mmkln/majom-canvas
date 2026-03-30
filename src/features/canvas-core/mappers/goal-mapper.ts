import { Goal as GoalDto } from '../../../majom-wrapper/interfaces/index.ts';
import { CanvasPositionReadDTO } from '../../../majom-wrapper/data-access/canvas-position-dto.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { mapStatus } from '../../../majom-wrapper/utils/statusMapping.ts';
import { normalizeUiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';

const DEFAULT_X = 0;
const DEFAULT_Y = 0;

/**
 * Map a Goal DTO into a canvas Goal element with position.
 */
export function mapGoal(
  dto: GoalDto,
  layout: CanvasPositionReadDTO[]
): GoalElement {
  const pos = layout.find((l) => {
    if (l.element_type !== 'goal') return false;
    if (!dto.uuid) return false;
    return l.element_uuid === dto.uuid;
  });
  const meta = pos?.meta as { goalScale?: number } | undefined;
  const scale =
    typeof meta?.goalScale === 'number' ? meta.goalScale : dto.scale ?? undefined;
  return new GoalElement({
    id: dto.uuid ?? dto.id.toString(),
    x: pos?.x ?? DEFAULT_X,
    y: pos?.y ?? DEFAULT_Y,
    backendId: dto.id,
    uuid: dto.uuid,
    title: dto.title,
    status: mapStatus(dto.status),
    description: dto.description ?? '',
    priority: normalizeUiPriority(dto.priority),
    tags: dto.tags.map((tag) => tag.title),
    tagIds: dto.tags.map((tag) => tag.id),
    scale,
  });
}
