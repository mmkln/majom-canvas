import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type {
  CanvasBootstrapResult,
  CanvasElementsLoadOptions,
  GoalRelation,
  CanvasPositionWriteDTO,
  StoryGoalLinkOptions,
  StoryGoalLinkResult,
} from '../../../../majom-wrapper/index.ts';
import type { CanvasSummary } from '../../../../majom-wrapper/data-access/canvas-api-service.ts';
import type {
  CanvasDataAdapter,
  CanvasListItem,
  CanvasElementsLoadState,
} from '../CanvasDataAdapter.ts';
import type {
  CanvasLayoutRecord,
  CanvasNodeRecord,
  CanvasSceneNode,
} from '../CanvasNodeSemanticsAdapter.ts';
import type { IConnection } from '../../core/interfaces/connection.ts';
import type { GoalElement } from '../../elements/GoalElement.ts';
import type { StoryElement } from '../../elements/StoryElement.ts';
import type { TaskElement } from '../../elements/TaskElement.ts';
import type { GoalElement as LegacyGoalElement } from '../../../../features/canvas/elements/GoalElement.ts';
import type { StoryElement as LegacyStoryElement } from '../../../../features/canvas/elements/StoryElement.ts';
import type { TaskElement as LegacyTaskElement } from '../../../../features/canvas/elements/TaskElement.ts';
import type { IConnection as LegacyConnection } from '../../../../features/canvas/core/interfaces/connection.ts';
import type { CanvasPlanningElement as LegacyCanvasPlanningElement } from '../../../../features/canvas/elements/utils/planningElementCapabilities.ts';
import type { PlanningCanvasDataPort } from './PlanningCanvasDataPort.ts';
import {
  planningCanvasElementSemantics,
  type PlanningCanvasElement,
} from './PlanningCanvasElementSemantics.ts';
import type {
  PlanningCanvasRelationAdapter,
  PlanningGoalLink,
  PlanningStoryGoalLink,
  PlanningTaskStoryLink,
} from './PlanningCanvasRelationAdapter.ts';

type LegacyRelationalPlanningElement =
  | LegacyTaskElement
  | LegacyStoryElement
  | LegacyGoalElement;

export class PlanningCanvasDataAdapter
  implements CanvasDataAdapter, PlanningCanvasRelationAdapter
{
  public readonly elementUpdateStatusChanges: Observable<unknown>;

  constructor(private readonly port: PlanningCanvasDataPort) {
    this.elementUpdateStatusChanges = this.port.elementUpdateStatusChanges;
  }

  public loadCanvases(): Observable<CanvasSummary[]> {
    return this.port.loadCanvases();
  }

  public bootstrapCanvas(): Observable<CanvasBootstrapResult> {
    return this.port.bootstrapCanvas();
  }

  public loadCanvasDetails(id: string): Observable<CanvasSummary> {
    return this.port.loadCanvasDetails(id);
  }

  public getActiveCanvasId(): string | null {
    return this.port.getActiveCanvasId();
  }

  public setActiveCanvas(canvas: CanvasListItem): void {
    this.port.setActiveCanvas(canvas);
  }

  public createCanvas(name: string): Observable<CanvasListItem> {
    return this.port.createCanvas(name);
  }

  public updateCanvasName(name: string): Observable<CanvasListItem> {
    return this.port.updateCanvasName(name);
  }

  public updateCanvasNameById(
    id: string,
    name: string
  ): Observable<CanvasListItem> {
    return this.port.updateCanvasNameById(id, name);
  }

  public updateCanvasFavorite(input: {
    id: string;
    name?: string;
    isFavorite: boolean;
    meta?: Record<string, unknown> | null;
  }): Observable<CanvasListItem> {
    return this.port.updateCanvasFavorite(input);
  }

  public updateCanvasGroup(input: {
    id: string;
    name?: string;
    groupId: string | null;
    groupName: string | null;
    meta?: Record<string, unknown> | null;
  }): Observable<CanvasListItem> {
    return this.port.updateCanvasGroup(input);
  }

  public deleteCanvas(id: string): Observable<void> {
    return this.port.deleteCanvas(id);
  }

  public clearElementCache(): void {
    this.port.clearElementCache();
  }

  public loadElementsProgressive(
    options: CanvasElementsLoadOptions
  ): Observable<CanvasElementsLoadState> {
    return this.port.loadElementsProgressive(options).pipe(
      map((state) => {
        if (state.phase === 'layout-ready') {
          return state as unknown as CanvasElementsLoadState;
        }
        return {
          ...state,
          records: planningCanvasElementSemantics.toNodeRecords(
            state.elements as unknown as PlanningCanvasElement[]
          ),
        } as CanvasElementsLoadState;
      })
    );
  }

  public loadRelations(): Observable<IConnection[]> {
    return this.port.loadRelations().pipe(
      map((connections) => connections as unknown as IConnection[])
    );
  }

  public getHighlightedElementUuids(): string[] {
    return this.port.getHighlightedElementUuids();
  }

  public ensureElementsPersisted(records: CanvasNodeRecord[]): Observable<void> {
    return this.port.ensureElementsPersisted(
      planningCanvasElementSemantics.materializeNodes(
        records
      ) as unknown as LegacyCanvasPlanningElement[]
    );
  }

  public queueElementUpdate(
    element: CanvasSceneNode,
    patch: Record<string, unknown>
  ): void {
    this.port.queueElementUpdate(
      element as unknown as LegacyCanvasPlanningElement,
      patch
    );
  }

  public markPositionsDirty(records: CanvasNodeRecord[]): void {
    this.port.markPositionsDirty(
      planningCanvasElementSemantics.materializeNodes(
        records
      ) as unknown as LegacyCanvasPlanningElement[]
    );
  }

  public deleteElement(element: CanvasSceneNode): Observable<void> {
    return this.port.deleteElement(
      element as unknown as LegacyCanvasPlanningElement
    );
  }

  public updateTaskStoryLink(
    taskStoryLink: PlanningTaskStoryLink
  ): Observable<unknown> {
    return this.port.updateTaskStoryLink(
      {
        task: taskStoryLink.task as unknown as LegacyTaskElement,
        story: taskStoryLink.story as LegacyStoryElement | null,
      }
    );
  }

  public updateStoryGoalLink(
    storyGoalLink: PlanningStoryGoalLink,
    options: StoryGoalLinkOptions
  ): Observable<StoryGoalLinkResult> {
    return this.port.updateStoryGoalLink(
      {
        story: storyGoalLink.story as unknown as LegacyStoryElement,
        goal: storyGoalLink.goal as unknown as LegacyGoalElement,
      },
      options
    );
  }

  public createGoalRelation(
    goalLink: PlanningGoalLink
  ): Observable<GoalRelation> {
    return this.port.createGoalRelation(
      this.toLegacyGoalLinkSnapshot(goalLink)
    );
  }

  public updateGoalRelation(
    currentGoalLink: PlanningGoalLink,
    nextGoalLink: PlanningGoalLink
  ): Observable<GoalRelation> {
    return this.port.updateGoalRelation(
      this.toLegacyGoalLinkSnapshot(currentGoalLink),
      this.toLegacyGoalLinkSnapshot(nextGoalLink)
    );
  }

  public deleteGoalRelation(goalLink: PlanningGoalLink): Observable<void> {
    return this.port.deleteGoalRelation(
      this.toLegacyGoalLinkSnapshot(goalLink)
    );
  }

  public hasRelationChanges(
    connections: IConnection[],
    records: CanvasNodeRecord[]
  ): boolean {
    return this.port.hasRelationChanges(
      connections as unknown as LegacyConnection[],
      planningCanvasElementSemantics.materializeNodes(
        records
      ) as unknown as LegacyRelationalPlanningElement[]
    );
  }

  public updateCanvasRelations(
    connections: IConnection[],
    records: CanvasNodeRecord[]
  ): Observable<void> {
    return this.port.updateCanvasRelations(
      connections as unknown as LegacyConnection[],
      planningCanvasElementSemantics.materializeNodes(
        records
      ) as unknown as LegacyRelationalPlanningElement[]
    );
  }

  public getRemovedPositionIds(records: CanvasNodeRecord[]): string[] {
    return this.port.getRemovedPositionIds(
      planningCanvasElementSemantics.materializeNodes(
        records
      ) as unknown as LegacyCanvasPlanningElement[]
    );
  }

  public needsPositionRefresh(records: CanvasNodeRecord[]): boolean {
    return this.port.needsPositionRefresh(
      planningCanvasElementSemantics.materializeNodes(
        records
      ) as unknown as LegacyCanvasPlanningElement[]
    );
  }

  public filterLayoutUpdates(
    changes: CanvasLayoutRecord[]
  ): CanvasLayoutRecord[] {
    const dtoByKey = new Map(
      changes.map((change) => [toLayoutRecordKey(change), change] as const)
    );
    const filteredDtos = this.port.filterPositionUpdates(
      changes.map((change) => toCanvasPositionWriteDTO(change))
    );
    return filteredDtos
      .map((change) =>
        dtoByKey.get(
          `${change.element_type ?? 'na'}:${change.element_uuid ?? 'na'}`
        )
      )
      .filter((change): change is CanvasLayoutRecord => Boolean(change));
  }

  public updateLayoutBatch(changes: CanvasLayoutRecord[]): Observable<void> {
    return this.port.updateLayoutBatch(
      changes.map((change) => toCanvasPositionWriteDTO(change))
    );
  }

  public deletePositions(positionIds: string[]): Observable<void> {
    return this.port.deletePositions(positionIds);
  }

  public refreshPositions(): Observable<void> {
    return this.port.refreshPositions();
  }

  private toLegacyGoalLinkSnapshot(
    goalLink: PlanningGoalLink
  ): PlanningGoalLink {
    return {
      fromGoal: goalLink.fromGoal as unknown as LegacyGoalElement,
      toGoal: goalLink.toGoal as unknown as LegacyGoalElement,
      relationType: goalLink.relationType,
    } as PlanningGoalLink;
  }
}

function toCanvasPositionWriteDTO(change: CanvasLayoutRecord): CanvasPositionWriteDTO {
  return {
    element_type: change.persistRef.layoutType!,
    element_uuid: change.persistRef.layoutUuid!,
    x: change.x,
    y: change.y,
    meta: change.meta,
  };
}

function toLayoutRecordKey(change: CanvasLayoutRecord): string {
  return `${change.persistRef.layoutType ?? 'na'}:${change.persistRef.layoutUuid ?? 'na'}`;
}
