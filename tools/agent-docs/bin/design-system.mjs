#!/usr/bin/env node
/**
 * Writes the Design System export into `<out>/project/`, for the system named
 * in `content/design-system/system.json`:
 *   node tools/agent-docs/bin/design-system.mjs --out <dir>/design-system
 * Prerequisite: `pnpm --filter @slotted/react build`, which builds the theme,
 * the themes and the React docs it reads. Publishing is in the README.
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { buildDesignSystem } from '../src/design-system.ts';

const { values } = parseArgs({ options: { out: { type: 'string' } } });
if (values.out === undefined) throw new Error('--out is required');

const root = resolve(import.meta.dirname, '../../..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const report = await buildDesignSystem({
  root,
  out: resolve(values.out),
  ref: `${git('rev-parse', '--abbrev-ref', 'HEAD')}@${git('rev-parse', '--short', 'HEAD')}`,
  at: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
  by: git('config', 'user.name'),
});
console.log(`design system: ${report.files.length} files in ${resolve(values.out, 'project')}`);
console.log(`tokens left out (not a color the type reads): ${report.dropped.join(', ') || 'none'}`);
console.log(
  `families without a preview (no complete example): ${report.withoutPreview.join(', ')}`,
);
for (const [family, error] of report.renderErrors) console.log(`render error ${family}: ${error}`);
