# TODO: API Integration

## Tasks
- [x] Update DTO to match backend model (`canvas`, `content_type`, `object_id`, `x`, `y`, `meta`, optional `id`).
- [x] Implement CanvasApiService endpoints GET `/canvas/layouts/` and PATCH `/canvas/layouts/batch/`.
- [x] Update CanvasDataService.loadElements() to fetch & merge tasks/stories/goals with layout.
- [x] Create mappers: `mapPlatformTask()`, `mapStory()`, `mapGoal()`.
- [ ] Initialize and render elements in `main.ts`.
- [ ] Integrate drag-and-drop batch updates with buffer.
- [x] Ensure JWT is attached to all API requests via `RxJSHttpClient`.
- [ ] Add Undo/Redo controls in UI via `CommandManager`.
- [x] Implement element palette UI: fetch Tasks, Stories, Goals via API and support search.
- [x] Enable drag-and-drop from palette onto canvas: instantiate new canvas elements at drop location.
- [ ] Track unsaved layout changes and display a Save button in the top-right when dirty.
- [ ] Implement Save button to call `CanvasDataService.updateLayoutBatch()` and persist layout to backend.

This document outlines the tasks and implementation details needed to wire up the front‑end canvas with the backend REST and real‑time services.

## 1. CanvasApiService & DTOs

**Path:** `src/majom-wrapper/data-access/CanvasApiService.ts`

- **Define DTO** in `src/majom-wrapper/data-access/CanvasPositionDTO.ts`:
  ```ts
  export interface CanvasPositionDTO {
    id?: number;
    canvas: number;
    content_type: number;
    object_id: number;
    x: number;
    y: number;
    meta?: Record<string, any>;
  }
  ```

- **Implement `CanvasApiService`**:
  ```ts
  import { Observable } from 'rxjs';
  // @ts-ignore
  import { RxJSHttpClient } from 'rxjs-http-client';
  import { CanvasPositionDTO } from './CanvasPositionDTO';

  export class CanvasApiService {
    constructor(private http: RxJSHttpClient, private readonly apiUrl: string) {}

    loadLayout(): Observable<CanvasPositionDTO[]> {
      return this.http.get<CanvasPositionDTO[]>(`${this.apiUrl}/canvas/layouts/`);
    }

    saveLayoutBatch(changes: CanvasPositionDTO[]): Observable<void> {
      return this.http.patch<void>(
        `${this.apiUrl}/canvas/layouts/batch/`,
        changes,
        { headers: {} }
      );
    }
  }
  ```

## 2. CanvasDataService (Application Service Layer)

**Path:** `src/majom-wrapper/services/CanvasDataService.ts`

- **Constructor**: inject `TasksApiService`, `StoriesApiService`, `GoalsApiService`, `CanvasApiService`.
- **Methods**:
  - `loadElements(): Observable<CanvasElement[]>`
    - Use `forkJoin` on:
      ```ts
      forkJoin({
        tasks: tasksApi.getTasks(),
        stories: storiesApi.getStories(),
        goals: goalsApi.getGoals(),
        layout: canvasApi.loadLayout()
      })
      ```
    - Map each DTO to domain object with position merged.
  - `createTask`, `updateTask`, `deleteTask` → call `TasksApiService` + return mapped `Task`.
  - Similarly for `Story` and `Goal`.
  - `updateLayoutBatch(changes: CanvasPositionDTO[])` → call `canvasApi.saveLayoutBatch(changes)`.

- **Example skeleton**:
  ```ts
  import { forkJoin, Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  import { Task, Story, Goal } from '../elements';
  import { CanvasPositionDTO } from '../data-access/CanvasPositionDTO';
  import { TasksApiService, StoriesApiService, GoalsApiService, CanvasApiService } from '../data-access';

  export class CanvasDataService {
    constructor(
      private tasksApi: TasksApiService,
      private storiesApi: StoriesApiService,
      private goalsApi: GoalsApiService,
      private canvasApi: CanvasApiService
    ) {}

    loadElements(): Observable<(Task|Story|Goal)[]> {
      return forkJoin({
        tasks: this.tasksApi.getTasks(),
        stories: this.storiesApi.getStories(),
        goals: this.goalsApi.getGoals(),
        layout: this.canvasApi.loadLayout()
      }).pipe(
        map(({ tasks, stories, goals, layout }) => {
          // apply mappers below
          return [
            ...tasks.map(t => mapPlatformTask(t, layout)),
            ...stories.map(s => mapStory(s, layout)),
            ...goals.map(g => mapGoal(g, layout))
          ];
        })
      );
    }
    // ... CRUD wrappers for tasks/stories/goals
    updateLayoutBatch(changes: CanvasPositionDTO[]): Observable<void> {
      return this.canvasApi.saveLayoutBatch(changes);
    }
  }
  ```

## 3. Mappers (DTO → Domain)

**Path:** `src/majom-wrapper/mappers/`:

- `mapPlatformTask(dto: PlatformTask, layout: CanvasPositionDTO[]): Task`
- `mapStory(dto: Story, layout: CanvasPositionDTO[]): StoryElement`
- `mapGoal(dto: Goal, layout: CanvasPositionDTO[]): GoalElement`

**Example**:
```ts
export function mapPlatformTask(
  dto: PlatformTask,
  layout: CanvasPositionDTO[]
): Task {
  const pos = layout.find(l => l.content_type === 'task' && l.object_id === dto.id);
  return new Task({
    id: dto.id.toString(),
    title: dto.title,
    description: dto.description,
    status: dto.status,
    priority: dto.priority,
    x: pos?.x ?? defaultX,
    y: pos?.y ?? defaultY,
    meta: pos?.meta
  });
}
```

## 4. Bootstrap in `main.ts`

```ts
import { RxJSHttpClient } from 'rxjs-http-client';
import { TasksApiService, StoriesApiService, GoalsApiService, CanvasApiService } from './majom-wrapper/data-access';
import { CanvasDataService } from './majom-wrapper/services/CanvasDataService';
import { Scene } from './majom-wrapper/core/Scene';
import { CanvasManager } from './majom-wrapper/ui/CanvasManager';
import { UIManager } from './majom-wrapper/ui/UIManager';
import { API_URL } from './majom-wrapper/config';

const http = new RxJSHttpClient();
const tasksApi = new TasksApiService(http, API_URL);
const storiesApi = new StoriesApiService(http, API_URL);
const goalsApi = new GoalsApiService(http, API_URL);
const canvasApi = new CanvasApiService(http, API_URL);

const dataSvc = new CanvasDataService(tasksApi, storiesApi, goalsApi, canvasApi);
const scene = new Scene();
const canvasM = new CanvasManager(scene);
const ui = new UIManager(canvasM, scene, dataSvc);

// Load and render
dataSvc.loadElements().subscribe(elements => {
  elements.forEach(el => scene.addElement(el));
  canvasM.draw();
});

ui.mountAll();
```

## 5. Commands & History (Undo/Redo)

- Implement `CreateElementCommand`, `UpdateElementCommand`, `MoveElementCommand`, `DeleteElementCommand` in `src/majom-wrapper/commands/`.
- Each `execute()` calls corresponding method on `CanvasDataService`, updates domain model, and emits change event.
- Register commands with `CommandManager` and persist undo stack in `HistoryService`.

## 6. Toolbar & Modals Integration

- **Buttons**: Bind "Create Task/Story/Goal" to dispatch `CreateElementCommand` via `CommandManager.execute()`.
- **EditElementModal**: On save, call `CanvasDataService.updateXXX()`, then `CommandManager.execute(new UpdateElementCommand(...))`.

## 7. Layout Persistence

- In `CanvasManager` or `CanvasDataService`, listen to element move events:
  ```ts
  this.interactionManager.elementMoved$
    .pipe(bufferTime(500))
    .subscribe(batch => this.dataSvc.updateLayoutBatch(batch));
  ```

## 8. Authentication Glue

- Ensure `RxJSHttpClient` attaches JWT access token stored by `AuthService` to all requests.
- On login success, reload elements via `dataSvc.loadElements()`.

## 9. Undo/Redo UI Controls

- Render Undo/Redo buttons in `CanvasToolbar`.
- Bind to `CommandManager.undo()` and `.redo()`.

---

Start implementing in the above order to establish a stable data flow, then layer on commands, persistence, and UI features.
