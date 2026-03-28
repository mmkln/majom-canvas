import type { Observable } from 'rxjs';
import type {
  Goal,
  PlatformTask,
  Story,
} from '../../../../majom-wrapper/interfaces/index.ts';
import type { CanvasLookupPage } from '../CanvasLookupAdapter.ts';

export interface PlanningCanvasLookupPort {
  searchTasks(
    term: string,
    page: number,
    pageSize: number
  ): Observable<CanvasLookupPage<PlatformTask>>;
  searchGoals(
    term: string,
    page: number,
    pageSize: number
  ): Observable<CanvasLookupPage<Goal>>;
  searchStories(
    term: string,
    page: number,
    pageSize: number
  ): Observable<CanvasLookupPage<Story>>;
  getStory(ref: string): Observable<Story>;
  getGoal(ref: string): Observable<Goal>;
  fetchStoriesByIds(ids: number[]): Observable<Story[]>;
}
