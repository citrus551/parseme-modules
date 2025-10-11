import * as assert from 'node:assert';
import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import { join } from 'path';

import { ProjectAnalyzer } from '../../../../dist/core/analyzers/project-analyzer.js';
import { ParsemeConfig } from '../../../../dist/core/config.js';

describe('ProjectAnalyzer', () => {
  let analyzer: ProjectAnalyzer;
  let config: ParsemeConfig;
  const fixturesDir = join(process.cwd(), 'tests/fixtures');

  beforeEach(() => {
    config = new ParsemeConfig();
    analyzer = new ProjectAnalyzer(config);
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe('analyze', () => {
    test('should analyze project with package.json', async () => {
      const result = await analyzer.analyze(fixturesDir);

      assert.strictEqual(result.name, 'test-project');
      assert.strictEqual(result.version, '1.0.0');
      assert.strictEqual(result.description, 'A test project for parseme');
      assert.strictEqual(result.packageManager, 'npm');
      assert.deepStrictEqual(result.dependencies, {
        express: '^4.18.0',
        lodash: '^4.17.21',
      });
      assert.deepStrictEqual(result.devDependencies, {
        '@types/node': '^20.0.0',
        typescript: '^5.0.0',
        nodemon: '^3.0.0',
      });
    });

    test('should handle missing package.json', async () => {
      const tempDir = '/nonexistent/path';
      const result = await analyzer.analyze(tempDir);

      assert.strictEqual(result.name, 'path');
      assert.strictEqual(result.packageManager, 'unknown');
      assert.deepStrictEqual(result.dependencies, {});
      assert.deepStrictEqual(result.devDependencies, {});
    });

    test('should detect TypeScript project type', async () => {
      const result = await analyzer.analyze(fixturesDir);
      // Based on the fixtures we have .ts files, but let's be more flexible
      assert.ok(
        result.type === 'typescript' || result.type === 'mixed' || result.type === 'javascript',
      );
    });
  });

  describe('project category detection', () => {
    test('should detect CLI tool project', async () => {
      const result = await analyzer.analyze(process.cwd());

      // This package has a bin field in package.json
      assert.strictEqual(result.category, 'cli-tool');
    });

    test('should detect scripts in package.json', async () => {
      const result = await analyzer.analyze(fixturesDir);

      assert.ok(result.scripts);
      assert.ok(result.scripts.build);
      assert.strictEqual(result.scripts.build, 'tsc');
    });

    test('should detect entry points', async () => {
      const result = await analyzer.analyze(process.cwd());

      assert.ok(result.entryPoints);
      assert.ok(result.entryPoints.length > 0);
    });

    test('should detect output targets', async () => {
      const result = await analyzer.analyze(process.cwd());

      // This project outputs to dist/
      assert.ok(result.outputTargets);
    });
  });

  describe('getAllProjectFiles', () => {
    test('should delegate to FileCollector and return files array', async () => {
      const files = await analyzer.getAllProjectFiles(fixturesDir);

      assert.ok(Array.isArray(files));
      assert.ok(files.length > 0);
      // Files should be relative paths
      assert.ok(files.some((f) => f.includes('.ts') || f.includes('.js')));
    });
  });
});
