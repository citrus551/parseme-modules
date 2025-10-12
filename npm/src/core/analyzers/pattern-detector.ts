import traverse from '@babel/traverse';
import * as t from '@babel/types';

import type { ComponentInfo, RouteInfo } from '../types.js';

export interface PatternAnalysis {
  endpoints: EndpointInfo[];
  components: ComponentInfo[];
  services: ServiceInfo[];
  models: ModelInfo[];
  configs: ConfigInfo[];
  middleware: MiddlewareInfo[];
  utilities: UtilityInfo[];
}

export interface EndpointInfo extends RouteInfo {
  decorator?: string;
}

export interface ServiceInfo {
  name: string;
  file: string;
  line: number;
  methods: string[];
  dependencies: string[];
  type: 'class' | 'function' | 'object';
}

export interface ModelInfo {
  name: string;
  file: string;
  line: number;
  fields: string[];
  type: 'interface' | 'type' | 'class' | 'schema';
}

export interface ConfigInfo {
  name: string;
  file: string;
  line: number;
  keys: string[];
  type: 'object' | 'class' | 'env';
}

export interface MiddlewareInfo {
  name: string;
  file: string;
  line: number;
  type: 'function' | 'class' | 'decorator';
}

export interface UtilityInfo {
  name: string;
  file: string;
  line: number;
  functions: string[];
  type: 'helper' | 'lib' | 'hook' | 'composable';
}

export class PatternDetector {
  analyzePatterns(ast: t.File, filePath: string, _content: string): PatternAnalysis {
    const analysis: PatternAnalysis = {
      endpoints: [],
      components: [],
      services: [],
      models: [],
      configs: [],
      middleware: [],
      utilities: [],
    };

    // Analyze patterns in the AST
    traverse.default(ast, {
      // Detect decorator-based routes: @Get(), @Post(), etc.
      ClassMethod: (path) => {
        const decorators = path.node.decorators;
        if (decorators) {
          decorators.forEach((decorator) => {
            if (t.isDecorator(decorator) && t.isCallExpression(decorator.expression)) {
              const callee = decorator.expression.callee;
              if (t.isIdentifier(callee)) {
                const httpMethods = ['Get', 'Post', 'Put', 'Delete', 'Patch', 'Options', 'Head'];
                if (httpMethods.includes(callee.name)) {
                  const route = decorator.expression.arguments[0];
                  const routePath = t.isStringLiteral(route) ? route.value : '/';

                  analysis.endpoints.push({
                    method: callee.name.toUpperCase(),
                    path: routePath,
                    handler: t.isIdentifier(path.node.key) ? path.node.key.name : 'anonymous',
                    file: filePath,
                    line: path.node.loc?.start.line || 0,
                    decorator: callee.name,
                  });
                }
              }
            }
          });
        }
      },

      // Detect Express/Fastify-style routes: app.get(), router.post(), fastify.get(), etc.
      CallExpression: (path) => {
        const { callee, arguments: args } = path.node;

        if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
          const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
          const methodName = callee.property.name;

          if (httpMethods.includes(methodName) && args.length >= 2) {
            const routePath = args[0];
            // Only detect if:
            // 1. First argument is a string literal (route path)
            // 2. Object is a known route handler name
            if (t.isStringLiteral(routePath) && t.isIdentifier(callee.object)) {
              const objectName = callee.object.name;
              const routeObjectNames = [
                'app',
                'router',
                'server',
                'fastify',
                'express',
                'route',
                'api',
              ];

              // Only detect if it's a common route object name
              // This filters out axios.get(), client.get(), etc.
              if (routeObjectNames.includes(objectName.toLowerCase())) {
                analysis.endpoints.push({
                  method: methodName.toUpperCase(),
                  path: routePath.value,
                  handler: 'anonymous',
                  file: filePath,
                  line: path.node.loc?.start.line || 0,
                });
              }
            }
          }
        }

        // Detect Nuxt.js server routes: defineEventHandler()
        if (t.isIdentifier(callee) && callee.name === 'defineEventHandler') {
          // Extract route path from file path
          // Nuxt server routes are in server/api/ or server/routes/
          const routePath = this.extractNuxtRoutePath(filePath);

          analysis.endpoints.push({
            method: 'GET/POST',
            path: routePath,
            handler: 'defineEventHandler',
            file: filePath,
            line: path.node.loc?.start.line || 0,
          });
        }
      },

      // Detect TypeScript interfaces and type aliases
      TSInterfaceDeclaration: (path) => {
        const interfaceName = path.node.id.name;
        const fields = path.node.body.body
          .filter((member): member is t.TSPropertySignature => t.isTSPropertySignature(member))
          .map((member) => {
            if (t.isIdentifier(member.key)) {
              return member.key.name;
            }
            return '';
          })
          .filter((name) => name !== '');

        analysis.models.push({
          name: interfaceName,
          file: filePath,
          line: path.node.loc?.start.line || 0,
          fields,
          type: 'interface',
        });
      },

      TSTypeAliasDeclaration: (path) => {
        const typeName = path.node.id.name;
        analysis.models.push({
          name: typeName,
          file: filePath,
          line: path.node.loc?.start.line || 0,
          fields: [],
          type: 'type',
        });
      },

      // Detect Next.js API route handlers: export function GET/POST/etc.
      ExportNamedDeclaration: (path) => {
        const declaration = path.node.declaration;

        if (t.isFunctionDeclaration(declaration) && declaration.id) {
          const functionName = declaration.id.name;
          const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

          // Only detect if it's an HTTP method name and in an api directory
          if (httpMethods.includes(functionName) && /\/api\//.test(filePath)) {
            // Extract route path from file path
            // Next.js API routes are in app/api/ or pages/api/
            const routePath = this.extractNextJSRoutePath(filePath);

            analysis.endpoints.push({
              method: functionName,
              path: routePath,
              handler: functionName,
              file: filePath,
              line: declaration.loc?.start.line || 0,
            });
          }
        }
      },

      // Detect React components
      FunctionDeclaration: (path) => {
        const functionName = path.node.id?.name;
        if (functionName) {
          // React hooks
          if (functionName.startsWith('use') && functionName.length > 3) {
            analysis.utilities.push({
              name: functionName,
              file: filePath,
              line: path.node.loc?.start.line || 0,
              functions: [functionName],
              type: 'hook',
            });
          }

          // React components (check for JSX return)
          if (this.hasJSXReturn(path.node.body)) {
            analysis.components.push({
              name: functionName,
              file: filePath,
              line: path.node.loc?.start.line || 0,
            });
          }

          // Middleware functions (req, res, next pattern)
          const params = path.node.params;
          if (params.length >= 3) {
            const paramNames = params
              .filter((param): param is t.Identifier => t.isIdentifier(param))
              .map((param) => param.name);

            const isMiddleware = paramNames.some((name) =>
              ['req', 'request', 'res', 'response', 'next', 'ctx', 'context'].includes(
                name.toLowerCase(),
              ),
            );

            if (isMiddleware) {
              analysis.middleware.push({
                name: functionName,
                file: filePath,
                line: path.node.loc?.start.line || 0,
                type: 'function',
              });
            }
          }
        }
      },

      // Detect service classes and components
      ClassDeclaration: (path) => {
        const className = path.node.id?.name;
        if (!className) {
          return;
        }

        // Service classes
        const hasInjectableDecorator = path.node.decorators?.some(
          (decorator) =>
            t.isDecorator(decorator) &&
            t.isCallExpression(decorator.expression) &&
            t.isIdentifier(decorator.expression.callee) &&
            decorator.expression.callee.name === 'Injectable',
        );

        const isServiceClass =
          className.endsWith('Service') ||
          className.endsWith('Repository') ||
          className.endsWith('Manager') ||
          hasInjectableDecorator;

        if (isServiceClass) {
          const methods = path.node.body.body
            .filter(
              (member): member is t.ClassMethod =>
                t.isClassMethod(member) && t.isIdentifier(member.key),
            )
            .map((member) => (member.key as t.Identifier).name);

          analysis.services.push({
            name: className,
            file: filePath,
            line: path.node.loc?.start.line || 0,
            methods,
            dependencies: [],
            type: 'class',
          });
        }

        // React class components (check for render method)
        const hasRenderMethod = path.node.body.body.some(
          (member) =>
            t.isClassMethod(member) && t.isIdentifier(member.key) && member.key.name === 'render',
        );

        if (hasRenderMethod) {
          analysis.components.push({
            name: className,
            file: filePath,
            line: path.node.loc?.start.line || 0,
          });
        }
      },
    });

    return analysis;
  }

  private hasJSXReturn(body: t.BlockStatement): boolean {
    return body.body.some(
      (stmt) => t.isReturnStatement(stmt) && stmt.argument && t.isJSXElement(stmt.argument),
    );
  }

  private extractNextJSRoutePath(filePath: string): string {
    // Next.js API routes can be in:
    // - app/api/[route]/route.ts (App Router)
    // - pages/api/[route].ts (Pages Router)

    // Try App Router pattern first
    let match = filePath.match(/\/app\/api\/(.+)\/route\.[jt]sx?$/);
    if (match) {
      return `/api/${match[1]}`;
    }

    // Try Pages Router pattern
    match = filePath.match(/\/pages\/api\/(.+)\.[jt]sx?$/);
    if (match) {
      return `/api/${match[1]}`;
    }

    // Fallback
    return '/api/unknown';
  }

  private extractNuxtRoutePath(filePath: string): string {
    // Nuxt.js server routes can be in:
    // - server/api/[route].ts
    // - server/routes/[route].ts

    let match = filePath.match(/\/server\/api\/(.+)\.[jt]s$/);
    if (match) {
      return `/api/${match[1]}`;
    }

    match = filePath.match(/\/server\/routes\/(.+)\.[jt]s$/);
    if (match) {
      return `/${match[1]}`;
    }

    // Fallback
    return '/api/unknown';
  }
}
