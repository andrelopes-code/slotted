import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * R1: no rail for state. A band of a few pixels on the start or top edge of an
 * item — a pseudo-element pinned to `inset-inline-start: 0`, a thick
 * `border-inline-start`, an inset shadow on one edge — may not say `current`,
 * `selected`, `active` or `checked`. The state is said by the item's ground,
 * by its indicator, or by its ink.
 *
 * Two families drew one: `list-item`'s current row carried a two-pixel bar
 * in `::after`, and `listbox`'s selected option a thick start border. Both
 * now paint the ground, and this test is what keeps the next family from
 * reaching for the bar again.
 *
 * A `forced-colors` block is exempt, as in `focus-ring.test.mjs`: there the
 * user agent owns every color and a border is what survives.
 */
const STATE = /\[(?:data|aria)-(?:current|selected|active|checked|pressed)\b/;
const PSEUDO = /::(?:before|after)\b/;

function stylesheets() {
  return readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      readdirSync(join(source, entry.name))
        .filter((name) => name.endsWith('.css'))
        .map((name) => ({
          path: join(entry.name, name),
          css: readFileSync(join(source, entry.name, name), 'utf8'),
        })),
    );
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function withoutForcedColors(css) {
  let out = '';
  let index = 0;
  const marker = /@media\s*\(forced-colors:\s*active\)\s*\{/g;
  for (let match = marker.exec(css); match; match = marker.exec(css)) {
    out += css.slice(index, match.index);
    let depth = 1;
    let end = match.index + match[0].length;
    for (; end < css.length && depth > 0; end += 1) {
      if (css[end] === '{') depth += 1;
      else if (css[end] === '}') depth -= 1;
    }
    index = end;
    marker.lastIndex = end;
  }
  return out + css.slice(index);
}

/**
 * Every innermost `selector { declarations }` pair, whatever it is nested in.
 * An at-rule's own block is skipped as a selector but its rules are walked.
 */
function rules(css) {
  const found = [];
  const stack = [];
  let start = 0;
  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];
    if (char === '{') {
      stack.push({ selector: css.slice(start, index).trim(), body: index + 1 });
      start = index + 1;
    } else if (char === '}') {
      const open = stack.pop();
      if (open && !open.selector.startsWith('@')) {
        const body = css.slice(open.body, index);
        const declarations = body.slice(
          0,
          body.indexOf('{') === -1 ? undefined : body.indexOf('{'),
        );
        found.push({ selector: open.selector.replace(/\s+/g, ' '), declarations });
      }
      start = index + 1;
    } else if (char === ';') {
      start = index + 1;
    }
  }
  return found;
}

function has(declarations, property) {
  const match = new RegExp(`(?:^|[;\\s])${property}\\s*:\\s*([^;]+)`).exec(declarations);
  return match ? match[1].trim() : undefined;
}

function isBand(value) {
  return value !== undefined && !/^(?:0|none|auto|transparent|inherit)$/.test(value);
}

function rails({ selector, declarations }) {
  if (!STATE.test(selector)) return [];
  const offences = [];
  if (PSEUDO.test(selector)) {
    if (
      has(declarations, 'inset-inline-start') === '0' &&
      isBand(has(declarations, 'inline-size'))
    ) {
      offences.push('a pseudo-element band on the start edge');
    }
    if (has(declarations, 'inset-block-start') === '0' && isBand(has(declarations, 'block-size'))) {
      offences.push('a pseudo-element band on the top edge');
    }
  }
  for (const property of [
    'border-inline-start',
    'border-inline-start-width',
    'border-block-start',
    'border-block-start-width',
  ]) {
    if (isBand(has(declarations, property))) offences.push(`${property} as a state edge`);
  }
  return offences;
}

test('no family says a state with a rail on its start or top edge (R1)', () => {
  const offenders = [];
  for (const { path, css } of stylesheets()) {
    for (const rule of rules(withoutForcedColors(stripComments(css)))) {
      for (const offence of rails(rule)) offenders.push(`${path}: ${rule.selector} — ${offence}`);
    }
  }
  assert.deepEqual(offenders, [], `A rail for state (R1):\n  ${offenders.join('\n  ')}`);
});

test('reads the state rules it guards', () => {
  const guarded = stylesheets().flatMap(({ css }) =>
    rules(withoutForcedColors(stripComments(css))).filter(({ selector }) => STATE.test(selector)),
  );
  assert.ok(guarded.length >= 40, `Expected the families' state rules, found ${guarded.length}`);
});
