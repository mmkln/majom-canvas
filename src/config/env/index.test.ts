import { describe, expect, it } from 'vitest';
import {
  resolveBoardsFeatureFlag,
  resolveWorkspaceFeatureFlag,
} from './index.ts';

describe('resolveBoardsFeatureFlag', () => {
  it('keeps boards visible by default without requiring a development build flag', () => {
    expect(resolveBoardsFeatureFlag(undefined)).toBe(true);
  });

  it('allows boards to be explicitly disabled by env flag', () => {
    expect(resolveBoardsFeatureFlag('false')).toBe(false);
  });

  it('keeps the legacy dev flag as a fallback override', () => {
    expect(resolveBoardsFeatureFlag(undefined, 'false')).toBe(false);
  });
});

describe('resolveWorkspaceFeatureFlag', () => {
  it('keeps workspaces visible by default without requiring a development build flag', () => {
    expect(resolveWorkspaceFeatureFlag(undefined)).toBe(true);
  });

  it('allows workspaces to be explicitly disabled by env flag', () => {
    expect(resolveWorkspaceFeatureFlag('false')).toBe(false);
  });

  it('keeps the legacy dev flag as a fallback override', () => {
    expect(resolveWorkspaceFeatureFlag(undefined, 'false')).toBe(false);
  });
});
