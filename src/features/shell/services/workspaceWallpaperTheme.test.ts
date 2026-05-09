// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import {
  resolveBrightnessFromHex,
  resolveWorkspaceWallpaperHeaderTheme,
} from './workspaceWallpaperTheme.ts';

describe('workspaceWallpaperTheme', () => {
  it('resolves dark foreground controls for a light wallpaper', () => {
    const theme = resolveWorkspaceWallpaperHeaderTheme({
      hasImage: true,
      brightness: resolveBrightnessFromHex('#f4f7fb'),
    });

    expect(theme.tone).toBe('on-light');
    expect(theme.textColor).toBe('#172b4d');
    expect(theme.buttonBackground).toBe('rgba(9, 30, 66, 0.1)');
  });

  it('resolves light foreground controls for a dark wallpaper', () => {
    const theme = resolveWorkspaceWallpaperHeaderTheme({
      hasImage: true,
      brightness: resolveBrightnessFromHex('#102033'),
    });

    expect(theme.tone).toBe('on-dark');
    expect(theme.textColor).toBe('#ffffff');
    expect(theme.buttonBackground).toBe('rgba(255, 255, 255, 0.18)');
  });

  it('uses a readable dark-overlay fallback while image analysis is unavailable', () => {
    const theme = resolveWorkspaceWallpaperHeaderTheme({
      hasImage: true,
      brightness: null,
    });

    expect(theme.tone).toBe('on-dark');
  });
});
