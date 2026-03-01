import { describe, expect, it } from 'vitest';
import {
  getModalContainerClass,
  getModalOverlayClass,
  getModalOverlayPlacementClass,
} from './modalLayout.ts';

describe('modalLayout bottom-sheet', () => {
  it('uses bottom placement and no outer mobile insets', () => {
    const overlayClass = getModalOverlayClass('bottom-sheet');
    expect(overlayClass).toContain('items-end');
    expect(overlayClass).toContain('px-0');
    expect(overlayClass).toContain('pb-0');
    expect(overlayClass).not.toContain('px-3');
  });

  it('uses full-width sheet with only top corners rounded on mobile', () => {
    const containerClass = getModalContainerClass('bottom-sheet');
    expect(containerClass).toContain('w-screen');
    expect(containerClass).toContain('max-w-none');
    expect(containerClass).toContain('rounded-none');
    expect(containerClass).toContain('rounded-t-2xl');
    expect(containerClass).toContain('border-x-0');
    expect(containerClass).toContain('border-b-0');
    expect(containerClass).toContain('border-t');
    expect(containerClass).toContain('md:rounded-xl');
  });

  it('keeps explicit placement API consistent for bottom-sheet', () => {
    expect(getModalOverlayPlacementClass('bottom-sheet')).toBe(
      'items-end md:items-center'
    );
  });
});
