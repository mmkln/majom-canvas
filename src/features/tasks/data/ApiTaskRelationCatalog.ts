import { firstValueFrom } from 'rxjs';
import type { GoalsApiService } from '../../../majom-wrapper/data-access/goals-api-service.ts';
import type { StoriesApiService } from '../../../majom-wrapper/data-access/stories-api-service.ts';
import {
  normalizeTaskEditGoalOption,
  normalizeTaskEditStoryOption,
  type TaskEditRelationOption,
} from '../domain/index.ts';
import type {
  TaskRelationCatalogPort,
  TaskRelationSearchParams,
  TaskRelationSearchResult,
  TaskStoryRelationSearchParams,
} from '../ports/index.ts';

type ApiTaskRelationCatalogDeps = {
  goalsApi: Pick<GoalsApiService, 'searchGoalsForPicker'>;
  storiesApi: Pick<StoriesApiService, 'fetchStories'>;
};

function isRelationOption(
  option: TaskEditRelationOption | null
): option is TaskEditRelationOption {
  return option !== null;
}

export class ApiTaskRelationCatalog implements TaskRelationCatalogPort {
  constructor(private readonly deps: ApiTaskRelationCatalogDeps) {}

  public searchGoals = async (
    params: TaskRelationSearchParams
  ): Promise<TaskRelationSearchResult> => {
    const response = await firstValueFrom(
      this.deps.goalsApi.searchGoalsForPicker({
        search: params.query,
        page: params.page,
        pageSize: params.pageSize,
      })
    );
    return {
      items: response.results
        .map((goal) => normalizeTaskEditGoalOption(goal))
        .filter(isRelationOption),
      nextPage: response.next ? params.page + 1 : null,
    };
  };

  public searchStories = async (
    params: TaskStoryRelationSearchParams
  ): Promise<TaskRelationSearchResult> => {
    const response = await firstValueFrom(
      this.deps.storiesApi.fetchStories({
        search: params.query,
        page: params.page,
        pageSize: params.pageSize,
        ...(params.goalId !== null ? { goal: params.goalId } : {}),
      })
    );
    return {
      items: response.results
        .map((story) => normalizeTaskEditStoryOption(story))
        .filter(isRelationOption),
      nextPage: response.next ? params.page + 1 : null,
    };
  };
}
