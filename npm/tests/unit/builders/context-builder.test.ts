import * as assert from 'node:assert';
import { test, describe, beforeEach } from 'node:test';

import { ContextBuilder } from '../../../dist/builders/context-builder.js';
import { ParsemeConfig } from '../../../dist/config.js';

import type { ProjectInfo, FileAnalysis, GitInfo } from '../../../dist/types.js';

describe('ContextBuilder', () => {
  let builder: ContextBuilder;
  let config: ParsemeConfig;

  beforeEach(() => {
    config = new ParsemeConfig();
    builder = new ContextBuilder(config);
  });

  describe('buildContext', () => {
    test('should build context from project analysis', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'frontend-web',
        packageManager: 'npm',
        dependencies: { react: '^18.0.0' },
        devDependencies: { typescript: '^5.0.0' },
        scripts: { build: 'tsc' },
        entryPoints: ['src/index.ts'],
        outputTargets: ['dist'],
      };

      const mockFileAnalyses: FileAnalysis[] = [
        {
          path: 'src/components/Button.tsx',
          type: 'component',
          exports: ['Button'],
          imports: ['react'],
          functions: ['Button'],
          classes: [],
          routes: [],
          components: [{ name: 'Button', file: 'src/components/Button.tsx', line: 1 }],
          services: [],
          models: [],
          configs: [],
          middleware: [],
          utilities: [],
        },
      ];

      const mockGitInfo: GitInfo = {
        branch: 'main',
        lastCommit: 'abc123 Initial commit',
        changedFiles: ['src/components/Button.tsx'],
        status: 'dirty',
      };

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: mockFileAnalyses,
        gitInfo: mockGitInfo,
        options: {},
      });

      assert.ok(typeof context === 'object');
      assert.ok('parseme' in context);
      assert.ok(typeof context.parseme === 'string');
      assert.ok(context.parseme.length > 0);
    });

    test('should handle project without git info', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'javascript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const mockFileAnalyses: FileAnalysis[] = [];

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: mockFileAnalyses,
        gitInfo: null,
        options: {},
      });

      assert.ok(typeof context === 'object');
      assert.ok('parseme' in context);
      assert.ok(typeof context.parseme === 'string');
    });

    test('should handle empty project', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'empty-project',
        type: 'typescript',
        category: 'unknown',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: [],
        gitInfo: null,
        options: {},
      });

      assert.ok(typeof context === 'object');
      assert.ok(context.parseme.includes('empty-project'));
    });
  });

  // Tests for private methods removed - these are implementation details
  // The public build() method is tested via integration tests
});
