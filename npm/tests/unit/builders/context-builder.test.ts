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

      const context = builder.buildContext(mockProjectInfo, mockFileAnalyses, mockGitInfo);

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

      const context = builder.buildContext(mockProjectInfo, mockFileAnalyses, null);

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

      const context = builder.buildContext(mockProjectInfo, [], null);

      assert.ok(typeof context === 'object');
      assert.ok(context.parseme.includes('empty-project'));
    });
  });

  describe('buildProjectOverview', () => {
    test('should build project overview section', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-app',
        version: '1.0.0',
        description: 'A test application',
        type: 'typescript',
        category: 'backend-api',
        packageManager: 'yarn',
        dependencies: { express: '^4.0.0' },
        devDependencies: { typescript: '^5.0.0' },
        scripts: { start: 'node dist/index.js', build: 'tsc' },
        entryPoints: ['src/index.ts'],
        outputTargets: ['dist'],
      };

      const overview = builder.buildProjectOverview(mockProjectInfo);

      assert.ok(typeof overview === 'string');
      assert.ok(overview.includes('test-app'));
      assert.ok(overview.includes('1.0.0'));
      assert.ok(overview.includes('backend-api'));
      assert.ok(overview.includes('yarn'));
    });
  });

  describe('buildFileStructure', () => {
    test('should build file structure section', () => {
      const mockFileAnalyses: FileAnalysis[] = [
        {
          path: 'src/index.ts',
          type: 'utility',
          exports: ['main'],
          imports: [],
          functions: ['main'],
          classes: [],
        },
        {
          path: 'src/routes/users.ts',
          type: 'route',
          exports: ['userRouter'],
          imports: ['express'],
          functions: [],
          classes: [],
          routes: [
            {
              method: 'GET',
              path: '/users',
              handler: 'getUsers',
              file: 'src/routes/users.ts',
              line: 5,
            },
            {
              method: 'POST',
              path: '/users',
              handler: 'createUser',
              file: 'src/routes/users.ts',
              line: 10,
            },
          ],
        },
      ];

      const structure = builder.buildFileStructure(mockFileAnalyses);

      assert.ok(typeof structure === 'string');
      assert.ok(structure.includes('src/index.ts'));
      assert.ok(structure.includes('src/routes/users.ts'));
      assert.ok(structure.includes('route'));
      assert.ok(structure.includes('utility'));
    });

    test('should handle empty file list', () => {
      const structure = builder.buildFileStructure([]);

      assert.ok(typeof structure === 'string');
      assert.ok(structure.includes('No files found'));
    });
  });

  describe('buildAPIEndpoints', () => {
    test('should build API endpoints section', () => {
      const mockFileAnalyses: FileAnalysis[] = [
        {
          path: 'src/routes/api.ts',
          type: 'route',
          exports: [],
          imports: [],
          functions: [],
          classes: [],
          routes: [
            {
              method: 'GET',
              path: '/api/users',
              handler: 'listUsers',
              file: 'src/routes/api.ts',
              line: 10,
            },
            {
              method: 'POST',
              path: '/api/users',
              handler: 'createUser',
              file: 'src/routes/api.ts',
              line: 15,
            },
            {
              method: 'PUT',
              path: '/api/users/:id',
              handler: 'updateUser',
              file: 'src/routes/api.ts',
              line: 20,
            },
          ],
        },
      ];

      const endpoints = builder.buildAPIEndpoints(mockFileAnalyses);

      assert.ok(typeof endpoints === 'string');
      assert.ok(endpoints.includes('GET /api/users'));
      assert.ok(endpoints.includes('POST /api/users'));
      assert.ok(endpoints.includes('PUT /api/users/:id'));
      assert.ok(endpoints.includes('listUsers'));
      assert.ok(endpoints.includes('createUser'));
    });

    test('should handle no endpoints', () => {
      const mockFileAnalyses: FileAnalysis[] = [
        {
          path: 'src/utils/helpers.ts',
          type: 'utility',
          exports: [],
          imports: [],
          functions: [],
          classes: [],
        },
      ];

      const endpoints = builder.buildAPIEndpoints(mockFileAnalyses);

      assert.ok(typeof endpoints === 'string');
      assert.ok(endpoints.includes('No API endpoints found'));
    });
  });

  describe('buildDependencies', () => {
    test('should build dependencies section', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'frontend-web',
        packageManager: 'npm',
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
          lodash: '^4.17.21',
        },
        devDependencies: {
          typescript: '^5.0.0',
          '@types/react': '^18.0.0',
          vite: '^4.0.0',
        },
      };

      const dependencies = builder.buildDependencies(mockProjectInfo);

      assert.ok(typeof dependencies === 'string');
      assert.ok(dependencies.includes('react'));
      assert.ok(dependencies.includes('typescript'));
      assert.ok(dependencies.includes('Production Dependencies'));
      assert.ok(dependencies.includes('Development Dependencies'));
    });

    test('should handle no dependencies', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'minimal-project',
        type: 'javascript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const dependencies = builder.buildDependencies(mockProjectInfo);

      assert.ok(typeof dependencies === 'string');
      assert.ok(dependencies.includes('No dependencies found'));
    });
  });

  describe('buildGitInfo', () => {
    test('should build git info section', () => {
      const mockGitInfo: GitInfo = {
        branch: 'feature/new-component',
        lastCommit: 'a1b2c3d Add new user component with tests',
        changedFiles: ['src/components/User.tsx', 'tests/User.test.tsx'],
        status: 'dirty',
      };

      const gitInfo = builder.buildGitInfo(mockGitInfo);

      assert.ok(typeof gitInfo === 'string');
      assert.ok(gitInfo.includes('feature/new-component'));
      assert.ok(gitInfo.includes('Add new user component'));
      assert.ok(gitInfo.includes('User.tsx'));
      assert.ok(gitInfo.includes('dirty'));
    });

    test('should handle clean repository', () => {
      const mockGitInfo: GitInfo = {
        branch: 'main',
        lastCommit: 'abc123 Initial commit',
        changedFiles: [],
        status: 'clean',
      };

      const gitInfo = builder.buildGitInfo(mockGitInfo);

      assert.ok(typeof gitInfo === 'string');
      assert.ok(gitInfo.includes('main'));
      assert.ok(gitInfo.includes('clean'));
      assert.ok(gitInfo.includes('No uncommitted changes'));
    });

    test('should handle null git info', () => {
      const gitInfo = builder.buildGitInfo(null);

      assert.ok(typeof gitInfo === 'string');
      assert.ok(gitInfo.includes('Not a Git repository'));
    });
  });

  describe('configuration handling', () => {
    test('should respect section enable/disable settings', () => {
      const configWithDisabledSections = new ParsemeConfig({
        sections: {
          dependencies: false,
          gitInfo: false,
        },
      });
      const builderWithConfig = new ContextBuilder(configWithDisabledSections);

      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'frontend-web',
        packageManager: 'npm',
        dependencies: { react: '^18.0.0' },
        devDependencies: {},
      };

      const context = builderWithConfig.buildContext(mockProjectInfo, [], null);

      assert.ok(typeof context.parseme === 'string');
      // Should not include disabled sections
      assert.ok(
        !context.parseme.includes('Dependencies') ||
          context.parseme.includes('Dependencies') === false,
      );
    });

    test('should handle truncation limits', () => {
      const configWithLimits = new ParsemeConfig({
        limits: {
          maxFileSize: 100,
          maxFiles: 1,
        },
      });
      const builderWithLimits = new ContextBuilder(configWithLimits);

      const mockFileAnalyses: FileAnalysis[] = [
        {
          path: 'src/file1.ts',
          type: 'utility',
          exports: [],
          imports: [],
          functions: [],
          classes: [],
        },
        {
          path: 'src/file2.ts',
          type: 'utility',
          exports: [],
          imports: [],
          functions: [],
          classes: [],
        },
      ];

      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const context = builderWithLimits.buildContext(mockProjectInfo, mockFileAnalyses, null);

      assert.ok(typeof context.parseme === 'string');
      // Should handle truncation appropriately
      assert.ok(context.parseme.length > 0);
    });
  });
});
