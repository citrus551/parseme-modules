import type { ProjectInfo, FrameworkInfo } from '../types.js';

interface FrameworkDetectorConfig {
  name: string;
  detectionKeys: string[] | ((deps: Record<string, string>) => boolean);
  versionKey: string;
  builtInFeatures?: string[];
  featureMap: Record<string, string>;
}

export class FrameworkDetector {
  private readonly frameworks: FrameworkDetectorConfig[] = [
    // Backend frameworks
    {
      name: 'nestjs',
      detectionKeys: ['@nestjs/core', '@nestjs/common'],
      versionKey: '@nestjs/core',
      builtInFeatures: ['decorators', 'dependency-injection', 'modules'],
      featureMap: {
        '@nestjs/typeorm': 'orm',
        '@nestjs/mongoose': 'orm',
        '@nestjs/passport': 'authentication',
        '@nestjs/jwt': 'jwt',
        '@nestjs/swagger': 'swagger',
        '@nestjs/graphql': 'graphql',
        '@nestjs/websockets': 'websockets',
        '@nestjs/microservices': 'microservices',
        '@nestjs/testing': 'testing',
      },
    },
    {
      name: 'fastify',
      detectionKeys: ['fastify'],
      versionKey: 'fastify',
      featureMap: {
        '@fastify/cors': 'cors',
        '@fastify/helmet': 'security',
        '@fastify/rate-limit': 'rate-limiting',
        '@fastify/multipart': 'file-upload',
        '@fastify/static': 'static-files',
        '@fastify/jwt': 'jwt',
        '@fastify/session': 'sessions',
      },
    },
    {
      name: 'express',
      detectionKeys: ['express'],
      versionKey: 'express',
      featureMap: {
        'express-session': 'sessions',
        passport: 'authentication',
        'express-rate-limit': 'rate-limiting',
        helmet: 'security',
        cors: 'cors',
        'body-parser': 'body-parsing',
        'express-validator': 'validation',
        multer: 'file-upload',
        'express-static': 'static-files',
      },
    },
    // Fullstack frameworks
    {
      name: 'next.js',
      detectionKeys: ['next'],
      versionKey: 'next',
      builtInFeatures: ['ssr', 'routing', 'api-routes', 'file-based-routing'],
      featureMap: {
        'next-auth': 'authentication',
        '@vercel/analytics': 'analytics',
      },
    },
    {
      name: 'nuxt.js',
      detectionKeys: ['nuxt'],
      versionKey: 'nuxt',
      builtInFeatures: ['ssr', 'routing', 'api-routes', 'file-based-routing', 'auto-imports'],
      featureMap: {
        '@nuxt/content': 'content-management',
        '@nuxtjs/auth': 'authentication',
        '@nuxtjs/auth-next': 'authentication',
        '@pinia/nuxt': 'state-management-pinia',
        '@nuxt/image': 'image-optimization',
        '@nuxtjs/tailwindcss': 'tailwind',
      },
    },
    // Frontend frameworks
    {
      name: 'react',
      detectionKeys: ['react', 'react-dom'],
      versionKey: 'react',
      featureMap: {
        'react-router': 'routing',
        'react-router-dom': 'routing',
        redux: 'state-management-redux',
        '@reduxjs/toolkit': 'state-management-redux',
        zustand: 'state-management-zustand',
        'react-query': 'data-fetching',
        '@tanstack/react-query': 'data-fetching',
        '@testing-library/react': 'testing',
      },
    },
    {
      name: 'vue',
      detectionKeys: (deps) =>
        !!deps['vue'] || Object.keys(deps).some((dep) => dep.startsWith('@vue/')),
      versionKey: 'vue',
      featureMap: {
        'vue-router': 'routing',
        pinia: 'state-management-pinia',
        vuex: 'state-management-vuex',
        '@vue/test-utils': 'testing',
      },
    },
    {
      name: 'angular',
      detectionKeys: ['@angular/core'],
      versionKey: '@angular/core',
      builtInFeatures: ['decorators', 'dependency-injection', 'typescript'],
      featureMap: {
        '@angular/router': 'routing',
        '@angular/forms': 'forms',
        '@angular/common/http': 'http-client',
        '@angular/common': 'http-client',
        '@ngrx/store': 'state-management-ngrx',
        '@angular/material': 'material-design',
        '@angular/animations': 'animations',
      },
    },
    {
      name: 'svelte',
      detectionKeys: (deps) =>
        !!deps['svelte'] || Object.keys(deps).some((dep) => dep.startsWith('@sveltejs/')),
      versionKey: 'svelte',
      featureMap: {
        '@sveltejs/kit': 'sveltekit',
        '@sveltejs/adapter-auto': 'sveltekit',
        'svelte-routing': 'routing',
        '@testing-library/svelte': 'testing',
      },
    },
  ];

  async detect(projectInfo: ProjectInfo): Promise<FrameworkInfo[]> {
    // Only check dependencies (not devDependencies) for framework detection
    // This prevents false positives from libraries that have frameworks in devDependencies for testing
    const deps = projectInfo.dependencies || {};
    const detectedFrameworks: FrameworkInfo[] = [];

    for (const config of this.frameworks) {
      if (this.shouldDetect(config, deps)) {
        detectedFrameworks.push(this.buildFrameworkInfo(config, deps));
      }
    }

    return detectedFrameworks;
  }

  private shouldDetect(config: FrameworkDetectorConfig, deps: Record<string, string>): boolean {
    if (typeof config.detectionKeys === 'function') {
      return config.detectionKeys(deps);
    }

    return config.detectionKeys.some((key) => deps[key]);
  }

  private buildFrameworkInfo(
    config: FrameworkDetectorConfig,
    deps: Record<string, string>,
  ): FrameworkInfo {
    const features: string[] = [...(config.builtInFeatures || [])];

    // Detect features based on feature map
    for (const [depKey, feature] of Object.entries(config.featureMap)) {
      if (deps[depKey]) {
        // Avoid duplicates
        if (!features.includes(feature)) {
          features.push(feature);
        }
      }
    }

    return {
      name: config.name,
      version: deps[config.versionKey],
      features,
    };
  }
}
