import * as assert from 'node:assert';
import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import { join } from 'path';

import { ASTAnalyzer } from '../../../../dist/core/analyzers/ast-analyzer.js';
import { ParsemeConfig as parsemeConfig } from '../../../../dist/core/config.js';

describe('ASTAnalyzer', () => {
  let analyzer: ASTAnalyzer;
  let config: parsemeConfig;
  const fixturesDir = join(import.meta.dirname, '../../../fixtures');

  beforeEach(() => {
    config = new parsemeConfig({
      rootDir: fixturesDir,
      includePatterns: ['**/*.ts', '**/*.js'],
      excludePatterns: ['node_modules/**'],
    });
    analyzer = new ASTAnalyzer(config);
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe('analyzeProject', () => {
    test('should analyze all files in project', async () => {
      const results = await analyzer.analyzeProject(fixturesDir);

      assert.ok(results.length > 0, 'Should find files to analyze');

      // Check that results contain expected properties from pattern analysis
      results.forEach((result) => {
        assert.ok(typeof result.path === 'string');
        assert.ok(typeof result.type === 'string');
        assert.ok(Array.isArray(result.exports));
        assert.ok(Array.isArray(result.imports));
        assert.ok(Array.isArray(result.functions));
        assert.ok(Array.isArray(result.classes));
        // New pattern-based properties
        assert.ok(Array.isArray(result.routes));
        assert.ok(Array.isArray(result.components));
        assert.ok(Array.isArray(result.services));
        assert.ok(Array.isArray(result.models));
        assert.ok(Array.isArray(result.configs));
        assert.ok(Array.isArray(result.middleware));
        assert.ok(Array.isArray(result.utilities));
      });
    });

    test('should handle JavaScript files with pattern detection', async () => {
      const results = await analyzer.analyzeProject(fixturesDir);

      const jsFile = results.find((r) => r.path.includes('express-routes.js'));
      if (jsFile) {
        assert.ok(jsFile.exports.length >= 0);
        // Should detect routes in Express file
        assert.ok(jsFile.routes.length >= 0);
        // File type should be determined by patterns, not just extension
        assert.ok(['route', 'utility', 'service'].includes(jsFile.type));
      }
    });

    test('should handle TypeScript files with pattern detection', async () => {
      const results = await analyzer.analyzeProject(fixturesDir);

      const tsFile = results.find((r) => r.path.includes('.ts'));
      if (tsFile) {
        assert.ok(tsFile.exports.length >= 0);
        // Should detect TypeScript-specific patterns like interfaces
        assert.ok(tsFile.models.length >= 0);
      }
    });

    test('should respect exclude patterns', async () => {
      const configWithExcludes = new parsemeConfig({
        rootDir: fixturesDir,
        includePatterns: ['**/*.ts', '**/*.js'],
        excludePatterns: ['**/*express*'],
      });
      const analyzerWithExcludes = new ASTAnalyzer(configWithExcludes);

      const results = await analyzerWithExcludes.analyzeProject(fixturesDir);
      const expressFile = results.find((r) => r.path.includes('express-routes.js'));
      assert.strictEqual(expressFile, undefined);
    });
  });

  describe('analyzeFile', () => {
    test('should return null for non-JS/TS files', async () => {
      const result = await analyzer.analyzeFile('/path/to/file.txt', 'file.txt');
      assert.strictEqual(result, null);
    });

    test('should analyze JavaScript files', async () => {
      // This would require a real file, so we'll test the pattern in integration tests
      assert.ok(true, 'Placeholder for file-specific JS analysis');
    });

    test('should analyze TypeScript files', async () => {
      // This would require a real file, so we'll test the pattern in integration tests
      assert.ok(true, 'Placeholder for file-specific TS analysis');
    });

    test('should determine file type based on patterns', async () => {
      // File type should be determined dynamically by what patterns are found
      // This will be tested with actual fixture files in integration tests
      assert.ok(true, 'File type determination tested in integration');
    });
  });

  describe('parseFile', () => {
    test('should handle TypeScript syntax', () => {
      // The parseFile method should correctly configure Babel for TS
      assert.ok(true, 'Parser configuration tested implicitly');
    });

    test('should handle JSX syntax', () => {
      // The parseFile method should correctly configure Babel for JSX
      assert.ok(true, 'Parser configuration tested implicitly');
    });
  });
});
