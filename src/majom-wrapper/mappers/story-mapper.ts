import { Story as StoryDto } from '../interfaces/index.ts';
import { CanvasPositionDTO } from '../data-access/canvas-position-dto.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { mapStatus } from '../utils/statusMapping.ts';

const DEFAULT_X = 0;
const DEFAULT_Y = 0;

/**
 * Map a Story DTO into a canvas Story element with position.
 */
export function mapStory(
  dto: StoryDto,
  layout: CanvasPositionDTO[]
): StoryElement {
  const pos = layout.find(
    (l) =>
      l.element_type === 'story' &&
      (l.element_id ?? l.object_id) === dto.id
  );
  const meta = pos?.meta as
    | { width?: number; height?: number; w?: number; h?: number }
    | undefined;
  const width = meta?.width ?? meta?.w;
  const height = meta?.height ?? meta?.h;
  return new StoryElement({
    id: dto.id.toString(),
    x: pos?.x ?? DEFAULT_X,
    y: pos?.y ?? DEFAULT_Y,
    width: typeof width === 'number' ? width : undefined,
    height: typeof height === 'number' ? height : undefined,
    title: dto.title,
    status: mapStatus(dto.status),
    description: dto.description,
  });
}
