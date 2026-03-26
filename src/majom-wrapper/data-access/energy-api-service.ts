import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpInterceptorClient } from './http-interceptor.js';
import {
  type EnergyInput,
  type EnergyRecord,
  EnergyLevel,
  isEnergyLevel,
} from '../../features/shell/energy.ts';

type BackendMood = {
  id: string;
  recorded_at: string;
  mood: string;
};

type BackendMoodDto = {
  mood: EnergyLevel;
};

function toEnergyRecord(value: BackendMood): EnergyRecord {
  return {
    id: value.id,
    recordedAt: value.recorded_at,
    energy: isEnergyLevel(value.mood) ? value.mood : EnergyLevel.NEUTRAL,
  };
}

function toBackendMoodDto(value: EnergyInput): BackendMoodDto {
  return {
    mood: value.energy,
  };
}

export class EnergyApiService {
  constructor(private readonly http: HttpInterceptorClient) {}

  public getEnergy(date?: string): Observable<EnergyRecord[]> {
    const query = date
      ? `?recorded_at=${encodeURIComponent(date)}`
      : '';
    return this.http
      .get<BackendMood[]>(`/mood/${query}`)
      .pipe(map((items) => items.map(toEnergyRecord)));
  }

  public getEnergyEntry(id: string): Observable<EnergyRecord> {
    const encodedId = encodeURIComponent(id);
    return this.http
      .get<BackendMood>(`/mood/${encodedId}/`)
      .pipe(map(toEnergyRecord));
  }

  public createEnergy(data: EnergyInput): Observable<EnergyRecord> {
    return this.http
      .post<BackendMood>('/mood/', toBackendMoodDto(data))
      .pipe(map(toEnergyRecord));
  }

  public updateEnergy(id: string, data: EnergyInput): Observable<EnergyRecord> {
    const encodedId = encodeURIComponent(id);
    return this.http
      .put<BackendMood>(`/mood/${encodedId}/`, toBackendMoodDto(data))
      .pipe(map(toEnergyRecord));
  }
}
