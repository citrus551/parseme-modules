import traverse from '@babel/traverse';
import * as t from '@babel/types';

import type { ParsemeConfig } from '../config.js';
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
  type: 'rest' | 'graphql' | 'websocket' | 'rpc' | 'unknown';
  framework?: string;
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
  constructor(private readonly config: ParsemeConfig) {}

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

    // Use a single traverse call to detect all patterns
    traverse.default(ast, {
      // Detect Express-style routes: app.get(), router.post(), etc.
      CallExpression: (path) => {
        if (t.isMemberExpression(path.node.callee) && t.isIdentifier(path.node.callee.property)) {
          const methodName = path.node.callee.property.name;
          const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'all'];

          if (httpMethods.includes(methodName)) {
            const routeArg = path.node.arguments[0];
            const routePath = t.isStringLiteral(routeArg) ? routeArg.value : '/';

            analysis.endpoints.push({
              method: methodName.toUpperCase(),
              path: routePath,
              handler: 'callback',
              file: filePath,
              line: path.node.loc?.start.line || 0,
              type: 'rest',
            });
          }
        }
      },

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
                    type: 'rest',
                    decorator: callee.name,
                  });
                }
              }
            }
          });
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

      // Detect TypeScript interfaces
      TSInterfaceDeclaration: (path) => {
        const interfaceName = path.node.id.name;
        const fields = path.node.body.body
          .filter(
            (member): member is t.TSPropertySignature =>
              t.isTSPropertySignature(member) && t.isIdentifier(member.key),
          )
          .map((member) => (member.key as t.Identifier).name);

        analysis.models.push({
          name: interfaceName,
          file: filePath,
          line: path.node.loc?.start.line || 0,
          fields,
          type: 'interface',
        });
      },

      // Detect type aliases
      TSTypeAliasDeclaration: (path) => {
        analysis.models.push({
          name: path.node.id.name,
          file: filePath,
          line: path.node.loc?.start.line || 0,
          fields: [],
          type: 'type',
        });
      },
    });

    return analysis;
  }

  private hasJSXReturn(body: t.BlockStatement): boolean {
    return body.body.some(
      (stmt) => t.isReturnStatement(stmt) && stmt.argument && t.isJSXElement(stmt.argument),
    );
  }
}
