import { buildTimeClusterSegmentsForDate } from '../domain/projection.ts';
import { isoFromDateKeyMinute } from '../domain/time.ts';
import type {
  TimeCluster,
  TimeClusteringSuggestionAction,
} from '../domain/types.ts';

export interface TimeClusteringSuggestion {
  id: string;
  title: string;
  description: string;
  action: TimeClusteringSuggestionAction;
}

export interface TimeClusteringSuggestionService {
  buildSuggestions(params: {
    dateKey: string;
    existingClusters: TimeCluster[];
  }): Promise<TimeClusteringSuggestion[]>;
}

export class StubTimeClusteringSuggestionService
  implements TimeClusteringSuggestionService
{
  public async buildSuggestions(params: {
    dateKey: string;
    existingClusters: TimeCluster[];
  }): Promise<TimeClusteringSuggestion[]> {
    const daySegments = buildTimeClusterSegmentsForDate(
      params.dateKey,
      params.existingClusters
    );
    const hasMorningCluster = daySegments.some(
      (cluster) => cluster.startMinute < 12 * 60 && cluster.endMinute > 9 * 60
    );

    if (!hasMorningCluster) {
      return [
        {
          id: `${params.dateKey}_morning_block`,
          title: 'Add morning block',
          description: 'Reserve a dedicated morning segment before noon.',
          action: {
            id: `${params.dateKey}_morning_block_action`,
            type: 'suggest_create_cluster',
            explanation:
              'A dedicated morning block helps protect a reliable chunk of time before noon.',
            payload: {
              dateKey: params.dateKey,
              title: 'Morning block',
              colorToken: 'indigo',
              startAtIso: isoFromDateKeyMinute(params.dateKey, 9 * 60),
              endAtIso: isoFromDateKeyMinute(params.dateKey, 11 * 60),
            },
          },
        },
      ];
    }

    return [];
  }
}
