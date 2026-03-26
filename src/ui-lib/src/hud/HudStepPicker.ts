import { createHudIconButton } from './HudIconButton.ts';
import { type IconName } from './icons.ts';

export type HudStepPickerOptions = {
  previousLabel: string;
  nextLabel: string;
  className?: string;
  triggerClassName?: string;
  triggerAdornment?: Element | null;
};

export type HudStepPicker = {
  element: HTMLDivElement;
  previousButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  triggerButton: HTMLButtonElement;
  triggerContent: HTMLSpanElement;
  triggerLabel: HTMLSpanElement;
  setTriggerAdornment: (element: Element | null) => void;
};

function createStepButton(options: {
  icon: IconName;
  label: string;
  side: 'left' | 'right';
}): HTMLButtonElement {
  const button = createHudIconButton({
    icon: options.icon,
    size: 'sm',
    tone: 'text',
    title: options.label,
    ariaLabel: options.label,
    iconStrokeWidth: 1.7,
    className: '!h-8 rounded-none hover:bg-slate-100 active:bg-slate-100',
  });
  button.style.width = '24px';
  button.style.minWidth = '24px';
  button.style.borderRadius =
    options.side === 'left' ? '16px 4px 4px 16px' : '4px 16px 16px 4px';
  return button;
}

export function createHudStepPicker(
  options: HudStepPickerOptions
): HudStepPicker {
  const element = document.createElement('div');
  element.className = [
    'relative inline-flex items-center gap-0.5',
    options.className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const previousButton = createStepButton({
    icon: 'chevron-left',
    label: options.previousLabel,
    side: 'left',
  });

  const triggerButton = document.createElement('button');
  triggerButton.type = 'button';
  triggerButton.className = [
    'relative inline-flex h-8 min-w-0 items-center justify-center rounded-sm px-3 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300',
    options.triggerClassName ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const triggerContent = document.createElement('span');
  triggerContent.className =
    'inline-flex min-w-0 flex-1 items-center justify-center gap-1.5';

  const triggerLabel = document.createElement('span');
  triggerLabel.className = 'truncate text-center';
  triggerContent.appendChild(triggerLabel);

  let triggerAdornment: Element | null = null;
  const setTriggerAdornment = (elementToSet: Element | null): void => {
    if (triggerAdornment) {
      triggerAdornment.remove();
    }
    triggerAdornment = elementToSet;
    if (triggerAdornment) {
      triggerAdornment.classList.add(
        'pointer-events-none',
        'absolute',
        'right-3',
        'top-1/2',
        '-translate-y-1/2',
        'shrink-0'
      );
      triggerButton.appendChild(triggerAdornment);
    }
  };

  triggerButton.appendChild(triggerContent);
  setTriggerAdornment(options.triggerAdornment ?? null);

  const nextButton = createStepButton({
    icon: 'chevron-right',
    label: options.nextLabel,
    side: 'right',
  });

  element.append(previousButton, triggerButton, nextButton);

  return {
    element,
    previousButton,
    nextButton,
    triggerButton,
    triggerContent,
    triggerLabel,
    setTriggerAdornment,
  };
}
