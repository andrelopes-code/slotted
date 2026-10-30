import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import ts from 'typescript';

import type { BlockVerdict } from './types.ts';

export interface CompileBlock {
  key: string;
  language: string;
  source: string;
}

const EXTENSION: Readonly<Record<string, string>> = { tsx: '.tsx', ts: '.ts' };

/**
 * Only a module a consumer could save as a file is a candidate: it imports the
 * library and exports something. A block of comments, a constant or a loose
 * element compiles too, and labelled Example it would teach nothing. Read from
 * the syntax tree, not from the text.
 */
export function isReactCandidate(block: CompileBlock): boolean {
  if (EXTENSION[block.language] === undefined) return false;
  const file = ts.createSourceFile(
    `block${EXTENSION[block.language]}`,
    block.source,
    ts.ScriptTarget.Latest,
    false,
    block.language === 'tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const imports = file.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.startsWith('@slotted/'),
  );
  const exports = file.statements.some(
    (statement) =>
      ts.isExportAssignment(statement) ||
      ts.isExportDeclaration(statement) ||
      (ts.canHaveModifiers(statement) &&
        (ts.getModifiers(statement) ?? []).some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        )),
  );
  return imports && exports;
}

/**
 * `@slotted/react` resolves only through the subpaths its manifest exports, as
 * it does for a consumer: a directory of declarations with no `exports` entry
 * is not importable, and mapping a wildcard onto `dist/types` would pass it.
 */
function exportedPaths(root: string): Record<string, string[]> {
  const manifest = JSON.parse(readFileSync(join(root, 'packages/react/package.json'), 'utf8')) as {
    exports: Record<string, string | { types?: string }>;
  };
  const paths: Record<string, string[]> = {};
  for (const [subpath, target] of Object.entries(manifest.exports)) {
    if (typeof target === 'string' || target.types === undefined) continue;
    paths[`@slotted/react${subpath.slice(1)}`] = [join(root, 'packages/react', target.types)];
  }
  return paths;
}

/**
 * A block is an example when it compiles, as a module of its own, against the
 * declarations the package publishes. The scratch directory sits inside the
 * package's own `node_modules`, so `react` and `@slotted/core` resolve the way
 * they do for a consumer, and `@slotted/react` is mapped onto the declarations
 * its manifest exports.
 */
export async function compileReact(
  blocks: readonly CompileBlock[],
  root: string,
): Promise<Map<string, BlockVerdict>> {
  const verdicts = new Map<string, BlockVerdict>();
  const candidates = blocks.filter(isReactCandidate);
  for (const block of blocks) verdicts.set(block.key, 'excerpt');
  if (candidates.length === 0) return verdicts;

  const types = join(root, 'packages/react/dist/types');
  if (!existsSync(join(types, 'index.d.ts'))) {
    throw new Error(
      `${types}/index.d.ts is missing: build @slotted/react before judging its examples`,
    );
  }
  const cache = join(root, 'packages/react/node_modules/.cache');
  mkdirSync(cache, { recursive: true });
  const dir = mkdtempSync(join(cache, 'agent-docs-'));
  try {
    const files = candidates.map((block, index) => {
      const file = join(dir, `block-${index}${EXTENSION[block.language]}`);
      writeFileSync(file, block.source);
      return { file, key: block.key };
    });
    const program = ts.createProgram(
      files.map(({ file }) => file),
      {
        strict: true,
        exactOptionalPropertyTypes: true,
        noUncheckedIndexedAccess: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        target: ts.ScriptTarget.ES2022,
        lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
        types: [],
        noEmit: true,
        skipLibCheck: true,
        moduleDetection: ts.ModuleDetectionKind.Force,
        paths: exportedPaths(root),
      },
    );
    const errors = ts
      .getPreEmitDiagnostics(program)
      .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
    // An error with no file is the configuration's, and would excerpt every block.
    const global = errors.filter((diagnostic) => diagnostic.file === undefined);
    if (global.length > 0) {
      throw new Error(ts.flattenDiagnosticMessageText(global[0]!.messageText, '\n'));
    }
    const failed = new Set(errors.map((diagnostic) => diagnostic.file!.fileName));
    for (const { file, key } of files) verdicts.set(key, failed.has(file) ? 'excerpt' : 'example');
    return verdicts;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
