import type { ParsemeConfig } from '../config.js';
import type { ProjectInfo, FrameworkInfo } from '../types.js';

export class FrameworkDetector {
  constructor(private readonly config: ParsemeConfig) {}

  async detect(projectInfo: ProjectInfo): Promise<FrameworkInfo> {
    const deps = { ...projectInfo.dependencies, ...projectInfo.devDependencies };

    // Check for frameworks in dependencies
    if (deps['@nestjs/core'] || deps['@nestjs/common']) {
      return this.detectNestJS(deps);
    }
    if (deps['fastify']) {
      return this.detectFastify(deps);
    }
    if (deps['express']) {
      return this.detectExpress(deps);
    }
    if (deps['koa']) {
      return this.detectKoa(deps);
    }
    if (deps['@hapi/hapi']) {
      return this.detectHapi(deps);
    }

    return {
      name: 'unknown',
      features: [],
    };
  }

  private detectExpress(deps: Record<string, string>): FrameworkInfo {
    const features: string[] = [];

    // Detect common Express features
    if (deps['express-session']) {
      features.push('sessions');
    }
    if (deps['passport']) {
      features.push('authentication');
    }
    if (deps['express-rate-limit']) {
      features.push('rate-limiting');
    }
    if (deps['helmet']) {
      features.push('security');
    }
    if (deps['cors']) {
      features.push('cors');
    }
    if (deps['body-parser']) {
      features.push('body-parsing');
    }
    if (deps['express-validator']) {
      features.push('validation');
    }
    if (deps['multer']) {
      features.push('file-upload');
    }
    if (deps['express-static']) {
      features.push('static-files');
    }

    return {
      name: 'express',
      version: deps['express'],
      features,
    };
  }

  private detectFastify(deps: Record<string, string>): FrameworkInfo {
    const features: string[] = [];

    if (deps['@fastify/cors']) {
      features.push('cors');
    }
    if (deps['@fastify/helmet']) {
      features.push('security');
    }
    if (deps['@fastify/rate-limit']) {
      features.push('rate-limiting');
    }
    if (deps['@fastify/multipart']) {
      features.push('file-upload');
    }
    if (deps['@fastify/static']) {
      features.push('static-files');
    }
    if (deps['@fastify/jwt']) {
      features.push('jwt');
    }
    if (deps['@fastify/session']) {
      features.push('sessions');
    }

    return {
      name: 'fastify',
      version: deps['fastify'],
      features,
    };
  }

  private detectNestJS(deps: Record<string, string>): FrameworkInfo {
    const features: string[] = [];

    if (deps['@nestjs/typeorm'] || deps['@nestjs/mongoose']) {
      features.push('orm');
    }
    if (deps['@nestjs/passport']) {
      features.push('authentication');
    }
    if (deps['@nestjs/jwt']) {
      features.push('jwt');
    }
    if (deps['@nestjs/swagger']) {
      features.push('swagger');
    }
    if (deps['@nestjs/graphql']) {
      features.push('graphql');
    }
    if (deps['@nestjs/websockets']) {
      features.push('websockets');
    }
    if (deps['@nestjs/microservices']) {
      features.push('microservices');
    }
    if (deps['@nestjs/testing']) {
      features.push('testing');
    }

    // NestJS uses decorators by default
    features.push('decorators', 'dependency-injection', 'modules');

    return {
      name: 'nestjs',
      version: deps['@nestjs/core'],
      features,
    };
  }

  private detectKoa(deps: Record<string, string>): FrameworkInfo {
    const features: string[] = [];

    if (deps['@koa/cors']) {
      features.push('cors');
    }
    if (deps['koa-helmet']) {
      features.push('security');
    }
    if (deps['koa-ratelimit']) {
      features.push('rate-limiting');
    }
    if (deps['koa-multer']) {
      features.push('file-upload');
    }
    if (deps['koa-static']) {
      features.push('static-files');
    }
    if (deps['koa-session']) {
      features.push('sessions');
    }
    if (deps['koa-bodyparser']) {
      features.push('body-parsing');
    }

    return {
      name: 'koa',
      version: deps['koa'],
      features,
    };
  }

  private detectHapi(deps: Record<string, string>): FrameworkInfo {
    const features: string[] = [];

    if (deps['@hapi/cookie']) {
      features.push('sessions');
    }
    if (deps['@hapi/jwt']) {
      features.push('jwt');
    }
    if (deps['@hapi/inert']) {
      features.push('static-files');
    }
    if (deps['@hapi/vision']) {
      features.push('templates');
    }
    if (deps['@hapi/boom']) {
      features.push('error-handling');
    }

    return {
      name: 'hapi',
      version: deps['@hapi/hapi'],
      features,
    };
  }
}
