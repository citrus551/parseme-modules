import * as assert from 'node:assert';
import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import { join } from 'path';

import { ParsemeConfig } from '../../../dist/core/config.js';
import { FileCollector } from '../../../dist/utils/file-collector.js';

describe('FileCollector', () => {
  let collector: FileCollector;
  let config: ParsemeConfig;
  const fixturesDir = join(process.cwd(), 'tests/fixtures');

  beforeEach(() => {
    config = new ParsemeConfig();
    collector = new FileCollector(config);
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe('getFiles', () => {
    test('should get all files without file type filtering', async () => {
      const result = await collector.getFiles(fixturesDir);

      assert.ok(Array.isArray(result.files));
      assert.ok(result.files.length > 0);
      assert.strictEqual(typeof result.totalFound, 'number');
      assert.strictEqual(typeof result.excluded, 'number');
      assert.strictEqual(result.totalFound, result.files.length + result.excluded);
    });

    test('should filter by file types when specified', async () => {
      const result = await collector.getFiles(fixturesDir, {
        fileTypes: ['ts', 'js'],
      });

      assert.ok(Array.isArray(result.files));
      // All returned files should be .ts or .js
      result.files.forEach((file) => {
        assert.ok(file.endsWith('.ts') || file.endsWith('.js'));
      });
    });

    test('should respect file limits when configured', async () => {
      const limitedConfig = new ParsemeConfig({
        limits: { maxFilesPerContext: 2 },
      });
      const limitedCollector = new FileCollector(limitedConfig);

      const result = await limitedCollector.getFiles(fixturesDir);

      assert.ok(result.files.length <= 2);
      if (result.totalFound > 2) {
        assert.strictEqual(result.files.length, 2);
        assert.strictEqual(result.excluded, result.totalFound - 2);
      }
    });

    test('should handle exclude patterns', async () => {
      const configWithExcludes = new ParsemeConfig({
        excludePatterns: ['**/*.test.ts'],
      });
      const excludeCollector = new FileCollector(configWithExcludes);

      const result = await excludeCollector.getFiles(fixturesDir);

      // Should not include test files
      assert.ok(!result.files.some((f) => f.endsWith('.test.ts')));
    });

    test('should show warning when files are excluded by limit', async () => {
      const limitedConfig = new ParsemeConfig({
        limits: { maxFilesPerContext: 1 },
      });
      const limitedCollector = new FileCollector(limitedConfig);

      // Mock console.warn to capture warnings
      const warnings: string[] = [];
      const originalWarn = console.warn;
      console.warn = (...args: unknown[]) => {
        warnings.push(args.join(' '));
      };

      try {
        const result = await limitedCollector.getFiles(fixturesDir);

        if (result.totalFound > 1) {
          // Should have shown a warning
          const limitWarnings = warnings.filter((w) => w.includes('File limit reached'));
          assert.ok(limitWarnings.length > 0);
          assert.ok(limitWarnings[0].includes('files excluded'));
        }
      } finally {
        console.warn = originalWarn;
      }
    });
  });

  describe('getAllProjectFiles', () => {
    test('should get all project files without file type filtering', async () => {
      const result = await collector.getAllProjectFiles(fixturesDir);

      assert.ok(Array.isArray(result.files));
      assert.ok(result.files.length > 0);
      // Should include various file types (not just code files)
      const hasNonCodeFiles = result.files.some(
        (f) =>
          !f.endsWith('.ts') && !f.endsWith('.js') && !f.endsWith('.tsx') && !f.endsWith('.jsx'),
      );
      assert.ok(hasNonCodeFiles);
    });

    test('should exclude files matching exclude patterns', async () => {
      const configWithExcludes = new ParsemeConfig({
        excludePatterns: ['**/*.test.ts', 'node_modules/**'],
      });
      const excludeCollector = new FileCollector(configWithExcludes);
      const result = await excludeCollector.getAllProjectFiles(fixturesDir);

      // Should not include test files
      assert.ok(!result.files.some((f) => f.endsWith('.test.ts')));
    });

    test('should respect maxFiles limit', async () => {
      const limitedConfig = new ParsemeConfig({
        limits: { maxFilesPerContext: 3 },
      });
      const limitedCollector = new FileCollector(limitedConfig);

      const result = await limitedCollector.getAllProjectFiles(fixturesDir);

      assert.ok(result.files.length <= 3);
      if (result.totalFound > 3) {
        assert.strictEqual(result.files.length, 3);
        assert.strictEqual(result.excluded, result.totalFound - 3);
      }
    });
  });

  describe('getCodeFiles', () => {
    test('should get only code files by default', async () => {
      const result = await collector.getCodeFiles(fixturesDir);

      assert.ok(Array.isArray(result.files));
      // All files should be code files
      result.files.forEach((file) => {
        assert.ok(
          file.endsWith('.ts') ||
            file.endsWith('.js') ||
            file.endsWith('.tsx') ||
            file.endsWith('.jsx'),
        );
      });
    });

    test('should respect custom file types', async () => {
      const result = await collector.getCodeFiles(fixturesDir, ['ts']);

      assert.ok(Array.isArray(result.files));
      // All files should be .ts files
      result.files.forEach((file) => {
        assert.ok(file.endsWith('.ts'));
      });
    });

    test('should apply limits to code files', async () => {
      const limitedConfig = new ParsemeConfig({
        limits: { maxFilesPerContext: 1 },
      });
      const limitedCollector = new FileCollector(limitedConfig);

      const result = await limitedCollector.getCodeFiles(fixturesDir);

      assert.ok(result.files.length <= 1);
      if (result.totalFound > 1) {
        assert.strictEqual(result.files.length, 1);
        assert.strictEqual(result.excluded, result.totalFound - 1);
      }
    });
  });
});
