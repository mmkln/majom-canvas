import {
  en,
  type AppTranslationKey,
  type AppTranslations,
} from './locales/en.ts';
import { es } from './locales/es.ts';
import { rue } from './locales/rue.ts';
import { uk } from './locales/uk.ts';

export const APP_LOCALE_STORAGE_KEY = 'app-locale';
export const SUPPORTED_APP_LOCALES = ['en', 'uk', 'es', 'rue'] as const;

export type AppLocale = (typeof SUPPORTED_APP_LOCALES)[number];

type TranslationValue = string | number;
type TranslationParams = Record<string, TranslationValue>;
type TranslationCatalog = Record<AppLocale, AppTranslations>;
type SetLocaleOptions = {
  persist?: boolean;
};
type LocaleChangeListener = (locale: AppLocale) => void;
type I18nServiceOptions = {
  fallbackLocale?: AppLocale;
  initialLocale?: AppLocale | string | string[] | null;
};

const APP_TRANSLATIONS: TranslationCatalog = {
  en,
  es,
  rue,
  uk,
};
const APP_LOCALE_ALIASES: Record<string, AppLocale> = {
  ua: 'uk',
};
const APP_LOCALE_LABEL_KEYS: Record<AppLocale, AppTranslationKey> = {
  en: 'common.languageEnglish',
  es: 'common.languageSpanish',
  rue: 'common.languageRusyn',
  uk: 'common.languageUkrainian',
};

type TranslationReader = {
  t: (key: AppTranslationKey) => string;
};

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!(key in params)) return match;
    return String(params[key]);
  });
}

function normalizeDateInput(value: Date | number | string): Date | null {
  const date =
    value instanceof Date
      ? new Date(value.getTime())
      : typeof value === 'number'
        ? new Date(value)
        : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeAppLocale(
  value: AppLocale | string | null | undefined
): AppLocale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  const candidate = normalized.split(/[-_]/)[0] ?? normalized;
  const aliased = APP_LOCALE_ALIASES[candidate] ?? candidate;
  return SUPPORTED_APP_LOCALES.includes(aliased as AppLocale)
    ? (aliased as AppLocale)
    : null;
}

export function resolveAppLocale(
  preferred: AppLocale | string | string[] | null | undefined,
  fallbackLocale: AppLocale = 'en'
): AppLocale {
  const candidates = Array.isArray(preferred) ? preferred : [preferred];
  for (const candidate of candidates) {
    const locale = normalizeAppLocale(candidate);
    if (locale) return locale;
  }
  return fallbackLocale;
}

export function getBrowserLocalePreferences(): string[] {
  if (typeof navigator === 'undefined') return [];
  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    return navigator.languages;
  }
  return navigator.language ? [navigator.language] : [];
}

export function getAppLocaleLabelKey(locale: AppLocale): AppTranslationKey {
  return APP_LOCALE_LABEL_KEYS[locale];
}

export function getAppLocaleLabel(
  i18n: TranslationReader,
  locale: AppLocale
): string {
  return i18n.t(getAppLocaleLabelKey(locale));
}

export function loadPersistedAppLocale(): AppLocale | null {
  try {
    return normalizeAppLocale(localStorage.getItem(APP_LOCALE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function persistAppLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale);
  } catch {
    // no-op
  }
}

export class I18nService {
  private readonly fallbackLocale: AppLocale;
  private readonly listeners = new Set<LocaleChangeListener>();
  private locale: AppLocale;

  constructor(options: I18nServiceOptions = {}) {
    this.fallbackLocale = options.fallbackLocale ?? 'en';
    this.locale = resolveAppLocale(options.initialLocale, this.fallbackLocale);
    this.syncDocumentLanguage();
  }

  public getLocale(): AppLocale {
    return this.locale;
  }

  public setLocale(
    preferred: AppLocale | string | string[] | null | undefined,
    options: SetLocaleOptions = {}
  ): AppLocale {
    const locale = resolveAppLocale(preferred, this.fallbackLocale);
    const changed = locale !== this.locale;
    this.locale = locale;
    this.syncDocumentLanguage();
    if (options.persist !== false) {
      persistAppLocale(locale);
    }
    if (changed) {
      this.listeners.forEach((listener) => listener(locale));
    }
    return locale;
  }

  public subscribe(listener: LocaleChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public t(key: AppTranslationKey, params?: TranslationParams): string {
    const template =
      APP_TRANSLATIONS[this.locale][key] ??
      APP_TRANSLATIONS[this.fallbackLocale][key] ??
      key;
    return interpolate(template, params);
  }

  public formatDate(
    value: Date | number | string,
    options: Intl.DateTimeFormatOptions = {}
  ): string {
    const date = normalizeDateInput(value);
    if (!date) return '';
    return new Intl.DateTimeFormat(this.locale, options).format(date);
  }

  private syncDocumentLanguage(): void {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = this.locale;
  }
}

export function createAppI18nService(
  options: I18nServiceOptions = {}
): I18nService {
  const initialLocale =
    options.initialLocale ??
    loadPersistedAppLocale() ??
    getBrowserLocalePreferences();

  return new I18nService({
    ...options,
    initialLocale,
  });
}
