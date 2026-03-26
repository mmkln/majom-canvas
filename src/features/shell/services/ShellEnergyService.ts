import { firstValueFrom } from 'rxjs';
import { first } from 'rxjs/operators';
import { environment } from '../../../config/environment.ts';
import { AuthService } from '../../../majom-wrapper/data-access/auth-service.ts';
import { EnergyApiService } from '../../../majom-wrapper/data-access/energy-api-service.ts';
import { HttpInterceptorClient } from '../../../majom-wrapper/data-access/http-interceptor.ts';
import type { EnergyLevel, EnergyRecord } from '../energy.ts';

export type AppEnergyService = {
  loadEnergy(date?: string): Promise<EnergyRecord | null>;
  loadEnergyHistory?(options?: { days?: number }): Promise<EnergyRecord[]>;
  saveEnergy(
    level: EnergyLevel,
    existingRecordId?: string | null
  ): Promise<EnergyRecord | null>;
};

export class ShellEnergyService implements AppEnergyService {
  private readonly authService = new AuthService();
  private readonly http = new HttpInterceptorClient(environment.apiUrl);
  private readonly energyApi = new EnergyApiService(this.http);

  public async loadEnergy(date: string = getTodayDateKey()): Promise<EnergyRecord | null> {
    if (!this.authService.isLoggedIn()) {
      return null;
    }

    const entries = await firstValueFrom(
      this.energyApi.getEnergy(date).pipe(first())
    );
    if (!entries.length) {
      return null;
    }

    return entries
      .slice()
      .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))[0];
  }

  public async saveEnergy(
    level: EnergyLevel,
    existingRecordId?: string | null
  ): Promise<EnergyRecord | null> {
    if (!this.authService.isLoggedIn()) {
      return null;
    }

    if (existingRecordId) {
      return firstValueFrom(
        this.energyApi
          .updateEnergy(existingRecordId, { energy: level })
          .pipe(first())
      );
    }

    return firstValueFrom(
      this.energyApi.createEnergy({ energy: level }).pipe(first())
    );
  }

  public async loadEnergyHistory(
    options: { days?: number } = {}
  ): Promise<EnergyRecord[]> {
    if (!this.authService.isLoggedIn()) {
      return [];
    }

    const days = options.days ?? 14;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (days - 1));

    const entries = await firstValueFrom(this.energyApi.getEnergy().pipe(first()));
    return entries
      .filter((entry) => {
        const recordedAt = new Date(entry.recordedAt);
        return !Number.isNaN(recordedAt.getTime()) && recordedAt >= cutoff;
      })
      .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  }
}

function getTodayDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
