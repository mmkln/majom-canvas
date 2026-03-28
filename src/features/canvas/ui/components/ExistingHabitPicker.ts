import type { Observable } from 'rxjs';
import {
  Priority,
  Status,
  type Habit,
} from '../../../../majom-wrapper/interfaces/index.ts';
import { AppRuntime, createAppRuntime } from '../../../../app-runtime/index.ts';
import {
  ExistingEntityPicker,
  type ExistingEntityPickerOpenOptions,
  type ExistingPickerPage,
} from './ExistingEntityPicker.ts';
import { getRoutineStatusLabel } from '../routineStatusPresentation.ts';

export class ExistingHabitPicker {
  private readonly picker: ExistingEntityPicker<'existing-habit', Habit>;

  constructor(
    loadHabitsPage: (
      term: string,
      page: number,
      pageSize: number
    ) => Observable<ExistingPickerPage<Habit>>,
    pageSize: number = 30,
    runtime: AppRuntime = createAppRuntime()
  ) {
    this.picker = new ExistingEntityPicker<'existing-habit', Habit>(
      loadHabitsPage,
      {
        dragKind: 'existing-habit',
        getTitle: (habit) => habit.title || '',
        getDescription: (habit) => habit.description,
        getPriority: (habit) => habit.priority ?? Priority.Low,
        getStatus: (habit) => habit.status,
        formatStatusLabel: (status, runtime) =>
          getRoutineStatusLabel(
            status === Status.Archived ? Status.Archived : Status.Active,
            runtime.i18n
          ),
        getStatusChipPalette: (status) =>
          status === Status.Archived
            ? 'border-slate-200 bg-slate-100 text-slate-600'
            : 'border-blue-200/80 bg-blue-50 text-blue-700',
        getUpdatedAt: (habit) => habit.last_checked,
      },
      pageSize,
      runtime
    );
  }

  public open(options: ExistingEntityPickerOpenOptions<Habit>): void {
    this.picker.open(options);
  }

  public close(): void {
    this.picker.close();
  }
}
