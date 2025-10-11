import * as assert from 'node:assert';
import { test, describe, beforeEach } from 'node:test';

import { ParsemeConfig } from '../../../dist/core/config.js';
import { ContextBuilder } from '../../../dist/core/context-builder.js';

import type { ProjectInfo, FileAnalysis, GitInfo } from '../../../dist/core/types.js';

describe('ContextBuilder', () => {
  let builder: ContextBuilder;
  let config: ParsemeConfig;

  beforeEach(() => {
    config = new ParsemeConfig();
    builder = new ContextBuilder(config);
  });

  describe('build', () => {
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
        allFiles: ['src/components/Button.tsx'],
        gitInfo: mockGitInfo,
        options: {},
      });

      assert.ok(typeof context === 'object');
      assert.ok('parseme' in context);
      assert.ok(typeof context.parseme === 'string');
      assert.ok(context.parseme.length > 0);
      assert.ok(context.parseme.includes('test-project'));
      assert.ok(context.parseme.includes('typescript'));
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
        allFiles: [],
        gitInfo: null,
        options: {},
      });

      assert.ok(typeof context === 'object');
      assert.ok('parseme' in context);
      assert.ok(typeof context.parseme === 'string');
      // Git section should not be included when gitInfo is null
      assert.ok(!context.context.gitDiff);
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
        allFiles: [],
        gitInfo: null,
        options: {},
      });

      assert.ok(typeof context === 'object');
      assert.ok(context.parseme.includes('empty-project'));
    });

    test('should include routes in context when available', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'api-project',
        type: 'typescript',
        category: 'backend-api',
        packageManager: 'npm',
        dependencies: { express: '^4.18.0' },
        devDependencies: {},
      };

      const mockFileAnalyses: FileAnalysis[] = [
        {
          path: 'src/routes/users.ts',
          type: 'route',
          exports: ['router'],
          imports: ['express'],
          functions: ['getUsers'],
          classes: [],
          routes: [
            {
              method: 'GET',
              path: '/users',
              handler: 'getUsers',
              file: 'src/routes/users.ts',
              line: 10,
            },
          ],
          components: [],
          services: [],
          models: [],
          configs: [],
          middleware: [],
          utilities: [],
        },
      ];

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: mockFileAnalyses,
        allFiles: ['src/routes/users.ts'],
        gitInfo: null,
        options: {},
      });

      assert.ok(context.parseme.includes('API Routes'));
      assert.ok(context.context.routes);
    });

    test('should generate files list in context', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: [],
        allFiles: ['src/index.ts', 'src/utils.ts', 'README.md'],
        gitInfo: null,
        options: {},
      });

      assert.ok(context.context.files);
      assert.ok(context.context.files.includes('src/index.ts'));
      assert.ok(context.context.files.includes('src/utils.ts'));
      assert.ok(context.context.files.includes('README.md'));
    });

    test('should generate structure data in context', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const mockFileAnalyses: FileAnalysis[] = [
        {
          path: 'src/index.ts',
          type: 'utility',
          exports: ['hello'],
          imports: [],
          functions: ['hello'],
          classes: [],
          routes: [],
          components: [],
          services: [],
          models: [],
          configs: [],
          middleware: [],
          utilities: [],
        },
      ];

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: mockFileAnalyses,
        allFiles: ['src/index.ts'],
        gitInfo: null,
        options: {},
      });

      assert.ok(context.context.structure);
      const structure = JSON.parse(context.context.structure);
      assert.strictEqual(structure.length, 1);
      assert.strictEqual(structure[0].path, 'src/index.ts');
      assert.strictEqual(structure[0].type, 'utility');
    });

    test('should include git diff in context when git info available', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const mockGitInfo: GitInfo = {
        branch: 'feature-branch',
        lastCommit: 'def456 Add feature',
        changedFiles: ['src/feature.ts'],
        status: 'dirty',
        diffStat: ' src/feature.ts | 10 ++++++++++\n 1 file changed, 10 insertions(+)',
      };

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: [],
        allFiles: [],
        gitInfo: mockGitInfo,
        options: {},
      });

      assert.ok(context.context.gitDiff);
      assert.ok(context.context.gitDiff.includes('src/feature.ts'));
    });

    test('should respect maxFilesPerContext limit', () => {
      const configWithLimit = new ParsemeConfig({
        limits: {
          maxFilesPerContext: 2,
        },
      });
      const limitedBuilder = new ContextBuilder(configWithLimit);

      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const mockFileAnalyses: FileAnalysis[] = [
        {
          path: 'src/file1.ts',
          type: 'utility',
          exports: [],
          imports: [],
          functions: [],
          classes: [],
          routes: [],
          components: [],
          services: [],
          models: [],
          configs: [],
          middleware: [],
          utilities: [],
        },
        {
          path: 'src/file2.ts',
          type: 'utility',
          exports: [],
          imports: [],
          functions: [],
          classes: [],
          routes: [],
          components: [],
          services: [],
          models: [],
          configs: [],
          middleware: [],
          utilities: [],
        },
        {
          path: 'src/file3.ts',
          type: 'utility',
          exports: [],
          imports: [],
          functions: [],
          classes: [],
          routes: [],
          components: [],
          services: [],
          models: [],
          configs: [],
          middleware: [],
          utilities: [],
        },
      ];

      const context = limitedBuilder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: mockFileAnalyses,
        allFiles: ['src/file1.ts', 'src/file2.ts', 'src/file3.ts'],
        gitInfo: null,
        options: {},
      });

      const structure = JSON.parse(context.context.structure);
      assert.strictEqual(structure.length, 2); // Limited to 2 files
    });

    test('should handle contextDir and outputPath for link generation', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: [],
        allFiles: [],
        gitInfo: null,
        options: {},
        contextDir: 'custom-context',
        outputPath: '/path/to/PARSEME.md',
      });

      assert.ok(context.parseme.includes('custom-context'));
    });

    test('should include project scripts in overview', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
        scripts: {
          build: 'tsc',
          test: 'jest',
          dev: 'nodemon',
        },
      };

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: [],
        allFiles: [],
        gitInfo: null,
        options: {},
      });

      assert.ok(context.parseme.includes('Available Scripts'));
      assert.ok(context.parseme.includes('build'));
      assert.ok(context.parseme.includes('test'));
      assert.ok(context.parseme.includes('dev'));
    });

    test('should include dependencies in overview', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {
          express: '^4.18.0',
          react: '^18.0.0',
        },
        devDependencies: {},
      };

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: [],
        allFiles: [],
        gitInfo: null,
        options: {},
      });

      assert.ok(context.parseme.includes('Dependencies'));
      assert.ok(context.parseme.includes('express'));
      assert.ok(context.parseme.includes('react'));
    });

    test('should include framework info when available', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'backend-api',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
        framework: {
          name: 'nestjs',
          version: '^10.0.0',
          features: ['decorators', 'dependency-injection'],
        },
      };

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: [],
        allFiles: [],
        gitInfo: null,
        options: {},
      });

      assert.ok(context.parseme.includes('nestjs'));
    });

    test('should truncate content when maxCharsPerFile limit exceeded', () => {
      const configWithLimits = new ParsemeConfig({
        limits: {
          maxCharsPerFile: 100,
          truncateStrategy: 'truncate',
        },
      });
      const limitedBuilder = new ContextBuilder(configWithLimits);

      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      // Create a large file analysis
      const largeExports: string[] = [];
      for (let i = 0; i < 1000; i++) {
        largeExports.push(`veryLongExportName${i}`);
      }

      const mockFileAnalyses: FileAnalysis[] = [
        {
          path: 'src/large-file.ts',
          type: 'utility',
          exports: largeExports,
          imports: [],
          functions: [],
          classes: [],
          routes: [],
          components: [],
          services: [],
          models: [],
          configs: [],
          middleware: [],
          utilities: [],
        },
      ];

      const context = limitedBuilder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: mockFileAnalyses,
        allFiles: ['src/large-file.ts'],
        gitInfo: null,
        options: {},
      });

      // Structure should be truncated
      assert.ok(
        context.context.structure.includes('truncated') ||
          context.context.structure.length < JSON.stringify(mockFileAnalyses, null, 2).length,
      );
    });

    test('should split content when split strategy is used', () => {
      const configWithSplit = new ParsemeConfig({
        limits: {
          maxCharsPerFile: 500,
          truncateStrategy: 'split',
        },
      });
      const splitBuilder = new ContextBuilder(configWithSplit);

      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      // Create a large file analysis
      const largeExports: string[] = [];
      for (let i = 0; i < 200; i++) {
        largeExports.push(`export${i}`);
      }

      const mockFileAnalyses: FileAnalysis[] = [
        {
          path: 'src/file.ts',
          type: 'utility',
          exports: largeExports,
          imports: [],
          functions: [],
          classes: [],
          routes: [],
          components: [],
          services: [],
          models: [],
          configs: [],
          middleware: [],
          utilities: [],
        },
      ];

      const context = splitBuilder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: mockFileAnalyses,
        allFiles: ['src/file.ts'],
        gitInfo: null,
        options: {},
      });

      // Should have split files when content is large
      const hasStructureParts =
        context.context.structure_part2 !== undefined || context.context.structure.includes('part');
      assert.ok(
        hasStructureParts || context.context.structure.length < 1000,
        'Should handle large content',
      );
    });

    test('should handle content without limits configuration', () => {
      const configNoLimits = new ParsemeConfig({
        limits: undefined as never,
      });
      const noLimitsBuilder = new ContextBuilder(configNoLimits);

      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const mockFileAnalyses: FileAnalysis[] = [
        {
          path: 'src/file.ts',
          type: 'utility',
          exports: ['export1', 'export2'],
          imports: [],
          functions: [],
          classes: [],
          routes: [],
          components: [],
          services: [],
          models: [],
          configs: [],
          middleware: [],
          utilities: [],
        },
      ];

      const context = noLimitsBuilder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: mockFileAnalyses,
        allFiles: ['src/file.ts'],
        gitInfo: null,
        options: {},
      });

      assert.ok(context.context.structure);
      assert.ok(!context.context.structure.includes('truncated'));
    });
  });
});
