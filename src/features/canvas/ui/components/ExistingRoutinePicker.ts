import type { Observable } from 'rxjs';
import type { Habit } from '../../../../majom-wrapper/interfaces/index.ts';
import {
  ExistingEntityPicker,
  type ExistingEntityPickerOpenOptions,
  type ExistingPickerPage,
} from './ExistingEntityPicker.ts';

export class ExistingRoutinePicker {
  private readonly picker: ExistingEntityPicker<Habit>;

  constructor(
    loadRoutinesPage: (
      term: string,
      page: number,
      pageSize: number
    ) => Observable<ExistingPickerPage<Habit>>,
    pageSize: number = 30
  ) {
    this.picker = new ExistingEntityPicker<Habit>(
      loadRoutinesPage,
      {
        drawerTitle: 'Add existing routine',
        searchPlaceholder: 'Search routines...',
        itemLabel: 'Routine',
        dragKind: 'existing-routine',
        getTitle: (routine) => routine.title || 'Untitled routine',
        getDescription: (routine) => routine.description,
        getStatus: (routine) => routine.status,
        getUpdatedAt: (routine) =>
          (routine as Habit & { updated_at?: unknown }).updated_at,
      },
      pageSize
    );
  }

  public open(options: ExistingEntityPickerOpenOptions<Habit>): void {
    this.picker.open(options);
  }

  public close(): void {
    this.picker.close();
  }
}
