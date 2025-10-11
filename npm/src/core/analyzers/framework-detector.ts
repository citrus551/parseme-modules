import type { ProjectInfo, FrameworkInfo } from '../types.js';
import type { EndpointInfo } from './pattern-detector.js';

export class FrameworkDetector {
  async detect(
    projectInfo: ProjectInfo,
    endpoints?: EndpointInfo[],
  ): Promise<FrameworkInfo> {
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

    // Fallback: If no framework found in dependencies, try to infer from endpoints
    if (endpoints && endpoints.length > 0) {
      const frameworkFromEndpoints = this.detectFrameworkFromEndpoints(endpoints);
      if (frameworkFromEndpoints) {
        return frameworkFromEndpoints;
      }
    }

    return {
      name: 'unknown',
      features: [],
    };
  }

  private detectFrameworkFromEndpoints(endpoints: EndpointInfo[]): FrameworkInfo | null {
    // Count frameworks detected in endpoints
    const frameworkCounts = new Map<string, number>();

    endpoints.forEach((endpoint) => {
      if (endpoint.framework) {
        const count = frameworkCounts.get(endpoint.framework) || 0;
        frameworkCounts.set(endpoint.framework, count + 1);
      }
    });

    if (frameworkCounts.size === 0) {
      return null;
    }

    // Find the most common framework
    let mostCommonFramework = '';
    let maxCount = 0;

    frameworkCounts.forEach((count, framework) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonFramework = framework;
      }
    });

    // Return framework info based on detected framework
    // Note: We can't detect features without package.json, so features array will be empty
    switch (mostCommonFramework.toLowerCase()) {
      case 'express':
        return { name: 'express', features: [] };
      case 'fastify':
        return { name: 'fastify', features: [] };
      case 'nestjs':
        return { name: 'nestjs', features: [] };
      default:
        return null;
    }
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
}
