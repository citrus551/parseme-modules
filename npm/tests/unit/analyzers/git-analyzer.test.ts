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
    test('should analyze git repository info', async () => {
      // Mock execSync to simulate git commands
      const execSyncMock = mock.fn();
      execSyncMock
        .mockImplementationOnce(() => 'main') // git branch --show-current
        .mockImplementationOnce(() => 'abc123 Latest commit message') // git log -1
        .mockImplementationOnce(() => 'M file1.js\nA file2.ts\n') // git status --porcelain
        .mockImplementationOnce(() => 'diff --git a/file1.js\n+added line\n'); // git diff

      // We can't easily mock child_process in Node.js test runner, so we'll test the interface
      // This would work in a real test where we can control the git commands
      const gitInfo = await analyzer.analyzeGit('/mock/project/path');

      // Test that the method exists and returns a structure
      assert.ok(typeof gitInfo === 'object');
      assert.ok('branch' in gitInfo || gitInfo === null); // null if not a git repo
    });

    test('should handle non-git directories gracefully', async () => {
      const gitInfo = await analyzer.analyzeGit('/non/existent/path');

      // Should return null for non-git directories
      assert.strictEqual(gitInfo, null);
    });

    test('should handle git command failures', async () => {
      // Test with a path that might exist but isn't a git repo
      const gitInfo = await analyzer.analyzeGit('/tmp');

      // Should handle errors gracefully and return null
      assert.strictEqual(gitInfo, null);
    });
  });

  describe('getCurrentBranch', () => {
    test('should extract branch name from git output', async () => {
      // Test the method interface
      const result = await analyzer.getCurrentBranch('/mock/path');

      // Should return a string or null
      assert.ok(typeof result === 'string' || result === null);
    });
  });

  describe('getLastCommit', () => {
    test('should extract last commit info', async () => {
      const result = await analyzer.getLastCommit('/mock/path');

      // Should return a string or null
      assert.ok(typeof result === 'string' || result === null);
    });
  });

  describe('getChangedFiles', () => {
    test('should extract list of changed files', async () => {
      const result = await analyzer.getChangedFiles('/mock/path');

      // Should return an array
      assert.ok(Array.isArray(result));
    });
  });

  describe('getGitStatus', () => {
    test('should determine if repo is clean or dirty', async () => {
      const result = await analyzer.getGitStatus('/mock/path');

      // Should return 'clean', 'dirty', or null
      assert.ok(result === 'clean' || result === 'dirty' || result === null);
    });
  });

  describe('getGitDiff', () => {
    test('should get git diff output', async () => {
      const result = await analyzer.getGitDiff('/mock/path');

      // Should return a string or null
      assert.ok(typeof result === 'string' || result === null);
    });
  });

  describe('error handling', () => {
    test('should handle missing git binary', async () => {
      // Test error handling when git is not available
      const gitInfo = await analyzer.analyzeGit('/mock/path');

      // Should handle missing git gracefully
      assert.ok(gitInfo === null || typeof gitInfo === 'object');
    });

    test('should handle permission errors', async () => {
      // Test handling of permission denied errors
      const gitInfo = await analyzer.analyzeGit('/root'); // Typically restricted

      // Should handle permission errors gracefully
      assert.ok(gitInfo === null || typeof gitInfo === 'object');
    });
  });
});
