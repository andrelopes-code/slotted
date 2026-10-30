import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { format, resolveConfig } from 'prettier';
import ts from 'typescript';

/*
 * The internationalization inventory: every text
 * the library writes on its own, per family and per binding, with the key it is
 * read under today, its text, its slots, its shape and where it is declared.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'docs/process/i18n-inventory.json');

const SOURCES = [
  { binding: 'react', dir: 'packages/react/src', family: (parts) => parts[0] },
  { binding: 'angular', dir: 'packages/angular', family: (parts) => parts[0] },
  { binding: 'core', dir: 'packages/core/src', family: (parts) => parts[0] },
];

export const NOT_RUNTIME =
  /\.(spec|test|stories|docs|demo)\.tsx?$|\.d\.ts$|-(demo|catalogue)\.tsx?$|(^|\/)[a-z-]+-demo\//;

/** A property name that holds words: `clearLabel`, `emptyText`, `title`, `placeholder`. */
export const TEXT_NAME =
  /^(label|title|placeholder|hint|description|[a-z][A-Za-z]*(Label|Text|Title|Placeholder|Hint|Message|Description))$/;

/** Attributes whose value a reader hears or sees. */
export const TEXT_ATTRIBUTES = new Set([
  'aria-label',
  'aria-description',
  'aria-roledescription',
  'aria-valuetext',
  'title',
  'placeholder',
  'alt',
]);

/**
 * A modifier's UI Events `key` value, as `aria-keyshortcuts` names it. In a
 * map keyed `alt` it is a token, not the image attribute's text.
 */
const UI_EVENTS_KEYS = new Set(['Alt', 'Control', 'Meta', 'Shift']);

/** Families whose words live in `core` and reach several families. */
const CORE_SHARED = new Set(['drag', 'keys', 'grid']);

// language: pt-BR
const PORTUGUESE =
  /[ãõçáéíóúâêôà]|\b(de|do|da|dos|das|em|para|com|sem|não|nenhum|nenhuma|mais|menos|ver|abrir|fechar|limpar|página|anterior|seguinte|slide|carrossel|novas?|avaliaç|estrelas?|detalhes|carregar|registo|nesta|navegação)\b/i;
// language: en-US

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.tsx?$/.test(name)) out.push(path);
  }
  return out;
}

/** `{name}` and `{name, plural, …}` / `{name, select, …}` names, in order of first use. */
export function slotsOf(text) {
  const names = [];
  for (const match of text.matchAll(/\{(\w+)(?:\s*,\s*(?:plural|select)\b)?/g)) {
    if (!names.includes(match[1])) names.push(match[1]);
  }
  return names;
}

export function languageOf(text) {
  return PORTUGUESE.test(text) ? 'pt' : 'en';
}

/** Is this literal a phrase a reader would read, rather than a token, a selector or a class? */
export function isPhrase(text) {
  const value = text.trim();
  if (value.length < 2) return false;
  if (!/\p{L}{2,}/u.test(value)) return false;
  if (/^[a-z][a-zA-Z0-9]*$/.test(value)) return false; // identifier
  if (/^[a-z0-9-]+$/.test(value)) return false; // token or kebab name
  if (/^[\w.-]+\/[\w./-]+$/.test(value)) return false; // path
  if (/^[.#[:]|[{};]\s*$|=>|^\s*</.test(value)) return false; // selector, code, markup
  if (/^(--|var\(|calc\(|rgb|oklch|#[0-9a-f]{3,8}$)/i.test(value)) return false; // css
  return /^[A-Z\u00C0-\u00DD]|\s/.test(value);
}

function textOf(node, sf) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return {
      text: node.text,
      shape: node.text.includes(', plural,') || node.text.includes(', select,') ? 'icu' : 'string',
    };
  }
  if (ts.isTemplateExpression(node))
    return { text: node.getText(sf).slice(1, -1), shape: 'template' };
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    const parameters = node.parameters.map((p) => p.name.getText(sf));
    return { text: node.getText(sf).replace(/\s+/g, ' '), shape: 'function', parameters };
  }
  if (ts.isMethodDeclaration(node)) {
    const parameters = node.parameters.map((p) => p.name.getText(sf));
    return { text: node.getText(sf).replace(/\s+/g, ' '), shape: 'function', parameters };
  }
  return undefined;
}

/**
 * A literal that reads as words and sits where a reader could meet it: not an
 * import, an error, a log, a comparison, a `case`, a property name or a CSS value.
 */
function isSuspect(node, sf) {
  const text = node.text.trim();
  if (!/\s/.test(text) && !/^[A-Z\u00C0-\u00DD][a-z\u00DF-\u00FF]+$/.test(text)) return false;
  if (!isPhrase(text)) return false;
  if (/^[A-Z][a-z]+[A-Z]/.test(text)) return false; // PascalCase identifier
  if (/[{}();=]|\$\{|\bvar\(|px\b|rem\b|%\)/.test(text.replace(/\{\w+(,[^}]*)?\}/g, '')))
    return false;
  for (let parent = node.parent, depth = 0; parent && depth < 4; parent = parent.parent, depth++) {
    if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) return false;
    if (ts.isThrowStatement(parent) || ts.isNewExpression(parent)) return false;
    if (
      ts.isCallExpression(parent) &&
      /^(console\.|Error|assert|matchMedia|querySelector|closest|setAttribute\('(data|role|class))/.test(
        parent.expression.getText(sf),
      )
    )
      return false;
    if (ts.isCaseClause(parent)) return false;
    if (ts.isBinaryExpression(parent) && /^(===|!==|==|!=)$/.test(parent.operatorToken.getText(sf)))
      return false;
    if (ts.isTypeNode(parent)) return false;
    if (ts.isDecorator(parent)) return false;
  }
  if (node.parent && ts.isPropertyAssignment(node.parent) && node.parent.name === node)
    return false;
  return true;
}

function nameOf(property, sf) {
  const name = property.name;
  if (!name) return undefined;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return name.getText(sf);
}

/** Every leaf of an object literal as `[path, node]`. */
function leaves(object, sf, prefix = '') {
  const out = [];
  for (const property of object.properties) {
    const name = nameOf(property, sf);
    if (name === undefined) continue;
    const path = prefix === '' ? name : `${prefix}.${name}`;
    if (ts.isPropertyAssignment(property)) {
      const value = unwrap(property.initializer);
      if (ts.isObjectLiteralExpression(value)) out.push(...leaves(value, sf, path));
      else out.push([path, value]);
    } else if (ts.isMethodDeclaration(property)) out.push([path, property]);
  }
  return out;
}

function unwrap(node) {
  let value = node;
  while (
    ts.isAsExpression(value) ||
    ts.isSatisfiesExpression(value) ||
    ts.isParenthesizedExpression(value) ||
    (ts.isCallExpression(value) && /^Object\.freeze$/.test(value.expression.getText()))
  ) {
    value = ts.isCallExpression(value) ? value.arguments[0] : value.expression;
  }
  return value;
}

function isCatalogName(name) {
  return /_(LABELS|MESSAGES|WORDS)$/.test(name);
}

/** A tag with its attributes, a `>` inside a quoted value kept inside the tag. */
const TAG = /<[a-zA-Z/!][^>"']*(?:"[^"]*"[^>"']*|'[^']*'[^>"']*)*>/g;
const INTERPOLATION = /\{\{[\s\S]*?\}\}/g;
const CONTROL_FLOW =
  /@(?:else\s+if|if|for|switch|case|defer|placeholder|loading|error|empty)\b[^{]*\{|@(?:else|default)\s*\{|@let\s[^;]*;/g;

/**
 * The text runs of an Angular template, each with its interpolations kept:
 * what sits between two tags, between a tag and a control-flow brace, or
 * between two braces. `{{ t('a') }}` alone is not text; `Showing {{ n }} rows` is.
 */
export function angularTextRuns(template) {
  const kept = [];
  const protectedText = template
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(TAG, '<>')
    .replace(INTERPOLATION, (match) => `\uE000${kept.push(match) - 1}\uE000`)
    .replace(CONTROL_FLOW, '<>')
    .replace(/[{}]/g, '<>');
  return [...protectedText.matchAll(/>([^<>]+)</g)]
    .map((match) =>
      match[1].replace(/\uE000(\d+)\uE000/g, (_, index) => kept[Number(index)]).trim(),
    )
    .filter((run) => run !== '');
}

/** Words written straight into an Angular template: text runs, text attributes, bound literals. */
export function angularTemplateTexts(template) {
  const found = [];
  const source = template.replace(/<!--[\s\S]*?-->/g, '');
  for (const match of source.matchAll(
    /\s(aria-label|aria-description|aria-roledescription|aria-valuetext|title|placeholder|alt)="([^"]*)"/g,
  )) {
    if (isPhrase(match[2].replace(INTERPOLATION, ' ')))
      found.push({ key: `@${match[1]}`, text: match[2] });
  }
  for (const match of source.matchAll(
    /\[(?:attr\.)?(aria-label|aria-description|aria-roledescription|aria-valuetext|title|placeholder|alt)\]="([^"]*)"/g,
  )) {
    for (const literal of match[2].matchAll(/'([^']*)'/g)) {
      if (isPhrase(literal[1])) found.push({ key: `@${match[1]}`, text: literal[1] });
    }
  }
  for (const run of angularTextRuns(source)) {
    if (isPhrase(run.replace(INTERPOLATION, ' ').replace(/\s+/g, ' ')))
      found.push({ key: '@text', text: run });
  }
  return found;
}

/** `TEXT_FIELD_CLEAR_LABEL` → `clearLabel`, the family prefix dropped. */
function scalarKey(name, family) {
  const prefix = `${family.replace(/-/g, '_').toUpperCase()}_`;
  const bare = name.startsWith(prefix) ? name.slice(prefix.length) : name;
  return bare.toLowerCase().replace(/_(\w)/g, (_, letter) => letter.toUpperCase());
}

/** Single words a text-named property takes as a mode, not as words. */
const MODE_WORDS = new Set([
  'auto',
  'none',
  'always',
  'never',
  'hover',
  'focus',
  'start',
  'end',
  'top',
  'bottom',
  'inline',
  'block',
  'hidden',
  'visible',
  'mark',
  'tooltip',
  'true',
  'false',
  'both',
  'outside',
  'inside',
  'center',
  'surface',
]);

function isWords(text, named) {
  if (isPhrase(text)) return true;
  return named && /^[a-z]{2,}$/.test(text) && !MODE_WORDS.has(text);
}

function isDefaultsName(name, typeText) {
  return /(_FALLBACK|_DEFAULTS)$|^DEFAULT_[A-Z_]+$/.test(name) || /Defaults\b/.test(typeText ?? '');
}

function extract(file, binding, family) {
  return extractSource(readFileSync(file, 'utf8'), file, binding, family);
}

/** Every text a source file writes on its own, plus its content props and suspect literals. */
export function extractSource(source, file, binding, family) {
  const sf = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const at = (node) =>
    `${relative(ROOT, file)}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`;
  const entries = [];
  const content = [];
  const suspects = [];
  const push = (entry) => entries.push({ binding, family, ...entry });

  const fromObject = (object, origin) => {
    for (const [path, value] of leaves(object, sf)) {
      const segments = path.split('.');
      const inGroup =
        segments.length > 1 && (segments[0] === 'labels' || segments[0] === 'messages');
      const leaf = segments[segments.length - 1];
      const text = textOf(value, sf);
      if (!text) continue;
      if (origin === 'catalog' || inGroup || TEXT_NAME.test(leaf)) {
        if (
          text.shape === 'string' &&
          !isWords(text.text, TEXT_NAME.test(leaf)) &&
          !inGroup &&
          origin !== 'catalog'
        )
          continue;
        push({
          key: path,
          ...text,
          source: origin,
          group: inGroup ? segments[0] : null,
          at: at(value),
        });
      }
    }
  };

  /** Module constants holding a template, so `template: TAG_BODY_TEMPLATE` is read as its text. */
  const localStrings = new Map();
  for (const statement of sf.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const value = declaration.initializer && unwrap(declaration.initializer);
      if (
        ts.isIdentifier(declaration.name) &&
        value &&
        (ts.isNoSubstitutionTemplateLiteral(value) || ts.isStringLiteral(value))
      ) {
        localStrings.set(declaration.name.text, value);
      }
    }
  }
  const visit = (node) => {
    // Named catalogs and defaults objects.
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isIdentifier(node.name)) {
      const value = unwrap(node.initializer);
      const name = node.name.text;
      if (ts.isObjectLiteralExpression(value)) {
        if (isCatalogName(name)) fromObject(value, 'catalog');
        else if (isDefaultsName(name, node.type?.getText(sf))) fromObject(value, 'defaults');
      } else if (/^[A-Z][A-Z0-9_]*_(LABEL|TEXT|TITLE|MESSAGE|PLACEHOLDER|HINT|WORD)$/.test(name)) {
        const text = textOf(value, sf);
        if (text)
          push({
            key: scalarKey(name, family),
            ...text,
            source: 'constant',
            group: null,
            at: at(value),
          });
      }
    }
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      isSuspect(node, sf)
    ) {
      suspects.push({ binding, family, text: node.text, at: at(node) });
    }
    // Angular `input('Clear')` and React destructuring `clearLabel = 'Clear'` on a text name.
    if (
      ts.isPropertyDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer)
    ) {
      const name = nameOf(node, sf);
      const call = node.initializer;
      if (
        /^input\b/.test(call.expression.getText(sf)) &&
        name &&
        TEXT_NAME.test(name) &&
        name !== 'ariaLabel'
      ) {
        const first = call.arguments[0];
        const text = first && textOf(first, sf);
        if (text && text.shape !== 'function' && isPhrase(text.text)) {
          push({ key: name, ...text, source: 'input-default', group: null, at: at(first) });
        } else content.push({ binding, family, prop: name, at: at(node) });
      }
    }
    if (
      ts.isBindingElement(node) &&
      node.initializer &&
      ts.isIdentifier(node.name) &&
      TEXT_NAME.test(node.name.text)
    ) {
      const text = textOf(node.initializer, sf);
      if (text && text.shape !== 'function' && isPhrase(text.text)) {
        push({
          key: node.name.text,
          ...text,
          source: 'prop-default',
          group: null,
          at: at(node.initializer),
        });
      }
    }
    if (ts.isPropertySignature(node) && /\.types\.ts$/.test(file)) {
      const name = nameOf(node, sf);
      if (name && TEXT_NAME.test(name) && name !== 'ariaLabel')
        content.push({ binding, family, prop: name, at: at(node) });
    }
    // Literal words in JSX.
    if (ts.isJsxAttribute(node) && TEXT_ATTRIBUTES.has(node.name.getText(sf)) && node.initializer) {
      const init = ts.isJsxExpression(node.initializer)
        ? node.initializer.expression
        : node.initializer;
      if (
        init &&
        (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) &&
        isPhrase(init.text)
      ) {
        push({
          key: `@${node.name.getText(sf)}`,
          text: init.text,
          shape: 'string',
          source: 'literal',
          group: null,
          at: at(init),
        });
      }
    }
    if (ts.isJsxText(node) && isPhrase(node.text)) {
      push({
        key: '@text',
        text: node.text.trim(),
        shape: 'string',
        source: 'literal',
        group: null,
        at: at(node),
      });
    }
    // `'aria-label': 'Close'` in a props object, and `?? 'Close'` fallbacks.
    if (ts.isPropertyAssignment(node) && TEXT_ATTRIBUTES.has(nameOf(node, sf) ?? '')) {
      const value = unwrap(node.initializer);
      if (
        (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) &&
        isPhrase(value.text) &&
        !(nameOf(node, sf) === 'alt' && UI_EVENTS_KEYS.has(value.text))
      ) {
        push({
          key: `@${nameOf(node, sf)}`,
          text: value.text,
          shape: 'string',
          source: 'literal',
          group: null,
          at: at(value),
        });
      }
    }
    if (
      (ts.isConditionalExpression(node) || ts.isBinaryExpression(node)) &&
      /aria-label|Label|label|title/.test(node.getText(sf).slice(0, 200))
    ) {
      const candidates = ts.isConditionalExpression(node)
        ? [node.whenTrue, node.whenFalse]
        : [node.right];
      const operator = ts.isBinaryExpression(node) ? node.operatorToken.kind : undefined;
      if (
        ts.isConditionalExpression(node) ||
        operator === ts.SyntaxKind.QuestionQuestionToken ||
        operator === ts.SyntaxKind.BarBarToken
      ) {
        for (const candidate of candidates) {
          if (
            (ts.isStringLiteral(candidate) || ts.isNoSubstitutionTemplateLiteral(candidate)) &&
            isPhrase(candidate.text)
          ) {
            push({
              key: '@fallback',
              text: candidate.text,
              shape: 'string',
              source: 'literal',
              group: null,
              at: at(candidate),
            });
          }
        }
      }
    }
    // Literal words in Angular templates, inline or in a `templateUrl` file.
    if (ts.isPropertyAssignment(node) && nameOf(node, sf) === 'template') {
      const template = ts.isIdentifier(node.initializer)
        ? (localStrings.get(node.initializer.text) ?? node.initializer)
        : node.initializer;
      if (ts.isIdentifier(template)) {
        ts.forEachChild(node, visit);
        return;
      }
      /* A `${…}` inside the template is markup kept elsewhere, not words. */
      const raw =
        ts.isNoSubstitutionTemplateLiteral(template) || ts.isStringLiteral(template)
          ? template.text
          : template
              .getText(sf)
              .slice(1, -1)
              .replace(/\$\{[^}]*\}/g, '<>');
      for (const found of angularTemplateTexts(raw)) {
        push({ ...found, shape: 'string', source: 'literal', group: null, at: at(template) });
      }
    }
    if (
      ts.isPropertyAssignment(node) &&
      nameOf(node, sf) === 'templateUrl' &&
      ts.isStringLiteral(node.initializer)
    ) {
      const html = join(dirname(file), node.initializer.text);
      if (existsSync(html)) {
        for (const found of angularTemplateTexts(readFileSync(html, 'utf8'))) {
          push({
            ...found,
            shape: 'string',
            source: 'literal',
            group: null,
            at: relative(ROOT, html),
          });
        }
      }
    }
    // A template literal a reader meets in JSX: `aria-label={`Remove ${name}`}`, `{`${n} rows`}`.
    if (
      ts.isJsxExpression(node) &&
      node.expression &&
      ts.isTemplateExpression(node.expression) &&
      (ts.isJsxElement(node.parent) ||
        ts.isJsxFragment(node.parent) ||
        (ts.isJsxAttribute(node.parent) && TEXT_ATTRIBUTES.has(node.parent.name.getText(sf))))
    ) {
      const literal = node.expression;
      const words =
        literal.head.text + literal.templateSpans.map((span) => span.literal.text).join(' ');
      if (isPhrase(words)) {
        push({
          key: '@template',
          text: literal.getText(sf).slice(1, -1),
          shape: 'template',
          source: 'literal',
          group: null,
          at: at(literal),
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { entries, content, suspects };
}

/** The key a catalog entry is read under: the group drops away, a loose prop loses its suffix. */
export function proposedKey(entry) {
  if (entry.group) return entry.key.slice(entry.group.length + 1);
  if (entry.source === 'catalog') return entry.key;
  if (entry.key.startsWith('@')) return null;
  const bare = entry.key.replace(/(Label|Text)$/, '');
  return bare === '' ? entry.key : bare;
}

function camel(name) {
  return name.replace(/-(\w)/g, (_, letter) => letter.toUpperCase());
}

export function buildInventory() {
  const all = [];
  const contentProps = [];
  const suspectList = [];
  for (const source of SOURCES) {
    const base = join(ROOT, source.dir);
    for (const file of walk(base)) {
      const rel = relative(base, file);
      if (NOT_RUNTIME.test(rel)) continue;
      const parts = rel.split('/');
      if (parts.length < 2) continue;
      const family = source.family(parts);
      if (family === 'i18n' || family === 'test') continue;
      const { entries, content, suspects } = extract(file, source.binding, family);
      all.push(...entries);
      contentProps.push(...content);
      suspectList.push(...suspects);
    }
  }

  const families = {};
  for (const entry of all) {
    const family = (families[entry.family] ??= {
      catalogName: camel(entry.family),
      react: {},
      angular: {},
      core: {},
    });
    const key = proposedKey(entry) ?? `${entry.key}#${entry.text}`;
    const slots = entry.shape === 'function' ? entry.parameters : slotsOf(entry.text);
    const row = {
      key,
      sourceKey: entry.key,
      text: entry.text,
      shape: entry.shape,
      slots,
      language: languageOf(entry.text),
      source: entry.source,
      classification: entry.source === 'literal' ? 'literal' : 'chrome',
      countWithoutPlural:
        slots.some((s) => /^(count|total|n|selected|shown|remaining)$/.test(s)) &&
        entry.shape !== 'icu' &&
        entry.shape !== 'function',
      at: entry.at,
    };
    family[entry.binding][key] ??= row;
  }

  // Props a family takes without a default of its own are content (D2).
  for (const prop of contentProps) {
    const family = families[prop.family];
    const chromeKeys = family
      ? Object.values(family[prop.binding] ?? {}).map((row) => row.sourceKey)
      : [];
    if (family && !chromeKeys.includes(prop.prop)) {
      const list = (family.content ??= {});
      const props = (list[prop.binding] ??= []);
      if (!props.includes(prop.prop)) props.push(prop.prop);
    }
  }

  for (const [name, family] of Object.entries(families)) {
    const react = new Set(Object.keys(family.react));
    const angular = new Set(Object.keys(family.angular));
    const divergence = {
      reactOnly: [...react].filter((k) => !angular.has(k) && !k.includes('#')),
      angularOnly: [...angular].filter((k) => !react.has(k) && !k.includes('#')),
      differentText: [...react].filter(
        (k) => angular.has(k) && family.react[k].text !== family.angular[k].text,
      ),
    };
    if (
      divergence.reactOnly.length ||
      divergence.angularOnly.length ||
      divergence.differentText.length
    )
      family.divergence = divergence;
    const languages = new Set(
      ['react', 'angular', 'core'].flatMap((b) =>
        Object.values(family[b])
          .filter((r) => r.classification === 'chrome')
          .map((r) => r.language),
      ),
    );
    family.languages = [...languages].sort();
    family.shared = CORE_SHARED.has(name);
  }

  const sorted = Object.fromEntries(
    Object.entries(families).sort(([a], [b]) => a.localeCompare(b)),
  );
  const count = (b) => Object.values(sorted).reduce((n, f) => n + Object.keys(f[b]).length, 0);
  return {
    generatedBy: 'scripts/extract-i18n.mjs',
    totals: {
      families: Object.keys(sorted).length,
      react: count('react'),
      angular: count('angular'),
      core: count('core'),
      portugueseFamilies: Object.entries(sorted)
        .filter(([, f]) => f.languages.includes('pt'))
        .map(([n]) => n),
      literalFamilies: Object.entries(sorted)
        .filter(([, f]) =>
          ['react', 'angular'].some((b) =>
            Object.values(f[b]).some((r) => r.classification === 'literal'),
          ),
        )
        .map(([n]) => n),
      divergentFamilies: Object.entries(sorted)
        .filter(([, f]) => f.divergence)
        .map(([n]) => n),
    },
    families: sorted,
    suspects: suspectList.filter(
      (s) =>
        !all.some((e) => e.family === s.family && e.binding === s.binding && e.text === s.text),
    ),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const inventory = buildInventory();
  const options = (await resolveConfig(OUTPUT)) ?? {};
  writeFileSync(OUTPUT, await format(JSON.stringify(inventory), { ...options, filepath: OUTPUT }));
  const { totals } = inventory;
  console.log(
    `${totals.families} families; keys react ${totals.react}, angular ${totals.angular}, core ${totals.core}`,
  );
  console.log(`portuguese: ${totals.portugueseFamilies.join(', ')}`);
  console.log(`literals: ${totals.literalFamilies.join(', ')}`);
  console.log(`divergent: ${totals.divergentFamilies.length}`);
  console.log(`suspects: ${inventory.suspects.length}`);
}
