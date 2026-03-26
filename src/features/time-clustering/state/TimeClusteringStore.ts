import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import {
  duplicateDayClusters,
  normalizeCluster,
  validateClusterPlacement,
} from '../domain/rules.ts';
import {
  dayOffsetDateKey,
  isoFromDateKeyMinute,
  startOfWeekDateKey,
  todayDateKey,
} from '../domain/time.ts';
import type {
  TimeCluster,
  TimeClusterRecurrence,
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
  | { type: 'createCluster'; cluster: TimeCluster }
  | {
      type: 'updateCluster';
      clusterId: string;
      patch: Partial<TimeCluster>;
    }
  | { type: 'deleteCluster'; clusterId: string }
  | {
      type: 'duplicateDayOneOff';
      sourceDateKey: string;
      targetDateKey: string;
    }
  | { type: 'applySuggestionAction'; action: TimeClusteringSuggestionAction }
  | { type: 'applyAiSuggestionAction'; action: TimeClusteringSuggestionAction };

function createSeedCluster(params: {
  id: string;
  title: string;
  colorToken: string;
  dateKey: string;
  startMinute: number;
  endMinute: number;
  recurrence?: TimeClusterRecurrence;
}): TimeCluster {
  return normalizeCluster({
    id: params.id,
    title: params.title,
    colorToken: params.colorToken,
    startAtIso: isoFromDateKeyMinute(params.dateKey, params.startMinute),
    endAtIso: isoFromDateKeyMinute(params.dateKey, params.endMinute),
    recurrence: params.recurrence ?? 'none',
  });
}

function createDefaultSnapshot(): TimeClusteringStateSnapshot {
  const selectedDateKey = todayDateKey();
  const weekStartDateKey = startOfWeekDateKey(selectedDateKey);
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
    clusters: [
      createSeedCluster({
        id: 'seed-kickoff',
        title: 'Weekly kickoff',
        colorToken: 'orange',
        dateKey: monday,
        startMinute: 8 * 60 + 30,
        endMinute: 9 * 60 + 15,
      }),
      createSeedCluster({
        id: 'seed-support-triage',
        title: 'Support triage',
        colorToken: 'green',
        dateKey: monday,
        startMinute: 11 * 60,
        endMinute: 12 * 60,
      }),
      createSeedCluster({
        id: 'seed-user-interviews',
        title: 'User interviews',
        colorToken: 'teal',
        dateKey: tuesday,
        startMinute: 9 * 60 + 30,
        endMinute: 11 * 60,
      }),
      createSeedCluster({
        id: 'seed-design-review',
        title: 'Design review',
        colorToken: 'violet',
        dateKey: tuesday,
        startMinute: 14 * 60,
        endMinute: 15 * 60,
      }),
      createSeedCluster({
        id: 'seed-deep-work',
        title: 'Deep work',
        colorToken: 'blue',
        dateKey: wednesday,
        startMinute: 9 * 60,
        endMinute: 10 * 60 + 30,
      }),
      createSeedCluster({
        id: 'seed-planning',
        title: 'Planning',
        colorToken: 'amber',
        dateKey: wednesday,
        startMinute: 12 * 60,
        endMinute: 13 * 60,
      }),
      createSeedCluster({
        id: 'seed-async-docs',
        title: 'Async docs',
        colorToken: 'green',
        dateKey: wednesday,
        startMinute: 15 * 60,
        endMinute: 16 * 60,
      }),
      createSeedCluster({
        id: 'seed-client-prep',
        title: 'Client prep',
        colorToken: 'orange',
        dateKey: thursday,
        startMinute: 10 * 60,
        endMinute: 11 * 60,
      }),
      createSeedCluster({
        id: 'seed-prototype-build',
        title: 'Prototype build',
        colorToken: 'violet',
        dateKey: thursday,
        startMinute: 13 * 60,
        endMinute: 15 * 60,
      }),
      createSeedCluster({
        id: 'seed-release-prep',
        title: 'Release prep',
        colorToken: 'teal',
        dateKey: friday,
        startMinute: 9 * 60,
        endMinute: 10 * 60,
      }),
      createSeedCluster({
        id: 'seed-qa-sweep',
        title: 'QA sweep',
        colorToken: 'blue',
        dateKey: friday,
        startMinute: 11 * 60,
        endMinute: 12 * 60 + 30,
      }),
      createSeedCluster({
        id: 'seed-retro',
        title: 'Retro',
        colorToken: 'amber',
        dateKey: friday,
        startMinute: 16 * 60,
        endMinute: 17 * 60,
      }),
      createSeedCluster({
        id: 'seed-content-pass',
        title: 'Content pass',
        colorToken: 'orange',
        dateKey: saturday,
        startMinute: 10 * 60 + 30,
        endMinute: 11 * 60 + 30,
      }),
      createSeedCluster({
        id: 'seed-week-reset',
        title: 'Week reset',
        colorToken: 'teal',
        dateKey: sunday,
        startMinute: 17 * 60,
        endMinute: 18 * 60,
      }),
    ],
    lastWarnings: [],
  };
}

function uniqueId(): string {
  return typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `cluster_${Date.now()}_${Math.round(Math.random() * 1_000_000)}`;
}

function buildClusterFromPayload(
  payload: Record<string, unknown>,
  fallbackDateKey: string
): TimeCluster {
  const dateKey =
    typeof payload.dateKey === 'string' && payload.dateKey.length > 0
      ? payload.dateKey
      : fallbackDateKey;
  const startAtIso =
    typeof payload.startAtIso === 'string'
      ? payload.startAtIso
      : isoFromDateKeyMinute(dateKey, Number(payload.startMinute ?? 540));
  const endAtIso =
    typeof payload.endAtIso === 'string'
      ? payload.endAtIso
      : isoFromDateKeyMinute(dateKey, Number(payload.endMinute ?? 600));

  const recurrence =
    payload.recurrence === 'daily' ||
    payload.recurrence === 'weekdays' ||
    payload.recurrence === 'weekly'
      ? payload.recurrence
      : 'none';

  const recurrenceWeekdays = Array.isArray(payload.recurrenceWeekdays)
    ? payload.recurrenceWeekdays
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
    : undefined;

  return normalizeCluster({
    id: typeof payload.id === 'string' && payload.id.length > 0
      ? payload.id
      : uniqueId(),
    title:
      typeof payload.title === 'string' && payload.title.trim().length > 0
        ? payload.title
        : 'Suggested cluster',
    description:
      typeof payload.description === 'string' ? payload.description : '',
    colorToken:
      typeof payload.colorToken === 'string' && payload.colorToken.length > 0
        ? payload.colorToken
        : 'violet',
    startAtIso,
    endAtIso,
    recurrence,
    recurrenceEndDateKey:
      typeof payload.recurrenceEndDateKey === 'string'
        ? payload.recurrenceEndDateKey
        : null,
    recurrenceWeekdays,
  });
}

function buildClusterPatchFromPayload(
  payload: Record<string, unknown>,
  fallbackDateKey: string
): Partial<TimeCluster> {
  const patch: Partial<TimeCluster> = {};
  const dateKey =
    typeof payload.dateKey === 'string' && payload.dateKey.length > 0
      ? payload.dateKey
      : fallbackDateKey;

  if (typeof payload.title === 'string') {
    patch.title = payload.title;
  }
  if (typeof payload.description === 'string') {
    patch.description = payload.description;
  }
  if (typeof payload.colorToken === 'string') {
    patch.colorToken = payload.colorToken;
  }
  if (
    payload.recurrence === 'none' ||
    payload.recurrence === 'daily' ||
    payload.recurrence === 'weekdays' ||
    payload.recurrence === 'weekly'
  ) {
    patch.recurrence = payload.recurrence;
  }
  if (
    typeof payload.recurrenceEndDateKey === 'string' ||
    payload.recurrenceEndDateKey === null
  ) {
    patch.recurrenceEndDateKey = payload.recurrenceEndDateKey;
  }
  if (Array.isArray(payload.recurrenceWeekdays)) {
    patch.recurrenceWeekdays = payload.recurrenceWeekdays
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
  }
  if (typeof payload.startAtIso === 'string') {
    patch.startAtIso = payload.startAtIso;
  } else if (payload.startMinute !== undefined) {
    patch.startAtIso = isoFromDateKeyMinute(dateKey, Number(payload.startMinute));
  }
  if (typeof payload.endAtIso === 'string') {
    patch.endAtIso = payload.endAtIso;
  } else if (payload.endMinute !== undefined) {
    patch.endAtIso = isoFromDateKeyMinute(dateKey, Number(payload.endMinute));
  }

  return patch;
}

export class TimeClusteringStore {
  private readonly stateSubject: BehaviorSubject<TimeClusteringStateSnapshot>;
  private readonly actions$ = new Subject<TimeClusteringStoreAction>();
  private readonly subscriptions = new Subscription();

  constructor(private readonly repository: TimeClusteringRepository) {
    this.stateSubject = new BehaviorSubject<TimeClusteringStateSnapshot>(
      repository.load() ?? createDefaultSnapshot()
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

  public createCluster(cluster: TimeCluster): void {
    this.actions$.next({ type: 'createCluster', cluster });
  }

  public updateCluster(clusterId: string, patch: Partial<TimeCluster>): void {
    this.actions$.next({ type: 'updateCluster', clusterId, patch });
  }

  public deleteCluster(clusterId: string): void {
    this.actions$.next({ type: 'deleteCluster', clusterId });
  }

  public duplicateDayOneOff(
    sourceDateKey: string,
    targetDateKey: string
  ): void {
    this.actions$.next({
      type: 'duplicateDayOneOff',
      sourceDateKey,
      targetDateKey,
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
      case 'createCluster': {
        const normalizedCluster = normalizeCluster(action.cluster);
        const warnings = validateClusterPlacement(
          normalizedCluster,
          previous.clusters
        );
        return {
          ...previous,
          clusters: [...previous.clusters, normalizedCluster],
          lastWarnings: warnings,
        };
      }
      case 'updateCluster': {
        const nextClusters = previous.clusters.map((cluster) =>
          cluster.id === action.clusterId
            ? normalizeCluster({ ...cluster, ...action.patch })
            : cluster
        );
        const changedCluster = nextClusters.find(
          (cluster) => cluster.id === action.clusterId
        );
        if (!changedCluster) return previous;
        const restClusters = nextClusters.filter(
          (cluster) => cluster.id !== action.clusterId
        );
        return {
          ...previous,
          clusters: nextClusters,
          lastWarnings: validateClusterPlacement(changedCluster, restClusters),
        };
      }
      case 'deleteCluster':
        return {
          ...previous,
          clusters: previous.clusters.filter(
            (cluster) => cluster.id !== action.clusterId
          ),
          lastWarnings: [],
        };
      case 'duplicateDayOneOff': {
        const result = duplicateDayClusters({
          clusters: previous.clusters,
          sourceDateKey: action.sourceDateKey,
          targetDateKey: action.targetDateKey,
        });
        return {
          ...previous,
          clusters: [...previous.clusters, ...result.clusters],
          lastWarnings: result.warnings,
        };
      }
      case 'applyAiSuggestionAction':
      case 'applySuggestionAction': {
        const payload = action.action.payload;
        switch (action.action.type) {
          case 'suggest_create_cluster':
            return this.reduce(previous, {
              type: 'createCluster',
              cluster: buildClusterFromPayload(payload, previous.selectedDateKey),
            });
          case 'suggest_update_cluster': {
            const clusterId =
              typeof payload.clusterId === 'string' ? payload.clusterId : '';
            if (!clusterId) return previous;
            return this.reduce(previous, {
              type: 'updateCluster',
              clusterId,
              patch: buildClusterPatchFromPayload(
                payload,
                previous.selectedDateKey
              ),
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
