// Core types for the parseme package

import type {
  ServiceInfo,
  ModelInfo,
  ConfigInfo,
  MiddlewareInfo,
  UtilityInfo,
} from './analyzers/pattern-detector.js';

export type { ServiceInfo, ModelInfo, ConfigInfo, MiddlewareInfo, UtilityInfo };

export interface GeneratorOptions {
  rootDir?: string;
  includeGitInfo?: boolean;
  maxDepth?: number;
  excludePatterns?: string[];
  includePatterns?: string[];
}

export interface ProjectInfo {
  name: string;
  version?: string;
  description?: string;
  type: 'typescript' | 'javascript' | 'mixed';
  category: ProjectCategory;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
  framework?: FrameworkInfo;
  buildTool?: BuildToolInfo;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts?: Record<string, string>;
  entryPoints?: string[];
  outputTargets?: string[];
}

export type ProjectCategory =
  | 'backend-api'
  | 'frontend-web'
  | 'frontend-mobile'
  | 'npm-package'
  | 'monorepo'
  | 'cli-tool'
  | 'desktop-app'
  | 'fullstack'
  | 'unknown';

export interface BuildToolInfo {
  name: string;
  version?: string;
  configFiles: string[];
  features: string[];
}

export interface FrameworkInfo {
  name: string;
  version?: string;
  features: string[];
  routes?: RouteInfo[];
  components?: ComponentInfo[];
}

export interface RouteInfo {
  method: string;
  path: string;
  handler: string;
  middleware?: string[];
  file: string;
  line: number;
}

export interface ComponentInfo {
  name: string;
  file: string;
  line: number;
}

export interface FileAnalysis {
  path: string;
  type: 'route' | 'middleware' | 'model' | 'service' | 'utility' | 'config' | 'test' | 'component';
  framework?: string;
  exports: string[];
  imports: string[];
  functions: string[];
  classes: string[];
  routes?: RouteInfo[];
  components?: ComponentInfo[];
  services?: ServiceInfo[];
  models?: ModelInfo[];
  configs?: ConfigInfo[];
  middleware?: MiddlewareInfo[];
  utilities?: UtilityInfo[];
}

export interface ContextOutput {
  parseme: string; // Main PARSEME.md content
  context?: {
    // Optional parseme-context/ folder files
    structure: string;
    routes: string;
    dependencies: string;
    [key: string]: string;
  };
}

export interface GitInfo {
  branch: string;
  lastCommit: string;
  changedFiles: string[];
  status: 'clean' | 'dirty';
  origin?: string;
  diffStat?: string;
}
