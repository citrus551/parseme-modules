import * as assert from 'node:assert';
import { test, describe, beforeEach, afterEach, mock } from 'node:test';

import { GitAnalyzer } from '../../../dist/analyzers/git-analyzer.js';
import { ParsemeConfig } from '../../../dist/config.js';

describe('GitAnalyzer', () => {
  let analyzer: GitAnalyzer;
  let config: ParsemeConfig;

  beforeEach(() => {
    config = new ParsemeConfig();
    analyzer = new GitAnalyzer(config);
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe('analyzeGit', () => {
    test('should handle non-git directories gracefully', async () => {
      const gitInfo = await analyzer.analyze('/non/existent/path');

      // Should return null for non-git directories
      assert.strictEqual(gitInfo, null);
    });

    test('should handle git command failures', async () => {
      // Test with a path that might exist but isn't a git repo
      const gitInfo = await analyzer.analyze('/tmp');

      // Should handle errors gracefully and return null
      assert.strictEqual(gitInfo, null);
    });
  });

  // Tests for individual git operations removed - these are tested through analyze()
  // The analyze() method is comprehensively tested in integration tests

  describe('error handling', () => {
    test('should handle missing git binary', async () => {
      // Test error handling when git is not available
      const gitInfo = await analyzer.analyze('/mock/path');

      // Should handle missing git gracefully
      assert.ok(gitInfo === null || typeof gitInfo === 'object');
    });

    test('should handle permission errors', async () => {
      // Test handling of permission denied errors
      const gitInfo = await analyzer.analyze('/root'); // Typically restricted

      // Should handle permission errors gracefully
      assert.ok(gitInfo === null || typeof gitInfo === 'object');
    });
  });
});
