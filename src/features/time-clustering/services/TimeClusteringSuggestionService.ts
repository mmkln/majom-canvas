import type { DayClusterPlan } from '../domain/types.ts';

export interface TimeClusteringSuggestion {
  id: string;
  title: string;
  description: string;
  dayPlans: DayClusterPlan[];
}

export interface TimeClusteringSuggestionService {
  buildSuggestions(params: {
    dateKey: string;
    existingPlans: Record<string, DayClusterPlan>;
  }): Promise<TimeClusteringSuggestion[]>;
}

export class StubTimeClusteringSuggestionService implements TimeClusteringSuggestionService {
  public async buildSuggestions(_params: {
    dateKey: string;
    existingPlans: Record<string, DayClusterPlan>;
  }): Promise<TimeClusteringSuggestion[]> {
    // Stage 1 skeleton: replace with AI-backed orchestration.
    return [];
  }
}
