import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox.ts';

describe('Checkbox', () => {
  it('creates component with default state', () => {
    const component = new Checkbox();
    expect(component.checked).toBe(false);
    expect(component.disabled).toBe(false);
    expect(component.label).toBe('');
    expect(component.getRootClassName()).toContain('cursor-pointer');
  });

  it('toggles when enabled', () => {
    const component = new Checkbox({ checked: false, disabled: false });
    component.toggleChecked();
    expect(component.checked).toBe(true);
  });

  it('does not toggle when disabled', () => {
    const component = new Checkbox({ checked: false, disabled: true });
    component.toggleChecked();
    expect(component.checked).toBe(false);
    expect(component.getRootClassName()).toContain('cursor-not-allowed');
  });

  it('emits onChange with correct boolean', () => {
    const component = new Checkbox({ checked: false });
    const onChange = vi.fn();
    component.onChange(onChange);
    component.toggleChecked();
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('writeValue updates checked state', () => {
    const component = new Checkbox({ checked: false });
    component.writeValue(true);
    expect(component.checked).toBe(true);
  });

  it('calls registered onChange and onTouched callbacks', () => {
    const component = new Checkbox({ checked: false });
    const cvaChange = vi.fn();
    const cvaTouched = vi.fn();
    component.registerOnChange(cvaChange);
    component.registerOnTouched(cvaTouched);

    component.toggleChecked();

    expect(cvaChange).toHaveBeenCalledWith(true);
    expect(cvaTouched).toHaveBeenCalledTimes(1);
  });

  it('renders unchecked/checked indicator class sets', () => {
    const component = new Checkbox({ checked: false, disabled: false });
    expect(component.getIndicatorClassName()).toContain(
      'border-gray-400 hover:border-gray-500 bg-white'
    );

    component.writeValue(true);
    expect(component.getIndicatorClassName()).toContain(
      'bg-blue-600 border-blue-600'
    );
  });

  it('resolves aria-label from ariaLabel or label', () => {
    const withAria = new Checkbox({
      label: 'Routine A',
      ariaLabel: 'Toggle routine A',
    });
    expect(withAria.getResolvedAriaLabel()).toBe('Toggle routine A');

    const withLabelOnly = new Checkbox({ label: 'Routine B' });
    expect(withLabelOnly.getResolvedAriaLabel()).toBe('Routine B');
  });
});
