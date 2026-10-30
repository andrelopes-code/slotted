import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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
    new URL('../../../../specs/components/highlight/contract.json', import.meta.url),
    'utf8',
  ),
);
/** The package's source root, one level up: every family is a sibling. */
const source = new URL('..', import.meta.url).pathname;
const css = readFileSync(new URL('./highlight.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./highlight.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');
const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const match = `${ui} [data-part-match]`;
const disabled = `${ui}:is([data-disabled],[data-disabled] *) [data-part-match]`;

function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

/**
 * The family has a root now, and the root is the element that holds the text:
 * the mark inside it is the one part painted, selected through the root so a
 * `mark` a page wrote on its own is left alone. The root itself has no rule —
 * it is inline and inherits everything — which the fragment proves by
 * rendering it inside a host's `label` with nothing between the two.
 */
test('paints the match through the root, and the root not at all', () => {
  assert.equal(contract.ui, 'highlight');
  assert.deepEqual(contract.members.highlight.parts, ['root', 'match']);
  assert.notEqual(rule(match), '');
  assert.equal(rule(ui), '');
  assert.equal(rule(`${ui}[data-part-root]`), '');
  assert.match(fragment, /data-ui="highlight" data-part="root"/);
  assert.match(fragment, /<mark data-part="match">/);
  assert.doesNotMatch(fragment, /<mark[^>]*data-ui=/);
});

/**
 * The criterion CB6 states: the width of a label with the mark and without it
 * differ by zero. Everything that could move the metric of a word is either
 * inherited from the line the word is on or set to nothing, so the only thing
 * the mark changes is colour.
 */
test('changes no metric of the word it marks', () => {
  const mark = rule(match);
  assert.match(mark, /font-weight:inherit/);
  assert.match(mark, /letter-spacing:inherit/);
  assert.match(mark, /padding:0/);
  assert.match(mark, /border-radius:var\(--slotted-radius-none,0px\)/);
  assert.doesNotMatch(mark, /padding-(inline|block)/);
  assert.doesNotMatch(mark, /font-size/);
  assert.doesNotMatch(mark, /(?<![\w-])margin/);
  assert.match(fragment, /data-scene="metric"/);
});

test('carries the mark on colour, with a rule of the accent under it', () => {
  const mark = rule(match);
  assert.match(
    mark,
    /background-color:var\(--slotted-highlight-background,color-mix\(in oklab,var\(--slotted-tone-accent-text\) calc\(var\(--slotted-highlight-tint-opacity,0\.075\) \* 100%\),transparent\)\)/,
  );
  assert.match(mark, /color:var\(--slotted-highlight-color,var\(--slotted-tone-accent-text\)\)/);
  assert.match(mark, /text-decoration-line:underline/);
  assert.match(
    mark,
    /text-decoration-color:var\(--slotted-highlight-rule-color,var\(--slotted-tone-accent-border\)\)/,
  );
  assert.match(mark, /text-decoration-thickness:var\(--slotted-border-width-thin,1px\)/);
  assert.match(mark, /text-underline-offset:var\(--slotted-space-1,0\.125rem\)/);
});

/**
 * The band is mixed from the tone's `text` role, not taken from its `surface`
 * role, and the share is the foundation's. A sheet that named a surface here
 * would paint no band in two schemes out of three.
 */
test('mixes the band from the accent text tone at the foundation share', () => {
  assert.doesNotMatch(rule(match), /accent-surface/);
  assert.match(rule(match), /--slotted-highlight-tint-opacity/);
});

/** A run that wraps is two boxes, and each of them is marked. */
test('marks both halves of a run that wraps', () => {
  assert.match(rule(match), /box-decoration-break:clone/);
  assert.match(rule(match), /-webkit-box-decoration-break:clone/);
  assert.match(fragment, /data-scene="wrapping"/);
});

/**
 * The current match cannot take a stronger band by degrees — 0.075 is the cap
 * the 7:1 promise sets in `high-contrast` — so it takes the accent's solid
 * ground and the ink the theme pairs with it, and gives the rule up: drawn in
 * that ink inside the fill it read as nothing. No outline: R3 reserves it for
 * the focus ring. Nothing moves.
 */
test('fills the current match with the accent pair, and moves nothing', () => {
  const current = rule(`${match}[data-current]`);
  assert.match(
    current,
    /background-color:var\(--slotted-highlight-current-background,var\(--slotted-tone-accent-solid\)\)/,
  );
  assert.match(
    current,
    /color:var\(--slotted-highlight-current-color,var\(--slotted-tone-accent-on-solid\)\)/,
  );
  assert.match(current, /text-decoration-line:none/);
  assert.doesNotMatch(current, /outline|padding|margin|font-|letter-spacing/);
  assert.match(fragment, /data-scene="current"/);
  assert.match(fragment, /<mark data-part="match" data-current>/);
});

/**
 * A disabled row keeps the rule and gives up the tone. The state is read from
 * the root and from any row above it, because the host's option is where the
 * state already lives; and it outranks `current`, whose fill and ink it takes
 * back, and whose rule it restores.
 */
test('steps the mark down inside a row that answers nothing, from the root or above it', () => {
  const stepped = rule(disabled);
  assert.match(
    stepped,
    /background-color:var\(--slotted-highlight-disabled-background,transparent\)/,
  );
  assert.match(stepped, /color:inherit/);
  assert.match(stepped, /text-decoration-line:underline/);
  assert.doesNotMatch(stepped, /text-decoration-(color|thickness)/);
  assert.ok(
    normalized.indexOf(`${match}[data-current]{`) < normalized.indexOf(`${disabled}{`),
    'disabled is written after current, so it wins at equal specificity',
  );
  assert.match(fragment, /data-scene="disabled"/);
  assert.match(fragment, /data-part="root" data-disabled/);
});

test('names the system pair forced colours would collapse', () => {
  const forced = declarations.slice(declarations.indexOf('@media (forced-colors: active)'));
  assert.match(forced, /background-color:\s*Mark/);
  assert.match(forced, /color:\s*MarkText/);
  assert.match(forced, /forced-color-adjust:\s*none/);
  assert.match(
    forced,
    /\[data-current\]\s*\{\s*background-color:\s*Highlight;\s*color:\s*HighlightText/,
  );
});

/**
 * The paint lives once. A family that drew the mark itself is a family whose
 * answer can drift from the other three, which is the whole of R6: the extract
 * is only done when no family sheet paints the part any more.
 */
test('leaves no family painting the mark on its own', () => {
  const offenders = [];
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'highlight') continue;
    for (const file of readdirSync(join(source, entry.name))) {
      if (!file.endsWith('.css')) continue;
      const other = readFileSync(join(source, entry.name, file), 'utf8').replace(
        /\/\*[\s\S]*?\*\//g,
        '',
      );
      if (/\[data-part-match\]\s*(?:,[^{]*)?\{/.test(other)) {
        offenders.push(`${entry.name}/${file}`);
      }
    }
  }
  assert.deepEqual(offenders, [], `${offenders.join(', ')} paints the mark instead of reading it`);
});

/**
 * The hosts render the family's anatomy, not the sheet's old one: a `mark`
 * wearing `data-ui='highlight'` itself is the shape wave 6 had, and a fragment
 * still writing it would be a fragment the sheet no longer paints.
 */
test('finds no host fragment wearing the identifier on the mark itself', () => {
  const offenders = [];
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'highlight') continue;
    for (const file of readdirSync(join(source, entry.name))) {
      if (!file.endsWith('.harness.html')) continue;
      const html = readFileSync(join(source, entry.name, file), 'utf8');
      if (/<mark[^>]*data-ui=["']highlight["']/.test(html)) offenders.push(`${entry.name}/${file}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `${offenders.join(', ')} renders the mark as the sheet's old shape`,
  );
});
