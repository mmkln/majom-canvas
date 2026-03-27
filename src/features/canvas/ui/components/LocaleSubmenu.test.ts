// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../../../i18n/I18nService.ts';
import { createLocaleSubmenu } from './LocaleSubmenu.ts';
import type { AppLocale } from '../../../../i18n/index.ts';

describe('LocaleSubmenu', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('keeps submenu interaction inside the menu and selects the clicked locale', () => {
    const onSelect = vi.fn<(locale: AppLocale) => void>();
    const outsideMouseDown = vi.fn();
    const i18n = new I18nService({ initialLocale: 'en' });
    const submenu = createLocaleSubmenu({
      i18n,
      currentLocale: 'en',
      onSelect,
    });
    document.body.appendChild(submenu.trigger);
    window.addEventListener('mousedown', outsideMouseDown);

    submenu.trigger.click();

    const ukItem = document.body.querySelector<HTMLButtonElement>(
      '[data-role="locale-submenu-item"][data-locale="uk"]'
    );
    expect(ukItem).not.toBeNull();

    ukItem?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    ukItem?.click();

    expect(outsideMouseDown).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith('uk');

    window.removeEventListener('mousedown', outsideMouseDown);
    submenu.destroy();
  });

  it('renders spanish as an available locale option', () => {
    const i18n = new I18nService({ initialLocale: 'en' });
    const submenu = createLocaleSubmenu({
      i18n,
      currentLocale: 'en',
      onSelect: vi.fn(),
    });
    document.body.appendChild(submenu.trigger);

    submenu.trigger.click();

    const spanishItem = document.body.querySelector<HTMLButtonElement>(
      '[data-role="locale-submenu-item"][data-locale="es"]'
    );

    expect(spanishItem).not.toBeNull();
    expect(spanishItem?.textContent).toContain('Spanish');

    submenu.destroy();
  });

  it('renders rusyn as an available locale option', () => {
    const i18n = new I18nService({ initialLocale: 'en' });
    const submenu = createLocaleSubmenu({
      i18n,
      currentLocale: 'en',
      onSelect: vi.fn(),
    });
    document.body.appendChild(submenu.trigger);

    submenu.trigger.click();

    const rusynItem = document.body.querySelector<HTMLButtonElement>(
      '[data-role="locale-submenu-item"][data-locale="rue"]'
    );

    expect(rusynItem).not.toBeNull();
    expect(rusynItem?.textContent).toContain('Rusyn');

    submenu.destroy();
  });
});
