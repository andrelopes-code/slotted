import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * The fragment as its regular expressions read it: the selector keys the
 * stylesheet matches are left out, and every tag stands on one line, as it did
 * before the formatter wrapped the tags the keys made long.
 */
function withoutSelectorKeys(markup) {
  return markup
    .replace(/\s+data-(?:part|ui)-[a-z0-9-]+=""/g, '')
    .replace(/<[^<>]+>/g, (tag) => tag.replace(/\s+/g, ' ').replace(/ (\/?>)$/, '$1'));
}

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/data-list/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./data-list.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./data-list.harness.html', import.meta.url), 'utf8'),
);
/**
 * One spelling for a selector or a sheet. The space before a pseudo-class is
 * kept, because `a :is(b)` and `a:is(b)` are two different selectors.
 */
function normalize(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,>])\s*/g, '$1')
    .replace(/:\s+/g, ':')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();
}

const normalized = normalize(css);

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.dataList;

/** A selector list split at its own commas, never at one inside `:is()` or `:has()`. */
function selectorList(text) {
  const selectors = [];
  let depth = 0;
  let current = '';
  for (const character of text) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      selectors.push(current);
      current = '';
      continue;
    }
    current += character;
  }
  return [...selectors, current];
}

/** Every declaration the selector receives, across every rule whose list names it. */
function rule(selector) {
  const wanted = normalize(selector);
  return normalized
    .split('}')
    .map((block) => block.split('{').slice(-2))
    .filter(([selectors]) => selectorList(selectors ?? '').includes(wanted))
    .map(([, body]) => body ?? '')
    .join('');
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${ui}[data-part-root]{`), 'no base rule for the root');
});

test('styles every part the contract declares', () => {
  for (const part of member.parts) {
    if (['root', 'selection', 'media', 'loader', 'load-more'].includes(part)) continue;
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
});

test('renders every part the contract declares, in at least one scene', () => {
  for (const part of member.parts) {
    assert.match(fragment, new RegExp(`data-part="${part}"`), `${part} appears in no scene`);
  }
  for (const family of contract.composes) {
    assert.match(fragment, new RegExp(`data-ui="${family}"`), `${family} appears in no scene`);
  }
});

/**
 * A part of this family never sits on another family's element: the `li` is
 * `list-item`'s root and keeps `data-part="root"`.
 */
test('writes no part of its own on the row', () => {
  assert.doesNotMatch(fragment, /<li[^>]*data-ui="list-item"[^>]*data-part="(?!root")/);
  assert.doesNotMatch(
    fragment,
    /<li[^>]*data-part="(?!root"|section")[^"]*"[^>]*data-ui="list-item"/,
  );
});

/**
 * The fields take the row's grid from the text column to its end, so the
 * trailing figure takes nothing from them; below `list-item`'s 22rem they
 * take it from the start edge.
 */
test('lays the fields under the title and the trailing value', () => {
  assert.match(
    rule(`${ui} [data-ui-list-item]>[data-part-content]>:is([data-part-fields],[data-part-more])`),
    /grid-column:2 \/ -1/,
  );
  assert.match(normalized, /@container slotted-list-item \(max-inline-size:22rem\)/);
  assert.match(normalized, /grid-column:1 \/ -1/);
});

/** The pop-in's geometry, and the two measures the contract records as literals. */
test('draws the pairs in the pop-in geometry', () => {
  const root = rule(`${ui}[data-part-root]`);
  assert.match(root, /--_field-min:9rem/);
  assert.match(root, /--_field-label-inline:7\.5rem/);
  for (const literal of ['--_field-min', '--_field-label-inline']) {
    assert.ok(literal in contract.literals, literal);
  }
  assert.match(
    rule(`${ui} [data-part-fields]`),
    /grid-template-columns:repeat\(auto-fill,minmax\(min\(var\(--_field-min\),100%\),1fr\)\)/,
  );
  assert.match(
    normalized,
    /@container slotted-data-list-fields \(min-inline-size:12rem\) and \(max-inline-size:19rem\)/,
  );
  assert.match(rule(`${ui} [data-part-field-value]`), /overflow-wrap:anywhere/);
  assert.doesNotMatch(rule(`${ui} [data-part-field-value]`), /text-overflow/);
});

/** §2.3: one target covers the record, and the record's controls stand above it. */
test('covers the record with the title and lifts every control above it', () => {
  assert.match(rule(`${ui} [data-ui-list-item]`), /position:relative/);
  const cover = rule(`${ui} :is(a,button)[data-part-title]::after`);
  assert.match(cover, /inset:0/);
  assert.match(cover, /position:absolute/);
  assert.match(normalized, /\[data-part-selection\],\[data-part-more\]/);
  assert.match(normalized, /z-index:1/);
});

/**
 * The row's hover and press answer the title, and hold back for the two
 * stronger states — `packages/styles/src/states.test.mjs` for this family.
 */
test('washes the row from its title and holds back for disabled and loading', () => {
  const row = `${ui} [data-ui-list-item]:not([data-disabled]):not([data-loading])`;
  const title = `[data-part-title]:is(a[href], button:not(:disabled))`;
  assert.match(rule(`${row}:has(${title}:hover)`), /--_fill:var\(--_hover/);
  assert.match(rule(`${row}:has(${title}:active)`), /--_fill:var\(--_active/);
});

test('draws every glyph with the Glyph element, never a mask or a character', () => {
  assert.doesNotMatch(css, /var\(--slotted-icon-(?!size|baseline-shift)/);
  assert.doesNotMatch(normalized, /mask/);
  assert.doesNotMatch(normalized, /content:'[^']+'/);
  assert.match(
    fragment,
    /data-direction="ascending"[\s\S]*?data-part="end"[^>]*>\s*<span data-ui="icon"[^>]*><svg data-part="glyph" data-glyph="chevron-down">/,
  );
  assert.match(
    fragment,
    /data-part="more"[^>]*>[^<]*<span data-ui="icon"[^>]*><svg data-part="glyph" data-glyph="chevron-down">/,
  );
});

test('draws the focus ring from the foundation on every control the family owns', () => {
  for (const selector of [
    `${ui} :is(a,button)[data-part-title]:focus-visible::after`,
    `${ui} [data-part-more]:focus-visible`,
  ]) {
    assert.match(rule(selector), /var\(--slotted-focus-ring-color/, selector);
  }
});

/**
 * A refresh keeps the rows and moves nothing. A veil refuses the press: an
 * inherited `pointer-events: none` restyled every row on each toggle.
 */
test('dims the set while it refreshes, without replacing it', () => {
  const busy = rule(`${ui}[aria-busy='true']>[data-ui-list]`);
  assert.match(busy, /opacity:0\.55/);
  assert.doesNotMatch(busy, /pointer-events/);
  const veil = rule(`${ui}[aria-busy='true']>[data-ui-list]::after`);
  assert.match(veil, /inset:0/);
  assert.match(veil, /position:absolute/);
  assert.match(rule(`${ui}>[data-ui-list]`), /position:relative/);
});

/** Loading keeps the item's anatomy: the field labels are real, the values are bars. */
test('reserves the item anatomy in the first-load skeleton', () => {
  const loader = fragment.slice(fragment.indexOf('data-scene="loading"'));
  const scene = loader.slice(0, loader.indexOf('</section>'));
  assert.match(scene, /data-part="field-label">Status</);
  assert.match(scene, /data-part="region"/);
  assert.match(scene, /aria-busy="true"/);
  const widths = [...scene.matchAll(/--slotted-skeleton-inline-size: ([\d.]+rem)/g)].map(
    ([, width]) => width,
  );
  assert.ok(new Set(widths).size > 3, 'the bars vary in length');
});
