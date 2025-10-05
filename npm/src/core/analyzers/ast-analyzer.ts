import { readFile } from 'fs/promises';
import { relative, extname } from 'path';

import { parse } from '@babel/parser';
import traverse, { type NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { glob } from 'glob';
import ignore from 'ignore';

import { PatternDetector, type PatternAnalysis } from './pattern-detector.js';

import type { ParsemeConfig } from '../config.js';
import type { FileAnalysis } from '../types.js';

export class ASTAnalyzer {
  private readonly ig: ReturnType<typeof ignore>;
  private readonly patternDetector: PatternDetector;

  constructor(private readonly config: ParsemeConfig) {
    this.ig = ignore();
    const configData = this.config.get();
    this.ig.add(configData.excludePatterns || []);
    this.patternDetector = new PatternDetector(config);
  }

  async analyzeProject(rootDir: string): Promise<FileAnalysis[]> {
    const configData = this.config.get();
    const fileTypes = configData.analyzeFileTypes || ['ts', 'tsx', 'js', 'jsx'];
    const patterns = fileTypes.map((type) => `**/*.${type}`);

    const files = await glob(patterns, {
      cwd: rootDir,
      absolute: true,
      ignore: configData.excludePatterns,
    });

    const analyses: FileAnalysis[] = [];

    for (const file of files) {
      const relativePath = relative(rootDir, file);

      // Skip if ignored
      if (this.ig.ignores(relativePath)) {
        continue;
      }

      try {
        const analysis = await this.analyzeFile(file, relativePath);
        if (analysis) {
          analyses.push(analysis);
        }
      } catch (error) {
        console.warn(`Failed to analyze ${relativePath}:`, error);
        // Continue with other files
      }
    }

    return analyses;
  }

  async analyzeFile(filePath: string, relativePath: string): Promise<FileAnalysis | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const ext = extname(filePath);

      // Skip non-JS/TS files for AST analysis
      if (!['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
        return null;
      }

      const ast = this.parseFile(content, ext);

      // Use pattern detector to analyze the file
      const patterns = this.patternDetector.analyzePatterns(ast, relativePath, content);

      const analysis: FileAnalysis = {
        path: relativePath,
        type: this.determineFileType(relativePath, content, patterns),
        exports: [],
        imports: [],
        functions: [],
        classes: [],
        routes: patterns.endpoints,
        components: patterns.components,
        services: patterns.services,
        models: patterns.models,
        configs: patterns.configs,
        middleware: patterns.middleware,
        utilities: patterns.utilities,
      };

      traverse.default(ast, {
        // Import declarations
        ImportDeclaration: (path: NodePath<t.ImportDeclaration>) => {
          analysis.imports.push(path.node.source.value);
        },

        // Export declarations
        ExportNamedDeclaration: (path: NodePath<t.ExportNamedDeclaration>) => {
          if (path.node.declaration) {
            if (t.isFunctionDeclaration(path.node.declaration) && path.node.declaration.id) {
              analysis.exports.push(path.node.declaration.id.name);
            } else if (t.isVariableDeclaration(path.node.declaration)) {
              path.node.declaration.declarations.forEach((decl: t.VariableDeclarator) => {
                if (t.isIdentifier(decl.id)) {
                  analysis.exports.push(decl.id.name);
                }
              });
            }
          }
          if (path.node.specifiers) {
            path.node.specifiers.forEach(
              (spec: t.ExportSpecifier | t.ExportDefaultSpecifier | t.ExportNamespaceSpecifier) => {
                if (t.isExportSpecifier(spec) && t.isIdentifier(spec.exported)) {
                  analysis.exports.push(spec.exported.name);
                }
              },
            );
          }
        },

        ExportDefaultDeclaration: (_path: NodePath<t.ExportDefaultDeclaration>) => {
          analysis.exports.push('default');
        },

        // Function declarations
        FunctionDeclaration: (path: NodePath<t.FunctionDeclaration>) => {
          if (path.node.id) {
            analysis.functions.push(path.node.id.name);
          }
        },

        // Class declarations
        ClassDeclaration: (path: NodePath<t.ClassDeclaration>) => {
          if (path.node.id) {
            analysis.classes.push(path.node.id.name);
          }
        },
      });

      return analysis;
    } catch (error) {
      console.warn(`Failed to parse ${relativePath}:`, error);
      return null;
    }
  }

  private parseFile(content: string, ext: string) {
    const isTypeScript = ext === '.ts' || ext === '.tsx';
    const isJSX = ext === '.jsx' || ext === '.tsx';

    return parse(content, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        ...(isTypeScript ? ['typescript' as const] : []),
        ...(isJSX ? ['jsx' as const] : []),
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'asyncGenerators',
        'functionBind',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'dynamicImport',
        'nullishCoalescingOperator',
        'optionalChaining',
      ],
    });
  }

  private determineFileType(
    relativePath: string,
    content: string,
    patterns: PatternAnalysis,
  ): FileAnalysis['type'] {
    // Use pattern analysis to determine file type dynamically
    if (patterns.endpoints.length > 0) {
      return 'route';
    }
    if (patterns.middleware.length > 0) {
      return 'middleware';
    }
    if (patterns.models.length > 0) {
      return 'model';
    }
    if (patterns.services.length > 0) {
      return 'service';
    }
    if (patterns.components.length > 0) {
      return 'component';
    }
    if (patterns.configs.length > 0) {
      return 'config';
    }

    // Fallback to path-based detection
    if (relativePath.includes('test') || relativePath.includes('spec')) {
      return 'test';
    }
    if (relativePath.includes('util') || relativePath.includes('helper')) {
      return 'utility';
    }

    return 'utility';
  }
}
