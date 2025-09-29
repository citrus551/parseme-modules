// This file represents a mixed TypeScript/JavaScript project structure
export const projectStructure = {
  files: [
    { path: 'src/index.ts', type: 'typescript' },
    { path: 'src/utils.js', type: 'javascript' },
    { path: 'src/config.json', type: 'json' },
    { path: 'src/components/Header.tsx', type: 'typescript' },
    { path: 'src/components/Footer.jsx', type: 'javascript' },
    { path: 'lib/helper.ts', type: 'typescript' },
    { path: 'lib/legacy.js', type: 'javascript' },
    { path: 'package.json', type: 'json' },
    { path: 'tsconfig.json', type: 'json' },
    { path: 'README.md', type: 'markdown' },
  ],
  expectedType: 'mixed',
};

export default projectStructure;
