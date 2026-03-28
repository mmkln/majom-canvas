import { Status } from '../../../../majom-wrapper/interfaces/index.ts';
import { createIcon } from '../icons.ts';
import { createStepPicker } from '../primitives/index.ts';
import {
  getRoutineStatusLabel,
  ROUTINE_STATUS_ICON_MAP,
  ROUTINE_STATUS_ICON_TONE_CLASS,
  ROUTINE_STATUS_ORDER,
} from '../routineStatusPresentation.ts';
import type { I18nService } from '../../../../i18n/index.ts';

const ROUTINE_STATUS_LABEL_TONE_CLASS: Record<
  Status.Active | Status.Archived,
  string
> = {
  [Status.Active]: 'text-blue-700',
  [Status.Archived]: 'text-slate-700',
};

const ROUTINE_STATUS_TRIGGER_BG_CLASS: Record<
  Status.Active | Status.Archived,
  string
> = {
  [Status.Active]: 'bg-blue-100/70',
  [Status.Archived]: 'bg-slate-100',
};

const ROUTINE_STATUS_STEP_TONE_CLASS: Record<
  Status.Active | Status.Archived,
  string
> = {
  [Status.Active]:
    'bg-blue-100/60 text-blue-600 hover:bg-blue-100 hover:text-blue-700',
  [Status.Archived]:
    'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-700',
};

type RoutineStatusSelectorOptions = {
  i18n?: Pick<I18nService, 't'>;
  onStatusChange: (status: Status.Active | Status.Archived) => void;
};

export class RoutineStatusSelector {
  public readonly element: HTMLDivElement;

  private readonly i18n: Pick<I18nService, 't'> | undefined;
  private readonly onStatusChange: (
    status: Status.Active | Status.Archived
  ) => void;
  private readonly triggerBtn: HTMLButtonElement;
  private readonly prevBtn: HTMLButtonElement;
  private readonly nextBtn: HTMLButtonElement;
  private readonly panel: HTMLDivElement;
  private readonly statusLabel: HTMLSpanElement;
  private currentStatus: Status.Active | Status.Archived | null = null;
  private open = false;

  constructor(options: RoutineStatusSelectorOptions) {
    this.i18n = options.i18n;
    this.onStatusChange = options.onStatusChange;

    const picker = createStepPicker({
      previousLabel: this.i18n?.t('status.previous') ?? 'Previous status',
      nextLabel: this.i18n?.t('status.next') ?? 'Next status',
    });
    this.element = picker.element;
    this.prevBtn = picker.previousButton;
    this.triggerBtn = picker.triggerButton;
    this.nextBtn = picker.nextButton;
    this.triggerBtn.setAttribute('aria-haspopup', 'menu');
    this.triggerBtn.setAttribute('aria-expanded', 'false');
    this.statusLabel = picker.triggerLabel;

    this.panel = document.createElement('div');
    this.panel.className =
      'absolute left-0 top-[calc(100%+8px)] z-[90] hidden min-w-[176px] max-w-[216px] overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.10)]';

    this.element.append(
      this.prevBtn,
      this.triggerBtn,
      this.nextBtn,
      this.panel
    );

    this.triggerBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.setOpen(!this.open);
    });
    this.prevBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.stepStatus(-1);
    });
    this.nextBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.stepStatus(1);
    });

    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('mousedown', this.onDocumentMouseDown);
    window.addEventListener('keydown', this.onWindowKeyDown);
    this.syncUi();
  }

  public setState(status: Status.Active | Status.Archived | null): void {
    this.currentStatus = status;
    this.syncUi();
  }

  public close(): void {
    this.setOpen(false);
  }

  public destroy(): void {
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousedown', this.onDocumentMouseDown);
    window.removeEventListener('keydown', this.onWindowKeyDown);
  }

  private readonly onWindowResize = (): void => {
    if (!this.open) return;
    this.positionDropdown();
  };

  private readonly onDocumentMouseDown = (event: MouseEvent): void => {
    if (!this.open) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (this.element.contains(target)) return;
    this.setOpen(false);
  };

  private readonly onWindowKeyDown = (event: KeyboardEvent): void => {
    if (!this.open) return;
    if (event.key !== 'Escape') return;
    this.setOpen(false);
  };

  private setOpen(open: boolean): void {
    if (this.open === open) return;
    this.open = open;
    this.panel.classList.toggle('hidden', !open);
    this.triggerBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      this.positionDropdown();
    }
  }

  private positionDropdown(): void {
    const anchorGap = 8;
    const viewportPadding = 8;
    this.panel.style.left = '0';
    this.panel.style.right = 'auto';
    this.panel.style.top = `calc(100% + ${anchorGap}px)`;
    this.panel.style.bottom = 'auto';
    this.panel.style.maxHeight = '';
    this.panel.style.overflowY = 'hidden';

    const rightOverflow =
      this.panel.getBoundingClientRect().right >
      window.innerWidth - viewportPadding;
    if (rightOverflow) {
      this.panel.style.left = 'auto';
      this.panel.style.right = '0';
    }

    const triggerRect = this.triggerBtn.getBoundingClientRect();
    const panelHeight = this.panel.getBoundingClientRect().height;
    const spaceBelow =
      window.innerHeight - triggerRect.bottom - viewportPadding;
    const spaceAbove = triggerRect.top - viewportPadding;
    const openUpward = panelHeight > spaceBelow && spaceAbove > spaceBelow;
    if (openUpward) {
      this.panel.style.top = 'auto';
      this.panel.style.bottom = `calc(100% + ${anchorGap}px)`;
    }
  }

  private renderOptions(): void {
    this.panel.innerHTML = '';
    ROUTINE_STATUS_ORDER.forEach((status) => {
      const isActive = this.currentStatus === status;
      const leading = createIcon(ROUTINE_STATUS_ICON_MAP[status], {
        size: 14,
        strokeWidth: 1.7,
      });
      leading.classList.add(
        'shrink-0',
        ROUTINE_STATUS_ICON_TONE_CLASS[status]
      );

      const trailing = isActive
        ? createIcon('check', { size: 14, strokeWidth: 2 })
        : null;
      trailing?.classList.add('shrink-0', 'text-slate-700');

      const option = document.createElement('button');
      option.type = 'button';
      option.className = isActive
        ? 'flex w-full items-center justify-between bg-slate-100 p-3.5 text-left text-[12px] font-medium text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300'
        : 'flex w-full items-center justify-between p-3.5 text-left text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300';

      const content = document.createElement('span');
      content.className = 'inline-flex min-w-0 items-center gap-2';
      const label = document.createElement('span');
      label.className = 'truncate';
      label.textContent = getRoutineStatusLabel(status, this.i18n);
      content.append(leading, label);
      option.appendChild(content);
      if (trailing) {
        option.appendChild(trailing);
      }
      option.addEventListener('click', (event) => {
        event.stopPropagation();
        if (this.currentStatus === status) {
          this.setOpen(false);
          return;
        }
        this.onStatusChange(status);
        this.setOpen(false);
      });
      this.panel.appendChild(option);
    });
  }

  private stepStatus(delta: -1 | 1): void {
    if (!this.currentStatus) return;
    const currentIndex = ROUTINE_STATUS_ORDER.indexOf(this.currentStatus);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + delta;
    if (nextIndex < 0 || nextIndex >= ROUTINE_STATUS_ORDER.length) return;
    this.onStatusChange(ROUTINE_STATUS_ORDER[nextIndex]);
  }

  private syncUi(): void {
    this.renderOptions();
    const status = this.currentStatus ?? Status.Active;
    this.statusLabel.textContent = this.currentStatus
      ? getRoutineStatusLabel(status, this.i18n)
      : this.i18n?.t('selectionMenu.changeStatus') ?? 'Status';
    this.statusLabel.className = this.currentStatus
      ? `truncate ${ROUTINE_STATUS_LABEL_TONE_CLASS[status]}`
      : 'truncate text-slate-700';
    this.applyToneClasses(
      this.triggerBtn,
      Object.values(ROUTINE_STATUS_TRIGGER_BG_CLASS)
    );
    this.applyToneClasses(
      this.prevBtn,
      Object.values(ROUTINE_STATUS_STEP_TONE_CLASS)
    );
    this.applyToneClasses(
      this.nextBtn,
      Object.values(ROUTINE_STATUS_STEP_TONE_CLASS)
    );
    if (!this.currentStatus) return;
    this.toggleClassNames(
      this.triggerBtn,
      ROUTINE_STATUS_TRIGGER_BG_CLASS[status],
      true
    );
    this.toggleClassNames(
      this.prevBtn,
      ROUTINE_STATUS_STEP_TONE_CLASS[status],
      true
    );
    this.toggleClassNames(
      this.nextBtn,
      ROUTINE_STATUS_STEP_TONE_CLASS[status],
      true
    );
  }

  private applyToneClasses(
    element: HTMLElement,
    classGroups: readonly string[]
  ): void {
    classGroups.forEach((group) => this.toggleClassNames(element, group, false));
  }

  private toggleClassNames(
    element: HTMLElement,
    classNames: string,
    enabled: boolean
  ): void {
    classNames
      .split(/\s+/)
      .filter(Boolean)
      .forEach((token) => element.classList.toggle(token, enabled));
  }
}
