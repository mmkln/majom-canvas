import { createIcon, type IconName } from '../../../../../ui-lib/src/hud/icons.ts';

type TextFieldOptions = {
  value: string;
  placeholder: string;
  ariaLabel: string;
  onInput: (value: string) => void;
  type?: 'text' | 'search' | 'email' | 'url';
  icon?: IconName | null;
  iconSize?: number;
  iconStrokeWidth?: number;
  iconClassName?: string;
  tone?: 'plain' | 'muted';
  size?: 'sm' | 'md';
  quietUntilFocus?: boolean;
  rounded?: 'lg' | 'full';
  dataRole?: string;
  className?: string;
  inputClassName?: string;
};

export function TextField(options: TextFieldOptions): HTMLLabelElement {
  const field = document.createElement('label');
  const tone = options.tone ?? 'muted';
  const size = options.size ?? 'md';
  const rounded = options.rounded ?? 'full';
  field.className = [
    'group flex min-w-[220px] flex-1 items-center transition-[background-color,color] duration-150',
    size === 'sm' ? 'gap-2.5 px-3.5 py-2.5 md:max-w-[360px]' : 'gap-3 px-4 py-3 md:max-w-[420px]',
    rounded === 'full' ? 'rounded-full' : 'rounded-[16px]',
    tone === 'muted'
      ? options.quietUntilFocus
        ? 'bg-slate-50 focus-within:bg-slate-100'
        : 'bg-slate-100'
      : 'bg-transparent',
    options.className ?? '',
  ]
    .join(' ')
    .trim();

  const icon =
    options.icon === null
      ? null
      : createIcon(options.icon ?? 'magnifying-glass', {
          size: options.iconSize ?? 16,
          strokeWidth: options.iconStrokeWidth ?? 1.8,
        });
  if (icon) {
    const iconClassName = [
      'shrink-0 text-slate-400 transition-colors duration-150',
      options.quietUntilFocus ? 'group-focus-within:text-slate-500' : '',
      options.iconClassName ?? '',
    ]
      .join(' ')
      .trim();
    icon.setAttribute('class', iconClassName);
    icon.setAttribute('aria-hidden', 'true');
  }

  const input = document.createElement('input');
  input.type = options.type ?? 'text';
  input.value = options.value;
  input.placeholder = options.placeholder;
  input.setAttribute('aria-label', options.ariaLabel);
  input.className = [
    'min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none',
    options.quietUntilFocus ? 'placeholder:text-slate-300' : 'placeholder:text-slate-400',
    options.inputClassName ?? '',
  ]
    .join(' ')
    .trim();
  if (options.dataRole) {
    input.dataset.role = options.dataRole;
  }
  input.addEventListener('input', () => options.onInput(input.value));

  if (icon) {
    field.append(icon);
  }
  field.append(input);
  return field;
}

export type { TextFieldOptions };
