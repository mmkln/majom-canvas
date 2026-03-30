// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createTimeSelect, setTimeSelectState } from './index.ts';

describe('HudTimeSelect', () => {
  it('creates stepped time options and reports minute values', () => {
    const onChange = vi.fn();
    const select = createTimeSelect({
      minMinute: 9 * 60,
      maxMinute: 10 * 60,
      stepMinutes: 15,
      selectedMinute: 9 * 60 + 30,
      onChange,
    });

    expect(
      Array.from(select.options).map((option) => option.textContent)
    ).toEqual(['09:00', '09:15', '09:30', '09:45', '10:00']);
    expect(select.value).toBe(String(9 * 60 + 30));

    select.value = String(9 * 60 + 45);
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toBe(9 * 60 + 45);
  });

  it('supports state updates and includes 24:00 when needed', () => {
    const select = createTimeSelect({
      minMinute: 23 * 60 + 30,
      maxMinute: 24 * 60,
      stepMinutes: 30,
      selectedMinute: 24 * 60,
    });

    expect(
      Array.from(select.options).map((option) => option.textContent)
    ).toEqual(['23:30', '24:00']);

    setTimeSelectState(select, { disabled: true, invalid: true });

    expect(select.disabled).toBe(true);
    expect(select.getAttribute('aria-invalid')).toBe('true');
  });
});
