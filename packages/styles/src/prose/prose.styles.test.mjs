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
    new URL('../../../../specs/components/prose/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./prose.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./prose.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const guard = ":not(:where([data-part='exclude'], [data-part='exclude'] *))";

/** Every selector in the sheet, one entry per selector, comments removed. */
function selectors() {
  return [...declarations.matchAll(/(^|\}|\{)([^{}]+)\{/g)]
    .map(([, , selector]) => selector.trim())
    .filter((selector) => selector.length > 0 && !selector.startsWith('@'))
    .flatMap(splitSelectorList)
    .map((selector) => selector.replace(/\s+/g, ' ').trim())
    .filter((selector) => selector.length > 0);
}

/** A selector list is separated by its own top-level commas, not by every one. */
function splitSelectorList(list) {
  const parts = [];
  let depth = 0;
  let current = '';

  for (const character of list) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += character;
  }
  parts.push(current);

  return parts;
}

/** The last compound of a selector: the element the rule is actually about. */
function subject(selector) {
  const parts = [];
  let depth = 0;
  let current = '';

  for (const character of selector) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (depth === 0 && (character === ' ' || character === '>' || character === '+')) {
      if (current.length > 0) parts.push(current);
      current = '';
      continue;
    }
    current += character;
  }
  if (current.length > 0) parts.push(current);

  return parts.at(-1) ?? '';
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(declarations.includes(`${ui} {`), 'the family has no base rule keyed on data-ui');
});

test('styles every part the contract declares', () => {
  for (const part of contract.members.prose.parts) {
    if (part === 'root') continue;
    /* `lead`, `exclude` and `footnotes` are written by the consumer's content,
       so the sheet keys them on the value rather than on the selector key. */
    const selector = ['lead', 'exclude', 'footnotes'].includes(part)
      ? `[data-part='${part}']`
      : `[data-part-${part.toLowerCase()}]`;
    assert.ok(declarations.includes(selector), `no rule reaches the ${part} part`);
  }
});

/**
 * The family styles bare tags, and two other things style the same tags: a
 * Slotted family placed inside the region, selected at 0-1-0, and the
 * consumer's own rule. Both have to win, so no content rule may weigh more
 * than the root identifier — which means no bare tag outside a `:where()` or a
 * `:not()`, anywhere in the sheet.
 */
test('never raises a content rule above the weight of the identifier', () => {
  const bare = selectors().filter((selector) => {
    const stripped = selector
      .replaceAll(/:(?:where|not|is|has|lang|dir)\([^()]*(?:\([^()]*\)[^()]*)*\)/g, '')
      .replaceAll(/\[[^\]]*\]/g, '')
      .replaceAll(/::?[a-z-]+/g, '');
    return /[a-z]/.test(stripped);
  });

  assert.deepEqual(bare, [], 'a bare tag outside :where() outweighs a family placed inside');
});

/**
 * The opt-out. Every rule whose subject is a tag carries the donut, so
 * `data-part='exclude'` and everything under it is left to whatever put it
 * there.
 */
test('lets every rule about a tag be opted out of', () => {
  const unguarded = selectors()
    .map(subject)
    .filter((compound) => compound.startsWith(':where(') && /[a-z]/.test(compound.slice(7)))
    .filter((compound) => !compound.includes(guard.replace(/\s+/g, ' ')));

  assert.deepEqual(unguarded, [], 'a rule about a tag cannot be opted out of');
});

/**
 * A page rendering a language model's answer appends blocks continuously. Each
 * of these three selectors changes its own match when one arrives, which
 * restyles text already under the reader's eye. `:first-child` and `+` look
 * backwards, and appending never changes what they matched.
 */
test('uses no selector whose match changes when a block is appended', () => {
  for (const forbidden of contract.streaming.forbiddenSelectors) {
    assert.ok(
      !declarations.includes(forbidden),
      `${forbidden} restyles content already on screen when the next block arrives`,
    );
  }
});

/**
 * Spacing runs one way: the arriving block brings its own space, and nothing
 * before it moves. A margin on the trailing edge would be a second opinion
 * about the same gap.
 */
test('spaces blocks from their leading edge only', () => {
  const trailing = [...declarations.matchAll(/margin-block-end:\s*([^;]+);/g)]
    .map(([, value]) => value.trim())
    .filter((value) => value !== '0');

  assert.deepEqual(trailing, [], 'a trailing margin is a second opinion about one gap');
  assert.ok(declarations.includes(`${contract.streaming.spacingProperty}:`));
});

/**
 * The anchor is hidden from the eye and from nothing else. `display: none` and
 * `visibility: hidden` both take it out of the tab sequence and out of the
 * accessible tree, and a permalink a keyboard cannot reach is a permalink for
 * pointers only.
 */
test('hides the heading anchor without removing it', () => {
  const rule = declarations.split(`${ui} [data-part-anchor] {`)[1]?.split('}')[0] ?? '';

  assert.match(rule, /opacity:\s*0/, 'the anchor is not hidden by opacity');
  assert.ok(!/display:\s*none/.test(rule), 'display: none takes the anchor out of the sequence');
  assert.ok(!/visibility:\s*hidden/.test(rule), 'visibility: hidden does the same');
  assert.ok(
    declarations.includes(`${ui} [data-part-anchor]:focus-visible`),
    'the anchor appears on hover and never on focus',
  );
});

/**
 * The ring is painted on markup that is actually operable. `tabindex` is
 * written by the binding only while the block overflows, so the selector
 * cannot match a block that fits — which is Adrian Roselli's own trick for
 * making the CSS refuse to reward markup that fails SC 4.1.2.
 */
test('rings the scrolling block only where it is focusable', () => {
  assert.ok(declarations.includes(`${contract.scroll.focusSelector}:focus-visible`));
  assert.ok(
    !declarations.includes(`[data-part-scroll]:focus-visible`),
    'the ring must not be painted on a block that takes no focus',
  );
});

/**
 * `container-type` makes an element a query container for its descendants and
 * not for itself, so every rule inside the query targets a descendant — which
 * is why one element is enough here and `description-list` needed two.
 */
test('answers its own inline size, at the breakpoints the contract states', () => {
  assert.match(css, /container-type:\s*inline-size/);
  assert.match(css, new RegExp(`container-name:\\s*${contract.container.name}`));

  for (const { maxWidth } of contract.container.breakpoints) {
    assert.ok(
      css.includes(`@container ${contract.container.name} (max-width: ${maxWidth})`),
      `no query at ${maxWidth}`,
    );
  }
});

/**
 * A Markdown link and a `<Link>` on one page are one theme decision. Reading
 * another family's token is not reaching into that family; naming its
 * identifier would be, and that is the rule `accordion` and `collapsible` set.
 */
test('borrows the token of each family whose bare element it paints', () => {
  for (const token of Object.values(contract.borrows)) {
    assert.ok(declarations.includes(token), `the stylesheet does not read ${token}`);
  }
  for (const family of ['link', 'divider', 'kbd', 'checkbox', 'card']) {
    assert.ok(
      !declarations.includes(`[data-ui-${family.toLowerCase()}]`),
      `a rule here reaches into ${family}`,
    );
  }
});

test('exercises every part in the harness fragment', () => {
  for (const part of contract.members.prose.parts) {
    assert.ok(fragment.includes(`data-part="${part}"`), `no scene renders the ${part} part`);
  }
  for (const value of [...contract.axes.size, ...contract.axes.flow]) {
    assert.ok(fragment.includes(`"${value}"`), `no scene renders ${value}`);
  }
});
