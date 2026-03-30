import { describe, expect, it } from 'vitest';
import {
  createWorkspaceViewSwitcherMachineState,
  transitionWorkspaceViewSwitcherMachineState,
} from './WorkspaceViewSwitcherMachine.ts';

describe('WorkspaceViewSwitcherMachine', () => {
  it('starts in peek mode for auto-collapsing switchers', () => {
    const state = createWorkspaceViewSwitcherMachineState({
      autoCollapseEnabled: true,
      initiallyPinned: false,
    });

    expect(state.mode).toBe('peek');
  });

  it('enters open mode directly from peek', () => {
    const initialState = createWorkspaceViewSwitcherMachineState({
      autoCollapseEnabled: true,
      initiallyPinned: false,
    });

    const openState = transitionWorkspaceViewSwitcherMachineState(initialState, {
      type: 'open',
    });

    expect(openState.mode).toBe('open');
  });

  it('returns to peek from open', () => {
    const initialState = createWorkspaceViewSwitcherMachineState({
      autoCollapseEnabled: true,
      initiallyPinned: false,
    });

    const nextState = transitionWorkspaceViewSwitcherMachineState(
      transitionWorkspaceViewSwitcherMachineState(initialState, {
        type: 'open',
      }),
      { type: 'peek' }
    );

    expect(nextState.mode).toBe('peek');
  });

  it('toggles pinning between pinned and open', () => {
    const initialState = createWorkspaceViewSwitcherMachineState({
      autoCollapseEnabled: true,
      initiallyPinned: false,
    });

    const pinnedState = transitionWorkspaceViewSwitcherMachineState(
      transitionWorkspaceViewSwitcherMachineState(initialState, {
        type: 'open',
      }),
      { type: 'toggle-pin' }
    );
    const unpinnedState = transitionWorkspaceViewSwitcherMachineState(
      pinnedState,
      { type: 'toggle-pin' }
    );

    expect(pinnedState.mode).toBe('pinned');
    expect(unpinnedState.mode).toBe('open');
  });

  it('restores pinned mode on reset-visible when already pinned', () => {
    const initialState = createWorkspaceViewSwitcherMachineState({
      autoCollapseEnabled: true,
      initiallyPinned: true,
    });

    const nextState = transitionWorkspaceViewSwitcherMachineState(initialState, {
      type: 'reset-visible',
    });

    expect(nextState.mode).toBe('pinned');
  });
});
