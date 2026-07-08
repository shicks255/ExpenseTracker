import { readFile, writeFile } from 'node:fs/promises';

const routesPath = new URL('../src/routes.ts', import.meta.url);

const current = await readFile(routesPath, 'utf8');

const updated = current.replace(
  /(from '\.\/controllers\/[^']+)(?<!\.js)';/g,
  "$1.js';",
);

if (updated !== current) {
  await writeFile(routesPath, updated, 'utf8');
}
