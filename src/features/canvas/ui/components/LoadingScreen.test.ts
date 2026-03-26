// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { LoadingScreen } from './LoadingScreen.ts';
import { createAppRuntime } from '../../../../app-runtime/index.ts';

describe('LoadingScreen', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('recomputes error copy when locale changes through runtime', () => {
    const runtime = createAppRuntime({ initialLocale: 'en' });
    const loadingScreen = new LoadingScreen({ runtime });

    loadingScreen.showError(
      (i18n) => i18n.t('loading.canvasFailed'),
      () => undefined
    );

    const message = document.body.querySelector('p');
    expect(message?.textContent).toBe(
      'Failed to load canvas data. Please try again.'
    );

    runtime.setLocale('uk');

    expect(message?.textContent).toBe(
      'Не вдалося завантажити дані canvas. Спробуйте ще раз.'
    );
    loadingScreen.hide();
  });
});
