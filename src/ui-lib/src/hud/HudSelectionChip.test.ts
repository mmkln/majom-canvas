// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import {
  createHudSelectionChip,
  setHudSelectionChipState,
} from './HudSelectionChip.ts';

describe('HudSelectionChip', () => {
  it('creates a selected compact chip', () => {
    const chip = createHudSelectionChip({
      selected: true,
      size: 'compact',
      title: 'Pick day',
    });

    expect(chip.type).toBe('button');
    expect(chip.dataset.selected).toBe('true');
    expect(chip.title).toBe('Pick day');
  });

  it('updates chip selection state', () => {
    const chip = createHudSelectionChip();

    setHudSelectionChipState(chip, { selected: true });
    expect(chip.dataset.selected).toBe('true');

    setHudSelectionChipState(chip, { selected: false, disabled: true });
    expect(chip.dataset.selected).toBe('false');
    expect(chip.disabled).toBe(true);
  });
});
