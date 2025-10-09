import { readFile } from 'fs/promises';
import { join, extname } from 'path';

import { parse } from '@babel/parser';
import traverse, { type NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import { PatternDetector, type PatternAnalysis } from './pattern-detector.js';
import { FileFilterService } from '../../utils/file-filter.js';

import type { ParsemeConfig } from '../config.js';
import type { FileAnalysis } from '../types.js';

export class ASTAnalyzer {
  private readonly fileFilter: FileFilterService;
  private readonly patternDetector: PatternDetector;

  constructor(private readonly config: ParsemeConfig) {
    const configData = this.config.get();
    this.fileFilter = new FileFilterService(configData.excludePatterns);
    this.patternDetector = new PatternDetector();
  }

  async analyzeProject(rootDir: string): Promise<FileAnalysis[]> {
    const configData = this.config.get();
    const fileTypes = configData.analyzeFileTypes || ['ts', 'tsx', 'js', 'jsx'];

    // Get filtered files (respects git ignore + custom excludePatterns)
    const files = await this.fileFilter.getFilteredFiles(rootDir, fileTypes);

    const analyses: FileAnalysis[] = [];

    for (const file of files) {
      const filePath = join(rootDir, file);

      try {
        const analysis = await this.analyzeFile(filePath, file);
        if (analysis) {
          analyses.push(analysis);
        }
      } catch (error) {
        console.warn(`Failed to analyze ${file}:`, error);
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
        type: this.determineFileType(relativePath, patterns),
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
    } catch {
      console.warn(`Failed to parse ${relativePath}`);
      return null;
    }
  }

  private parseFile(content: string, ext: string): ReturnType<typeof parse> {
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

  private determineFileType(relativePath: string, patterns: PatternAnalysis): FileAnalysis['type'] {
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
