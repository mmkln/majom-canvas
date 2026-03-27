// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  APP_LOCALE_STORAGE_KEY,
  I18nService,
  createAppI18nService,
  loadPersistedAppLocale,
  normalizeAppLocale,
  resolveAppLocale,
} from './I18nService.ts';

describe('I18nService', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
  });

  it('normalizes locale aliases and region variants', () => {
    expect(normalizeAppLocale('uk-UA')).toBe('uk');
    expect(normalizeAppLocale('en_US')).toBe('en');
    expect(normalizeAppLocale('es-ES')).toBe('es');
    expect(normalizeAppLocale('rue-UA')).toBe('rue');
    expect(normalizeAppLocale('ua')).toBe('uk');
    expect(normalizeAppLocale('de')).toBeNull();
  });

  it('resolves the first supported locale from a preference list', () => {
    expect(resolveAppLocale(['de-DE', 'rue-UA', 'es-ES'])).toBe('rue');
    expect(resolveAppLocale(['de-DE', 'es-ES', 'uk-UA'])).toBe('es');
    expect(resolveAppLocale(['de-DE', 'uk-UA', 'en-US'])).toBe('uk');
    expect(resolveAppLocale(['de-DE'], 'en')).toBe('en');
  });

  it('translates keys, interpolates params, and persists locale changes', () => {
    const i18n = new I18nService({ initialLocale: 'en' });

    expect(i18n.t('timeClustering.addCluster')).toBe('Add cluster');

    i18n.setLocale('uk-UA');

    expect(i18n.getLocale()).toBe('uk');
    expect(i18n.t('timeClustering.error.minDuration', { minutes: 30 })).toBe(
      'Час завершення має бути щонайменше на 30 хвилин пізніше за час початку.'
    );
    expect(document.documentElement.lang).toBe('uk');
    expect(loadPersistedAppLocale()).toBe('uk');
  });

  it('supports the spanish locale', () => {
    const i18n = new I18nService({ initialLocale: 'es' });

    expect(i18n.getLocale()).toBe('es');
    expect(i18n.t('common.language')).toBe('Idioma');
    expect(i18n.t('existingPicker.add')).toBe('Añadir');
    expect(i18n.t('timeClustering.addCluster')).toBe('Añadir bloque');
    expect(document.documentElement.lang).toBe('es');
  });

  it('supports the rusyn locale', () => {
    const i18n = new I18nService({ initialLocale: 'rue' });

    expect(i18n.getLocale()).toBe('rue');
    expect(i18n.t('common.language')).toBe('Язык');
    expect(document.documentElement.lang).toBe('rue');
  });

  it('notifies subscribers when the locale changes', () => {
    const i18n = new I18nService({ initialLocale: 'en' });
    const changes: string[] = [];
    const unsubscribe = i18n.subscribe((locale) => changes.push(locale));

    i18n.setLocale('uk');
    i18n.setLocale('uk');
    unsubscribe();
    i18n.setLocale('en');

    expect(changes).toEqual(['uk']);
  });

  it('uses persisted locale when creating the app service', () => {
    localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'uk');

    const i18n = createAppI18nService();

    expect(i18n.getLocale()).toBe('uk');
  });
});
