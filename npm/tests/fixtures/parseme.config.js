/** @type {import('parseme').ParsemeConfigFile} */
export default {
  rootDir: './test-project',
  outputPath: 'PARSEME.md',
  contextDir: 'parseme-context',
  analyzeFileTypes: ['ts', 'js'],
  excludePatterns: ['node_modules/**', 'dist/**', '**/*.test.ts'],
  includeGitInfo: true,
  useGitForFiles: true,
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
    maxFilesPerContext: 15,
  },
};
