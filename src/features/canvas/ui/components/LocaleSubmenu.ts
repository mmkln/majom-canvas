import {
  createBadge,
  createDropdownItem,
  createSurface,
} from '../primitives/index.ts';
import { positionFixedElement } from '../overlayPosition.ts';
import { createIcon } from '../../../../ui-lib/src/hud/icons.ts';
import {
  SUPPORTED_APP_LOCALES,
  type AppLocale,
  I18nService,
} from '../../../../i18n/index.ts';

const SUBMENU_CLOSE_DELAY_MS = 120;
const SUBMENU_GAP_PX = 4;

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

function getLocaleLabel(i18n: I18nService, locale: AppLocale): string {
  return locale === 'uk'
    ? i18n.t('common.languageUkrainian')
    : i18n.t('common.languageEnglish');
}

function createLocaleCodeBadge(
  i18n: I18nService,
  locale: AppLocale,
  tone: 'default' | 'selected' = 'default'
): HTMLSpanElement {
  return createBadge({
    label: locale.toUpperCase(),
    tone: tone === 'selected' ? 'accent' : 'neutral',
    className: 'min-w-[2rem]',
    title: getLocaleLabel(i18n, locale),
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
  let closeTimeoutId: number | null = null;

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
    onClick: (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!isOpen()) {
        open();
      }
    },
  });
  trigger.dataset.role = 'locale-submenu-trigger';
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');

  const clearCloseTimer = (): void => {
    if (closeTimeoutId === null) return;
    window.clearTimeout(closeTimeoutId);
    closeTimeoutId = null;
  };

  const scheduleClose = (): void => {
    clearCloseTimer();
    closeTimeoutId = window.setTimeout(() => {
      close();
    }, SUBMENU_CLOSE_DELAY_MS);
  };

  const positionPanel = (): void => {
    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const panelWidth = panelRect.width || 160;
    const openLeft =
      triggerRect.right + SUBMENU_GAP_PX + panelWidth > window.innerWidth - 8;

    positionFixedElement(panel, {
      anchorX: openLeft
        ? triggerRect.left - SUBMENU_GAP_PX
        : triggerRect.right + SUBMENU_GAP_PX,
      anchorY: triggerRect.top,
      alignX: openLeft ? 'right' : 'left',
      alignY: 'top',
    });
  };

  const setExpandedState = (expanded: boolean): void => {
    trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    trigger.classList.toggle('bg-indigo-50', expanded);
    trigger.classList.toggle('text-slate-800', expanded);
  };

  const close = (): void => {
    clearCloseTimer();
    panel.style.display = 'none';
    panel.style.visibility = '';
    setExpandedState(false);
  };

  const renderPanelItems = (): void => {
    panel.innerHTML = '';
    SUPPORTED_APP_LOCALES.forEach((locale) => {
      const selected = locale === options.currentLocale;
      const item = createDropdownItem({
        label: getLocaleLabel(options.i18n, locale),
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
          close();
        },
      });
      item.dataset.role = 'locale-submenu-item';
      item.dataset.locale = locale;
      panel.appendChild(item);
    });
  };

  const isOpen = (): boolean => panel.style.display === 'block';

  const open = (): void => {
    if (options.disabled) return;
    clearCloseTimer();
    renderPanelItems();
    if (!panel.isConnected) {
      document.body.appendChild(panel);
    }
    panel.style.display = 'block';
    panel.style.visibility = 'hidden';
    positionPanel();
    panel.style.visibility = 'visible';
    setExpandedState(true);
  };

  const focusFirstItem = (): void => {
    const first = panel.querySelector('button:not([disabled])');
    if (first instanceof HTMLButtonElement) {
      first.focus();
    }
  };

  trigger.addEventListener('mouseenter', () => {
    open();
  });
  trigger.addEventListener('mouseleave', () => {
    scheduleClose();
  });
  trigger.addEventListener('focus', () => {
    open();
  });
  trigger.addEventListener('focusout', (event) => {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && panel.contains(relatedTarget)) {
      return;
    }
    scheduleClose();
  });
  trigger.addEventListener('keydown', (event) => {
    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'ArrowRight'
    ) {
      event.preventDefault();
      open();
      focusFirstItem();
      return;
    }
    if (event.key === 'Escape' || event.key === 'ArrowLeft') {
      event.preventDefault();
      close();
    }
  });

  panel.addEventListener('mouseenter', () => {
    clearCloseTimer();
  });
  panel.addEventListener('mousedown', (event) => {
    event.stopPropagation();
  });
  panel.addEventListener('mouseleave', () => {
    scheduleClose();
  });
  panel.addEventListener('focusout', (event) => {
    const relatedTarget = event.relatedTarget;
    if (
      relatedTarget === trigger ||
      (relatedTarget instanceof Node && panel.contains(relatedTarget))
    ) {
      return;
    }
    scheduleClose();
  });
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key === 'ArrowLeft') {
      event.preventDefault();
      close();
      trigger.focus();
    }
  });

  return {
    trigger,
    close,
    destroy: () => {
      clearCloseTimer();
      close();
      panel.remove();
    },
  };
}
