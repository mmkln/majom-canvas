import { map } from 'rxjs/operators';
import { environment } from '../../../../config/environment.ts';
import {
  CanvasApiService,
  CanvasDataService,
  CanvasRelationsApiService,
  GoalsApiService,
  HabitsApiService,
  StoriesApiService,
  TasksApiService,
} from '../../../../majom-wrapper/index.ts';
import { HttpInterceptorClient } from '../../../../majom-wrapper/data-access/http-interceptor.ts';
import type { CanvasCoreAdapters } from '../CanvasCoreAdapters.ts';
import type { PlanningCanvasLookupPort } from './PlanningCanvasLookupPort.ts';
import { PlanningCanvasAlignmentAdapter } from './PlanningCanvasAlignmentAdapter.ts';
import { PlanningCanvasAppearanceAdapter } from './PlanningCanvasAppearanceAdapter.ts';
import { PlanningCanvasDataAdapter } from './PlanningCanvasDataAdapter.ts';
import { PlanningCanvasInteractionAdapter } from './PlanningCanvasInteractionAdapter.ts';
import { PlanningCanvasLookupAdapter } from './PlanningCanvasLookupAdapter.ts';
import { PlanningCanvasRelationBridge } from './PlanningCanvasRelationBridge.ts';
import { planningCanvasElementSemantics } from './PlanningCanvasElementSemantics.ts';
import { PlanningCanvasPersistenceAdapter } from './PlanningCanvasPersistenceAdapter.ts';
import { PlanningCanvasUiAdapter } from './PlanningCanvasUiAdapter.ts';
import { LocalStorageDataProvider } from '../../../canvas/core/data/LocalStorageDataProvider.ts';
import { LocalStorageCanvasDraftRepository } from '../../drafts/LocalStorageCanvasDraftRepository.ts';

function createPlanningCanvasLookupPort(): PlanningCanvasLookupPort {
  const http = new HttpInterceptorClient(environment.apiUrl);
  const tasksApi = new TasksApiService(http);
  const goalsApi = new GoalsApiService(http);
  const storiesApi = new StoriesApiService(http);

  return {
    searchTasks(term, page, pageSize) {
      return tasksApi
        .fetchTasks({
          page,
          pageSize,
          search: term || undefined,
        })
        .pipe(
          map((res) => ({
            items: res.results || [],
            hasMore: Boolean(res.next),
          }))
        );
    },

    searchGoals(term, page, pageSize) {
      return goalsApi
        .fetchGoals({
          page,
          pageSize,
          search: term || undefined,
        })
        .pipe(
          map((res) => ({
            items: res.results || [],
            hasMore: Boolean(res.next),
          }))
        );
    },

    searchStories(term, page, pageSize) {
      return storiesApi
        .fetchStories({
          page,
          pageSize,
          search: term || undefined,
        })
        .pipe(
          map((res) => ({
            items: res.results || [],
            hasMore: Boolean(res.next),
          }))
        );
    },

    getStory(ref) {
      return storiesApi.getStory(ref);
    },

    getGoal(ref) {
      return goalsApi.getGoal(ref);
    },

    fetchStoriesByIds(ids) {
      return storiesApi.fetchStoriesByIds(ids);
    },
  };
}

function createPlanningCanvasDataService(): CanvasDataService {
  const http = new HttpInterceptorClient(environment.apiUrl);
  return new CanvasDataService(
    new TasksApiService(http),
    new StoriesApiService(http),
    new GoalsApiService(http),
    new HabitsApiService(http),
    new CanvasApiService(http),
    new CanvasRelationsApiService(http)
  );
}

export function createPlanningCanvasAdapters(): CanvasCoreAdapters {
  // This bundle is ready for task/story/goal planning flows.
  // Habit parity still lives in the legacy canvas runtime.
  const dataPort = createPlanningCanvasDataService();
  const data = new PlanningCanvasDataAdapter(dataPort);
  const relations = new PlanningCanvasRelationBridge(dataPort);

  return {
    alignment: new PlanningCanvasAlignmentAdapter(),
    appearance: new PlanningCanvasAppearanceAdapter(),
    data,
    drafts: new LocalStorageCanvasDraftRepository(),
    interaction: new PlanningCanvasInteractionAdapter(),
    lookup: new PlanningCanvasLookupAdapter(createPlanningCanvasLookupPort()),
    nodeSemantics: planningCanvasElementSemantics,
    persistence: new PlanningCanvasPersistenceAdapter(
      new LocalStorageDataProvider()
    ),
    planningRelations: relations,
    ui: new PlanningCanvasUiAdapter(),
  };
}
