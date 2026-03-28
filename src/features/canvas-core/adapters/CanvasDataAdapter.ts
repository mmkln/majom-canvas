import type { Observable } from 'rxjs';
import type {
  CanvasBootstrapResult,
  CanvasElementsLoadOptions,
} from '../../../majom-wrapper/index.ts';
import type { CanvasSummary } from '../../../majom-wrapper/data-access/canvas-api-service.ts';
import type { CanvasLoadingPlaceholder } from '../core/types/canvasLoading.ts';
import type { IConnection } from '../core/interfaces/connection.ts';
import type {
  CanvasLayoutRecord,
  CanvasNodeRecord,
  CanvasSceneNode,
} from './CanvasNodeSemanticsAdapter.ts';

export type CanvasListItem = Pick<CanvasSummary, 'id' | 'name' | 'meta'>;

export type CanvasElementsLoadState =
  | {
      phase: 'layout-ready';
      placeholders: CanvasLoadingPlaceholder[];
      focusedElementUuid: string | null;
    }
  | {
      phase: 'elements-partial-ready';
      records: CanvasNodeRecord[];
      placeholders: CanvasLoadingPlaceholder[];
      focusedElementUuid: string | null;
    }
  | {
      phase: 'elements-ready';
      records: CanvasNodeRecord[];
      focusedElementUuid: string | null;
    };

export interface CanvasDataAdapter {
  readonly elementUpdateStatusChanges: Observable<unknown>;

  loadCanvases(): Observable<CanvasSummary[]>;
  bootstrapCanvas(): Observable<CanvasBootstrapResult>;
  loadCanvasDetails(id: string): Observable<CanvasSummary>;
  getActiveCanvasId(): string | null;
  setActiveCanvas(canvas: CanvasListItem): void;
  createCanvas(name: string): Observable<CanvasListItem>;
  updateCanvasName(name: string): Observable<CanvasListItem>;
  updateCanvasNameById(id: string, name: string): Observable<CanvasListItem>;
  updateCanvasFavorite(input: {
    id: string;
    name?: string;
    isFavorite: boolean;
    meta?: Record<string, unknown> | null;
  }): Observable<CanvasListItem>;
  updateCanvasGroup(input: {
    id: string;
    name?: string;
    groupId: string | null;
    groupName: string | null;
    meta?: Record<string, unknown> | null;
  }): Observable<CanvasListItem>;
  deleteCanvas(id: string): Observable<void>;

  clearElementCache(): void;
  loadElementsProgressive(
    options: CanvasElementsLoadOptions
  ): Observable<CanvasElementsLoadState>;
  loadRelations(): Observable<IConnection[]>;
  getHighlightedElementUuids(): string[];
  ensureElementsPersisted(records: CanvasNodeRecord[]): Observable<void>;
  queueElementUpdate(
    element: CanvasSceneNode,
    patch: Record<string, unknown>
  ): void;
  markPositionsDirty(records: CanvasNodeRecord[]): void;
  deleteElement(element: CanvasSceneNode): Observable<void>;
  hasRelationChanges(
    connections: IConnection[],
    records: CanvasNodeRecord[]
  ): boolean;
  updateCanvasRelations(
    connections: IConnection[],
    records: CanvasNodeRecord[]
  ): Observable<void>;
  getRemovedPositionIds(records: CanvasNodeRecord[]): string[];
  needsPositionRefresh(records: CanvasNodeRecord[]): boolean;
  filterLayoutUpdates(changes: CanvasLayoutRecord[]): CanvasLayoutRecord[];
  updateLayoutBatch(changes: CanvasLayoutRecord[]): Observable<void>;
  deletePositions(positionIds: string[]): Observable<void>;
  refreshPositions(): Observable<void>;
}
