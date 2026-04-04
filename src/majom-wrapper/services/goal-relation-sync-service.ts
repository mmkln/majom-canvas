import { Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GoalRelationsApiService } from '../data-access/goal-relations-api-service.ts';
import type {
  GoalRelation,
  GoalRelationCreate,
  GoalRelationType,
} from '../interfaces/index.ts';
import { TaskElement } from '../../features/canvas/elements/TaskElement.ts';
import { StoryElement } from '../../features/canvas/elements/StoryElement.ts';
import { GoalElement } from '../../features/canvas/elements/GoalElement.ts';
import { ConnectionRelationType } from '../../features/canvas/core/interfaces/connection.ts';
import type { PlanningGoalLink } from '../../features/canvas-core/adapters/planning/PlanningCanvasRelationAdapter.ts';

type PersistablePlanningElement = TaskElement | StoryElement | GoalElement;

type GoalRelationSyncDeps = {
  ensureElementsPersisted: (
    elements: PersistablePlanningElement[]
  ) => Observable<void>;
};

export class GoalRelationSyncService {
  constructor(
    private readonly goalRelationsApi: GoalRelationsApiService | undefined,
    private readonly deps: GoalRelationSyncDeps
  ) {}

  public createRelation(goalLink: PlanningGoalLink): Observable<GoalRelation> {
    return this.deps.ensureElementsPersisted([
      goalLink.fromGoal,
      goalLink.toGoal,
    ]).pipe(
      switchMap(() => {
        const payload = this.buildGoalRelationCreate(goalLink);
        if (!payload) {
          return throwError(
            () => new Error('Goal relation cannot be created without goal UUIDs.')
          );
        }
        return this.findGoalRelation(payload).pipe(
          switchMap((existing) => {
            if (existing) {
              return of(existing);
            }
            return this.requireGoalRelationsApi().createRelation(payload);
          })
        );
      })
    );
  }

  public updateRelation(
    currentGoalLink: PlanningGoalLink,
    nextGoalLink: PlanningGoalLink
  ): Observable<GoalRelation> {
    return this.deps.ensureElementsPersisted([
      currentGoalLink.fromGoal,
      currentGoalLink.toGoal,
      nextGoalLink.fromGoal,
      nextGoalLink.toGoal,
    ]).pipe(
      switchMap(() => {
        const currentPayload = this.buildGoalRelationQuery(currentGoalLink);
        const nextPayload = this.buildGoalRelationCreate(nextGoalLink);
        if (!currentPayload || !nextPayload) {
          return throwError(
            () => new Error('Goal relation cannot be updated without goal UUIDs.')
          );
        }
        return this.findGoalRelation(currentPayload).pipe(
          switchMap((currentRelation) => {
            if (!currentRelation) {
              return this.createRelation(nextGoalLink);
            }
            if (this.isSameGoalRelation(currentPayload, nextPayload)) {
              return of(currentRelation);
            }
            return this.findGoalRelation(nextPayload).pipe(
              switchMap((nextRelation) => {
                if (nextRelation && nextRelation.id !== currentRelation.id) {
                  return this.requireGoalRelationsApi()
                    .deleteRelation(currentRelation.id)
                    .pipe(map(() => nextRelation));
                }
                return this.requireGoalRelationsApi().updateRelation(
                  currentRelation.id,
                  {
                    from_goal_uuid: nextPayload.from_goal_uuid,
                    to_goal_uuid: nextPayload.to_goal_uuid,
                    relation_type: nextPayload.relation_type,
                  }
                );
              })
            );
          })
        );
      })
    );
  }

  public deleteRelation(goalLink: PlanningGoalLink): Observable<void> {
    const payload = this.buildGoalRelationQuery(goalLink);
    if (!payload) {
      return of(undefined);
    }
    return this.findGoalRelation(payload).pipe(
      switchMap((relation) => {
        if (!relation) {
          return of(undefined);
        }
        return this.requireGoalRelationsApi().deleteRelation(relation.id);
      })
    );
  }

  private requireGoalRelationsApi(): GoalRelationsApiService {
    if (this.goalRelationsApi) {
      return this.goalRelationsApi;
    }
    throw new Error('GoalRelationsApiService is not configured.');
  }

  private buildGoalRelationCreate(
    goalLink: PlanningGoalLink
  ): GoalRelationCreate | null {
    const normalized = this.normalizeGoalRelationInput(
      goalLink.fromGoal.uuid ?? null,
      goalLink.toGoal.uuid ?? null,
      goalLink.relationType
    );
    if (!normalized) return null;
    return {
      ...normalized,
      meta: null,
    };
  }

  private buildGoalRelationQuery(
    goalLink: PlanningGoalLink
  ): Pick<
    GoalRelationCreate,
    'from_goal_uuid' | 'to_goal_uuid' | 'relation_type'
  > | null {
    return this.normalizeGoalRelationInput(
      goalLink.fromGoal.uuid ?? null,
      goalLink.toGoal.uuid ?? null,
      goalLink.relationType
    );
  }

  private normalizeGoalRelationInput(
    fromGoalUuid: string | null,
    toGoalUuid: string | null,
    relationType: ConnectionRelationType
  ): Pick<
    GoalRelationCreate,
    'from_goal_uuid' | 'to_goal_uuid' | 'relation_type'
  > | null {
    const domainRelationType = this.mapGoalRelationTypeToBackend(relationType);
    if (!fromGoalUuid || !toGoalUuid || !domainRelationType) {
      return null;
    }
    if (domainRelationType === 'relates_to' && fromGoalUuid > toGoalUuid) {
      return {
        from_goal_uuid: toGoalUuid,
        to_goal_uuid: fromGoalUuid,
        relation_type: domainRelationType,
      };
    }
    return {
      from_goal_uuid: fromGoalUuid,
      to_goal_uuid: toGoalUuid,
      relation_type: domainRelationType,
    };
  }

  private mapGoalRelationTypeToBackend(
    relationType: ConnectionRelationType
  ): GoalRelationType | null {
    switch (relationType) {
      case ConnectionRelationType.LeadsTo:
        return 'leads_to';
      case ConnectionRelationType.Blocks:
        return 'blocks';
      case ConnectionRelationType.RelatesTo:
        return 'relates_to';
      default:
        return null;
    }
  }

  private findGoalRelation(
    params: Pick<
      GoalRelationCreate,
      'from_goal_uuid' | 'to_goal_uuid' | 'relation_type'
    >
  ): Observable<GoalRelation | null> {
    return this.requireGoalRelationsApi()
      .listRelations(params)
      .pipe(map((relations) => relations[0] ?? null));
  }

  private isSameGoalRelation(
    left: Pick<
      GoalRelationCreate,
      'from_goal_uuid' | 'to_goal_uuid' | 'relation_type'
    >,
    right: Pick<
      GoalRelationCreate,
      'from_goal_uuid' | 'to_goal_uuid' | 'relation_type'
    >
  ): boolean {
    return (
      left.from_goal_uuid === right.from_goal_uuid &&
      left.to_goal_uuid === right.to_goal_uuid &&
      left.relation_type === right.relation_type
    );
  }
}
