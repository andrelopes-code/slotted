import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import ts from 'typescript';

import { angularTextRuns, buildInventory } from './extract-i18n.mjs';

/*
 * The internationalization gate:
 *
 * 1. no family writes words of its own: every text the inventory finds in a
 *    binding, or in core outside `packages/core/src/i18n`, is a failure;
 * 2. every published locale has exactly the keys of en-US;
 * 3. every message reads the slots its en-US message reads;
 * 4. every message is read whole by the message grammar;
 * 5. a contract's `messages` list is its family's keys in en-US, and no
 *    contract declares `labels`;
 * 6. no binding builds a sentence around a message (`${t('filter')} ${name}`).
 *
 * Points 2 and 3 are also typed; the gate exists because a translation is data
 * and can be written outside TypeScript.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const I18N = join(ROOT, 'packages/core/src/i18n');
const CONTRACTS = join(ROOT, 'specs/components');

/** The i18n sources, transpiled to plain modules, so the gate reads the catalogs as they ship. */
async function loadI18n() {
  const out = mkdtempSync(join(tmpdir(), 'slotted-i18n-'));
  const walk = (dir) =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });
  for (const file of walk(I18N)) {
    if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue;
    const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    const target = join(out, relative(I18N, file)).replace(/\.ts$/, '.mjs');
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, outputText.replace(/(from\s+'\.{1,2}\/[^']+)'/g, "$1.mjs'"));
  }
  const load = (path) => import(pathToFileURL(join(out, path)).href);
  const index = await load('index.mjs');
  const locales = {};
  for (const name of readdirSync(join(I18N, 'locales'))) {
    if (!name.endsWith('.ts')) continue;
    const tag = name.slice(0, -3);
    const module = await load(`locales/${tag}.mjs`);
    locales[tag] = module[tag.replace('-', '_').toUpperCase()];
  }
  return { ...index, locales };
}

const i18n = await loadI18n();

/** Every leaf of a catalog as `[path, message]`, a nested key written `group.key`. */
function leaves(tree, prefix = '') {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    return value !== null && typeof value === 'object' ? leaves(value, path) : [[path, value]];
  });
}

export function textViolations(inventory) {
  return Object.entries(inventory.families).flatMap(([family, rows]) =>
    ['react', 'angular', 'core'].flatMap((binding) =>
      Object.values(rows[binding] ?? {}).map(
        (row) => `${family} (${binding}): ${JSON.stringify(row.text)} at ${row.at}`,
      ),
    ),
  );
}

export function catalogViolations(en, locales) {
  const base = new Map(leaves(en));
  return Object.entries(locales).flatMap(([tag, catalog]) => {
    const translated = new Map(leaves(catalog));
    const errors = [];
    for (const [path, message] of base) {
      if (!translated.has(path)) {
        errors.push(`${tag}: missing ${path}`);
        continue;
      }
      const text = translated.get(path);
      if (typeof message !== 'string' || typeof text !== 'string') continue;
      const want = i18n.messageSlots(message).sort();
      const got = i18n.messageSlots(text).sort();
      if (want.join() !== got.join()) {
        errors.push(
          `${tag}: ${path} reads [${got.join(', ')}] where en-US reads [${want.join(', ')}]`,
        );
      }
      if (!i18n.isWellFormed(text)) errors.push(`${tag}: ${path} is not well formed`);
    }
    for (const path of translated.keys()) {
      if (!base.has(path)) errors.push(`${tag}: ${path} is not an en-US key`);
    }
    return errors;
  });
}

const camel = (name) => name.replace(/-(\w)/g, (_, letter) => letter.toUpperCase());

export function contractViolations(en, contracts) {
  return Object.entries(contracts).flatMap(([family, contract]) => {
    const errors = [];
    if ('labels' in contract) errors.push(`${family}: contract still declares labels`);
    if (Array.isArray(contract.messages)) {
      const keys = leaves(en[camel(family)] ?? {}).map(([path]) => path);
      if (contract.messages.join() !== keys.join()) {
        errors.push(
          `${family}: contract messages [${contract.messages.join(', ')}] differ from en-US [${keys.join(', ')}]`,
        );
      }
    }
    return errors;
  });
}

/** A call to a family translator: `t('key')`, `this.t('key')`, `grid.t('key')`. */
function isMessageCall(node) {
  if (!ts.isCallExpression(node)) return false;
  const callee = node.expression;
  return (
    (ts.isIdentifier(callee) && callee.text === 't') ||
    (ts.isPropertyAccessExpression(callee) && callee.name.text === 't')
  );
}

const containsMessageCall = (node) =>
  isMessageCall(node) ||
  (ts.forEachChild(node, (child) => containsMessageCall(child) || undefined) ?? false);

/** An Angular template expression that joins a message to anything with `+`. */
const TEMPLATE_JOIN = /(?:^|[^\w.])(?:\w+\.)?t\('[^']*'(?:,[^)]*)?\)\s*\+|\+\s*(?:\w+\.)?t\('/;

/**
 * Sentences assembled around a message: a template literal holding a message
 * and anything else, a `+` with a message on either side, or a `join` over
 * messages. Each fixes English word order, which a translation cannot change;
 * the sentence belongs in the catalog as one message with slots.
 */
export function concatenations(source, file) {
  const sf = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const found = [];
  const report = (node) =>
    found.push(
      `${file}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}: ${node.getText(sf).replace(/\s+/g, ' ').slice(0, 120)}`,
    );
  const visit = (node) => {
    if (ts.isTemplateExpression(node)) {
      const holdsMessage = node.templateSpans.some((span) => containsMessageCall(span.expression));
      const others = node.head.text + node.templateSpans.map((span) => span.literal.text).join('');
      const parts = node.templateSpans.length;
      if (holdsMessage && (others.trim() !== '' || parts > 1)) {
        report(node);
        return;
      }
      if (
        node.parent &&
        ts.isPropertyAssignment(node.parent) &&
        node.parent.name.getText(sf) === 'template'
      ) {
        const raw = node.getText(sf);
        if (TEMPLATE_JOIN.test(raw)) report(node);
      }
    }
    if (ts.isNoSubstitutionTemplateLiteral(node) && TEMPLATE_JOIN.test(node.text)) {
      report(node);
      return;
    }
    /* An Angular text run holding a message beside other text: `{{ t('filter') }}: {{ name }}`. */
    if (
      (ts.isNoSubstitutionTemplateLiteral(node) || ts.isStringLiteral(node)) &&
      node.parent &&
      ts.isPropertyAssignment(node.parent) &&
      node.parent.name.getText(sf) === 'template' &&
      angularTextRuns(node.text).some(
        (run) =>
          /\{\{[^}]*\bt\(/.test(run) &&
          (run.replace(/\{\{[\s\S]*?\}\}/g, '').trim() !== '' ||
            (run.match(/\{\{/g) ?? []).length > 1),
      )
    ) {
      report(node);
      return;
    }
    /* JSX text beside a message in the same element: `{t('filter')}: {name}`. */
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      const children = node.children;
      const holdsMessage = children.some(
        (child) => ts.isJsxExpression(child) && child.expression && isMessageCall(child.expression),
      );
      const others = children.filter(
        (child) =>
          (ts.isJsxText(child) && child.text.trim() !== '') ||
          (ts.isJsxExpression(child) && child.expression && !isMessageCall(child.expression)),
      );
      const textBeside = children.some((child) => ts.isJsxText(child) && child.text.trim() !== '');
      if (holdsMessage && textBeside && others.length > 0) report(node);
    }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.PlusToken &&
      (isMessageCall(node.left) || isMessageCall(node.right))
    ) {
      report(node);
      return;
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'join' &&
      ts.isArrayLiteralExpression(node.expression.expression) &&
      node.expression.expression.elements.some(containsMessageCall)
    ) {
      report(node);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

const RUNTIME = /\.tsx?$/;
const NOT_RUNTIME_FILE = /\.(spec|test|stories|docs|demo)\.tsx?$|\.d\.ts$|-(demo|catalogue)\.tsx?$/;

function bindingSources() {
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      if (entry.name === 'node_modules' || entry.name === 'dist') return [];
      const path = join(dir, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    });
  return [join(ROOT, 'packages/react/src'), join(ROOT, 'packages/angular')]
    .flatMap(walk)
    .filter((path) => RUNTIME.test(path) && !NOT_RUNTIME_FILE.test(path) && !/-demo\//.test(path));
}

/** The Angular text runs that hold a message beside other text, or a message joined with `+`. */
export function templateConcatenations(template) {
  const runs = angularTextRuns(template).filter(
    (run) =>
      /\{\{[^}]*\bt\(/.test(run) &&
      (run.replace(/\{\{[\s\S]*?\}\}/g, '').trim() !== '' || (run.match(/\{\{/g) ?? []).length > 1),
  );
  return TEMPLATE_JOIN.test(template) ? [...runs, 'a message joined with +'] : runs;
}

/** Every Angular `templateUrl` file under the binding. */
function templateFiles() {
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      if (entry.name === 'node_modules' || entry.name === 'dist') return [];
      const path = join(dir, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    });
  return walk(join(ROOT, 'packages/angular')).filter((path) => path.endsWith('.html'));
}

function readContracts() {
  return Object.fromEntries(
    readdirSync(CONTRACTS)
      .filter((name) => statSync(join(CONTRACTS, name, 'contract.json'), { throwIfNoEntry: false }))
      .map((name) => [
        name,
        JSON.parse(readFileSync(join(CONTRACTS, name, 'contract.json'), 'utf8')),
      ]),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = [
    ...textViolations(buildInventory()),
    ...catalogViolations(i18n.EN_US, i18n.locales),
    ...leaves(i18n.EN_US)
      .filter(([, message]) => typeof message !== 'string' || !i18n.isWellFormed(message))
      .map(([path]) => `en-US: ${path} is not well formed`),
    ...contractViolations(i18n.EN_US, readContracts()),
    ...bindingSources().flatMap((file) =>
      concatenations(readFileSync(file, 'utf8'), relative(ROOT, file)).map(
        (found) => `sentence built around a message: ${found}`,
      ),
    ),
    ...templateFiles().flatMap((file) =>
      templateConcatenations(readFileSync(file, 'utf8')).map(
        (run) => `sentence built around a message: ${relative(ROOT, file)}: ${run.slice(0, 120)}`,
      ),
    ),
  ];
  for (const error of errors) console.error(error);
  console.log(`${errors.length} i18n violation${errors.length === 1 ? '' : 's'}`);
  process.exitCode = errors.length === 0 ? 0 : 1;
}
