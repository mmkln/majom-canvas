import type { Observable } from 'rxjs';
import type { Story } from '../../../../majom-wrapper/interfaces/index.ts';
import {
  ExistingEntityPicker,
  type ExistingEntityPickerOpenOptions,
  type ExistingPickerPage,
} from './ExistingEntityPicker.ts';
import { AppRuntime, createAppRuntime } from '../../../../app-runtime/index.ts';

export class ExistingStoryPicker {
  private readonly picker: ExistingEntityPicker<'existing-story', Story>;

  constructor(
    loadStoriesPage: (
      term: string,
      page: number,
      pageSize: number
    ) => Observable<ExistingPickerPage<Story>>,
    pageSize: number = 30,
    runtime: AppRuntime = createAppRuntime()
  ) {
    this.picker = new ExistingEntityPicker<'existing-story', Story>(
      loadStoriesPage,
      {
        dragKind: 'existing-story',
        getTitle: (story) => story.title || '',
        getDescription: (story) => story.description,
        getStatus: (story) => story.status,
        getPriority: (story) => story.priority,
        getUpdatedAt: (story) =>
          (story as Story & { updated_at?: unknown }).updated_at,
      },
      pageSize,
      runtime
    );
  }

  public open(options: ExistingEntityPickerOpenOptions<Story>): void {
    this.picker.open(options);
  }

  public close(): void {
    this.picker.close();
  }
}
