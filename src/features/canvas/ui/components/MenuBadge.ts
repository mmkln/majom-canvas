export type MenuBadgeVariant = 'focus' | 'highlight';

const MENU_BADGE_CLASS = 'inline-flex h-1.5 w-1.5 shrink-0 rounded-full';

const MENU_BADGE_VARIANT_CLASS: Record<MenuBadgeVariant, string> = {
  focus: 'bg-purple-400',
  highlight: 'bg-orange-400',
};

export function createMenuBadge(variant: MenuBadgeVariant): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.className = `${MENU_BADGE_CLASS} ${MENU_BADGE_VARIANT_CLASS[variant]}`;
  badge.setAttribute('aria-hidden', 'true');
  return badge;
}
