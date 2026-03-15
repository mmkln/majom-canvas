export type HudToggleSwitchOptions = {
  label: string;
  checked?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  onChange?: (checked: boolean, event: Event) => void;
};

export function createHudToggleSwitch(
  options: HudToggleSwitchOptions
): HTMLLabelElement {
  const root = document.createElement('label');
  root.setAttribute('data-component', 'HudToggleSwitch');
  const disabled = options.disabled === true;
  root.className =
    `inline-flex w-full items-center px-4 py-3 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${options.className ?? ''}`.trim();

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'sr-only peer';
  input.checked = options.checked === true;
  input.disabled = disabled;
  input.setAttribute('role', 'switch');
  input.setAttribute('aria-checked', input.checked ? 'true' : 'false');
  input.setAttribute('aria-label', options.label);

  const track = document.createElement('div');
  track.className =
    "relative h-5 w-9 rounded-full bg-neutral-quaternary bg-slate-300 transition-colors peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-soft peer-focus:ring-indigo-200 dark:peer-focus:ring-brand-soft peer-checked:bg-brand peer-checked:bg-indigo-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-buffer peer-checked:after:border-white after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-transparent after:bg-white after:transition-all after:content-['']";
  track.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.className =
    `ms-3 select-none text-sm font-medium text-heading text-slate-700 ${options.labelClassName ?? ''}`.trim();
  text.textContent = options.label;

  input.addEventListener('change', (event) => {
    const target = event.currentTarget as HTMLInputElement | null;
    const checked = target?.checked === true;
    input.setAttribute('aria-checked', checked ? 'true' : 'false');
    options.onChange?.(checked, event);
  });

  root.append(input, track, text);
  return root;
}

