export type WorkspaceViewSwitcherMode = 'peek' | 'open' | 'pinned';

export type WorkspaceViewSwitcherMachineState = {
  autoCollapseEnabled: boolean;
  mode: WorkspaceViewSwitcherMode;
};

export type WorkspaceViewSwitcherMachineEvent =
  | { type: 'open' }
  | { type: 'peek' }
  | { type: 'toggle-pin' }
  | { type: 'reset-visible' };

type CreateWorkspaceViewSwitcherMachineStateOptions = {
  autoCollapseEnabled: boolean;
  initiallyPinned: boolean;
};

export function createWorkspaceViewSwitcherMachineState(
  options: CreateWorkspaceViewSwitcherMachineStateOptions
): WorkspaceViewSwitcherMachineState {
  return {
    autoCollapseEnabled: options.autoCollapseEnabled,
    mode: options.autoCollapseEnabled
      ? options.initiallyPinned
        ? 'pinned'
        : 'peek'
      : 'open',
  };
}

export function transitionWorkspaceViewSwitcherMachineState(
  state: WorkspaceViewSwitcherMachineState,
  event: WorkspaceViewSwitcherMachineEvent
): WorkspaceViewSwitcherMachineState {
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

export function isWorkspaceViewSwitcherExpanded(
  state: WorkspaceViewSwitcherMachineState
): boolean {
  return state.mode !== 'peek';
}

export function isWorkspaceViewSwitcherPinned(
  state: WorkspaceViewSwitcherMachineState
): boolean {
  return state.mode === 'pinned';
}
