export type HudToggleSwitchOptions = {
  label: string;
  checked?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  size?: 'default' | 'compact';
  fullWidth?: boolean;
  togglePosition?: 'left' | 'right';
  onChange?: (checked: boolean, event: Event) => void;
};

export function createHudToggleSwitch(
  options: HudToggleSwitchOptions
): HTMLLabelElement {
  const root = document.createElement('label');
  root.setAttribute('data-component', 'HudToggleSwitch');
  const disabled = options.disabled === true;
  const size = options.size ?? 'default';
  const fullWidth = options.fullWidth ?? true;
  const togglePosition = options.togglePosition ?? 'left';
  const gapClass = size === 'compact' ? 'gap-2' : 'gap-3';
  const trackClassName =
    size === 'compact'
      ? "relative h-4 w-7 shrink-0 rounded-full bg-slate-300 transition-colors duration-150 ease-out peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-200 peer-checked:bg-indigo-600 peer-disabled:bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:shadow-[0_1px_2px_rgba(15,23,42,0.18)] after:transition-transform after:duration-150 after:ease-out peer-checked:after:translate-x-3 after:content-['']"
      : "relative h-5 w-9 shrink-0 rounded-full bg-slate-300 transition-colors duration-150 ease-out peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-200 peer-checked:bg-indigo-600 peer-disabled:bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-[0_1px_2px_rgba(15,23,42,0.18)] after:transition-transform after:duration-150 after:ease-out peer-checked:after:translate-x-4 after:content-['']";
  const textSizeClass =
    size === 'compact' ? 'text-[13px] leading-[1.45]' : 'text-sm leading-5';
  root.className =
    `inline-flex ${fullWidth ? 'w-full' : 'w-auto'} items-center ${gapClass} ${togglePosition === 'right' && fullWidth ? 'justify-between' : ''} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${options.className ?? ''}`.trim();

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'sr-only peer';
  input.checked = options.checked === true;
  input.disabled = disabled;
  input.setAttribute('role', 'switch');
  input.setAttribute('aria-checked', input.checked ? 'true' : 'false');
  input.setAttribute('aria-label', options.label);

  const track = document.createElement('div');
  track.className = trackClassName;
  track.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.className =
    `${fullWidth ? 'min-w-0' : ''} select-none ${textSizeClass} font-medium text-slate-700 ${options.labelClassName ?? ''}`.trim();
  text.textContent = options.label;

  input.addEventListener('change', (event) => {
    const target = event.currentTarget as HTMLInputElement | null;
    const checked = target?.checked === true;
    input.setAttribute('aria-checked', checked ? 'true' : 'false');
    options.onChange?.(checked, event);
  });

  if (togglePosition === 'right') {
    if (fullWidth) {
      text.classList.add('flex-1');
    }
    root.append(input, text, track);
  } else {
    root.append(input, track, text);
  }
  return root;
}
