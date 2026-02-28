export type HudFormMessageTone = 'error' | 'info' | 'success';

type HudFormMessageOptions = {
  className?: string;
  tone?: HudFormMessageTone;
  ariaLive?: 'polite' | 'assertive';
};

type HudFormMessageState = {
  message?: string | null;
  tone?: HudFormMessageTone;
};

export type HudFormMessage = {
  element: HTMLDivElement;
  show: (message: string, tone?: HudFormMessageTone) => void;
  clear: () => void;
  setState: (state: HudFormMessageState) => void;
};

const classByTone: Record<HudFormMessageTone, string> = {
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-slate-200 bg-slate-50 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

function setToneClass(
  element: HTMLDivElement,
  previousTone: HudFormMessageTone,
  nextTone: HudFormMessageTone
): void {
  element.classList.remove(...classByTone[previousTone].split(' '));
  element.classList.add(...classByTone[nextTone].split(' '));
}

export function createHudFormMessage(
  options: HudFormMessageOptions = {}
): HudFormMessage {
  const element = document.createElement('div');
  const baseClass = 'hidden rounded-lg border px-3 py-2.5 text-sm';
  const tone = options.tone ?? 'error';
  element.className =
    `${baseClass} ${classByTone[tone]} ${options.className ?? ''}`.trim();
  element.setAttribute('aria-live', options.ariaLive ?? 'polite');

  let currentTone = tone;

  const applyState = (state: HudFormMessageState): void => {
    if (state.tone !== undefined && state.tone !== currentTone) {
      setToneClass(element, currentTone, state.tone);
      currentTone = state.tone;
    }

    if (state.message !== undefined) {
      const nextMessage = state.message?.trim() ?? '';
      if (nextMessage.length === 0) {
        element.textContent = '';
        element.classList.add('hidden');
        element.removeAttribute('role');
      } else {
        element.textContent = nextMessage;
        element.classList.remove('hidden');
        element.setAttribute(
          'role',
          currentTone === 'error' ? 'alert' : 'status'
        );
      }
    }
  };

  return {
    element,
    show: (message: string, nextTone?: HudFormMessageTone) =>
      applyState({ message, tone: nextTone }),
    clear: () => applyState({ message: '' }),
    setState: applyState,
  };
}
