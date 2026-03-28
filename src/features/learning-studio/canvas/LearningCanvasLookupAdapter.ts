import { of, throwError, type Observable } from 'rxjs';
import type { Goal, PlatformTask, Story } from '../../../majom-wrapper/interfaces/index.ts';
import type {
  CanvasLookupAdapter,
  CanvasLookupPage,
} from '../../canvas-core/adapters/CanvasLookupAdapter.ts';

const EMPTY_LOOKUP_PAGE: CanvasLookupPage<never> = {
  items: [],
  hasMore: false,
};

export class LearningCanvasLookupAdapter implements CanvasLookupAdapter {
  public searchTasks(): Observable<CanvasLookupPage<PlatformTask>> {
    return of(EMPTY_LOOKUP_PAGE as CanvasLookupPage<PlatformTask>);
  }

  public searchGoals(): Observable<CanvasLookupPage<Goal>> {
    return of(EMPTY_LOOKUP_PAGE as CanvasLookupPage<Goal>);
  }

  public searchStories(): Observable<CanvasLookupPage<Story>> {
    return of(EMPTY_LOOKUP_PAGE as CanvasLookupPage<Story>);
  }

  public getStory(ref: string): Observable<Story> {
    return throwError(
      () => new Error(`Learning canvas does not provide story lookup for "${ref}".`)
    );
  }

  public getGoal(ref: string): Observable<Goal> {
    return throwError(
      () => new Error(`Learning canvas does not provide goal lookup for "${ref}".`)
    );
  }

  public fetchStoriesByIds(): Observable<Story[]> {
    return of([]);
  }
}
