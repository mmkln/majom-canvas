import { describe, expect, it } from 'vitest';
import {
  createPresentationMenuMachineState,
  transitionPresentationMenuMachineState,
} from './PresentationMenuMachine.ts';

describe('PresentationMenuMachine', () => {
  it('starts in peek mode for auto-collapsing switchers', () => {
    const state = createPresentationMenuMachineState({
      autoCollapseEnabled: true,
      initiallyPinned: false,
    });

    expect(state.mode).toBe('peek');
  });

  it('enters open mode directly from peek', () => {
    const initialState = createPresentationMenuMachineState({
      autoCollapseEnabled: true,
      initiallyPinned: false,
    });

    const openState = transitionPresentationMenuMachineState(initialState, {
      type: 'open',
    });

    expect(openState.mode).toBe('open');
  });

  it('returns to peek from open', () => {
    const initialState = createPresentationMenuMachineState({
      autoCollapseEnabled: true,
      initiallyPinned: false,
    });

    const nextState = transitionPresentationMenuMachineState(
      transitionPresentationMenuMachineState(initialState, {
        type: 'open',
      }),
      { type: 'peek' }
    );

    expect(nextState.mode).toBe('peek');
  });

  it('toggles pinning between pinned and open', () => {
    const initialState = createPresentationMenuMachineState({
      autoCollapseEnabled: true,
      initiallyPinned: false,
    });

    const pinnedState = transitionPresentationMenuMachineState(
      transitionPresentationMenuMachineState(initialState, {
        type: 'open',
      }),
      { type: 'toggle-pin' }
    );
    const unpinnedState = transitionPresentationMenuMachineState(
      pinnedState,
      { type: 'toggle-pin' }
    );

    expect(pinnedState.mode).toBe('pinned');
    expect(unpinnedState.mode).toBe('open');
  });

  it('restores pinned mode on reset-visible when already pinned', () => {
    const initialState = createPresentationMenuMachineState({
      autoCollapseEnabled: true,
      initiallyPinned: true,
    });

    const nextState = transitionPresentationMenuMachineState(initialState, {
      type: 'reset-visible',
    });

    expect(nextState.mode).toBe('pinned');
  });
});
