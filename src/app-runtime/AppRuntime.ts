import {
  type AppLocale,
  type I18nService,
  createAppI18nService,
} from '../i18n/index.ts';
import type { EnergyLevel, EnergyRecord } from '../features/shell/energy.ts';
import { ShellEnergyService, type AppEnergyService } from '../features/shell/services/ShellEnergyService.ts';

export type AppEnergyState = {
  level: EnergyLevel | null;
  recordId: string | null;
  loading: boolean;
  saving: boolean;
  loaded: boolean;
};

export type AppRuntimeSnapshot = {
  locale: AppLocale;
  theme: AppTheme;
  energy: AppEnergyState;
};

export type AppRuntimeListener = (snapshot: AppRuntimeSnapshot) => void;
export type AppTheme = 'light' | 'dark';

type AppRuntimeOptions = {
  i18n?: I18nService;
  initialLocale?: AppLocale | string | string[] | null;
  initialTheme?: AppTheme;
  energyService?: AppEnergyService | null;
};
type AppRuntimeSubscribeOptions = {
  emitCurrent?: boolean;
};

export class AppRuntime {
  public readonly i18n: I18nService;

  private readonly listeners = new Set<AppRuntimeListener>();
  private readonly energyService: AppEnergyService | null;
  private theme: AppTheme;
  private energyState: AppEnergyState = {
    level: null,
    recordId: null,
    loading: false,
    saving: false,
    loaded: false,
  };
  private energyLoadPromise: Promise<void> | null = null;

  constructor(options: AppRuntimeOptions = {}) {
    this.i18n =
      options.i18n ??
      createAppI18nService({ initialLocale: options.initialLocale });
    this.energyService =
      options.energyService === undefined
        ? new ShellEnergyService()
        : options.energyService;
    this.theme = options.initialTheme ?? 'light';
    this.i18n.subscribe(() => {
      this.emitSnapshot();
    });
  }

  public getSnapshot(): AppRuntimeSnapshot {
    return {
      locale: this.i18n.getLocale(),
      theme: this.theme,
      energy: this.getEnergyState(),
    };
  }

  public getTheme(): AppTheme {
    return this.theme;
  }

  public getEnergyState(): AppEnergyState {
    return { ...this.energyState };
  }

  public subscribe(
    listener: AppRuntimeListener,
    options: AppRuntimeSubscribeOptions = {}
  ): () => void {
    this.listeners.add(listener);
    if (options.emitCurrent) {
      listener(this.getSnapshot());
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setLocale(
    locale: AppLocale | string | string[] | null | undefined
  ): AppLocale {
    return this.i18n.setLocale(locale);
  }

  public setTheme(theme: AppTheme): AppTheme {
    if (this.theme === theme) {
      return this.theme;
    }
    this.theme = theme;
    this.emitSnapshot();
    return this.theme;
  }

  public async ensureEnergyLoaded(): Promise<void> {
    if (this.energyState.loaded) {
      return;
    }
    if (this.energyLoadPromise) {
      await this.energyLoadPromise;
      return;
    }

    this.energyState = {
      ...this.energyState,
      loading: true,
    };
    this.emitSnapshot();

    this.energyLoadPromise = (async () => {
      try {
        const record = await this.energyService?.loadEnergy();
        this.energyState = {
          level: record?.energy ?? this.energyState.level,
          recordId: record?.id ?? null,
          loading: false,
          saving: false,
          loaded: true,
        };
      } catch (error) {
        console.warn('Failed to load energy state.', error);
        this.energyState = {
          ...this.energyState,
          loading: false,
          loaded: true,
        };
      } finally {
        this.energyLoadPromise = null;
        this.emitSnapshot();
      }
    })();

    await this.energyLoadPromise;
  }

  public async setEnergyLevel(level: EnergyLevel): Promise<void> {
    if (!this.energyState.loaded && !this.energyState.loading) {
      await this.ensureEnergyLoaded();
    }

    const previousState = { ...this.energyState };
    this.energyState = {
      ...this.energyState,
      level,
      saving: true,
      loaded: true,
    };
    this.emitSnapshot();

    try {
      const record = await this.energyService?.saveEnergy(level);
      this.energyState = {
        level: record?.energy ?? level,
        recordId: record?.id ?? previousState.recordId,
        loading: false,
        saving: false,
        loaded: true,
      };
      this.emitSnapshot();
    } catch (error) {
      this.energyState = {
        ...previousState,
        loaded: true,
      };
      this.emitSnapshot();
      throw error;
    }
  }

  public async loadEnergyHistory(
    options: { days?: number } = {}
  ): Promise<EnergyRecord[]> {
    if (!this.energyService?.loadEnergyHistory) {
      return [];
    }
    return this.energyService.loadEnergyHistory(options);
  }

  private emitSnapshot(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export function createAppRuntime(options: AppRuntimeOptions = {}): AppRuntime {
  return new AppRuntime(options);
}
