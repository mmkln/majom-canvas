import { ElementStatus } from '../../elements/ElementStatus.ts';
import { createIcon, type IconName } from '../icons.ts';
import {
  getStatusLabel,
  STATUS_ICON_MAP,
  STATUS_ICON_TONE_CLASS,
  STATUS_ORDER,
} from '../statusPresentation.ts';

const STATUS_LABEL_TONE_CLASS: Record<ElementStatus, string> = {
  [ElementStatus.Done]: 'text-emerald-700',
  [ElementStatus.InProgress]: 'text-blue-700',
  [ElementStatus.Pending]: 'text-amber-700',
  [ElementStatus.Defined]: 'text-slate-700',
};

const STATUS_LABEL_MIXED_TONE_CLASS = 'text-slate-700';

const STATUS_TRIGGER_BG_CLASS: Record<ElementStatus, string> = {
  [ElementStatus.Done]: 'bg-emerald-100/70',
  [ElementStatus.InProgress]: 'bg-blue-100/70',
  [ElementStatus.Pending]: 'bg-amber-100/70',
  [ElementStatus.Defined]: 'bg-slate-100',
};

const STATUS_TRIGGER_MIXED_BG_CLASS = 'bg-slate-100/60';

const STATUS_STEP_TONE_CLASS: Record<ElementStatus, string> = {
  [ElementStatus.Done]:
    'bg-emerald-100/60 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700',
  [ElementStatus.InProgress]:
    'bg-blue-100/60 text-blue-600 hover:bg-blue-100 hover:text-blue-700',
  [ElementStatus.Pending]:
    'bg-amber-100/60 text-amber-600 hover:bg-amber-100 hover:text-amber-700',
  [ElementStatus.Defined]:
    'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-700',
};

const STATUS_STEP_MIXED_TONE_CLASS =
  'bg-slate-100/60 text-slate-600 hover:bg-slate-200/70 hover:text-slate-700';

type StatusSelectorOptions = {
  onStatusChange: (status: ElementStatus) => void;
};

export class StatusSelector {
  public readonly element: HTMLDivElement;

  private readonly onStatusChange: (status: ElementStatus) => void;
  private readonly triggerBtn: HTMLButtonElement;
  private readonly prevBtn: HTMLButtonElement;
  private readonly nextBtn: HTMLButtonElement;
  private readonly panel: HTMLDivElement;
  private readonly statusLabel: HTMLSpanElement;
  private currentStatus: ElementStatus | null = null;
  private open = false;

  constructor(options: StatusSelectorOptions) {
    this.onStatusChange = options.onStatusChange;

    this.element = document.createElement('div');
    this.element.className = 'relative inline-flex items-center gap-0.5';

    this.prevBtn = this.createStepButton(
      'chevron-left',
      'Previous status',
      'left',
      () => this.stepStatus(-1)
    );

    this.triggerBtn = document.createElement('button');
    this.triggerBtn.type = 'button';
    this.triggerBtn.className =
      'inline-flex h-8 items-center justify-between gap-2 rounded-sm px-3 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300';
    this.triggerBtn.setAttribute('aria-haspopup', 'menu');
    this.triggerBtn.setAttribute('aria-expanded', 'false');

    const triggerLeft = document.createElement('span');
    triggerLeft.className = 'inline-flex min-w-0 items-center gap-1.5';
    this.statusLabel = document.createElement('span');
    this.statusLabel.className = `truncate ${STATUS_LABEL_MIXED_TONE_CLASS}`;
    triggerLeft.append(this.statusLabel);

    this.triggerBtn.append(triggerLeft);

    this.nextBtn = this.createStepButton(
      'chevron-right',
      'Next status',
      'right',
      () => this.stepStatus(1)
    );

    this.panel = document.createElement('div');
    this.panel.className =
      'absolute left-0 top-[calc(100%+8px)] z-[90] hidden min-w-[176px] max-w-[216px] overflow-hidden rounded-xl border border-slate-200/90 bg-white/98 shadow-[0_10px_22px_rgba(15,23,42,0.10)] backdrop-blur-[1px]';

    this.element.append(this.prevBtn, this.triggerBtn, this.nextBtn, this.panel);

    this.triggerBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.setOpen(!this.open);
    });

    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('mousedown', this.onDocumentMouseDown);
    window.addEventListener('keydown', this.onWindowKeyDown);
    this.syncUi();
  }

  public setState(status: ElementStatus | null): void {
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

  private createStepButton(
    icon: IconName,
    label: string,
    side: 'left' | 'right',
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className =
      `inline-flex h-8 w-6 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:text-slate-300 disabled:opacity-60`;
    button.title = label;
    button.style.borderRadius = side === 'left' ? '16px 4px 4px 16px' : '4px 16px 16px 4px';
    button.setAttribute('aria-label', label);
    const iconEl = createIcon(icon, { size: 14, strokeWidth: 1.9 });
    iconEl.classList.add('shrink-0');
    button.appendChild(iconEl);
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      onClick();
    });
    return button;
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
    const leftOverflow = this.panel.getBoundingClientRect().left < viewportPadding;
    if (leftOverflow) {
      this.panel.style.left = '0';
      this.panel.style.right = 'auto';
    }

    const triggerRect = this.triggerBtn.getBoundingClientRect();
    const panelHeight = this.panel.getBoundingClientRect().height;
    const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
    const spaceAbove = triggerRect.top - viewportPadding;

    const openUpward = panelHeight > spaceBelow && spaceAbove > spaceBelow;
    if (openUpward) {
      this.panel.style.top = 'auto';
      this.panel.style.bottom = `calc(100% + ${anchorGap}px)`;
    }

    const availableSpace = openUpward ? spaceAbove : spaceBelow;
    if (panelHeight > availableSpace) {
      this.panel.style.maxHeight = `${Math.max(120, Math.floor(availableSpace))}px`;
      this.panel.style.overflowY = 'auto';
    }
  }

  private renderOptions(): void {
    this.panel.innerHTML = '';
    STATUS_ORDER.forEach((status) => {
      const isActive = this.currentStatus === status;
      const leading = createIcon(STATUS_ICON_MAP[status], {
        size: 14,
        strokeWidth: 1.7,
      });
      leading.classList.add('shrink-0', STATUS_ICON_TONE_CLASS[status]);

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
      label.textContent = getStatusLabel(status);
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
        this.currentStatus = status;
        this.syncUi();
        this.onStatusChange(status);
        this.setOpen(false);
      });

      this.panel.appendChild(option);
    });
  }

  private syncUi(): void {
    this.setStatusLabelTone(null);
    this.setTriggerStatusBackground(null);
    this.setStepButtonsStatusTone(null);

    if (this.currentStatus === null) {
      this.statusLabel.textContent = 'Mixed';
      this.setStatusLabelTone(null);
      this.setTriggerStatusBackground(null);
      this.setStepButtonsStatusTone(null);
      this.prevBtn.disabled = true;
      this.nextBtn.disabled = true;
    } else {
      this.statusLabel.textContent = getStatusLabel(this.currentStatus);
      this.setStatusLabelTone(this.currentStatus);
      this.setTriggerStatusBackground(this.currentStatus);
      this.setStepButtonsStatusTone(this.currentStatus);

      const index = STATUS_ORDER.indexOf(this.currentStatus);
      this.prevBtn.disabled = index <= 0;
      this.nextBtn.disabled = index >= STATUS_ORDER.length - 1;
    }

    const triggerText =
      this.currentStatus !== null
        ? getStatusLabel(this.currentStatus)
        : 'Mixed status';
    this.triggerBtn.title = `Status: ${triggerText}`;
    this.triggerBtn.setAttribute('aria-label', `Status: ${triggerText}`);
    this.renderOptions();
    if (this.open) {
      this.positionDropdown();
    }
  }

  private stepStatus(direction: -1 | 1): void {
    if (this.currentStatus === null) return;
    const currentIndex = STATUS_ORDER.indexOf(this.currentStatus);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= STATUS_ORDER.length) return;
    const nextStatus = STATUS_ORDER[nextIndex];
    this.currentStatus = nextStatus;
    this.syncUi();
    this.onStatusChange(nextStatus);
    this.setOpen(false);
  }

  private setStatusLabelTone(status: ElementStatus | null): void {
    [STATUS_LABEL_MIXED_TONE_CLASS, ...Object.values(STATUS_LABEL_TONE_CLASS)].forEach(
      (tone) => this.statusLabel.classList.remove(tone)
    );
    if (status === null) {
      this.statusLabel.classList.add(STATUS_LABEL_MIXED_TONE_CLASS);
      return;
    }
    this.statusLabel.classList.add(STATUS_LABEL_TONE_CLASS[status]);
  }

  private setTriggerStatusBackground(status: ElementStatus | null): void {
    [STATUS_TRIGGER_MIXED_BG_CLASS, ...Object.values(STATUS_TRIGGER_BG_CLASS)].forEach(
      (tone) => this.triggerBtn.classList.remove(tone)
    );
    if (status === null) {
      this.triggerBtn.classList.add(STATUS_TRIGGER_MIXED_BG_CLASS);
      return;
    }
    this.triggerBtn.classList.add(STATUS_TRIGGER_BG_CLASS[status]);
  }

  private setStepButtonsStatusTone(status: ElementStatus | null): void {
    [STATUS_STEP_MIXED_TONE_CLASS, ...Object.values(STATUS_STEP_TONE_CLASS)].forEach(
      (tone) => {
        const tokens = tone.split(' ').filter(Boolean);
        this.prevBtn.classList.remove(...tokens);
        this.nextBtn.classList.remove(...tokens);
      }
    );
    const toneClass =
      status === null ? STATUS_STEP_MIXED_TONE_CLASS : STATUS_STEP_TONE_CLASS[status];
    const tokens = toneClass.split(' ').filter(Boolean);
    this.prevBtn.classList.add(...tokens);
    this.nextBtn.classList.add(...tokens);
  }
}
