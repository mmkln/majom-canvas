// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../../../app-runtime/index.ts';
import { LoginPage } from './LoginPage.ts';

describe('LoginPage product context', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('shows service context and refreshes it with the app locale', () => {
    const runtime = createAppRuntime({ initialLocale: 'en' });
    const onBack = vi.fn();
    const loginPage = new LoginPage({
      runtime,
      secondaryAction: {
        text: (i18n) => i18n.t('login.backToOverview'),
        onClick: onBack,
      },
      onSubmit: () => Promise.resolve({ ok: true }),
    });

    loginPage.show();

    expect(document.body.textContent).toContain(
      'Sign in to your Majom workspace.'
    );
    expect(document.body.textContent).toContain(
      'Access is currently limited while Majom is in early development.'
    );
    expect(document.body.textContent).toContain(
      'Your workspace stays private to your account.'
    );

    const backButton = Array.from(
      document.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent === 'Back to overview');
    backButton?.click();

    expect(onBack).toHaveBeenCalledTimes(1);

    runtime.setLocale('es');

    expect(document.body.textContent).toContain(
      'Inicia sesión en tu espacio de trabajo de Majom.'
    );
    expect(document.body.textContent).toContain('Volver al resumen');
  });
});
