import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

/*
 * The published declarations of `@slotted/core`, `@slotted/react` and
 * `@slotted/theme` type-check under `moduleResolution: nodenext`, the
 * resolution of a consumer that runs on Node's own ES modules. The probe is a
 * module of a consumer's: it imports a root export, a subpath and each
 * package, and an assignment that would pass if an import resolved to `any`
 * is expected to fail.
 *
 * Run from the package whose dependencies resolve all three
 * (`packages/react`), after the three are built:
 * `node ../../scripts/verify-declarations.mjs`.
 */

const PROBE = `import { createRowMetrics, writeToClipboard } from '@slotted/core';
import { formatMessage } from '@slotted/core/i18n';
import { Button } from '@slotted/react/button';
import { defineTheme } from '@slotted/theme';

export const root = [writeToClipboard, createRowMetrics];

// @ts-expect-error a function is not a symbol; an import resolved to any would be
export const message: symbol = formatMessage;
// @ts-expect-error a component is not a symbol
export const button: symbol = Button;
// @ts-expect-error a function is not a symbol
export const theme: symbol = defineTheme;
`;

const CONFIG = {
  compilerOptions: {
    module: 'nodenext',
    moduleResolution: 'nodenext',
    noEmit: true,
    skipLibCheck: false,
    strict: true,
    types: [],
  },
  files: ['probe.mts'],
};

const packageDirectory = process.cwd();
/* Inside the package and outside node_modules, so the probe resolves the
   package by its own name and its dependencies as a consumer would. */
const probeDirectory = join(packageDirectory, 'dist', '.declarations-probe');
const compiler = createRequire(join(packageDirectory, 'package.json')).resolve(
  'typescript/bin/tsc',
);

rmSync(probeDirectory, { force: true, recursive: true });
mkdirSync(probeDirectory, { recursive: true });
writeFileSync(join(probeDirectory, 'probe.mts'), PROBE);
writeFileSync(join(probeDirectory, 'tsconfig.json'), JSON.stringify(CONFIG, null, 2));

try {
  execFileSync(process.execPath, [compiler, '-p', resolve(probeDirectory)], { stdio: 'inherit' });
} catch {
  console.error('declarations: the published types do not resolve under nodenext');
  process.exitCode = 1;
} finally {
  rmSync(probeDirectory, { force: true, recursive: true });
}
