/** @type {import('parseme').ParsemeConfigFile} */
export default {
  rootDir: './test-project',
  outputPath: 'PARSEME.md',
  contextDir: 'parseme-context',
  includePatterns: ['src/**/*.ts', 'src/**/*.js', 'package.json'],
  excludePatterns: ['node_modules/**', 'dist/**', '**/*.test.ts'],
  includeGitInfo: true,
  maxDepth: 5,
  sections: {
    overview: true,
    architecture: true,
    routes: true,
    dependencies: true,
    git: true,
    fileStructure: true,
  },
  style: {
    includeLineNumbers: false,
    includeFileStats: true,
    groupByType: true,
    sortOrder: 'type',
  },
  limits: {
    maxLinesPerFile: 500,
    maxCharsPerFile: 25000,
    maxFilesPerContext: 15,
    truncateStrategy: 'truncate',
  },
};
