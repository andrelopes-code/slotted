import { spawn } from 'node:child_process';

/**
 * Runs the named package scripts at once and fails when any of them fails.
 * The gates of `pnpm check` share no output and read no file another writes,
 * and run one after the other they took the sum of their times. Each gate's
 * output is printed whole when it ends, so two gates never interleave.
 *
 *   node scripts/run-gates.mjs typecheck lint test:contracts
 */
const gates = process.argv.slice(2);
const started = Date.now();

const run = (gate) =>
  new Promise((resolve) => {
    const child = spawn('pnpm', ['run', '--silent', gate], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('close', (code) => {
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      if (code !== 0) process.stdout.write(`\n── ${gate} failed ──\n${output}`);
      console.log(`${code === 0 ? 'ok  ' : 'FAIL'} ${gate} (${seconds} s)`);
      resolve(code === 0);
    });
  });

const results = await Promise.all(gates.map(run));
process.exit(results.every(Boolean) ? 0 : 1);
