import { Story as StoryDto } from '../interfaces/index.ts';
import { CanvasPositionReadDTO } from '../data-access/canvas-position-dto.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { mapStatus } from '../utils/statusMapping.ts';

const DEFAULT_X = 0;
const DEFAULT_Y = 0;

/**
 * Map a Story DTO into a canvas Story element with position.
 */
export function mapStory(
  dto: StoryDto,
  layout: CanvasPositionReadDTO[]
): StoryElement {
  const pos = layout.find((l) => {
    if (l.element_type !== 'story') return false;
    if (!dto.uuid) return false;
    return l.element_uuid === dto.uuid;
  });
  const meta = pos?.meta as
    | { width?: number; height?: number; w?: number; h?: number }
    | undefined;
  const width = meta?.width ?? meta?.w;
  const height = meta?.height ?? meta?.h;
  return new StoryElement({
    id: dto.uuid ?? dto.id.toString(),
    x: pos?.x ?? DEFAULT_X,
    y: pos?.y ?? DEFAULT_Y,
    width: typeof width === 'number' ? width : undefined,
    height: typeof height === 'number' ? height : undefined,
    backendId: dto.id,
    uuid: dto.uuid,
    goalBackendId: dto.goal?.id ?? dto.goal_id ?? null,
    title: dto.title,
    status: mapStatus(dto.status),
    description: dto.description,
  });
}


