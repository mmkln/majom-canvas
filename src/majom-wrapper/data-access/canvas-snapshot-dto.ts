import type { CanvasRelation } from '../interfaces/index.ts';
import type { CanvasMeta, CanvasSummary } from './canvas-api-service.ts';
import type { CanvasPositionReadDTO, CanvasPositionWriteDTO } from './canvas-position-dto.ts';

export type CanvasSnapshotSummary = {
  nodeCount: number;
  relationCount: number;
  taskCount: number;
  storyCount: number;
  goalCount: number;
  habitCount: number;
};

export type CanvasSnapshotDTO = {
  canvas: CanvasSummary;
  revision: number;
  positions: CanvasPositionReadDTO[];
  relations: CanvasRelation[];
  summary: CanvasSnapshotSummary;
};

export type CanvasSnapshotCanvasWriteDTO = Partial<{
  name: string;
  meta: CanvasMeta;
}>;

export type CanvasSnapshotRelationWriteDTO = Omit<
  CanvasRelation,
  'id' | 'canvas' | 'created_at' | 'updated_at'
> & {
  meta?: Record<string, unknown> | null;
};

export type CanvasSnapshotWriteDTO = {
  baseRevision: number;
  canvas?: CanvasSnapshotCanvasWriteDTO;
  positions: Array<
    Required<
      Pick<
        CanvasPositionWriteDTO,
        'element_type' | 'element_uuid' | 'x' | 'y'
      >
    > &
      Pick<CanvasPositionWriteDTO, 'meta'>
  >;
  relations: CanvasSnapshotRelationWriteDTO[];
  source?: 'manual-save' | 'autosave' | 'restore' | 'system';
};

export type CanvasSnapshotVersionListItemDTO = {
  id: string;
  revision: number;
  source: 'manual-save' | 'autosave' | 'restore' | 'system';
  summary: CanvasSnapshotSummary;
  created_at: string;
};

export type CanvasSnapshotVersionDetailDTO = CanvasSnapshotVersionListItemDTO & {
  snapshot: CanvasSnapshotDTO;
};
