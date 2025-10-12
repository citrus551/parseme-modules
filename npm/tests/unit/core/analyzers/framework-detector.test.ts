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
    test('should return empty array when no framework detected', async () => {
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

      const frameworks = await detector.detect(mockProjectInfo);

      assert.strictEqual(frameworks.length, 0);
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

      const frameworks = await detector.detect(mockProjectInfo);

      assert.strictEqual(frameworks.length, 1);
      assert.strictEqual(frameworks[0].name, 'express');
      assert.strictEqual(frameworks[0].version, '^4.18.0');
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

      const frameworks = await detector.detect(mockProjectInfo);
      const express = frameworks.find((f) => f.name === 'express');

      assert.ok(express, 'Express framework should be detected');
      assert.ok(express!.features.includes('sessions'));
      assert.ok(express!.features.includes('authentication'));
      assert.ok(express!.features.includes('rate-limiting'));
      assert.ok(express!.features.includes('security'));
      assert.ok(express!.features.includes('cors'));
      assert.ok(express!.features.includes('body-parsing'));
      assert.ok(express!.features.includes('validation'));
      assert.ok(express!.features.includes('file-upload'));
      assert.ok(express!.features.includes('static-files'));
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

      const frameworks = await detector.detect(mockProjectInfo);

      assert.strictEqual(frameworks.length, 1);
      assert.strictEqual(frameworks[0].name, 'fastify');
      assert.strictEqual(frameworks[0].version, '^4.0.0');
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

      const frameworks = await detector.detect(mockProjectInfo);
      const fastify = frameworks.find((f) => f.name === 'fastify');

      assert.ok(fastify, 'Fastify framework should be detected');
      assert.ok(fastify!.features.includes('cors'));
      assert.ok(fastify!.features.includes('security'));
      assert.ok(fastify!.features.includes('rate-limiting'));
      assert.ok(fastify!.features.includes('file-upload'));
      assert.ok(fastify!.features.includes('static-files'));
      assert.ok(fastify!.features.includes('jwt'));
      assert.ok(fastify!.features.includes('sessions'));
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

      const frameworks = await detector.detect(mockProjectInfo);

      assert.strictEqual(frameworks.length, 1);
      assert.strictEqual(frameworks[0].name, 'nestjs');
      assert.strictEqual(frameworks[0].version, '^10.0.0');
      assert.ok(frameworks[0].features.includes('decorators'));
      assert.ok(frameworks[0].features.includes('dependency-injection'));
      assert.ok(frameworks[0].features.includes('modules'));
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

      const frameworks = await detector.detect(mockProjectInfo);
      const nestjs = frameworks.find((f) => f.name === 'nestjs');

      assert.ok(nestjs, 'NestJS framework should be detected');
      assert.ok(nestjs!.features.includes('orm'));
      assert.ok(nestjs!.features.includes('authentication'));
      assert.ok(nestjs!.features.includes('jwt'));
      assert.ok(nestjs!.features.includes('swagger'));
      assert.ok(nestjs!.features.includes('graphql'));
      assert.ok(nestjs!.features.includes('websockets'));
      assert.ok(nestjs!.features.includes('microservices'));
      // testing is in devDependencies, so it should NOT be detected
      assert.ok(!nestjs!.features.includes('testing'));
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

      const frameworks = await detector.detect(mockProjectInfo);

      assert.strictEqual(frameworks.length, 1);
      assert.strictEqual(frameworks[0].name, 'nestjs');
      assert.ok(frameworks[0].features.includes('orm'));
    });

    test('should detect both NestJS and Express when both present', async () => {
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

      const frameworks = await detector.detect(mockProjectInfo);

      assert.strictEqual(frameworks.length, 2);
      assert.ok(frameworks.some((f) => f.name === 'nestjs'));
      assert.ok(frameworks.some((f) => f.name === 'express'));
    });

    test('should detect both Fastify and Express when both present', async () => {
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

      const frameworks = await detector.detect(mockProjectInfo);

      assert.strictEqual(frameworks.length, 2);
      assert.ok(frameworks.some((f) => f.name === 'fastify'));
      assert.ok(frameworks.some((f) => f.name === 'express'));
    });

    test('should only check dependencies not devDependencies for framework detection', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'dev-deps-app',
        type: 'typescript',
        category: 'npm-package',
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

      const frameworks = await detector.detect(mockProjectInfo);

      // Should NOT detect NestJS since it's only in devDependencies
      assert.strictEqual(frameworks.length, 0);
    });

    test('should detect Vue when @vue/* packages are in dependencies', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'vue-lib',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {
          '@vue/devtools-api': '^8.0.0',
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const frameworks = await detector.detect(mockProjectInfo);

      assert.strictEqual(frameworks.length, 1);
      assert.strictEqual(frameworks[0].name, 'vue');
    });

    test('should detect Svelte when @sveltejs/* packages are in dependencies', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'svelte-app',
        type: 'typescript',
        category: 'web-app',
        packageManager: 'npm',
        dependencies: {
          '@sveltejs/kit': '^2.0.0',
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const frameworks = await detector.detect(mockProjectInfo);

      assert.strictEqual(frameworks.length, 1);
      assert.strictEqual(frameworks[0].name, 'svelte');
    });

    test('should detect React with features', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'react-app',
        type: 'typescript',
        category: 'web-app',
        packageManager: 'npm',
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
          'react-router-dom': '^6.0.0',
          '@reduxjs/toolkit': '^1.9.0',
          '@tanstack/react-query': '^4.0.0',
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const frameworks = await detector.detect(mockProjectInfo);
      const react = frameworks.find((f) => f.name === 'react');

      assert.ok(react, 'React framework should be detected');
      assert.strictEqual(react!.version, '^18.0.0');
      assert.ok(react!.features.includes('routing'));
      assert.ok(react!.features.includes('state-management-redux'));
      assert.ok(react!.features.includes('data-fetching'));
    });

    test('should detect Next.js with built-in features', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'nextjs-app',
        type: 'typescript',
        category: 'fullstack-app',
        packageManager: 'npm',
        dependencies: {
          next: '^14.0.0',
          react: '^18.0.0',
          'react-dom': '^18.0.0',
          'next-auth': '^4.0.0',
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const frameworks = await detector.detect(mockProjectInfo);
      const nextjs = frameworks.find((f) => f.name === 'next.js');

      assert.ok(nextjs, 'Next.js framework should be detected');
      assert.strictEqual(nextjs!.version, '^14.0.0');
      assert.ok(nextjs!.features.includes('ssr'));
      assert.ok(nextjs!.features.includes('routing'));
      assert.ok(nextjs!.features.includes('api-routes'));
      assert.ok(nextjs!.features.includes('file-based-routing'));
      assert.ok(nextjs!.features.includes('authentication'));
    });

    test('should detect Nuxt.js with built-in features', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'nuxt-app',
        type: 'typescript',
        category: 'fullstack-app',
        packageManager: 'npm',
        dependencies: {
          nuxt: '^3.0.0',
          vue: '^3.0.0',
          '@nuxt/content': '^2.0.0',
          '@pinia/nuxt': '^0.4.0',
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const frameworks = await detector.detect(mockProjectInfo);
      const nuxt = frameworks.find((f) => f.name === 'nuxt.js');

      assert.ok(nuxt, 'Nuxt.js framework should be detected');
      assert.strictEqual(nuxt!.version, '^3.0.0');
      assert.ok(nuxt!.features.includes('ssr'));
      assert.ok(nuxt!.features.includes('routing'));
      assert.ok(nuxt!.features.includes('auto-imports'));
      assert.ok(nuxt!.features.includes('content-management'));
      assert.ok(nuxt!.features.includes('state-management-pinia'));
    });

    test('should detect Angular with built-in features', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'angular-app',
        type: 'typescript',
        category: 'web-app',
        packageManager: 'npm',
        dependencies: {
          '@angular/core': '^17.0.0',
          '@angular/router': '^17.0.0',
          '@angular/forms': '^17.0.0',
          '@angular/material': '^17.0.0',
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const frameworks = await detector.detect(mockProjectInfo);
      const angular = frameworks.find((f) => f.name === 'angular');

      assert.ok(angular, 'Angular framework should be detected');
      assert.strictEqual(angular!.version, '^17.0.0');
      assert.ok(angular!.features.includes('decorators'));
      assert.ok(angular!.features.includes('dependency-injection'));
      assert.ok(angular!.features.includes('typescript'));
      assert.ok(angular!.features.includes('routing'));
      assert.ok(angular!.features.includes('forms'));
      assert.ok(angular!.features.includes('material-design'));
    });

    test('should not duplicate features when multiple deps map to same feature', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'nestjs-app',
        type: 'typescript',
        category: 'backend-api',
        packageManager: 'npm',
        dependencies: {
          '@nestjs/core': '^10.0.0',
          '@nestjs/typeorm': '^10.0.0',
          '@nestjs/mongoose': '^10.0.0', // Both map to 'orm'
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const frameworks = await detector.detect(mockProjectInfo);
      const nestjs = frameworks.find((f) => f.name === 'nestjs');

      assert.ok(nestjs, 'NestJS framework should be detected');

      // Count how many times 'orm' appears - should only be once
      const ormCount = nestjs!.features.filter((f) => f === 'orm').length;
      assert.strictEqual(ormCount, 1, 'ORM feature should only appear once');
    });

    test('should detect multiple detection keys with OR logic', async () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'react-app',
        type: 'typescript',
        category: 'web-app',
        packageManager: 'npm',
        dependencies: {
          'react-dom': '^18.0.0', // Only react-dom, not react
        },
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };

      const frameworks = await detector.detect(mockProjectInfo);

      assert.strictEqual(frameworks.length, 1);
      assert.strictEqual(frameworks[0].name, 'react');
    });
  });
});
