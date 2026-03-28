import { map, type Observable } from 'rxjs';
import type {
  Goal,
  PlatformTask,
  Story,
} from '../../../../majom-wrapper/interfaces/index.ts';
import type {
  CanvasLookupAdapter,
  CanvasLookupPage,
} from '../CanvasLookupAdapter.ts';
import type { PlanningCanvasLookupPort } from './PlanningCanvasLookupPort.ts';

export class PlanningCanvasLookupAdapter implements CanvasLookupAdapter {
  constructor(private readonly port: PlanningCanvasLookupPort) {}

  public searchTasks(
    term: string,
    page: number,
    pageSize: number
  ): Observable<CanvasLookupPage<PlatformTask>> {
    return this.port.searchTasks(term, page, pageSize).pipe(
      map((res) => ({
        items: res.items || [],
        hasMore: Boolean(res.hasMore),
      }))
    );
  }

  public searchGoals(
    term: string,
    page: number,
    pageSize: number
  ): Observable<CanvasLookupPage<Goal>> {
    return this.port.searchGoals(term, page, pageSize).pipe(
      map((res) => ({
        items: res.items || [],
        hasMore: Boolean(res.hasMore),
      }))
    );
  }

  public searchStories(
    term: string,
    page: number,
    pageSize: number
  ): Observable<CanvasLookupPage<Story>> {
    return this.port.searchStories(term, page, pageSize).pipe(
      map((res) => ({
        items: res.items || [],
        hasMore: Boolean(res.hasMore),
      }))
    );
  }

  public getStory(ref: string): Observable<Story> {
    return this.port.getStory(ref);
  }

  public getGoal(ref: string): Observable<Goal> {
    return this.port.getGoal(ref);
  }

  public fetchStoriesByIds(ids: number[]): Observable<Story[]> {
    return this.port.fetchStoriesByIds(ids);
  }
}
