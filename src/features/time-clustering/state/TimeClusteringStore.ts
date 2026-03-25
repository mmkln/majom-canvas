import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import type { TimeClusteringStateSnapshot, TimeClusteringViewMode } from '../domain/types.ts';
import type { TimeClusteringRepository } from '../data/TimeClusteringRepository.ts';

export type TimeClusteringStoreListener = (snapshot: TimeClusteringStateSnapshot) => void;
type TimeClusteringStoreAction =
  | { type: 'setSelectedDate'; dateKey: string }
  | { type: 'setViewMode'; mode: TimeClusteringViewMode }
  | {
      type: 'upsertDayPlan';
      plan: TimeClusteringStateSnapshot['plansByDate'][string];
    };

function todayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createDefaultSnapshot(): TimeClusteringStateSnapshot {
  return {
    selectedDateKey: todayDateKey(),
    viewMode: 'day-compact',
    plansByDate: {},
  };
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

  public setViewMode(mode: TimeClusteringViewMode): void {
    this.actions$.next({ type: 'setViewMode', mode });
  }

  public upsertDayPlan(next: TimeClusteringStateSnapshot['plansByDate'][string]): void {
    this.actions$.next({ type: 'upsertDayPlan', plan: next });
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
      case 'setSelectedDate':
        return {
          ...previous,
          selectedDateKey: action.dateKey,
        };
      case 'setViewMode':
        return {
          ...previous,
          viewMode: action.mode,
        };
      case 'upsertDayPlan':
        return {
          ...previous,
          plansByDate: {
            ...previous.plansByDate,
            [action.plan.dateKey]: action.plan,
          },
        };
      default:
        return previous;
    }
  }
}
