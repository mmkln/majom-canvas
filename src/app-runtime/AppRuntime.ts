import {
  type AppLocale,
  type I18nService,
  createAppI18nService,
} from '../i18n/index.ts';

export type AppRuntimeSnapshot = {
  locale: AppLocale;
};

export type AppRuntimeListener = (snapshot: AppRuntimeSnapshot) => void;

type AppRuntimeOptions = {
  i18n?: I18nService;
  initialLocale?: AppLocale | string | string[] | null;
};
type AppRuntimeSubscribeOptions = {
  emitCurrent?: boolean;
};

export class AppRuntime {
  public readonly i18n: I18nService;

  private readonly listeners = new Set<AppRuntimeListener>();

  constructor(options: AppRuntimeOptions = {}) {
    this.i18n =
      options.i18n ??
      createAppI18nService({ initialLocale: options.initialLocale });
    this.i18n.subscribe(() => {
      this.emitSnapshot();
    });
  }

  public getSnapshot(): AppRuntimeSnapshot {
    return {
      locale: this.i18n.getLocale(),
    };
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

  private emitSnapshot(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export function createAppRuntime(options: AppRuntimeOptions = {}): AppRuntime {
  return new AppRuntime(options);
}
