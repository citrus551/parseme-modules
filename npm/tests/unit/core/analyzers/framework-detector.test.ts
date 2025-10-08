import * as assert from 'node:assert';
import { test, describe, beforeEach } from 'node:test';

import { FrameworkDetector } from '../../../../dist/core/analyzers/framework-detector.js';

import type { ProjectInfo } from '../../../../dist/core/types.js';

describe('FrameworkDetector', () => {
  let detector: FrameworkDetector;

  beforeEach(() => {
    detector = new FrameworkDetector();
  });

  describe('detect', () => {
    test('should return unknown when no framework detected', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const framework = await detector.detect(mockProjectInfo);

      assert.strictEqual(framework.name, 'unknown');
      assert.strictEqual(framework.features.length, 0);
    });

    test('should detect Express framework', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'express-app',
        type: 'javascript',
        category: 'backend-api',
        packageManager: 'npm',
        dependencies: {
          express: '^4.18.0',
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const framework = await detector.detect(mockProjectInfo);

      assert.strictEqual(framework.name, 'express');
      assert.strictEqual(framework.version, '^4.18.0');
    });

    test('should detect Express with common features', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'express-app',
        type: 'javascript',
        category: 'backend-api',
        packageManager: 'npm',
        dependencies: {
          express: '^4.18.0',
          'express-session': '^1.17.0',
          passport: '^0.6.0',
          'express-rate-limit': '^6.0.0',
          helmet: '^7.0.0',
          cors: '^2.8.0',
          'body-parser': '^1.20.0',
          'express-validator': '^7.0.0',
          multer: '^1.4.0',
          'express-static': '^1.15.0',
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const framework = await detector.detect(mockProjectInfo);

      assert.strictEqual(framework.name, 'express');
      assert.ok(framework.features.includes('sessions'));
      assert.ok(framework.features.includes('authentication'));
      assert.ok(framework.features.includes('rate-limiting'));
      assert.ok(framework.features.includes('security'));
      assert.ok(framework.features.includes('cors'));
      assert.ok(framework.features.includes('body-parsing'));
      assert.ok(framework.features.includes('validation'));
      assert.ok(framework.features.includes('file-upload'));
      assert.ok(framework.features.includes('static-files'));
    });

    test('should detect Fastify framework', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'fastify-app',
        type: 'typescript',
        category: 'backend-api',
        packageManager: 'npm',
        dependencies: {
          fastify: '^4.0.0',
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const framework = await detector.detect(mockProjectInfo);

      assert.strictEqual(framework.name, 'fastify');
      assert.strictEqual(framework.version, '^4.0.0');
    });

    test('should detect Fastify with common plugins', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'fastify-app',
        type: 'typescript',
        category: 'backend-api',
        packageManager: 'npm',
        dependencies: {
          fastify: '^4.0.0',
          '@fastify/cors': '^8.0.0',
          '@fastify/helmet': '^10.0.0',
          '@fastify/rate-limit': '^8.0.0',
          '@fastify/multipart': '^7.0.0',
          '@fastify/static': '^6.0.0',
          '@fastify/jwt': '^6.0.0',
          '@fastify/session': '^9.0.0',
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const framework = await detector.detect(mockProjectInfo);

      assert.strictEqual(framework.name, 'fastify');
      assert.ok(framework.features.includes('cors'));
      assert.ok(framework.features.includes('security'));
      assert.ok(framework.features.includes('rate-limiting'));
      assert.ok(framework.features.includes('file-upload'));
      assert.ok(framework.features.includes('static-files'));
      assert.ok(framework.features.includes('jwt'));
      assert.ok(framework.features.includes('sessions'));
    });

    test('should detect NestJS framework', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'nestjs-app',
        type: 'typescript',
        category: 'backend-api',
        packageManager: 'npm',
        dependencies: {
          '@nestjs/core': '^10.0.0',
          '@nestjs/common': '^10.0.0',
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const framework = await detector.detect(mockProjectInfo);

      assert.strictEqual(framework.name, 'nestjs');
      assert.strictEqual(framework.version, '^10.0.0');
      assert.ok(framework.features.includes('decorators'));
      assert.ok(framework.features.includes('dependency-injection'));
      assert.ok(framework.features.includes('modules'));
    });

    test('should detect NestJS with common modules', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'nestjs-app',
        type: 'typescript',
        category: 'backend-api',
        packageManager: 'npm',
        dependencies: {
          '@nestjs/core': '^10.0.0',
          '@nestjs/common': '^10.0.0',
          '@nestjs/typeorm': '^10.0.0',
          '@nestjs/passport': '^10.0.0',
          '@nestjs/jwt': '^10.0.0',
          '@nestjs/swagger': '^7.0.0',
          '@nestjs/graphql': '^12.0.0',
          '@nestjs/websockets': '^10.0.0',
          '@nestjs/microservices': '^10.0.0',
        },
        devDependencies: {
          '@nestjs/testing': '^10.0.0',
        },
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const framework = await detector.detect(mockProjectInfo);

      assert.strictEqual(framework.name, 'nestjs');
      assert.ok(framework.features.includes('orm'));
      assert.ok(framework.features.includes('authentication'));
      assert.ok(framework.features.includes('jwt'));
      assert.ok(framework.features.includes('swagger'));
      assert.ok(framework.features.includes('graphql'));
      assert.ok(framework.features.includes('websockets'));
      assert.ok(framework.features.includes('microservices'));
      assert.ok(framework.features.includes('testing'));
    });

    test('should detect NestJS with mongoose', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'nestjs-app',
        type: 'typescript',
        category: 'backend-api',
        packageManager: 'npm',
        dependencies: {
          '@nestjs/core': '^10.0.0',
          '@nestjs/mongoose': '^10.0.0',
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const framework = await detector.detect(mockProjectInfo);

      assert.strictEqual(framework.name, 'nestjs');
      assert.ok(framework.features.includes('orm'));
    });

    test('should prioritize NestJS over other frameworks', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'nestjs-app',
        type: 'typescript',
        category: 'backend-api',
        packageManager: 'npm',
        dependencies: {
          '@nestjs/core': '^10.0.0',
          express: '^4.18.0', // NestJS uses Express under the hood
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const framework = await detector.detect(mockProjectInfo);

      assert.strictEqual(framework.name, 'nestjs');
    });

    test('should prioritize Fastify over Express', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'mixed-app',
        type: 'javascript',
        category: 'backend-api',
        packageManager: 'npm',
        dependencies: {
          fastify: '^4.0.0',
          express: '^4.18.0',
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const framework = await detector.detect(mockProjectInfo);

      assert.strictEqual(framework.name, 'fastify');
    });

    test('should handle devDependencies when detecting framework', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'dev-deps-app',
        type: 'typescript',
        category: 'backend-api',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {
          '@nestjs/core': '^10.0.0',
          '@nestjs/common': '^10.0.0',
        },
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const framework = await detector.detect(mockProjectInfo);

      assert.strictEqual(framework.name, 'nestjs');
    });
  });
});
