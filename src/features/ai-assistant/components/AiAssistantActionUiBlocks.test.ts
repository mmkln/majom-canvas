// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import {
  createActionCardSurface,
  createActionImportantMetaBlock,
  createActionPreviewSurface,
} from './AiAssistantActionUiBlocks.ts';
import { AI_ASSISTANT_ACTION_TOKENS } from './AiAssistantActionUiTokens.ts';

describe('AiAssistantActionUiBlocks', () => {
  it('renders default action cards as low-chrome local surfaces', () => {
    const surface = createActionCardSurface({
      kind: 'single',
      gap: '0',
    });

    expect(surface.getAttribute('data-component')).toBeNull();
    expect(surface.style.borderStyle).toBe('none');
    expect(surface.style.boxShadow).toBe('none');
    expect(surface.style.background).toBe(
      AI_ASSISTANT_ACTION_TOKENS.surface.cardBackground
    );
  });

  it('keeps semantic borders only for failed action cards', () => {
    const failedSurface = createActionCardSurface({
      kind: 'single',
      gap: '0',
      status: 'failed',
    });

    expect(failedSurface.style.border).toBe(
      AI_ASSISTANT_ACTION_TOKENS.surface.cardFailedBorder
    );
    expect(failedSurface.style.boxShadow).toBe('none');
  });

  it('renders preview and important-meta surfaces without HudSurface chrome', () => {
    const preview = createActionPreviewSurface();
    const meta = createActionImportantMetaBlock('Selected story');

    expect(preview.getAttribute('data-component')).toBeNull();
    expect(preview.style.borderStyle).toBe('none');
    expect(preview.style.boxShadow).toBe('none');
    expect(meta.getAttribute('data-component')).toBeNull();
    expect(meta.style.borderStyle).toBe('none');
    expect(meta.style.boxShadow).toBe('none');
  });
});
