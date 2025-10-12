import type { ProjectInfo, FrameworkInfo } from '../types.js';
import type { EndpointInfo } from './pattern-detector.js';

export class FrameworkDetector {
  async detect(projectInfo: ProjectInfo, endpoints?: EndpointInfo[]): Promise<FrameworkInfo[]> {
    const deps = { ...projectInfo.dependencies, ...projectInfo.devDependencies };
    const detectedFrameworks: FrameworkInfo[] = [];

    // Backend frameworks
    if (deps['@nestjs/core'] || deps['@nestjs/common']) {
      detectedFrameworks.push(this.detectNestJS(deps));
    }
    if (deps['fastify']) {
      detectedFrameworks.push(this.detectFastify(deps));
    }
    if (deps['express']) {
      detectedFrameworks.push(this.detectExpress(deps));
    }

    // Fullstack frameworks (check these first as they include frontend frameworks)
    if (deps['next']) {
      detectedFrameworks.push(this.detectNextJS(deps));
    }
    if (deps['nuxt']) {
      detectedFrameworks.push(this.detectNuxtJS(deps));
    }

    // Frontend frameworks
    if (deps['react'] || deps['react-dom']) {
      detectedFrameworks.push(this.detectReact(deps));
    }
    if (deps['vue']) {
      detectedFrameworks.push(this.detectVue(deps));
    }
    if (deps['@angular/core']) {
      detectedFrameworks.push(this.detectAngular(deps));
    }
    if (deps['svelte']) {
      detectedFrameworks.push(this.detectSvelte(deps));
    }

    // Fallback: If no framework found in dependencies, try to infer from endpoints
    if (detectedFrameworks.length === 0 && endpoints && endpoints.length > 0) {
      const frameworksFromEndpoints = this.detectFrameworksFromEndpoints(endpoints);
      detectedFrameworks.push(...frameworksFromEndpoints);
    }

    return detectedFrameworks;
  }

  private detectFrameworksFromEndpoints(endpoints: EndpointInfo[]): FrameworkInfo[] {
    // Count frameworks detected in endpoints
    const frameworkCounts = new Map<string, number>();

    endpoints.forEach((endpoint) => {
      if (endpoint.framework) {
        const count = frameworkCounts.get(endpoint.framework) || 0;
        frameworkCounts.set(endpoint.framework, count + 1);
      }
    });

    if (frameworkCounts.size === 0) {
      return [];
    }

    // Return all detected frameworks
    // Note: We can't detect features without package.json, so features array will be empty
    const detectedFrameworks: FrameworkInfo[] = [];

    frameworkCounts.forEach((_, framework) => {
      switch (framework.toLowerCase()) {
        case 'express':
          detectedFrameworks.push({ name: 'express', features: [] });
          break;
        case 'fastify':
          detectedFrameworks.push({ name: 'fastify', features: [] });
          break;
        case 'nestjs':
          detectedFrameworks.push({ name: 'nestjs', features: [] });
          break;
      }
    });

    return detectedFrameworks;
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

  private detectReact(deps: Record<string, string>): FrameworkInfo {
    const features: string[] = [];

    // Detect React-specific libraries
    if (deps['react-router'] || deps['react-router-dom']) {
      features.push('routing');
    }
    if (deps['redux'] || deps['@reduxjs/toolkit']) {
      features.push('state-management-redux');
    }
    if (deps['zustand']) {
      features.push('state-management-zustand');
    }
    if (deps['react-query'] || deps['@tanstack/react-query']) {
      features.push('data-fetching');
    }
    if (deps['@testing-library/react']) {
      features.push('testing');
    }

    return {
      name: 'react',
      version: deps['react'],
      features,
    };
  }

  private detectVue(deps: Record<string, string>): FrameworkInfo {
    const features: string[] = [];

    // Detect Vue-specific libraries
    if (deps['vue-router']) {
      features.push('routing');
    }
    if (deps['pinia']) {
      features.push('state-management-pinia');
    }
    if (deps['vuex']) {
      features.push('state-management-vuex');
    }
    if (deps['@vue/test-utils']) {
      features.push('testing');
    }

    return {
      name: 'vue',
      version: deps['vue'],
      features,
    };
  }

  private detectAngular(deps: Record<string, string>): FrameworkInfo {
    const features: string[] = [];

    // Detect Angular-specific modules
    if (deps['@angular/router']) {
      features.push('routing');
    }
    if (deps['@angular/forms']) {
      features.push('forms');
    }
    if (deps['@angular/common/http'] || deps['@angular/common']) {
      features.push('http-client');
    }
    if (deps['@ngrx/store']) {
      features.push('state-management-ngrx');
    }
    if (deps['@angular/material']) {
      features.push('material-design');
    }
    if (deps['@angular/animations']) {
      features.push('animations');
    }

    // Angular uses decorators and dependency injection by default
    features.push('decorators', 'dependency-injection', 'typescript');

    return {
      name: 'angular',
      version: deps['@angular/core'],
      features,
    };
  }

  private detectSvelte(deps: Record<string, string>): FrameworkInfo {
    const features: string[] = [];

    // Detect Svelte-specific libraries
    if (deps['@sveltejs/kit'] || deps['@sveltejs/adapter-auto']) {
      features.push('sveltekit');
    }
    if (deps['svelte-routing']) {
      features.push('routing');
    }
    if (deps['@testing-library/svelte']) {
      features.push('testing');
    }

    return {
      name: 'svelte',
      version: deps['svelte'],
      features,
    };
  }

  private detectNextJS(deps: Record<string, string>): FrameworkInfo {
    const features: string[] = [];

    // Next.js features are often built-in, but we can detect some patterns
    if (deps['next-auth']) {
      features.push('authentication');
    }
    if (deps['@vercel/analytics']) {
      features.push('analytics');
    }

    // Next.js built-in features
    features.push('ssr', 'routing', 'api-routes', 'file-based-routing');

    return {
      name: 'next.js',
      version: deps['next'],
      features,
    };
  }

  private detectNuxtJS(deps: Record<string, string>): FrameworkInfo {
    const features: string[] = [];

    // Nuxt.js modules and features
    if (deps['@nuxt/content']) {
      features.push('content-management');
    }
    if (deps['@nuxtjs/auth'] || deps['@nuxtjs/auth-next']) {
      features.push('authentication');
    }
    if (deps['@pinia/nuxt']) {
      features.push('state-management-pinia');
    }
    if (deps['@nuxt/image']) {
      features.push('image-optimization');
    }
    if (deps['@nuxtjs/tailwindcss']) {
      features.push('tailwind');
    }

    // Nuxt.js built-in features
    features.push('ssr', 'routing', 'api-routes', 'file-based-routing', 'auto-imports');

    return {
      name: 'nuxt.js',
      version: deps['nuxt'],
      features,
    };
  }
}
