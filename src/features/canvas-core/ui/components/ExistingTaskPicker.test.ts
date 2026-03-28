// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { of } from 'rxjs';
import { ExistingTaskPicker } from './ExistingTaskPicker.ts';
import { createAppRuntime } from '../../../../app-runtime/index.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ExistingTaskPicker', () => {
  it('updates picker copy when locale changes at runtime', () => {
    const runtime = createAppRuntime({ initialLocale: 'en' });
    const picker = new ExistingTaskPicker(
      () =>
        of({
          items: [],
          hasMore: false,
        }),
      30,
      runtime
    );

    picker.open({
      sceneX: 0,
      sceneY: 0,
      onPick: () => {},
      isOnCanvas: () => false,
    });

    try {
      const searchInput = document.querySelector(
        'input[type="search"]'
      ) as HTMLInputElement | null;
      expect(document.body.textContent).toContain('Tasks');
      expect(searchInput?.placeholder).toBe('Search tasks...');

      runtime.setLocale('uk');

      expect(document.body.textContent).toContain('Задачі');
      expect(searchInput?.placeholder).toBe('Шукати задачі...');
    } finally {
      picker.close();
    }
  });
});
