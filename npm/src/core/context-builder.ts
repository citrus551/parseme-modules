import { relative, dirname } from 'path';

import type { ParsemeConfig } from './config.js';
import type {
  ContextOutput,
  ProjectInfo,
  FileAnalysis,
  GitInfo,
  GeneratorOptions,
  RouteInfo,
} from './types.js';

interface BuildContext {
  projectInfo: ProjectInfo;
  fileAnalyses: FileAnalysis[];
  allFiles: string[];
  gitInfo?: GitInfo | null;
  options: GeneratorOptions;
  contextDir?: string;
  outputPath?: string;
}

export class ContextBuilder {
  constructor(private readonly config: ParsemeConfig) {}

  build(context: BuildContext): ContextOutput {
    return this.buildMultiFile(context);
  }

  private buildMultiFile(context: BuildContext): ContextOutput {
    const { projectInfo, fileAnalyses, gitInfo, contextDir, outputPath } = context;
    const limits = this.config.get().limits;

    // Limit number of files analyzed if specified
    const limitedFileAnalyses = limits?.maxFilesPerContext
      ? fileAnalyses.slice(0, limits.maxFilesPerContext)
      : fileAnalyses;

    // Warn if files were excluded due to limit
    if (limits?.maxFilesPerContext && fileAnalyses.length > limits.maxFilesPerContext) {
      const excludedCount = fileAnalyses.length - limits.maxFilesPerContext;

      console.warn(`⚠️  File limit reached: ${excludedCount} files excluded from analysis.`);
      console.warn(`   Analyzed: ${limits.maxFilesPerContext}/${fileAnalyses.length} files`);
      console.warn(
        `   To analyze more files, increase 'limits.maxFilesPerContext' in your config file.`,
      );
    }

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

    // Check if routes exist before building main content
    // Extract all actual route objects (filter out reference objects)
    const routes = limitedFileAnalyses.flatMap((f) => {
      const fileRoutes = f.routes || [];
      // Only include if it's an array of actual routes, not a reference object
      return Array.isArray(fileRoutes) && fileRoutes.length > 0 && !('$ref' in fileRoutes[0])
        ? fileRoutes
        : [];
    });
    const hasRoutes = routes.length > 0;

    const mainContent =
      this.buildHeader(linkPath, hasRoutes) +
      '\n\n\n' +
      this.buildProjectOverview(projectInfo) +
      '\n\n\n' +
      this.buildSummarySection(context, linkPath, hasRoutes) +
      '\n\n\n' +
      (gitInfo ? this.buildGitSection(gitInfo) : '');
    const contextFiles: {
      [key: string]: string;
      structure: string;
    } = {
      structure: '',
    };

    // Files list (markdown) - all files in project, not just analyzed ones
    contextFiles.files = this.buildFilesList(context.allFiles);

    // Detailed structure (JSON with AST)
    contextFiles.structure = this.buildDetailedStructure(limitedFileAnalyses, hasRoutes);

    // Routes documentation (only if routes exist)
    if (hasRoutes) {
      contextFiles.routes = this.buildDetailedRoutes(routes, limitedFileAnalyses);
    }

    // Git information
    if (gitInfo && gitInfo.diffStat && gitInfo.diffStat.length > 0) {
      contextFiles.gitDiff = this.buildDetailedGit(gitInfo);
    }

    return {
      parseme: mainContent,
      context: contextFiles,
    };
  }

  private buildHeader(linkPath: string, hasRoutes: boolean): string {
    const routesInstructions = hasRoutes
      ? `   - Files with routes will reference [${linkPath}/routes.json](${linkPath}/routes.json) using a $ref pattern for token efficiency
5. For API route details, see [${linkPath}/routes.json](${linkPath}/routes.json) which contains all discovered endpoints
6. For git tracked projects follow the instructions in the "Git Information" section of this file to validate the actuality of the provided information.
7. Only dive deeper into specific files after reviewing this summary, that replaces the need for initial project exploration and significantly reduces token usage for project comprehension.`
      : `5. For git tracked projects, follow the instructions in the "Git Information" section of this file to validate the actuality of the provided information.
6. Only dive deeper into specific files after reviewing this summary, that replaces the need for initial project exploration and significantly reduces token usage for project comprehension.`;

    return `## PARSEME - AI Agent Context
Auto-generated project summary optimized for AI coding agents. This file provides complete project context without requiring full codebase traversal, designed for token efficiency.

**Usage Instructions for AI Agents:**
1. Read this PARSEME.md file completely first before accessing individual project files
2. Basic project information, script availability and dependency information provides basic understanding of code base and tech stack without checking package.json
3. Use the provided file list [${linkPath}/files.md](${linkPath}/files.md) to see all tracked files in the project
4. Utilize the structure and AST data [${linkPath}/structure.json](${linkPath}/structure.json) for code analysis without manual parsing
${routesInstructions}`;
  }

  private buildProjectOverview(projectInfo: ProjectInfo): string {
    let content = `## Basic Project Information

**Project:** ${projectInfo.name}${projectInfo.version ? ` v${projectInfo.version}` : ''}
**Description:** ${projectInfo.description || 'No description available.'}
**Type:** ${projectInfo.type} project
**Package Manager:** ${projectInfo.packageManager}
**Framework:** ${projectInfo.framework?.name || 'None detected'}`;

    // Add main entry point if available
    if (projectInfo.entryPoints && projectInfo.entryPoints.length > 0) {
      content += `\n**Main Entry Point:** ${projectInfo.entryPoints[0]}`;
    }

    content += '\n';

    // Add dependencies
    const deps = Object.keys(projectInfo.dependencies);
    if (deps.length > 0) {
      content += '\n\n### Dependencies\n';
      deps.forEach((dep) => {
        content += `- ${dep}\n`;
      });
    }

    // Add available scripts
    if (projectInfo.scripts && Object.keys(projectInfo.scripts).length > 0) {
      content += '\n### Available Scripts\n';
      Object.entries(projectInfo.scripts).forEach(([name, script]) => {
        content += `- **${name}**: \`${script}\`\n`;
      });
    }

    return content;
  }

  private buildGitSection(gitInfo: GitInfo): string {
    const base = `## Git Information

**State when PARSEME.md and all linked files were automatically generated:**

- **Branch:** ${gitInfo.branch}
- **Commit:** ${gitInfo.lastCommit}${gitInfo.origin ? `\n- **Origin:** ${gitInfo.origin}` : ''}

### Git Diff Statistics`;

    const info =
      gitInfo.diffStat && gitInfo.diffStat.length > 0
        ? `Git diff statistics from the time of generation are available at [parseme-context/gitDiff.md](parseme-context/gitDiff.md) (relative to the commit mentioned above).

**AI Agent Command:** To check for changes since generation, run:
\`\`\`bash
git diff --stat
\`\`\`
Compare the output with the baseline in [parseme-context/gitDiff.md](parseme-context/gitDiff.md) to detect any modifications.`
        : `Git diff statistics showed no changes at the time of generation relative to the commit mentioned above.`;

    return base + '\n\n' + info;
  }

  private buildSummarySection(context: BuildContext, linkPath: string, hasRoutes: boolean): string {
    let content = `## Project Files
A complete list of all git-tracked files in the project (excluding files matching additional exclude patterns) is available at [${linkPath}/files.md](${linkPath}/files.md). This provides a quick overview of the project structure.


## Project Structure & AST
Detailed structure and Abstract Syntax Tree data for all tracked files is available at [${linkPath}/structure.json](${linkPath}/structure.json). This includes file paths, types, imports, exports, functions, classes, interfaces, and routes for comprehensive code analysis without manual parsing.`;

    if (hasRoutes) {
      content += `\n\n\n## API Routes
A comprehensive list of all discovered API routes is available at [${linkPath}/routes.json](${linkPath}/routes.json). This includes HTTP methods, paths, handler names, and source file locations for backend routes (Express, NestJS, and decorator-based routing).`;
    }

    return content;
  }

  private buildFilesList(allFiles: string[]): string {
    let content = `# Project Files\n`;

    allFiles.forEach((file) => {
      content += `- ${file}\n`;
    });

    return content;
  }

  private buildDetailedStructure(fileAnalyses: FileAnalysis[], hasRoutes: boolean): string {
    const structureData = fileAnalyses.map((file) => {
      const routes = file.routes || [];

      // If file has routes and routes exist in the project, replace with reference instead of full route objects
      const routesData =
        routes.length > 0 && hasRoutes
          ? {
              $ref: './routes.json',
              filter: { file: file.path },
              count: routes.length,
            }
          : [];

      return {
        path: file.path,
        type: file.type,
        exports: file.exports,
        imports: file.imports,
        functions: file.functions,
        classes: file.classes,
        routes: routesData,
      };
    });

    const jsonContent = JSON.stringify(structureData, null, 2);
    return jsonContent;
  }

  private buildDetailedRoutes(routes: RouteInfo[], _fileAnalyses: FileAnalysis[]): string {
    const jsonContent = JSON.stringify(routes, null, 2);
    return jsonContent;
  }

  private buildDetailedDependencies(projectInfo: ProjectInfo): string {
    const jsonContent = JSON.stringify(
      {
        dependencies: projectInfo.dependencies,
        packageManager: projectInfo.packageManager,
        version: projectInfo.version,
      },
      null,
      2,
    );
    return jsonContent;
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

  private buildDetailedGit(gitInfo: GitInfo): string {
    let content = `# Git Diff Statistics
`;

    content += gitInfo.diffStat;

    return content;
  }
}
