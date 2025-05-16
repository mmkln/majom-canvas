import { OfflineCanvasService } from './OfflineCanvasService.ts';
import { CanvasApiService } from '../data-access/canvas-api-service.ts';
import { TasksApiService } from '../data-access/tasks-api-service.ts';
import { StoriesApiService } from '../data-access/stories-api-service.ts';
import { GoalsApiService } from '../data-access/goals-api-service.ts';
import { lastValueFrom } from 'rxjs';
import { notify } from '../../core/services/NotificationService.ts';
import { CanvasPositionDTO } from '../data-access/canvas-position-dto.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { Priority as ApiPriority, Status as ApiStatus, PlatformTask, Story, Goal } from '../interfaces/index.ts';
import { ElementStatus } from '../../elements/ElementStatus.ts';

/**
 * Service to synchronize offline canvas state with server.
 */
export class CanvasSyncService {
  constructor(
    private offlineService: OfflineCanvasService,
    private canvasApi: CanvasApiService,
    private taskApi: TasksApiService,
    private storyApi: StoriesApiService,
    private goalApi: GoalsApiService
  ) {}

  /** Map element instances to Django ContentType IDs */
  private getContentTypeId(el: any): number {
    if (el instanceof TaskElement) return 1;
    if (el instanceof StoryElement) return 2;
    if (el instanceof GoalElement) return 3;
    return 0;
  }

  private mapPriority(p: 'low' | 'medium' | 'high'): ApiPriority {
    switch (p) {
      case 'low': return ApiPriority.Low;
      case 'medium': return ApiPriority.Medium;
      case 'high': return ApiPriority.High;
    }
  }

  private mapStatus(es: ElementStatus): ApiStatus {
    switch (es) {
      case ElementStatus.InProgress: return ApiStatus.Active;
      case ElementStatus.Done: return ApiStatus.Completed;
      case ElementStatus.Pending: return ApiStatus.Described;
      case ElementStatus.Defined: return ApiStatus.Draft;
      default: return ApiStatus.Active;
    }
  }

  /**
   * Flush offline-created elements and positions to server.
   */
  public async synchronizeOfflineCanvas(): Promise<void> {
    try {
      // 1. Load buffered elements
      const elements = this.offlineService.getElements();

      // 2. Create missing server entities per type
      for (const el of elements) {
        let createdId: number;
        if (el instanceof TaskElement) {
          //TODO: replace with dedicated mapper
          const dto: Partial<PlatformTask> = {
            title: el.title,
            description: el.description,
            status: this.mapStatus(el.status),
            priority: this.mapPriority(el.priority),
            due_date: el.dueDate,
          };
          const resp = await lastValueFrom<{ id: number }>(
            this.taskApi.createTask(dto)
          );
          createdId = resp.id;
        } else if (el instanceof StoryElement) {
          const dto: Partial<Story> = {
            title: el.title,
            description: el.description,
            status: this.mapStatus(el.status),
            priority: this.mapPriority(el.priority),
          };
          const resp = await lastValueFrom<{ id: number }>(
            this.storyApi.createStory(dto)
          );
          createdId = resp.id;
        } else if (el instanceof GoalElement) {
          const dto: Partial<Goal> = {
            title: el.title,
            description: el.description,
            status: this.mapStatus(el.status),
            priority: this.mapPriority(el.priority),
          };
          const resp = await lastValueFrom<{ id: number }>(
            this.goalApi.createGoal(dto)
          );
          createdId = resp.id;
        } else {
          continue;
        }
        el.id = createdId.toString();
      }

      // 3. Get existing canvas or create a new one
      let canvasId: string;
      const existingLayout = await lastValueFrom(this.canvasApi.loadLayout());
      if (existingLayout.length > 0) {
        canvasId = existingLayout[0].canvas.toString();
      } else {
        const resp = await lastValueFrom(this.canvasApi.createCanvas());
        canvasId = resp.id;
      }

      // 4. Prepare positions with canvasId
      const positions: CanvasPositionDTO[] = elements.map((e: any) => ({
        canvas: canvasId,
        content_type: this.getContentTypeId(e),
        element_type: e.constructor.name.toLowerCase(),
        object_id: Number(e.id),
        element_id: Number(e.id),
        x: e.x,
        y: e.y,
        meta: e.meta || {},
      }));
      // Use batch update endpoint for positions
      await lastValueFrom(this.canvasApi.saveLayoutBatch(positions));

      // 5. Clear buffer and notify
      this.offlineService.clearElements();
      notify('Canvas synced successfully.', 'success');
    } catch (error: any) {
      notify('Failed to sync canvas.', 'error');
      throw error;
    }
  }
}
