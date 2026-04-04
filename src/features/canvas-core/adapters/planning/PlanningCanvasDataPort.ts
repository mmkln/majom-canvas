import type { Observable } from 'rxjs';
import type {
  CanvasBootstrapResult,
  CanvasElementsLoadOptions,
  CanvasElementsLoadState,
  GoalRelation,
  CanvasPositionWriteDTO,
  StoryGoalLinkOptions,
  StoryGoalLinkResult,
} from '../../../../majom-wrapper/index.ts';
import type { CanvasSummary } from '../../../../majom-wrapper/data-access/canvas-api-service.ts';
import type { GoalElement } from '../../../../features/canvas/elements/GoalElement.ts';
import type { StoryElement } from '../../../../features/canvas/elements/StoryElement.ts';
import type { TaskElement } from '../../../../features/canvas/elements/TaskElement.ts';
import type { IConnection } from '../../../../features/canvas/core/interfaces/connection.ts';
import type { CanvasPlanningElement } from '../../../../features/canvas/elements/utils/planningElementCapabilities.ts';
import type {
  PlanningGoalLink,
  PlanningStoryGoalLink,
  PlanningTaskStoryLink,
} from './PlanningCanvasRelationAdapter.ts';

export type PlanningCanvasListItem = Pick<CanvasSummary, 'id' | 'name' | 'meta'>;

export interface PlanningCanvasDataPort {
  readonly elementUpdateStatusChanges: Observable<unknown>;

  loadCanvases(): Observable<CanvasSummary[]>;
  bootstrapCanvas(): Observable<CanvasBootstrapResult>;
  loadCanvasDetails(id: string): Observable<CanvasSummary>;
  getActiveCanvasId(): string | null;
  setActiveCanvas(canvas: PlanningCanvasListItem): void;
  createCanvas(name: string): Observable<PlanningCanvasListItem>;
  updateCanvasName(name: string): Observable<PlanningCanvasListItem>;
  updateCanvasNameById(
    id: string,
    name: string
  ): Observable<PlanningCanvasListItem>;
  updateCanvasFavorite(input: {
    id: string;
    name?: string;
    isFavorite: boolean;
    meta?: Record<string, unknown> | null;
  }): Observable<PlanningCanvasListItem>;
  updateCanvasGroup(input: {
    id: string;
    name?: string;
    groupId: string | null;
    groupName: string | null;
    meta?: Record<string, unknown> | null;
  }): Observable<PlanningCanvasListItem>;
  deleteCanvas(id: string): Observable<void>;

  clearElementCache(): void;
  loadElementsProgressive(
    options: CanvasElementsLoadOptions
  ): Observable<CanvasElementsLoadState>;
  loadRelations(): Observable<IConnection[]>;
  getHighlightedElementUuids(): string[];
  ensureElementsPersisted(elements: CanvasPlanningElement[]): Observable<void>;
  queueElementUpdate(
    element: CanvasPlanningElement,
    patch: Record<string, unknown>
  ): void;
  markPositionsDirty(elements: CanvasPlanningElement[]): void;
  deleteElement(element: CanvasPlanningElement): Observable<void>;
  updateTaskStoryLink(taskStoryLink: PlanningTaskStoryLink): Observable<unknown>;
  updateStoryGoalLink(
    storyGoalLink: PlanningStoryGoalLink,
    options: StoryGoalLinkOptions
  ): Observable<StoryGoalLinkResult>;
  createGoalRelation(goalLink: PlanningGoalLink): Observable<GoalRelation>;
  updateGoalRelation(
    currentGoalLink: PlanningGoalLink,
    nextGoalLink: PlanningGoalLink
  ): Observable<GoalRelation>;
  deleteGoalRelation(goalLink: PlanningGoalLink): Observable<void>;
  hasRelationChanges(
    connections: IConnection[],
    elements: Array<TaskElement | StoryElement | GoalElement>
  ): boolean;
  updateCanvasRelations(
    connections: IConnection[],
    elements: Array<TaskElement | StoryElement | GoalElement>
  ): Observable<void>;
  getRemovedPositionIds(elements: CanvasPlanningElement[]): string[];
  needsPositionRefresh(elements: CanvasPlanningElement[]): boolean;
  filterPositionUpdates(
    changes: CanvasPositionWriteDTO[]
  ): CanvasPositionWriteDTO[];
  updateLayoutBatch(changes: CanvasPositionWriteDTO[]): Observable<void>;
  deletePositions(positionIds: string[]): Observable<void>;
  refreshPositions(): Observable<void>;
}
