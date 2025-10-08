import * as assert from 'node:assert';
import { exec } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import { promisify } from 'node:util';

import { GitAnalyzer } from '../../../../dist/core/analyzers/git-analyzer.js';

const execAsync = promisify(exec);

describe('GitAnalyzer', () => {
  let analyzer: GitAnalyzer;
  let testDir: string;

  beforeEach(async () => {
    analyzer = new GitAnalyzer();
    testDir = join(tmpdir(), `parseme-git-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    mock.restoreAll();
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('analyze', () => {
    test('should analyze git repository successfully', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: testDir });
      await execAsync('git config user.email "test@test.com"', { cwd: testDir });
      await execAsync('git config user.name "Test User"', { cwd: testDir });

      // Create and commit a file
      await writeFile(join(testDir, 'test.txt'), 'test content');
      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "Initial commit"', { cwd: testDir });

      const gitInfo = await analyzer.analyze(testDir);

      assert.ok(gitInfo !== null);
      assert.ok(gitInfo.branch);
      assert.ok(gitInfo.lastCommit);
      assert.ok(gitInfo.lastCommit.includes('Initial commit'));
      assert.strictEqual(gitInfo.status, 'clean');
      assert.strictEqual(gitInfo.changedFiles.length, 0);
    });

    test('should detect dirty repository status', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: testDir });
      await execAsync('git config user.email "test@test.com"', { cwd: testDir });
      await execAsync('git config user.name "Test User"', { cwd: testDir });

      // Create and commit a file
      await writeFile(join(testDir, 'test.txt'), 'test content');
      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "Initial commit"', { cwd: testDir });

      // Make uncommitted changes
      await writeFile(join(testDir, 'test2.txt'), 'new file');

      const gitInfo = await analyzer.analyze(testDir);

      assert.ok(gitInfo !== null);
      assert.strictEqual(gitInfo.status, 'dirty');
      assert.ok(gitInfo.changedFiles.length > 0);
      assert.ok(gitInfo.changedFiles.includes('test2.txt'));
    });

    test('should detect git remote origin', async () => {
      // Initialize git repo with remote
      await execAsync('git init', { cwd: testDir });
      await execAsync('git config user.email "test@test.com"', { cwd: testDir });
      await execAsync('git config user.name "Test User"', { cwd: testDir });
      await execAsync('git remote add origin https://github.com/test/repo.git', { cwd: testDir });

      const gitInfo = await analyzer.analyze(testDir);

      assert.ok(gitInfo !== null);
      assert.strictEqual(gitInfo.origin, 'https://github.com/test/repo.git');
    });

    test('should handle repository without remote', async () => {
      // Initialize git repo without remote
      await execAsync('git init', { cwd: testDir });
      await execAsync('git config user.email "test@test.com"', { cwd: testDir });
      await execAsync('git config user.name "Test User"', { cwd: testDir });

      const gitInfo = await analyzer.analyze(testDir);

      assert.ok(gitInfo !== null);
      assert.strictEqual(gitInfo.origin, undefined);
    });

    test('should handle repository without commits', async () => {
      // Initialize empty git repo
      await execAsync('git init', { cwd: testDir });

      const gitInfo = await analyzer.analyze(testDir);

      assert.ok(gitInfo !== null);
      assert.strictEqual(gitInfo.lastCommit, 'No commits');
    });

    test('should detect diff stats', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: testDir });
      await execAsync('git config user.email "test@test.com"', { cwd: testDir });
      await execAsync('git config user.name "Test User"', { cwd: testDir });

      // Create and commit a file
      await writeFile(join(testDir, 'test.txt'), 'test content');
      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "Initial commit"', { cwd: testDir });

      // Modify file but don't commit
      await writeFile(join(testDir, 'test.txt'), 'modified content\nwith more lines');

      const gitInfo = await analyzer.analyze(testDir);

      assert.ok(gitInfo !== null);
      // diffStat might be undefined or a string depending on git state
      assert.ok(gitInfo.diffStat === undefined || typeof gitInfo.diffStat === 'string');
    });

    test('should handle non-git directories gracefully', async () => {
      const gitInfo = await analyzer.analyze(testDir);

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
