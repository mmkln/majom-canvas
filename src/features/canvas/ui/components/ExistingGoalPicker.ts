import type { Observable } from 'rxjs';
import type { Goal } from '../../../../majom-wrapper/interfaces/index.ts';
import {
  ExistingEntityPicker,
  type ExistingEntityPickerOpenOptions,
  type ExistingPickerPage,
} from './ExistingEntityPicker.ts';
import { AppRuntime, createAppRuntime } from '../../../../app-runtime/index.ts';

export class ExistingGoalPicker {
  private readonly picker: ExistingEntityPicker<'existing-goal', Goal>;

  constructor(
    loadGoalsPage: (
      term: string,
      page: number,
      pageSize: number
    ) => Observable<ExistingPickerPage<Goal>>,
    pageSize: number = 30,
    runtime: AppRuntime = createAppRuntime()
  ) {
    this.picker = new ExistingEntityPicker<'existing-goal', Goal>(
      loadGoalsPage,
      {
        dragKind: 'existing-goal',
        getTitle: (goal) => goal.title || '',
        getDescription: (goal) => goal.description,
        getStatus: (goal) => goal.status,
        getPriority: (goal) => goal.priority,
        getUpdatedAt: (goal) =>
          (goal as Goal & { updated_at?: unknown }).updated_at,
      },
      pageSize,
      runtime
    );
  }

  public open(options: ExistingEntityPickerOpenOptions<Goal>): void {
    this.picker.open(options);
  }

  public close(): void {
    this.picker.close();
  }
}
