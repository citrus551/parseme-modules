import * as assert from 'node:assert';
import { exec } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, describe, beforeEach, afterEach } from 'node:test';
import { promisify } from 'node:util';

import { FileFilterService } from '../../../dist/utils/file-filter.js';

const execAsync = promisify(exec);

describe('File Filter Utility', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `parseme-filter-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('getFilteredFiles', () => {
    test('should get git-tracked files in git repository', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: testDir });
      await execAsync('git config user.email "test@test.com"', { cwd: testDir });
      await execAsync('git config user.name "Test User"', { cwd: testDir });

      // Create files
      await writeFile(join(testDir, 'tracked.ts'), 'content');
      await writeFile(join(testDir, 'untracked.ts'), 'content');

      // Track only one file
      await execAsync('git add tracked.ts', { cwd: testDir });
      await execAsync('git commit -m "Initial"', { cwd: testDir });

      const filter = new FileFilterService([]);
      const files = await filter.getFilteredFiles(testDir);

      assert.ok(files.includes('tracked.ts'));
      assert.ok(!files.includes('untracked.ts'));
    });

    test('should apply custom exclude patterns', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: testDir });
      await execAsync('git config user.email "test@test.com"', { cwd: testDir });
      await execAsync('git config user.name "Test User"', { cwd: testDir });

      // Create files
      await writeFile(join(testDir, 'include.ts'), 'content');
      await writeFile(join(testDir, 'exclude.test.ts'), 'content');

      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "Initial"', { cwd: testDir });

      const filter = new FileFilterService(['**/*.test.ts']);
      const files = await filter.getFilteredFiles(testDir);

      assert.ok(files.includes('include.ts'));
      assert.ok(!files.includes('exclude.test.ts'));
    });

    test('should filter by file extensions', async () => {
      // Initialize git repo
      await execAsync('git init', { cwd: testDir });
      await execAsync('git config user.email "test@test.com"', { cwd: testDir });
      await execAsync('git config user.name "Test User"', { cwd: testDir });

      // Create files
      await writeFile(join(testDir, 'file.ts'), 'content');
      await writeFile(join(testDir, 'file.js'), 'content');
      await writeFile(join(testDir, 'file.md'), 'content');

      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "Initial"', { cwd: testDir });

      const filter = new FileFilterService([]);
      const files = await filter.getFilteredFiles(testDir, ['ts']);

      assert.ok(files.includes('file.ts'));
      assert.ok(!files.includes('file.js'));
      assert.ok(!files.includes('file.md'));
    });

    test('should get all files in non-git directory', async () => {
      // Create files without git
      await writeFile(join(testDir, 'file1.ts'), 'content');
      await mkdir(join(testDir, 'subdir'));
      await writeFile(join(testDir, 'subdir', 'file2.ts'), 'content');

      const filter = new FileFilterService([]);
      const files = await filter.getFilteredFiles(testDir);

      assert.ok(files.some((f) => f.includes('file1.ts')));
      assert.ok(files.some((f) => f.includes('file2.ts')));
    });

    test('should apply exclude patterns in non-git directory', async () => {
      // Create files without git
      await writeFile(join(testDir, 'include.ts'), 'content');
      await writeFile(join(testDir, 'node_modules.ts'), 'content');

      const filter = new FileFilterService(['node_modules*']);
      const files = await filter.getFilteredFiles(testDir);

      assert.ok(files.includes('include.ts'));
      assert.ok(!files.includes('node_modules.ts'));
    });
  });

  describe('shouldIgnore', () => {
    test('should return true for files matching exclude patterns', () => {
      const filter = new FileFilterService(['**/*.test.ts', 'dist/**']);

      assert.strictEqual(filter.shouldIgnore('src/file.test.ts'), true);
      assert.strictEqual(filter.shouldIgnore('dist/bundle.js'), true);
    });

    test('should return false for files not matching patterns', () => {
      const filter = new FileFilterService(['**/*.test.ts']);

      assert.strictEqual(filter.shouldIgnore('src/file.ts'), false);
    });

    test('should handle empty exclude patterns', () => {
      const filter = new FileFilterService([]);

      assert.strictEqual(filter.shouldIgnore('any/file.ts'), false);
    });
  });
});
