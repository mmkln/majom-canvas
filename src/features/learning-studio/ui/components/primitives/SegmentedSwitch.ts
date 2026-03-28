type SegmentedSwitchItem<T extends string> = {
  value: T;
  label: string;
  dataRole?: string;
};

type SegmentedSwitchOptions<T extends string> = {
  items: SegmentedSwitchItem<T>[];
  value: T;
  onChange: (value: T) => void;
  dataRole?: string;
  className?: string;
  buttonClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
};

export function SegmentedSwitch<T extends string>(
  options: SegmentedSwitchOptions<T>
): HTMLDivElement {
  const root = document.createElement('div');
  root.className = [
    'inline-flex flex-wrap items-center gap-0.5 rounded-full bg-slate-50 p-0.5',
    options.className ?? '',
  ]
    .join(' ')
    .trim();

  if (options.dataRole) {
    root.dataset.role = options.dataRole;
  }

  options.items.forEach((item) => {
    const button = document.createElement('button');
    const active = options.value === item.value;
    button.type = 'button';
    button.className = [
      'inline-flex items-center justify-center rounded-full px-3.5 py-2 text-[13px] font-medium transition-[background-color,color] duration-150',
      active
        ? 'bg-white text-slate-950 font-semibold'
        : 'text-slate-400 hover:bg-white/70 hover:text-slate-700',
      options.buttonClassName ?? '',
      active ? options.activeClassName ?? '' : options.inactiveClassName ?? '',
    ]
      .join(' ')
      .trim();
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    if (item.dataRole) {
      button.dataset.role = item.dataRole;
    }
    button.textContent = item.label;
    button.addEventListener('click', () => options.onChange(item.value));
    root.append(button);
  });

  return root;
}

export type { SegmentedSwitchItem, SegmentedSwitchOptions };
