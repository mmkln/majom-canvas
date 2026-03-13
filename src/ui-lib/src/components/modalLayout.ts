import type { OverlayPresentation } from '../services/ModalService.ts';

export type ModalActionRowVariant = 'confirm' | 'form';

export type ModalActionRowOptions = {
  variant?: ModalActionRowVariant;
  className?: string;
};

export type ModalActionButtonPreset = 'default' | 'medium' | 'wide';

const MODAL_ACTION_BUTTON_CLASS_BY_PRESET: Record<
  ModalActionButtonPreset,
  string
> = {
  default: 'h-11 w-full justify-center md:h-9 md:w-auto md:min-w-[96px]',
  medium: 'h-11 w-full justify-center md:h-9 md:w-auto md:min-w-[104px]',
  wide: 'h-11 w-full justify-center md:h-9 md:w-auto md:min-w-[120px]',
};

export function getModalActionButtonClass(
  preset: ModalActionButtonPreset = 'default'
): string {
  return MODAL_ACTION_BUTTON_CLASS_BY_PRESET[preset];
}

export function createModalActionRow(
  options: ModalActionRowOptions = {}
): HTMLDivElement {
  const row = document.createElement('div');
  row.setAttribute('data-component', 'ModalActionRow');
  const variant = options.variant ?? 'confirm';
  const variantClass =
    variant === 'form'
      ? 'flex flex-col-reverse gap-2 border-t border-slate-200 pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] md:flex-row md:justify-end md:border-t-0 md:pt-0 md:pb-0'
      : 'mt-5 grid grid-cols-1 gap-2 md:flex md:justify-end';
  row.className = `${variantClass} ${options.className ?? ''}`.trim();
  return row;
}

export function getModalOverlayPlacementClass(
  presentation: OverlayPresentation
): string {
  if (presentation === 'dialog') return 'items-center';
  if (presentation === 'fullscreen') return 'items-stretch md:items-center';
  return 'items-end md:items-center';
}

export function getModalOverlayClass(
  presentation: OverlayPresentation
): string {
  if (presentation === 'bottom-sheet') {
    return 'fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-end md:items-center justify-center overflow-y-auto px-0 pt-0 pb-0 md:px-4 md:pt-[max(0.75rem,env(safe-area-inset-top))] md:pb-[max(0.75rem,env(safe-area-inset-bottom))]';
  }
  const placementClass = getModalOverlayPlacementClass(presentation);
  return `fixed inset-0 bg-black/20 backdrop-blur-[1px] flex ${placementClass} justify-center overflow-y-auto px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-4`;
}

export function getModalContainerClass(
  presentation: OverlayPresentation
): string {
  if (presentation === 'fullscreen') {
    return 'relative flex h-[calc(100dvh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom)))] w-full max-w-[42rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 pb-4 pt-4 shadow-[0_24px_56px_rgba(15,23,42,0.18)] md:h-auto md:max-h-[min(88vh,56rem)] md:w-[min(42rem,calc(100vw-2rem))] md:rounded-xl md:px-6 md:pb-5 md:pt-5';
  }
  if (presentation === 'bottom-sheet') {
    return 'relative flex w-screen max-w-none flex-col overflow-hidden rounded-none rounded-t-2xl border-x-0 border-b-0 border-t border-slate-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_24px_56px_rgba(15,23,42,0.18)] md:w-[min(34rem,calc(100vw-2rem))] md:max-h-[min(88vh,56rem)] md:rounded-xl md:border md:px-6 md:pb-5 md:pt-5';
  }
  return 'relative flex w-full max-w-[34rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 pb-4 pt-4 shadow-[0_24px_56px_rgba(15,23,42,0.18)] md:w-[min(34rem,calc(100vw-2rem))] md:max-h-[min(88vh,56rem)] md:rounded-xl md:px-6 md:pb-5 md:pt-5';
}

export function getModalContainerMaxHeight(
  presentation: OverlayPresentation
): string {
  return presentation === 'fullscreen' ? '' : 'min(92dvh, 56rem)';
}

export const MODAL_HEADER_CLASS = 'pr-8 shrink-0';
export const MODAL_DIVIDER_CLASS =
  'my-4 -mx-4 shrink-0 border-t border-slate-200 md:-mx-6';
export const MODAL_BODY_CLASS = 'min-h-0 flex-1 overflow-y-auto';
export const MODAL_FOOTER_CLASS = 'mt-4 shrink-0';
