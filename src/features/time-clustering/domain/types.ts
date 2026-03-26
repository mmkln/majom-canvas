export type TimeClusteringLayoutMode = 'docked-left' | 'fullscreen';

export interface TimeCluster {
  id: string;
  title: string;
  colorToken: string;
  startAtIso: string;
  endAtIso: string;
}

export interface TimeClusterSegment {
  cluster: TimeCluster;
  dateKey: string; // YYYY-MM-DD in local timezone
  startMinute: number;
  endMinute: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
  isStartSegment: boolean;
  isEndSegment: boolean;
}

export interface DuplicationWarning {
  type: 'time-collision';
  sourceClusterId: string;
  targetClusterId: string;
}

export interface DuplicationResult {
  clusters: TimeCluster[];
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
  clusters: TimeCluster[];
  lastWarnings: DuplicationWarning[];
}
