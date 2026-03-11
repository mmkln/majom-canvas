import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const FORBIDDEN_IMPORT_SEGMENTS = [
  'features/canvas',
  'majom-wrapper',
  'config/environment',
];

const collectTsFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];

  entries.forEach((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
      return;
    }
    if (fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  });

  return files;
};

describe('canvas-core boundaries', () => {
  it('does not import product-specific modules', () => {
    const currentDir = fileURLToPath(new URL('.', import.meta.url));
    const files = collectTsFiles(currentDir).filter(
      (filePath) => !filePath.endsWith('.test.ts')
    );
    const violations: string[] = [];

    files.forEach((filePath) => {
      const content = readFileSync(filePath, 'utf8');
      FORBIDDEN_IMPORT_SEGMENTS.forEach((segment) => {
        if (content.includes(segment)) {
          violations.push(`${filePath} -> ${segment}`);
        }
      });
    });

    expect(violations).toEqual([]);
  });
});
