// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { AppRuntime, createAppRuntime } from './AppRuntime.ts';
import { I18nService } from '../i18n/I18nService.ts';

describe('AppRuntime', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
  });

  it('exposes the active locale in its snapshot', () => {
    const runtime = createAppRuntime({ initialLocale: 'uk' });

    expect(runtime.getSnapshot().locale).toBe('uk');
    expect(runtime.i18n.getLocale()).toBe('uk');
  });

  it('notifies subscribers when locale changes through runtime', () => {
    const runtime = createAppRuntime({ initialLocale: 'en' });
    const changes: string[] = [];
    const unsubscribe = runtime.subscribe((snapshot) => {
      changes.push(snapshot.locale);
    });

    runtime.setLocale('uk');
    runtime.setLocale('uk');
    unsubscribe();
    runtime.setLocale('en');

    expect(changes).toEqual(['uk']);
  });

  it('fans out locale changes triggered directly on i18n', () => {
    const runtime = new AppRuntime({
      i18n: new I18nService({ initialLocale: 'en' }),
    });
    const changes: string[] = [];

    runtime.subscribe((snapshot) => {
      changes.push(snapshot.locale);
    });
    runtime.i18n.setLocale('uk');

    expect(changes).toEqual(['uk']);
  });

  it('can emit the current snapshot immediately on subscribe', () => {
    const runtime = createAppRuntime({ initialLocale: 'uk' });
    const changes: string[] = [];

    runtime.subscribe((snapshot) => {
      changes.push(snapshot.locale);
    }, { emitCurrent: true });

    expect(changes).toEqual(['uk']);
  });
});
