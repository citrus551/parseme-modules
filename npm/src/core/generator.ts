import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';

import { ASTAnalyzer } from './analyzers/ast-analyzer.js';
import { FrameworkDetector } from './analyzers/framework-detector.js';
import { ProjectAnalyzer } from './analyzers/project-analyzer.js';
import { ParsemeConfig } from './config.js';
import { ContextBuilder } from './context-builder.js';
import { GitAnalyzer } from '../utils/git.js';

import type { ContextOutput, GeneratorOptions } from './types.js';

export class ParsemeGenerator {
  private readonly config: ParsemeConfig;
  private readonly projectAnalyzer: ProjectAnalyzer;
  private readonly astAnalyzer: ASTAnalyzer;
  private readonly frameworkDetector: FrameworkDetector;
  private readonly gitAnalyzer: GitAnalyzer;
  private readonly contextBuilder: ContextBuilder;

  constructor(options: GeneratorOptions = {}) {
    this.config = new ParsemeConfig(options);
    this.projectAnalyzer = new ProjectAnalyzer(this.config);
    this.astAnalyzer = new ASTAnalyzer(this.config);
    this.frameworkDetector = new FrameworkDetector();
    this.gitAnalyzer = new GitAnalyzer();
    this.contextBuilder = new ContextBuilder(this.config);
  }

  async generate(outputPath?: string): Promise<ContextOutput> {
    const configData = this.config.get();

    // Step 1: Analyze the project structure and metadata
    const projectInfo = await this.projectAnalyzer.analyze(configData.rootDir!);

    // Step 2: Analyze all relevant files with AST
    const fileAnalyses = await this.astAnalyzer.analyzeProject(configData.rootDir!);

    // Step 3: Detect frameworks from dependencies
    projectInfo.frameworks = await this.frameworkDetector.detect(projectInfo);

    // Step 4: Get all project files (for file list output)
    const allFiles = await this.projectAnalyzer.getAllProjectFiles(configData.rootDir!);

    // Step 5: Get git information if enabled
    const gitInfo = configData.includeGitInfo
      ? await this.gitAnalyzer.analyze(configData.rootDir!)
      : null;

    // Calculate final output path for link generation
    const finalOutputPath =
      outputPath || configData.outputPath || join(configData.rootDir!, 'PARSEME.md');

    // Step 6: Build the context output
    return this.contextBuilder.build({
      projectInfo,
      fileAnalyses,
      allFiles,
      gitInfo,
      options: configData,
      contextDir: configData.contextDir,
      outputPath: finalOutputPath,
    });
  }

  async generateToFile(outputPath?: string, contextDir?: string): Promise<void> {
    // Use outputPath from config if not specified
    const configData = this.config.get();
    let finalOutputPath: string;

    if (outputPath) {
      finalOutputPath = outputPath;
    } else if (configData.outputPath) {
      // If outputPath is relative, resolve it relative to rootDir
      finalOutputPath = configData.outputPath.startsWith('/')
        ? configData.outputPath
        : join(configData.rootDir!, configData.outputPath);
    } else {
      finalOutputPath = join(configData.rootDir!, 'PARSEME.md');
    }

    const context = await this.generate(finalOutputPath);

    // Use contextDir from config if not specified
    const finalContextDir = contextDir || configData.contextDir || 'parseme-context';

    // If contextDir is relative, make it relative to the output file's directory
    const baseDir = join(finalOutputPath, '..');
    const parsemeDir = finalContextDir.startsWith('/')
      ? finalContextDir // Absolute path
      : join(baseDir, finalContextDir); // Relative path

    // Clear the directory if it exists, then recreate it
    await rm(parsemeDir, { recursive: true, force: true });
    await mkdir(parsemeDir, { recursive: true });
    await writeFile(finalOutputPath, context.parseme);

    if (context.context) {
      for (const [filename, content] of Object.entries(context.context)) {
        // Use .md extension for markdown files, .json for others
        const extension = filename === 'gitDiff' || filename === 'files' ? '.md' : '.json';
        await writeFile(join(parsemeDir, `${filename}${extension}`), content);
      }
    }
  }
}
