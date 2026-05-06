export type PresentationMenuMode = 'peek' | 'open' | 'pinned';

export type PresentationMenuMachineState = {
  autoCollapseEnabled: boolean;
  mode: PresentationMenuMode;
};

export type PresentationMenuMachineEvent =
  | { type: 'open' }
  | { type: 'peek' }
  | { type: 'toggle-pin' }
  | { type: 'reset-visible' };

type CreatePresentationMenuMachineStateOptions = {
  autoCollapseEnabled: boolean;
  initiallyPinned: boolean;
};

export function createPresentationMenuMachineState(
  options: CreatePresentationMenuMachineStateOptions
): PresentationMenuMachineState {
  return {
    autoCollapseEnabled: options.autoCollapseEnabled,
    mode: options.autoCollapseEnabled
      ? options.initiallyPinned
        ? 'pinned'
        : 'peek'
      : 'open',
  };
}

export function transitionPresentationMenuMachineState(
  state: PresentationMenuMachineState,
  event: PresentationMenuMachineEvent
): PresentationMenuMachineState {
  switch (event.type) {
    case 'open':
      if (state.mode === 'pinned') {
        return state;
      }
      return {
        ...state,
        mode: 'open',
      };
    case 'peek':
      if (!state.autoCollapseEnabled || state.mode === 'pinned') {
        return state;
      }
      return {
        ...state,
        mode: 'peek',
      };
    case 'toggle-pin':
      if (!state.autoCollapseEnabled) {
        return {
          ...state,
          mode: 'open',
        };
      }
      return {
        ...state,
        mode: state.mode === 'pinned' ? 'open' : 'pinned',
      };
    case 'reset-visible':
      if (!state.autoCollapseEnabled) {
        return {
          ...state,
          mode: 'open',
        };
      }
      return {
        ...state,
        mode: state.mode === 'pinned' ? 'pinned' : 'peek',
      };
  }
}

export function isPresentationMenuExpanded(
  state: PresentationMenuMachineState
): boolean {
  return state.mode !== 'peek';
}

export function isPresentationMenuPinned(
  state: PresentationMenuMachineState
): boolean {
  return state.mode === 'pinned';
}
