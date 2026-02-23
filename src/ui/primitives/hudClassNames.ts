export const HUD_SURFACE_CLASS =
  'rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_10px_26px_rgba(15,23,42,0.14)] backdrop-blur-sm';

export const HUD_SURFACE_ELEVATED_CLASS =
  'rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_18px_42px_rgba(15,23,42,0.18)] backdrop-blur-sm';

export const HUD_BUTTON_BASE_CLASS =
  'rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400';

export const HUD_TEXT_BUTTON_SECONDARY_CLASS =
  'truncate rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-slate-400';

export const HUD_TEXT_BUTTON_TERTIARY_CLASS =
  'truncate rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-slate-400';

export const HUD_TEXT_BUTTON_DANGER_CLASS =
  'truncate rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-slate-400';

export const HUD_ICON_BUTTON_SECONDARY_CLASS =
  'inline-flex shrink-0 items-center justify-center rounded-lg p-0 text-[15px] font-semibold leading-none text-indigo-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-slate-400';

export const HUD_ICON_BUTTON_TERTIARY_CLASS =
  'inline-flex shrink-0 items-center justify-center rounded-lg p-0 text-[15px] font-medium leading-none text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-slate-400';

export const HUD_ICON_BUTTON_DANGER_CLASS =
  'inline-flex shrink-0 items-center justify-center rounded-lg p-0 text-[15px] font-medium leading-none text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-slate-400';

export const HUD_ICON_BUTTON_SIZE_SM_CLASS = 'h-8 w-8';
export const HUD_ICON_BUTTON_SIZE_MD_CLASS = 'h-9 w-9';
export const HUD_ICON_BUTTON_SIZE_LG_CLASS = 'h-10 w-10';

export const HUD_PRIMARY_BUTTON_CLASS =
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white bg-indigo-600 transition-colors hover:border-indigo-600 hover:bg-indigo-700 active:border-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400';

export const HUD_DROPDOWN_CLASS = `${HUD_SURFACE_ELEVATED_CLASS} overflow-hidden`;

export const HUD_DIVIDER_BASE_CLASS = 'border-t';
export const HUD_DIVIDER_DEFAULT_TONE_CLASS = 'border-slate-200';
export const HUD_DIVIDER_SOFT_TONE_CLASS = 'border-slate-100';
export const HUD_DIVIDER_INSET_CLASS = 'mx-2';
export const HUD_DIVIDER_SPACED_CLASS = 'my-1';

export const HUD_MENU_ITEM_BASE_CLASS =
  'flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-inset';

export const HUD_MENU_ITEM_DEFAULT_CLASS =
  'font-normal text-slate-600 hover:bg-indigo-50 hover:text-slate-800';

export const HUD_MENU_ITEM_EMPHASIS_CLASS =
  'font-semibold text-slate-700 hover:bg-indigo-50 hover:text-slate-900';

export const HUD_MENU_ITEM_SELECTED_CLASS =
  'bg-indigo-50 font-medium text-indigo-700';

export const HUD_MENU_ITEM_ACCENT_CREATE_CLASS =
  'font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700';

export const HUD_MENU_ITEM_DANGER_CLASS =
  'font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700';

export const HUD_MENU_ITEM_DISABLED_CLASS =
  'cursor-not-allowed text-slate-400 hover:bg-transparent hover:text-slate-400';

export const HUD_PAGE_EYEBROW_CLASS =
  'mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400';

export const HUD_PAGE_TITLE_CLASS =
  'text-[30px] font-semibold leading-none tracking-tight text-slate-900';

export const HUD_FIELD_CLASS = 'mb-4 space-y-1.5';
export const HUD_FIELD_LABEL_BASE_CLASS = 'block text-[13px] font-medium leading-5';
export const HUD_FIELD_LABEL_DEFAULT_CLASS = 'text-slate-500';
export const HUD_FIELD_LABEL_MUTED_CLASS = 'text-slate-400';
export const HUD_FIELD_LABEL_ERROR_CLASS = 'text-rose-700';
export const HUD_FIELD_LABEL_DISABLED_CLASS = 'text-slate-400';
export const HUD_FIELD_REQUIRED_MARK_CLASS = 'ml-1 text-rose-400';
export const HUD_FIELD_HINT_CLASS = 'text-xs text-slate-500';
export const HUD_FIELD_ERROR_CLASS = 'text-xs font-medium text-rose-600';

// Backward-compatible alias.
export const HUD_FIELD_LABEL_CLASS = `${HUD_FIELD_LABEL_BASE_CLASS} ${HUD_FIELD_LABEL_DEFAULT_CLASS}`;

export const HUD_INPUT_BASE_CLASS =
  'w-full outline-none transition-colors disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 aria-[invalid=true]:border-rose-300 aria-[invalid=true]:bg-rose-50 aria-[invalid=true]:ring-rose-100';

export const HUD_INPUT_DEFAULT_CLASS =
  'h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200';

export const HUD_INPUT_INLINE_CLASS =
  'h-[34px] rounded-lg border border-indigo-200/70 bg-indigo-50/70 px-3 text-sm font-semibold text-indigo-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100';

export const HUD_SEGMENTED_CONTROL_CLASS =
  'inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1';

export const HUD_SEGMENTED_ITEM_CLASS =
  'inline-flex items-center justify-center rounded-md px-2.5 text-sm font-medium text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-0';

export const HUD_SEGMENTED_ITEM_SM_CLASS = 'h-7 min-w-7 text-xs';
export const HUD_SEGMENTED_ITEM_MD_CLASS = 'h-8 min-w-8 text-sm';

export const HUD_SEGMENTED_ITEM_ACTIVE_CLASS =
  'bg-slate-100 text-slate-900';

export const HUD_SEGMENTED_ITEM_INACTIVE_CLASS =
  'hover:bg-slate-50 hover:text-slate-800';

export const HUD_SEGMENTED_ITEM_DISABLED_CLASS =
  'cursor-not-allowed text-slate-400 hover:bg-transparent hover:text-slate-400';

// Backward-compatible aliases.
export const HUD_SOFT_TEXT_BUTTON_CLASS = HUD_TEXT_BUTTON_SECONDARY_CLASS;
export const HUD_SOFT_ICON_BUTTON_CLASS = HUD_ICON_BUTTON_SECONDARY_CLASS;
export const HUD_DROPDOWN_ITEM_CLASS = HUD_MENU_ITEM_BASE_CLASS;
export const HUD_DROPDOWN_ITEM_DEFAULT_CLASS = HUD_MENU_ITEM_DEFAULT_CLASS;
export const HUD_DROPDOWN_ITEM_ACTIVE_CLASS = HUD_MENU_ITEM_SELECTED_CLASS;
export const HUD_INLINE_INPUT_CLASS = `${HUD_INPUT_BASE_CLASS} ${HUD_INPUT_INLINE_CLASS}`;
