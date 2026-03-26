import type { Observable } from 'rxjs';
import type { PlatformTask } from '../../../../majom-wrapper/interfaces/index.ts';
import {
  ExistingEntityPicker,
  type ExistingEntityPickerOpenOptions,
  type ExistingPickerPage,
} from './ExistingEntityPicker.ts';
import { AppRuntime, createAppRuntime } from '../../../../app-runtime/index.ts';

export class ExistingTaskPicker {
  private readonly picker: ExistingEntityPicker<'existing-task', PlatformTask>;

  constructor(
    loadTasksPage: (
      term: string,
      page: number,
      pageSize: number
    ) => Observable<ExistingPickerPage<PlatformTask>>,
    pageSize: number = 30,
    runtime: AppRuntime = createAppRuntime()
  ) {
    this.picker = new ExistingEntityPicker<'existing-task', PlatformTask>(
      loadTasksPage,
      {
        dragKind: 'existing-task',
        getTitle: (task) => task.title || '',
        getDescription: (task) => task.description,
        getStatus: (task) => task.status,
        getPriority: (task) => task.priority,
        getUpdatedAt: (task) =>
          (task as PlatformTask & { updated_at?: unknown }).updated_at,
      },
      pageSize,
      runtime
    );
  }

  public open(options: ExistingEntityPickerOpenOptions<PlatformTask>): void {
    this.picker.open(options);
  }

  public close(): void {
    this.picker.close();
  }
}
