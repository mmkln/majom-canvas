import type { DayClusterPlan, TimeClusteringSuggestionAction } from '../domain/types.ts';

export interface TimeClusteringSuggestion {
  id: string;
  title: string;
  description: string;
  action: TimeClusteringSuggestionAction;
}

export interface TimeClusteringSuggestionService {
  buildSuggestions(params: {
    dateKey: string;
    existingPlans: Record<string, DayClusterPlan>;
  }): Promise<TimeClusteringSuggestion[]>;
}

export class StubTimeClusteringSuggestionService implements TimeClusteringSuggestionService {
  public async buildSuggestions(params: {
    dateKey: string;
    existingPlans: Record<string, DayClusterPlan>;
  }): Promise<TimeClusteringSuggestion[]> {
    const dayPlan = params.existingPlans[params.dateKey];
    const hasMorningCluster = dayPlan?.clusters.some((cluster) => cluster.startMinute <= 9 * 60) ?? false;

    if (!hasMorningCluster) {
      return [
        {
          id: `${params.dateKey}_morning_focus`,
          title: 'Add morning focus block',
          description: 'Protect a focused morning segment before noon.',
          action: {
            id: `${params.dateKey}_morning_focus_action`,
            type: 'suggest_create_cluster',
            explanation: 'A dedicated morning block improves predictable progress on priority work.',
            payload: {
              dateKey: params.dateKey,
              title: 'Morning Focus',
              colorToken: 'indigo',
              startMinute: 9 * 60,
              endMinute: 11 * 60,
              parallelizable: false,
            },
          },
        },
      ];
    }

    return [];
  }
}
