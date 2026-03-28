import {
  createBadge,
  createDropdownItem,
  createSurface,
  Submenu,
} from '../primitives/index.ts';
import { createIcon } from '../../../../ui-lib/src/hud/icons.ts';
import {
  getAppLocaleLabel,
  SUPPORTED_APP_LOCALES,
  type AppLocale,
  I18nService,
} from '../../../../i18n/index.ts';

export type LocaleSubmenuHandle = {
  trigger: HTMLButtonElement;
  close: () => void;
  destroy: () => void;
};

type LocaleSubmenuOptions = {
  i18n: I18nService;
  currentLocale: AppLocale;
  disabled?: boolean;
  panelZIndex?: number;
  onSelect: (locale: AppLocale) => void;
};

function createLocaleCodeBadge(
  i18n: I18nService,
  locale: AppLocale,
  tone: 'default' | 'selected' = 'default'
): HTMLSpanElement {
  return createBadge({
    label: locale.toUpperCase(),
    tone: tone === 'selected' ? 'accent' : 'neutral',
    className: 'min-w-[2rem]',
    title: getAppLocaleLabel(i18n, locale),
  });
}

function createTriggerTrailing(
  i18n: I18nService,
  locale: AppLocale
): HTMLSpanElement {
  const trailing = document.createElement('span');
  trailing.className = 'ml-auto inline-flex items-center gap-2';
  const chevron = createIcon('chevron-right', {
    size: 14,
    strokeWidth: 1.9,
  });
  chevron.classList.add('shrink-0', 'text-slate-400');
  chevron.setAttribute('aria-hidden', 'true');
  trailing.append(createLocaleCodeBadge(i18n, locale), chevron);
  return trailing;
}

export function createLocaleSubmenu(
  options: LocaleSubmenuOptions
): LocaleSubmenuHandle {
  const panel = createSurface({
    elevated: true,
    className: 'fixed hidden min-w-[10rem] overflow-hidden',
  });
  panel.dataset.role = 'locale-submenu-panel';
  panel.setAttribute('role', 'menu');
  panel.setAttribute('aria-label', options.i18n.t('common.languageSelection'));
  panel.style.zIndex = `${options.panelZIndex ?? 320}`;

  const trigger = createDropdownItem({
    label: options.i18n.t('common.language'),
    trailing: createTriggerTrailing(options.i18n, options.currentLocale),
    disabled: options.disabled ?? false,
  });
  trigger.dataset.role = 'locale-submenu-trigger';
  let submenu: Submenu | null = null;

  const renderPanelItems = (): void => {
    panel.innerHTML = '';
    SUPPORTED_APP_LOCALES.forEach((locale) => {
      const selected = locale === options.currentLocale;
      const item = createDropdownItem({
        label: getAppLocaleLabel(options.i18n, locale),
        variant: selected ? 'selected' : 'default',
        trailing: createLocaleCodeBadge(
          options.i18n,
          locale,
          selected ? 'selected' : 'default'
        ),
        disabled: options.disabled ?? false,
        onClick: (event) => {
          event.preventDefault();
          event.stopPropagation();
          options.onSelect(locale);
          submenu?.close();
        },
      });
      item.dataset.role = 'locale-submenu-item';
      item.dataset.locale = locale;
      panel.appendChild(item);
    });
  };
  submenu = new Submenu({
    trigger,
    panel,
    openMode: 'hover-or-click',
    placement: 'right-start',
    panelZIndex: options.panelZIndex ?? 320,
    beforeOpen: renderPanelItems,
  });

  return {
    trigger,
    close: () => submenu?.close(),
    destroy: () => {
      submenu?.destroy();
      submenu = null;
    },
  };
}
