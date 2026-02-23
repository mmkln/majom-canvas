import type { FieldRule } from './types.ts';

type RequiredOptions = {
  trim?: boolean;
};

type MinLengthOptions = {
  trim?: boolean;
};

function normalizeString(value: unknown, trim: boolean): string {
  if (typeof value !== 'string') return '';
  return trim ? value.trim() : value;
}

export function required<TValues>(
  message: string,
  options: RequiredOptions = {}
): FieldRule<TValues> {
  const trim = options.trim ?? true;
  return (value: unknown) => {
    const nextValue = normalizeString(value, trim);
    return nextValue.length > 0 ? null : message;
  };
}

export function minLength<TValues>(
  min: number,
  message: string,
  options: MinLengthOptions = {}
): FieldRule<TValues> {
  const trim = options.trim ?? false;
  return (value: unknown) => {
    const nextValue = normalizeString(value, trim);
    if (nextValue.length === 0) return null;
    return nextValue.length >= min ? null : message;
  };
}

export function email<TValues>(message: string): FieldRule<TValues> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return (value: unknown) => {
    const nextValue = normalizeString(value, true);
    if (nextValue.length === 0) return null;
    return emailRegex.test(nextValue) ? null : message;
  };
}
