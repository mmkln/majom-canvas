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
  const rootPadding = size === 'compact' ? 'px-0 py-0' : 'px-4 py-3';
  const trackClassName =
    size === 'compact'
      ? "relative h-4 w-7 rounded-full bg-neutral-quaternary bg-slate-300 transition-colors peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-soft peer-focus:ring-indigo-200 dark:peer-focus:ring-brand-soft peer-checked:bg-brand peer-checked:bg-indigo-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-buffer peer-checked:after:border-white after:absolute after:start-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:border after:border-transparent after:bg-white after:transition-all after:content-['']"
      : "relative h-5 w-9 rounded-full bg-neutral-quaternary bg-slate-300 transition-colors peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-soft peer-focus:ring-indigo-200 dark:peer-focus:ring-brand-soft peer-checked:bg-brand peer-checked:bg-indigo-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-buffer peer-checked:after:border-white after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-transparent after:bg-white after:transition-all after:content-['']";
  const textSizeClass = size === 'compact' ? 'text-xs' : 'text-sm';
  root.className =
    `inline-flex ${fullWidth ? 'w-full' : 'w-auto'} items-center ${rootPadding} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${options.className ?? ''}`.trim();

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
    `${togglePosition === 'right' ? 'me-3' : 'ms-3'} select-none ${textSizeClass} font-medium text-heading text-slate-700 ${options.labelClassName ?? ''}`.trim();
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
