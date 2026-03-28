type InteractiveRowOptions = {
  className?: string;
  dataRole?: string;
  onClick?: () => void;
};

export function InteractiveRow(
  options: InteractiveRowOptions = {}
): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = [
    'w-full rounded-[18px] text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/80',
    options.className ?? '',
  ]
    .join(' ')
    .trim();
  if (options.dataRole) {
    element.dataset.role = options.dataRole;
  }
  if (options.onClick) {
    element.addEventListener('click', options.onClick);
  }
  return element;
}

export type { InteractiveRowOptions };
