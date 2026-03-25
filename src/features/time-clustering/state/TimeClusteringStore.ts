import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import {
  duplicateDayPlanKeepBoth,
  normalizeCluster,
  validateClusterPlacement,
} from '../domain/rules.ts';
import type {
  DayClusterPlan,
  TimeCluster,
  TimeClusteringStateSnapshot,
  TimeClusteringSuggestionAction,
} from '../domain/types.ts';
import type { TimeClusteringRepository } from '../data/TimeClusteringRepository.ts';

export type TimeClusteringStoreListener = (
  snapshot: TimeClusteringStateSnapshot
) => void;
type TimeClusteringStoreAction =
  | { type: 'initializeFromStorage'; snapshot: TimeClusteringStateSnapshot }
  | { type: 'setSelectedDate'; dateKey: string }
  | { type: 'setWeekAnchor'; dateKey: string }
  | {
      type: 'upsertDayPlan';
      plan: TimeClusteringStateSnapshot['plansByDate'][string];
    }
  | { type: 'createCluster'; dateKey: string; cluster: TimeCluster }
  | {
      type: 'updateCluster';
      dateKey: string;
      clusterId: string;
      patch: Partial<TimeCluster>;
    }
  | { type: 'deleteCluster'; dateKey: string; clusterId: string }
  | {
      type: 'duplicateDayOneOff';
      sourceDateKey: string;
      targetDateKey: string;
      nowIso: string;
    }
  | { type: 'applySuggestionAction'; action: TimeClusteringSuggestionAction }
  | { type: 'applyAiSuggestionAction'; action: TimeClusteringSuggestionAction };

function todayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(dateKey: string): Date | null {
  const date = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayOffsetDateKey(baseDateKey: string, offset: number): string {
  const date = dateFromKey(baseDateKey);
  if (!date) return baseDateKey;
  date.setDate(date.getDate() + offset);
  return dateKeyFromDate(date);
}

function startOfWeekDateKey(baseDateKey: string): string {
  const date = dateFromKey(baseDateKey);
  if (!date) return baseDateKey;
  const weekday = date.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + diff);
  return dateKeyFromDate(date);
}

function createSeedPlan(
  dateKey: string,
  nowIso: string,
  clusters: TimeCluster[]
): DayClusterPlan {
  return {
    dateKey,
    clusters,
    updatedAtIso: nowIso,
  };
}

function createDefaultSnapshot(): TimeClusteringStateSnapshot {
  const selectedDateKey = todayDateKey();
  const weekStartDateKey = startOfWeekDateKey(selectedDateKey);
  const nowIso = new Date().toISOString();
  const weekDateKeys = Array.from({ length: 7 }, (_, index) =>
    dayOffsetDateKey(weekStartDateKey, index)
  );
  const [
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday,
  ] = weekDateKeys;

  return {
    selectedDateKey,
    weekAnchorDateKey: selectedDateKey,
    plansByDate: {
      [monday]: createSeedPlan(monday, nowIso, [
        {
          id: 'seed-kickoff',
          title: 'Weekly kickoff',
          colorToken: 'orange',
          startMinute: 8 * 60 + 30,
          endMinute: 9 * 60 + 15,
          parallelizable: false,
        },
        {
          id: 'seed-support-triage',
          title: 'Support triage',
          colorToken: 'green',
          startMinute: 11 * 60,
          endMinute: 12 * 60,
          parallelizable: false,
        },
      ]),
      [tuesday]: createSeedPlan(tuesday, nowIso, [
        {
          id: 'seed-user-interviews',
          title: 'User interviews',
          colorToken: 'teal',
          startMinute: 9 * 60 + 30,
          endMinute: 11 * 60,
          parallelizable: false,
        },
        {
          id: 'seed-design-review',
          title: 'Design review',
          colorToken: 'violet',
          startMinute: 14 * 60,
          endMinute: 15 * 60,
          parallelizable: false,
        },
      ]),
      [wednesday]: createSeedPlan(wednesday, nowIso, [
        {
          id: 'seed-deep-work',
          title: 'Deep work',
          colorToken: 'blue',
          startMinute: 9 * 60,
          endMinute: 10 * 60 + 30,
          parallelizable: false,
        },
        {
          id: 'seed-planning',
          title: 'Planning',
          colorToken: 'amber',
          startMinute: 12 * 60,
          endMinute: 13 * 60,
          parallelizable: false,
        },
        {
          id: 'seed-async-docs',
          title: 'Async docs',
          colorToken: 'green',
          startMinute: 15 * 60,
          endMinute: 16 * 60,
          parallelizable: true,
        },
      ]),
      [thursday]: createSeedPlan(thursday, nowIso, [
        {
          id: 'seed-client-prep',
          title: 'Client prep',
          colorToken: 'orange',
          startMinute: 10 * 60,
          endMinute: 11 * 60,
          parallelizable: false,
        },
        {
          id: 'seed-prototype-build',
          title: 'Prototype build',
          colorToken: 'violet',
          startMinute: 13 * 60,
          endMinute: 15 * 60,
          parallelizable: false,
        },
      ]),
      [friday]: createSeedPlan(friday, nowIso, [
        {
          id: 'seed-release-prep',
          title: 'Release prep',
          colorToken: 'teal',
          startMinute: 9 * 60,
          endMinute: 10 * 60,
          parallelizable: false,
        },
        {
          id: 'seed-qa-sweep',
          title: 'QA sweep',
          colorToken: 'blue',
          startMinute: 11 * 60,
          endMinute: 12 * 60 + 30,
          parallelizable: false,
        },
        {
          id: 'seed-retro',
          title: 'Retro',
          colorToken: 'amber',
          startMinute: 16 * 60,
          endMinute: 17 * 60,
          parallelizable: false,
        },
      ]),
      [saturday]: createSeedPlan(saturday, nowIso, [
        {
          id: 'seed-content-pass',
          title: 'Content pass',
          colorToken: 'orange',
          startMinute: 10 * 60 + 30,
          endMinute: 11 * 60 + 30,
          parallelizable: true,
        },
      ]),
      [sunday]: createSeedPlan(sunday, nowIso, [
        {
          id: 'seed-week-reset',
          title: 'Week reset',
          colorToken: 'teal',
          startMinute: 17 * 60,
          endMinute: 18 * 60,
          parallelizable: false,
        },
      ]),
    },
    lastWarnings: [],
  };
}

function createEmptyDayPlan(dateKey: string, nowIso: string): DayClusterPlan {
  return {
    dateKey,
    clusters: [],
    updatedAtIso: nowIso,
  };
}

function uniqueId(): string {
  return typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `cluster_${Date.now()}_${Math.round(Math.random() * 1_000_000)}`;
}

export class TimeClusteringStore {
  private readonly stateSubject: BehaviorSubject<TimeClusteringStateSnapshot>;
  private readonly actions$ = new Subject<TimeClusteringStoreAction>();
  private readonly subscriptions = new Subscription();

  constructor(private readonly repository: TimeClusteringRepository) {
    const persistedSnapshot = repository.load();
    this.stateSubject = new BehaviorSubject<TimeClusteringStateSnapshot>(
      persistedSnapshot && Object.keys(persistedSnapshot.plansByDate).length > 0
        ? persistedSnapshot
        : createDefaultSnapshot()
    );
    this.subscriptions.add(
      this.actions$.subscribe((action) => {
        const next = this.reduce(this.stateSubject.value, action);
        this.stateSubject.next(next);
        this.repository.save(next);
      })
    );
  }

  public get state$() {
    return this.stateSubject.asObservable();
  }

  public getSnapshot(): TimeClusteringStateSnapshot {
    return this.stateSubject.value;
  }

  public subscribe(listener: TimeClusteringStoreListener): () => void {
    const subscription = this.state$.subscribe(listener);
    return () => {
      subscription.unsubscribe();
    };
  }

  public setSelectedDate(dateKey: string): void {
    this.actions$.next({ type: 'setSelectedDate', dateKey });
  }

  public setActiveDay(dateKey: string): void {
    this.actions$.next({ type: 'setSelectedDate', dateKey });
  }

  public setWeekAnchor(dateKey: string): void {
    this.actions$.next({ type: 'setWeekAnchor', dateKey });
  }

  public upsertDayPlan(
    next: TimeClusteringStateSnapshot['plansByDate'][string]
  ): void {
    this.actions$.next({ type: 'upsertDayPlan', plan: next });
  }

  public createCluster(dateKey: string, cluster: TimeCluster): void {
    this.actions$.next({ type: 'createCluster', dateKey, cluster });
  }

  public updateCluster(
    dateKey: string,
    clusterId: string,
    patch: Partial<TimeCluster>
  ): void {
    this.actions$.next({ type: 'updateCluster', dateKey, clusterId, patch });
  }

  public deleteCluster(dateKey: string, clusterId: string): void {
    this.actions$.next({ type: 'deleteCluster', dateKey, clusterId });
  }

  public duplicateDayOneOff(
    sourceDateKey: string,
    targetDateKey: string
  ): void {
    this.actions$.next({
      type: 'duplicateDayOneOff',
      sourceDateKey,
      targetDateKey,
      nowIso: new Date().toISOString(),
    });
  }

  public applySuggestionAction(action: TimeClusteringSuggestionAction): void {
    this.actions$.next({ type: 'applySuggestionAction', action });
  }

  public applyAiSuggestionAction(action: TimeClusteringSuggestionAction): void {
    this.actions$.next({ type: 'applyAiSuggestionAction', action });
  }

  public initializeFromStorage(snapshot: TimeClusteringStateSnapshot): void {
    this.actions$.next({ type: 'initializeFromStorage', snapshot });
  }

  public destroy(): void {
    this.subscriptions.unsubscribe();
    this.actions$.complete();
    this.stateSubject.complete();
  }

  private reduce(
    previous: TimeClusteringStateSnapshot,
    action: TimeClusteringStoreAction
  ): TimeClusteringStateSnapshot {
    switch (action.type) {
      case 'initializeFromStorage':
        return action.snapshot;
      case 'setSelectedDate':
        return {
          ...previous,
          selectedDateKey: action.dateKey,
          weekAnchorDateKey: action.dateKey,
        };
      case 'setWeekAnchor':
        return {
          ...previous,
          weekAnchorDateKey: action.dateKey,
        };
      case 'upsertDayPlan':
        return {
          ...previous,
          plansByDate: {
            ...previous.plansByDate,
            [action.plan.dateKey]: action.plan,
          },
          lastWarnings: [],
        };
      case 'createCluster': {
        const nowIso = new Date().toISOString();
        const currentPlan =
          previous.plansByDate[action.dateKey] ??
          createEmptyDayPlan(action.dateKey, nowIso);
        const normalizedCluster = normalizeCluster(action.cluster);
        const warnings = validateClusterPlacement(
          normalizedCluster,
          currentPlan.clusters
        );
        return {
          ...previous,
          plansByDate: {
            ...previous.plansByDate,
            [action.dateKey]: {
              ...currentPlan,
              updatedAtIso: nowIso,
              clusters: [...currentPlan.clusters, normalizedCluster],
            },
          },
          lastWarnings: warnings,
        };
      }
      case 'updateCluster': {
        const nowIso = new Date().toISOString();
        const currentPlan = previous.plansByDate[action.dateKey];
        if (!currentPlan) return previous;
        const nextClusters = currentPlan.clusters.map((cluster) =>
          cluster.id === action.clusterId
            ? normalizeCluster({ ...cluster, ...action.patch })
            : cluster
        );
        const changedCluster = nextClusters.find(
          (cluster) => cluster.id === action.clusterId
        );
        const restClusters = nextClusters.filter(
          (cluster) => cluster.id !== action.clusterId
        );
        const warnings = changedCluster
          ? validateClusterPlacement(changedCluster, restClusters)
          : [];
        return {
          ...previous,
          plansByDate: {
            ...previous.plansByDate,
            [action.dateKey]: {
              ...currentPlan,
              updatedAtIso: nowIso,
              clusters: nextClusters,
            },
          },
          lastWarnings: warnings,
        };
      }
      case 'deleteCluster': {
        const nowIso = new Date().toISOString();
        const currentPlan = previous.plansByDate[action.dateKey];
        if (!currentPlan) return previous;
        return {
          ...previous,
          plansByDate: {
            ...previous.plansByDate,
            [action.dateKey]: {
              ...currentPlan,
              updatedAtIso: nowIso,
              clusters: currentPlan.clusters.filter(
                (cluster) => cluster.id !== action.clusterId
              ),
            },
          },
          lastWarnings: [],
        };
      }
      case 'duplicateDayOneOff': {
        const sourcePlan = previous.plansByDate[action.sourceDateKey];
        if (!sourcePlan) return previous;
        const result = duplicateDayPlanKeepBoth({
          source: sourcePlan,
          targetDateKey: action.targetDateKey,
          targetExisting: previous.plansByDate[action.targetDateKey] ?? null,
          nowIso: action.nowIso,
        });
        return {
          ...previous,
          plansByDate: {
            ...previous.plansByDate,
            [action.targetDateKey]: result.plan,
          },
          lastWarnings: result.warnings,
        };
      }
      case 'applyAiSuggestionAction':
      case 'applySuggestionAction': {
        const payload = action.action.payload;
        switch (action.action.type) {
          case 'suggest_create_cluster': {
            const dateKey =
              typeof payload.dateKey === 'string' && payload.dateKey.length > 0
                ? payload.dateKey
                : previous.selectedDateKey;
            const title =
              typeof payload.title === 'string'
                ? payload.title
                : 'Suggested cluster';
            const cluster: TimeCluster = normalizeCluster({
              id: uniqueId(),
              title,
              colorToken:
                typeof payload.colorToken === 'string'
                  ? payload.colorToken
                  : 'violet',
              startMinute: Number(payload.startMinute ?? 540),
              endMinute: Number(payload.endMinute ?? 600),
              parallelizable: Boolean(payload.parallelizable),
            });
            return this.reduce(previous, {
              type: 'createCluster',
              dateKey,
              cluster,
            });
          }
          case 'suggest_update_cluster': {
            const dateKey =
              typeof payload.dateKey === 'string' && payload.dateKey.length > 0
                ? payload.dateKey
                : previous.selectedDateKey;
            const clusterId =
              typeof payload.clusterId === 'string' ? payload.clusterId : '';
            if (!clusterId) return previous;
            return this.reduce(previous, {
              type: 'updateCluster',
              dateKey,
              clusterId,
              patch: payload as Partial<TimeCluster>,
            });
          }
          case 'suggest_duplicate_day': {
            const sourceDateKey =
              typeof payload.sourceDateKey === 'string'
                ? payload.sourceDateKey
                : previous.selectedDateKey;
            const targetDateKey =
              typeof payload.targetDateKey === 'string'
                ? payload.targetDateKey
                : previous.selectedDateKey;
            return this.reduce(previous, {
              type: 'duplicateDayOneOff',
              sourceDateKey,
              targetDateKey,
              nowIso: new Date().toISOString(),
            });
          }
          case 'suggest_rebalance_day':
          default:
            return previous;
        }
      }
      default:
        return previous;
    }
  }
}
