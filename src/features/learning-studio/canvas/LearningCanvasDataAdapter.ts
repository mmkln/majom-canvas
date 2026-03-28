import { Subject, of, type Observable } from 'rxjs';
import type {
  CanvasBootstrapResult,
  CanvasElementsLoadOptions,
} from '../../../majom-wrapper/index.ts';
import type { CanvasSummary } from '../../../majom-wrapper/data-access/canvas-api-service.ts';
import type {
  CanvasDataAdapter,
  CanvasElementsLoadState,
  CanvasListItem,
} from '../../canvas-core/adapters/CanvasDataAdapter.ts';
import type {
  CanvasLayoutRecord,
  CanvasNodeRecord,
  CanvasNodeSemanticsAdapter,
  CanvasSceneNode,
} from '../../canvas-core/adapters/CanvasNodeSemanticsAdapter.ts';
import type { IConnection } from '../../canvas-core/core/interfaces/connection.ts';
import type { LearningCanvasHostApi } from './LearningCanvasHostApi.ts';
import { LearningCanvasContentStore } from './LearningCanvasContentStore.ts';

export class LearningCanvasDataAdapter implements CanvasDataAdapter {
  public readonly elementUpdateStatusChanges = new Subject<unknown>().asObservable();
  private readonly contentStore: LearningCanvasContentStore;

  constructor(
    private readonly hostApi: LearningCanvasHostApi,
    private readonly nodeSemantics: CanvasNodeSemanticsAdapter
  ) {
    this.contentStore = new LearningCanvasContentStore(hostApi);
  }

  public loadCanvases(): Observable<CanvasSummary[]> {
    return of([this.getCanvasSummary()]);
  }

  public bootstrapCanvas(): Observable<CanvasBootstrapResult> {
    const activeCanvas = this.getCanvasListItem();
    return of({
      canvases: [activeCanvas],
      activeCanvas,
    });
  }

  public loadCanvasDetails(): Observable<CanvasSummary> {
    return of(this.getCanvasSummary());
  }

  public getActiveCanvasId(): string | null {
    return this.getCanvasListItem().id;
  }

  public setActiveCanvas(): void {}

  public createCanvas(name: string): Observable<CanvasListItem> {
    return of({
      ...this.getCanvasListItem(),
      name,
    });
  }

  public updateCanvasName(name: string): Observable<CanvasListItem> {
    this.contentStore.saveCanvasTitle(name);
    return of({
      ...this.getCanvasListItem(),
      name,
    });
  }

  public updateCanvasNameById(
    _id: string,
    name: string
  ): Observable<CanvasListItem> {
    return this.updateCanvasName(name);
  }

  public updateCanvasFavorite(input: {
    id: string;
    name?: string;
    isFavorite: boolean;
    meta?: Record<string, unknown> | null;
  }): Observable<CanvasListItem> {
    return of({
      ...this.getCanvasListItem(),
      id: input.id,
      name: input.name ?? this.getCanvasListItem().name,
      meta: {
        ...(input.meta ?? {}),
        is_favorite: input.isFavorite,
      },
    });
  }

  public updateCanvasGroup(input: {
    id: string;
    name?: string;
    groupId: string | null;
    groupName: string | null;
    meta?: Record<string, unknown> | null;
  }): Observable<CanvasListItem> {
    return of({
      ...this.getCanvasListItem(),
      id: input.id,
      name: input.name ?? this.getCanvasListItem().name,
      meta: {
        ...(input.meta ?? {}),
        groupId: input.groupId,
        groupName: input.groupName,
      },
    });
  }

  public deleteCanvas(): Observable<void> {
    return of(void 0);
  }

  public clearElementCache(): void {}

  public loadElementsProgressive(
    _options: CanvasElementsLoadOptions
  ): Observable<CanvasElementsLoadState> {
    const snapshot = this.contentStore.getSnapshot();
    return of({
      phase: 'elements-ready',
      records: this.nodeSemantics.toNodeRecords(snapshot.elements),
      focusedElementUuid: null,
    });
  }

  public loadRelations(): Observable<IConnection[]> {
    return of(this.contentStore.getSnapshot().connections);
  }

  public getHighlightedElementUuids(): string[] {
    return [];
  }

  public ensureElementsPersisted(_records: CanvasNodeRecord[]): Observable<void> {
    return of(void 0);
  }

  public queueElementUpdate(
    element: CanvasSceneNode,
    patch: Record<string, unknown>
  ): void {
    this.contentStore.patchElement(element, patch);
  }

  public markPositionsDirty(_records: CanvasNodeRecord[]): void {}

  public deleteElement(element: CanvasSceneNode): Observable<void> {
    this.contentStore.deleteElement(element);
    return of(void 0);
  }

  public hasRelationChanges(
    connections: IConnection[],
    _records: CanvasNodeRecord[]
  ): boolean {
    return this.contentStore.hasRelationChanges(connections);
  }

  public updateCanvasRelations(
    connections: IConnection[],
    records: CanvasNodeRecord[]
  ): Observable<void> {
    const elements = this.nodeSemantics.materializeNodes(records);
    this.contentStore.saveStructure(elements, connections);
    return of(void 0);
  }

  public getRemovedPositionIds(_records: CanvasNodeRecord[]): string[] {
    return [];
  }

  public needsPositionRefresh(_records: CanvasNodeRecord[]): boolean {
    return false;
  }

  public filterLayoutUpdates(changes: CanvasLayoutRecord[]): CanvasLayoutRecord[] {
    return changes.filter(
      (change) => change.persistRef.layoutType === 'module'
    );
  }

  public updateLayoutBatch(changes: CanvasLayoutRecord[]): Observable<void> {
    this.contentStore.saveModuleLayouts(changes);
    return of(void 0);
  }

  public deletePositions(): Observable<void> {
    return of(void 0);
  }

  public refreshPositions(): Observable<void> {
    return of(void 0);
  }

  private getCanvasSummary(): CanvasSummary {
    const document = this.hostApi.getDocument();
    return {
      id: document.canvasId,
      name: document.title || 'Untitled course canvas',
      created_at: new Date(0).toISOString(),
      meta: {
        source: 'learning-studio',
        courseId: document.courseId,
        mode: document.mode,
      },
    };
  }

  private getCanvasListItem(): CanvasListItem {
    const summary = this.getCanvasSummary();
    return {
      id: summary.id,
      name: summary.name,
      meta: summary.meta ?? null,
    };
  }
}
