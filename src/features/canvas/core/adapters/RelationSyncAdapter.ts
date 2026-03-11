import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type { TaskElement } from '../../elements/TaskElement.ts';
import type { StoryElement } from '../../elements/StoryElement.ts';
import type { GoalElement } from '../../elements/GoalElement.ts';
import type { IConnection } from '../interfaces/connection.ts';

type PlanningElement = TaskElement | StoryElement | GoalElement;

type RelationSyncDataService = {
  hasRelationChanges(
    connections: IConnection[],
    elements: PlanningElement[]
  ): boolean;
  updateCanvasRelations(
    connections: IConnection[],
    elements: PlanningElement[]
  ): Observable<void>;
};

export type RelationSyncOptions = {
  showNotifications: boolean;
  throwOnError: boolean;
  relationDraftId?: string;
  errorMessage?: string;
};

export class RelationSyncAdapter {
  constructor(
    private readonly canvasDataService: RelationSyncDataService,
    private readonly getConnections: () => IConnection[],
    private readonly notifyError: (message: string) => void,
    private readonly logError: (message: string, error: unknown) => void,
    private readonly queueUnsyncedDraft: (
      draftId: string,
      payload: { relationCount: number; elementCount: number }
    ) => void
  ) {}

  public hasPendingChanges(elements: PlanningElement[]): boolean {
    return this.canvasDataService.hasRelationChanges(
      this.getConnections(),
      elements
    );
  }

  public sync$(
    elements: PlanningElement[],
    options: RelationSyncOptions
  ): Observable<void> {
    const connections = this.getConnections();
    if (!this.canvasDataService.hasRelationChanges(connections, elements)) {
      return of(undefined);
    }
    return this.canvasDataService.updateCanvasRelations(connections, elements).pipe(
      catchError((error) => {
        const errorMessage = options.errorMessage ?? 'Failed to save relations';
        if (options.relationDraftId) {
          this.queueUnsyncedDraft(options.relationDraftId, {
            relationCount: connections.length,
            elementCount: elements.length,
          });
        }
        this.logError(errorMessage, error);
        if (options.showNotifications) {
          this.notifyError(errorMessage);
        }
        if (options.throwOnError) {
          return throwError(() => error);
        }
        return of(undefined);
      })
    );
  }
}

