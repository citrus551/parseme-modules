// Types related to file analysis and AST parsing

import type {
  ServiceInfo,
  ModelInfo,
  ConfigInfo,
  MiddlewareInfo,
  UtilityInfo,
  EndpointInfo,
} from '../analyzers/pattern-detector.js';

export type { ServiceInfo, ModelInfo, ConfigInfo, MiddlewareInfo, UtilityInfo, EndpointInfo };

export interface FileAnalysis {
  path: string;
  type: 'route' | 'middleware' | 'model' | 'service' | 'utility' | 'config' | 'test' | 'component';
  framework?: string;
  exports: string[];
  imports: string[];
  functions: string[];
  classes: string[];
  routes?: EndpointInfo[];
  components?: ComponentInfo[];
  services?: ServiceInfo[];
  models?: ModelInfo[];
  configs?: ConfigInfo[];
  middleware?: MiddlewareInfo[];
  utilities?: UtilityInfo[];
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

export interface GitInfo {
  branch: string;
  lastCommit: string;
  changedFiles: string[];
  status: 'clean' | 'dirty';
  origin?: string;
  diffStat?: string;
}
