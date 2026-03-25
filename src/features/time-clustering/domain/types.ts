export type TimeClusteringLayoutMode = 'docked-left' | 'fullscreen';

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

export type TimeClusteringSuggestionActionType =
  | 'suggest_create_cluster'
  | 'suggest_update_cluster'
  | 'suggest_duplicate_day'
  | 'suggest_rebalance_day';

export interface TimeClusteringSuggestionAction {
  id: string;
  type: TimeClusteringSuggestionActionType;
  explanation: string;
  payload: Record<string, unknown>;
}

export interface TimeClusteringStateSnapshot {
  selectedDateKey: string;
  weekAnchorDateKey: string;
  plansByDate: Record<string, DayClusterPlan>;
  lastWarnings: DuplicationWarning[];
}
