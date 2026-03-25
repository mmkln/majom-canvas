export type TimeClusteringViewMode = 'day-compact' | 'week-fullscreen';

export interface TimeCluster {
  id: string;
  title: string;
  colorToken: string;
  startMinute: number;
  endMinute: number;
  parallelizable: boolean;
}

export interface DayClusterPlan {
  dateKey: string; // YYYY-MM-DD in local timezone
  clusters: TimeCluster[];
  updatedAtIso: string;
}

export interface DuplicationWarning {
  type: 'time-collision';
  sourceClusterId: string;
  targetClusterId: string;
}

export interface DuplicationResult {
  plan: DayClusterPlan;
  warnings: DuplicationWarning[];
}

export interface TimeClusteringStateSnapshot {
  selectedDateKey: string;
  viewMode: TimeClusteringViewMode;
  plansByDate: Record<string, DayClusterPlan>;
}
