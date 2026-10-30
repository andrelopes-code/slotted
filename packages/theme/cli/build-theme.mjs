#!/usr/bin/env node
import { buildTheme } from './build.mjs';

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const out = outIndex === -1 ? 'dist' : args[outIndex + 1];
const input = args.find((arg, index) => !arg.startsWith('--') && index !== outIndex + 1);
if (!input || !out) {
  console.error('usage: slotted-build-theme <theme module> [--out <dir>]');
  process.exit(2);
}
try {
  await buildTheme(input, out);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
