// Types related to project information and framework detection

import type { RouteInfo, ComponentInfo } from './analyzer-types.js';

export interface ProjectInfo {
  name: string;
  version?: string;
  description?: string;
  type: 'typescript' | 'javascript' | 'mixed';
  category: ProjectCategory;
  packageManager: 'unknown' | 'npm' | 'yarn' | 'pnpm' | 'bun';
  frameworks?: FrameworkInfo[];
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

export interface FrameworkInfo {
  name: string;
  version?: string;
  features: string[];
  routes?: RouteInfo[];
  components?: ComponentInfo[];
}

export interface BuildToolInfo {
  name: string;
  version?: string;
  configFiles: string[];
  features: string[];
}
