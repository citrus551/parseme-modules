import { relative, dirname } from 'path';

import type { ParsemeConfig } from '../config.js';
import type {
  ContextOutput,
  ProjectInfo,
  FileAnalysis,
  GitInfo,
  GeneratorOptions,
  RouteInfo,
} from '../types.js';

interface BuildContext {
  projectInfo: ProjectInfo;
  fileAnalyses: FileAnalysis[];
  gitInfo?: GitInfo;
  options: GeneratorOptions;
  contextDir?: string;
  outputPath?: string;
}

export class ContextBuilder {
  constructor(private readonly config: ParsemeConfig) {}

  private truncateContent(content: string, type: 'lines' | 'chars' = 'chars'): string | string[] {
    const limits = this.config.get().limits;
    if (!limits) {
      return content;
    }

    const strategy = limits.truncateStrategy || 'truncate';

    if (type === 'lines') {
      const lines = content.split('\n');
      const maxLines = limits.maxLinesPerFile || 1000;

      if (lines.length > maxLines) {
        if (strategy === 'split') {
          return this.splitContentByLines(lines, maxLines);
        } else {
          const truncated = lines.slice(0, maxLines).join('\n');
          return truncated + '\n\n[... truncated for AI compatibility ...]';
        }
      }
    } else {
      const maxChars = limits.maxCharsPerFile || 50000;

      if (content.length > maxChars) {
        if (strategy === 'split') {
          return this.splitContentByChars(content, maxChars);
        } else {
          const truncated = content.substring(0, maxChars - 100);
          return truncated + '\n\n[... truncated for AI compatibility ...]';
        }
      }
    }

    return content;
  }

  private splitContentByLines(lines: string[], maxLines: number): string[] {
    const parts: string[] = [];
    const safeMaxLines = maxLines - 5; // Reserve space for split indicators

    for (let i = 0; i < lines.length; i += safeMaxLines) {
      const chunk = lines.slice(i, i + safeMaxLines);
      const partNumber = Math.floor(i / safeMaxLines) + 1;
      const totalParts = Math.ceil(lines.length / safeMaxLines);

      let partContent = chunk.join('\n');
      partContent += `\n\n[... part ${partNumber} of ${totalParts} ...]`;

      parts.push(partContent);
    }

    return parts;
  }

  private splitContentByChars(content: string, maxChars: number): string[] {
    const parts: string[] = [];
    const safeMaxChars = maxChars - 200; // Reserve space for split indicators

    for (let i = 0; i < content.length; i += safeMaxChars) {
      let chunk = content.substring(i, i + safeMaxChars);
      const partNumber = Math.floor(i / safeMaxChars) + 1;
      const totalParts = Math.ceil(content.length / safeMaxChars);

      // Try to break at a reasonable place (newline or word boundary)
      if (i + safeMaxChars < content.length) {
        const lastNewline = chunk.lastIndexOf('\n');
        const lastSpace = chunk.lastIndexOf(' ');
        const breakPoint =
          lastNewline > -1 ? lastNewline : lastSpace > -1 ? lastSpace : chunk.length;

        if (breakPoint > safeMaxChars * 0.8) {
          // Only break if we're not losing too much content
          chunk = chunk.substring(0, breakPoint);
        }
      }

      chunk += `\n\n[... part ${partNumber} of ${totalParts} ...]`;
      parts.push(chunk);
    }

    return parts;
  }

  build(context: BuildContext): ContextOutput {
    return this.buildMultiFile(context);
  }

  private buildMultiFile(context: BuildContext): ContextOutput {
    const { projectInfo, fileAnalyses, gitInfo } = context;
    const limits = this.config.get().limits;

    // Limit number of files analyzed if specified
    const limitedFileAnalyses = limits?.maxFilesPerContext
      ? fileAnalyses.slice(0, limits.maxFilesPerContext)
      : fileAnalyses;

    const mainContent =
      this.buildHeader(projectInfo) +
      '\n\n' +
      this.buildProjectOverview(projectInfo) +
      '\n\n' +
      this.buildSummarySection(context);

    const contextFiles: {
      [key: string]: string;
      structure: string;
      routes: string;
      dependencies: string;
    } = {
      structure: '',
      routes: '',
      dependencies: '',
    };

    // Helper function to merge split files into contextFiles
    const mergeSplitFiles = (result: string | Record<string, string>, baseName: string) => {
      if (typeof result === 'string') {
        contextFiles[baseName] = result;
      } else {
        // Merge split files into contextFiles
        Object.entries(result).forEach(([key, value]) => {
          contextFiles[key] = value;
        });
      }
    };

    // Detailed structure
    const structureResult = this.buildDetailedStructure(limitedFileAnalyses);
    mergeSplitFiles(structureResult, 'structure');

    // Routes documentation
    const routes = limitedFileAnalyses.flatMap((f) => f.routes || []);
    if (routes.length > 0) {
      const routesResult = this.buildDetailedRoutes(routes, limitedFileAnalyses);
      mergeSplitFiles(routesResult, 'routes');
    }

    // Dependencies
    const dependenciesResult = this.buildDetailedDependencies(projectInfo);
    mergeSplitFiles(dependenciesResult, 'dependencies');

    // Framework details
    if (
      projectInfo.framework &&
      projectInfo.framework.name &&
      projectInfo.framework.name !== 'unknown'
    ) {
      contextFiles.framework = this.buildDetailedFramework(projectInfo.framework);
    }

    // Git information
    if (gitInfo) {
      const gitResult = this.buildDetailedGit(gitInfo);
      mergeSplitFiles(gitResult, 'git');
    }

    return {
      parseme: mainContent,
      context: contextFiles,
    };
  }

  private buildHeader(projectInfo: ProjectInfo): string {
    return `# ${projectInfo.name}

*AI-Generated Project Context*

${projectInfo.description || 'No description available.'}`;
  }

  private buildProjectOverview(projectInfo: ProjectInfo): string {
    return `## Project Overview

- **Type**: ${projectInfo.type} project
- **Package Manager**: ${projectInfo.packageManager}
- **Framework**: ${projectInfo.framework?.name || 'None detected'}
- **Version**: ${projectInfo.version || 'Not specified'}`;
  }

  private buildFrameworkSection(framework: ProjectInfo['framework']): string {
    if (!framework) {
      return '';
    }

    const features =
      framework.features.length > 0 ? `\n- **Features**: ${framework.features.join(', ')}` : '';

    return `## Framework: ${framework.name}

- **Version**: ${framework.version || 'Unknown'}${features}`;
  }

  private buildArchitectureSection(fileAnalyses: FileAnalysis[]): string {
    const typeGroups = fileAnalyses.reduce(
      (acc, file) => {
        if (!acc[file.type]) {
          acc[file.type] = [];
        }
        acc[file.type].push(file);
        return acc;
      },
      {} as Record<string, FileAnalysis[]>,
    );

    const archLines = Object.entries(typeGroups)
      .map(([type, files]) => `- **${type}**: ${files.length} files`)
      .join('\n');

    return `## Architecture Overview

${archLines}`;
  }

  private buildRoutesSection(routes: RouteInfo[], _fileAnalyses: FileAnalysis[]): string {
    const routesByMethod = routes.reduce(
      (acc, route) => {
        if (!acc[route.method]) {
          acc[route.method] = [];
        }
        acc[route.method].push(route);
        return acc;
      },
      {} as Record<string, RouteInfo[]>,
    );

    const routeLines = Object.entries(routesByMethod)
      .map(([method, methodRoutes]) => {
        const routeList = methodRoutes
          .map((route) => `  - \`${route.path}\` → ${route.handler}`)
          .join('\n');
        return `- **${method}**:\n${routeList}`;
      })
      .join('\n');

    return `## API Endpoints

${routeLines}`;
  }

  private buildFileStructureSection(fileAnalyses: FileAnalysis[]): string {
    const structure = fileAnalyses.map((file) => `- \`${file.path}\` (${file.type})`).join('\n');

    return `## File Structure

${structure}`;
  }

  private buildDependenciesSection(projectInfo: ProjectInfo): string {
    const deps = Object.keys(projectInfo.dependencies);
    const devDeps = Object.keys(projectInfo.devDependencies);

    let content = '## Dependencies\n\n';

    if (deps.length > 0) {
      content += `**Production**: ${deps.join(', ')}\n\n`;
    }

    if (devDeps.length > 0) {
      content += `**Development**: ${devDeps.join(', ')}`;
    }

    return content;
  }

  private buildGitSection(gitInfo: GitInfo): string {
    return `## Git Information

- **Branch**: ${gitInfo.branch}
- **Status**: ${gitInfo.status}
- **Last Commit**: ${gitInfo.lastCommit}
${gitInfo.changedFiles.length > 0 ? `- **Changed Files**: ${gitInfo.changedFiles.join(', ')}` : ''}`;
  }

  private buildFooter(): string {
    return `---

*Generated by PARSEME v1.0.0 on ${new Date().toISOString().split('T')[0]}*`;
  }

  private buildSummarySection(context: BuildContext): string {
    const { fileAnalyses, contextDir, outputPath } = context;
    const totalFiles = fileAnalyses.length;
    const routes = fileAnalyses.flatMap((f) => f.routes || []).length;

    // Calculate the relative path for the link in markdown
    let linkPath = 'parseme-context';

    if (contextDir && outputPath) {
      const outputDir = dirname(outputPath);

      if (contextDir.startsWith('/')) {
        // Absolute path: calculate relative path from output file to context dir
        linkPath = relative(outputDir, contextDir);
      } else {
        // Relative path: use as-is since it's relative to the output file's directory
        linkPath = contextDir;
      }
    } else if (contextDir) {
      // Fallback: use contextDir as-is if no outputPath provided
      linkPath = contextDir;
    }

    return `## Summary

This project contains ${totalFiles} analyzed files${routes > 0 ? ` with ${routes} API endpoints` : ''}.

For detailed information, see the files in the \`${linkPath}/\` directory.`;
  }

  private buildDetailedStructure(fileAnalyses: FileAnalysis[]): string | Record<string, string> {
    const structureData = fileAnalyses.map((file) => ({
      path: file.path,
      type: file.type,
      exports: file.exports,
      imports: file.imports,
      functions: file.functions,
      classes: file.classes,
      routes: file.routes || [],
    }));

    const jsonContent = JSON.stringify(structureData, null, 2);
    const result = this.truncateContent(jsonContent);

    if (Array.isArray(result)) {
      // Return split files as a record with numbered keys
      const splitFiles: Record<string, string> = {};
      result.forEach((part, index) => {
        const suffix = index === 0 ? '' : `_part${index + 1}`;
        splitFiles[`structure${suffix}`] = part;
      });
      return splitFiles;
    }

    return result;
  }

  private buildDetailedRoutes(
    routes: RouteInfo[],
    _fileAnalyses: FileAnalysis[],
  ): string | Record<string, string> {
    const jsonContent = JSON.stringify(routes, null, 2);
    const result = this.truncateContent(jsonContent);

    if (Array.isArray(result)) {
      const splitFiles: Record<string, string> = {};
      result.forEach((part, index) => {
        const suffix = index === 0 ? '' : `_part${index + 1}`;
        splitFiles[`routes${suffix}`] = part;
      });
      return splitFiles;
    }

    return result;
  }

  private buildDetailedDependencies(projectInfo: ProjectInfo): string | Record<string, string> {
    const jsonContent = JSON.stringify(
      {
        dependencies: projectInfo.dependencies,
        packageManager: projectInfo.packageManager,
        version: projectInfo.version,
      },
      null,
      2,
    );
    const result = this.truncateContent(jsonContent);

    if (Array.isArray(result)) {
      const splitFiles: Record<string, string> = {};
      result.forEach((part, index) => {
        const suffix = index === 0 ? '' : `_part${index + 1}`;
        splitFiles[`dependencies${suffix}`] = part;
      });
      return splitFiles;
    }

    return result;
  }

  private buildDetailedFramework(framework: ProjectInfo['framework']): string {
    if (!framework) {
      return '';
    }

    let content = `# Framework: ${framework.name}\n\n`;
    content += `**Version**: ${framework.version || 'Unknown'}\n\n`;

    if (framework.features.length > 0) {
      content += '## Features Detected\n\n';
      framework.features.forEach((feature) => {
        content += `- ${feature}\n`;
      });
    }

    return content;
  }

  private buildDetailedGit(gitInfo: GitInfo): string | Record<string, string> {
    const jsonContent = JSON.stringify(gitInfo, null, 2);
    const result = this.truncateContent(jsonContent);

    if (Array.isArray(result)) {
      const splitFiles: Record<string, string> = {};
      result.forEach((part, index) => {
        const suffix = index === 0 ? '' : `_part${index + 1}`;
        splitFiles[`git${suffix}`] = part;
      });
      return splitFiles;
    }

    return result;
  }
}
