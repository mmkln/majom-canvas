import type { Observable } from 'rxjs';
import type { Story } from '../../../../majom-wrapper/interfaces/index.ts';
import {
  ExistingEntityPicker,
  type ExistingEntityPickerOpenOptions,
  type ExistingPickerPage,
} from './ExistingEntityPicker.ts';

export class ExistingStoryPicker {
  private readonly picker: ExistingEntityPicker<Story>;

  constructor(
    loadStoriesPage: (
      term: string,
      page: number,
      pageSize: number
    ) => Observable<ExistingPickerPage<Story>>,
    pageSize: number = 30
  ) {
    this.picker = new ExistingEntityPicker<Story>(
      loadStoriesPage,
      {
        drawerTitle: 'Add existing story',
        searchPlaceholder: 'Search stories...',
        itemLabel: 'Story',
        dragKind: 'existing-story',
        getTitle: (story) => story.title || 'Untitled story',
        getDescription: (story) => story.description,
        getStatus: (story) => story.status,
        getPriority: (story) => story.priority,
        getUpdatedAt: (story) =>
          (story as Story & { updated_at?: unknown }).updated_at,
      },
      pageSize
    );
  }

  public open(options: ExistingEntityPickerOpenOptions<Story>): void {
    this.picker.open(options);
  }

  public close(): void {
    this.picker.close();
  }
}
