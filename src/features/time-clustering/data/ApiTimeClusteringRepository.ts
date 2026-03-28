import { firstValueFrom } from 'rxjs';
import type { TimeClusteringStateSnapshot } from '../domain/types.ts';
import { TimeClusteringApiService } from '../../../majom-wrapper/data-access/time-clustering-api-service.ts';
import type { TimeClusteringRepository } from './TimeClusteringRepository.ts';

export class ApiTimeClusteringRepository implements TimeClusteringRepository {
  constructor(private readonly api: TimeClusteringApiService) {}

  public async load(): Promise<TimeClusteringStateSnapshot | null> {
    try {
      return await firstValueFrom(this.api.loadSnapshot());
    } catch (error) {
      console.warn('Time clustering snapshot load failed.', error);
      return null;
    }
  }

  public async save(snapshot: TimeClusteringStateSnapshot): Promise<void> {
    await firstValueFrom(this.api.saveSnapshot(snapshot));
  }

  public async clear(): Promise<void> {
    await firstValueFrom(this.api.clearSnapshot());
  }
}
