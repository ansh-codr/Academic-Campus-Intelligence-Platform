// Firebase uploads only the functions directory. Include shared contracts in its entrypoint.
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
const manifest = JSON.parse(await readFile(new URL('../functions/package.json', import.meta.url), 'utf8'));
await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  external: Object.keys(manifest.dependencies),
});
