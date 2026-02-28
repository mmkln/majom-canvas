import type { Observable } from 'rxjs';
import type { Goal } from '../../../../majom-wrapper/interfaces/index.ts';
import {
  ExistingEntityPicker,
  type ExistingEntityPickerOpenOptions,
  type ExistingPickerPage,
} from './ExistingEntityPicker.ts';

export class ExistingGoalPicker {
  private readonly picker: ExistingEntityPicker<Goal>;

  constructor(
    loadGoalsPage: (
      term: string,
      page: number,
      pageSize: number
    ) => Observable<ExistingPickerPage<Goal>>,
    pageSize: number = 30
  ) {
    this.picker = new ExistingEntityPicker<Goal>(
      loadGoalsPage,
      {
        drawerTitle: 'Add existing goal',
        searchPlaceholder: 'Search goals...',
        itemLabel: 'Goal',
        dragKind: 'existing-goal',
        getTitle: (goal) => goal.title || 'Untitled goal',
        getDescription: (goal) => goal.description,
        getStatus: (goal) => goal.status,
        getPriority: (goal) => goal.priority,
        getUpdatedAt: (goal) =>
          (goal as Goal & { updated_at?: unknown }).updated_at,
      },
      pageSize
    );
  }

  public open(options: ExistingEntityPickerOpenOptions<Goal>): void {
    this.picker.open(options);
  }

  public close(): void {
    this.picker.close();
  }
}
