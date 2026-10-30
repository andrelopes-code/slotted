import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { promisify, stripVTControlCharacters } from 'node:util';

import type { CompileBlock } from './compile-react.ts';
import type { BlockVerdict } from './types.ts';

const run = promisify(execFile);

/**
 * Only a module that declares its own component is a candidate: a template
 * compiles only inside a component, and writing one around it would mean
 * guessing its imports. Candidates compile with `ngc` and strict templates
 * against the published declarations, so an unknown input or selector fails.
 */
export function isAngularCandidate(block: CompileBlock): boolean {
  return block.language === 'ts' && block.source.includes('@Component(');
}

const DIAGNOSTIC = /^(.+?)(?:\(\d+,\d+\)|:\d+:\d+)(?::| -) error (?:TS|NG)\d+/;

export interface NgcRun {
  output: string;
  exitCode: number;
  /** A string code from the child process, such as an exceeded output buffer. */
  errorCode: string | undefined;
}

/** The file names of the blocks ngc reported, or an error when its output cannot be trusted. */
export function readNgcResult({ output, exitCode, errorCode }: NgcRun): Set<string> {
  if (errorCode === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
    // A truncated output names too few failures, and the rest would pass as examples.
    throw new Error('ngc output was truncated at the buffer limit');
  }
  if (errorCode !== undefined) {
    // The process never started — a missing binary is `ENOENT` — so there is no output to read.
    throw new Error(`ngc could not run: ${errorCode}`);
  }
  const failed = new Set<string>();
  // ngc colors its diagnostics whatever `pretty` says; the codes would hide every error.
  const plain = stripVTControlCharacters(output);
  for (const line of plain.split('\n')) {
    const match = DIAGNOSTIC.exec(line.trim());
    if (match === null) continue;
    const name = basename(match[1]!);
    if (!/^block-\d+\.ts$/.test(name)) {
      // An error outside the blocks is the configuration's, and would excerpt every block.
      throw new Error(`ngc reported an error outside the examples: ${line.trim()}`);
    }
    failed.add(name);
  }
  if (exitCode !== 0 && failed.size === 0) {
    throw new Error(`ngc failed and named no example:\n${plain.trim()}`);
  }
  return failed;
}

export async function compileAngular(
  blocks: readonly CompileBlock[],
  root: string,
): Promise<Map<string, BlockVerdict>> {
  const verdicts = new Map<string, BlockVerdict>();
  for (const block of blocks) verdicts.set(block.key, 'excerpt');
  const candidates = blocks.filter(isAngularCandidate);
  if (candidates.length === 0) return verdicts;

  const dist = join(root, 'packages/angular/dist');
  if (!existsSync(join(dist, 'package.json'))) {
    throw new Error(`${dist} is missing: build @slotted/angular before judging its examples`);
  }
  const cache = join(root, 'packages/angular/node_modules/.cache');
  mkdirSync(cache, { recursive: true });
  const dir = mkdtempSync(join(cache, 'agent-docs-'));
  try {
    const files = candidates.map((block, index) => {
      const file = join(dir, `block-${index}.ts`);
      writeFileSync(file, block.source);
      return { file, key: block.key };
    });
    // `@angular/compiler-cli` is a devDependency of the repository root, not of the package.
    const ngc = join(root, 'node_modules/.bin/ngc');
    const compile = async (remaining: readonly { file: string }[]): Promise<Set<string>> => {
      writeFileSync(
        join(dir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            strict: true,
            target: 'ES2022',
            module: 'ES2022',
            moduleResolution: 'bundler',
            lib: ['es2022', 'dom'],
            types: [],
            skipLibCheck: true,
            pretty: false,
            outDir: join(dir, 'out'),
            paths: { '@slotted/angular/*': [join(dist, 'types/slotted-angular-*.d.ts')] },
          },
          angularCompilerOptions: {
            strictTemplates: true,
            strictInjectionParameters: true,
            strictInputAccessModifiers: true,
          },
          files: remaining.map(({ file }) => file),
        }),
      );
      const result = await run(ngc, ['-p', join(dir, 'tsconfig.json')], {
        cwd: dir,
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
        maxBuffer: 64 * 1024 * 1024,
      }).then(
        ({ stdout, stderr }) => ({
          output: `${stdout}\n${stderr}`,
          exitCode: 0,
          errorCode: undefined,
        }),
        (error: { stdout?: string; stderr?: string; code?: number | string }) => ({
          output: `${error.stdout ?? ''}\n${error.stderr ?? ''}`,
          exitCode: typeof error.code === 'number' ? error.code : 1,
          errorCode: typeof error.code === 'string' ? error.code : undefined,
        }),
      );
      return new Set([...readNgcResult(result)].map((name) => join(dir, name)));
    };

    /*
     * ngc stops before the template phase when an earlier phase fails, so one
     * block's TypeScript error would hide every other block's template errors.
     * The blocks that failed leave, and the rest compile again until a run is clean.
     */
    let remaining = files;
    while (remaining.length > 0) {
      const failed = await compile(remaining);
      if (failed.size === 0) break;
      remaining = remaining.filter(({ file }) => !failed.has(file));
    }
    const passed = new Set(remaining.map(({ file }) => file));
    for (const { file, key } of files) verdicts.set(key, passed.has(file) ? 'example' : 'excerpt');
    return verdicts;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
