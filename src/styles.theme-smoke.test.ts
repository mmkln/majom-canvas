import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('theme semantic tokens smoke', () => {
  beforeAll(() => {
    const stylesPath = resolve(process.cwd(), 'src/styles.css');
    const css = readFileSync(stylesPath, 'utf8');
    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);
  });

  it('switches root semantic palette when data-theme changes', () => {
    const root = document.documentElement;

    root.removeAttribute('data-theme');
    const lightStyles = getComputedStyle(root);
    const lightSurface = lightStyles
      .getPropertyValue('--surface-base')
      .trim()
      .toLowerCase();
    const lightText = lightStyles
      .getPropertyValue('--text-primary')
      .trim()
      .toLowerCase();

    root.setAttribute('data-theme', 'dark');
    const darkStyles = getComputedStyle(root);
    const darkSurface = darkStyles
      .getPropertyValue('--surface-base')
      .trim()
      .toLowerCase();
    const darkText = darkStyles
      .getPropertyValue('--text-primary')
      .trim()
      .toLowerCase();

    expect(lightSurface).toBe('#ffffff');
    expect(darkSurface).toBe('#0f172a');
    expect(lightText).toBe('#0f172a');
    expect(darkText).toBe('#f8fafc');
    expect(lightSurface).not.toBe(darkSurface);
    expect(lightText).not.toBe(darkText);
  });
});
