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
    new URL('../../../../specs/components/section/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./section.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./section.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.section;

function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${ui}{`), 'the family has no base rule keyed on data-ui');
});

test('styles every part the contract declares', () => {
  for (const declared of member.parts) {
    if (declared === 'root') continue;
    assert.ok(
      normalized.includes(`[data-part-${declared.toLowerCase()}]`),
      `no rule reaches the ${declared} part`,
    );
  }
});

test('renders every part the contract declares, in at least one scene', () => {
  for (const declared of member.parts) {
    assert.match(
      fragment,
      new RegExp(`data-part="${declared}"`),
      `${declared} appears in no scene`,
    );
  }
  assert.match(
    fragment,
    /data-part="body">[\s\S]*<section\s+data-ui="section"/,
    'no scene nests a section',
  );
});

/**
 * A section holds sections, and the families inside it have a `header`, an
 * `actions` and a `description` of their own, so every rule reaches its part
 * with a child combinator.
 */
test('reaches its own parts with a child combinator, never a descendant one', () => {
  for (const part of member.parts) {
    if (part === 'root') continue;
    const descendant = new RegExp(`\\[data-ui-section\\][^{]*? \\[data-part-${part}\\]`);
    assert.ok(!descendant.test(normalized), `a descendant rule reaches ${part}`);
  }
});

/** The hooks anchor navigation needs. */
test('lands a hash link under the page chrome', () => {
  assert.match(rule(ui), /scroll-margin-block-start:var\(--slotted-page-sticky-top,0px\)/);
});

test('sticks its header under the page chrome and paints it', () => {
  const header = rule(`${ui}[data-sticky]>[data-part-header]`);
  assert.match(header, /position:sticky/);
  assert.match(header, /inset-block-start:var\(--slotted-page-sticky-top,0px\)/);
  assert.match(
    header,
    /background-color:var\(--slotted-section-header-background,var\(--_ground\)\)/,
  );
  assert.match(rule(ui), /--_ground:var\(--slotted-page-ground,var\(--slotted-surface,Canvas\)\)/);
});

/** A surface, not a card. */
test('paints a surface with no shadow and no interaction', () => {
  const surface = rule(`${ui}[data-ground='surface']`);
  assert.match(surface, /background-color:var\(--_ground\)/);
  assert.match(surface, /border-radius:var\(--slotted-section-radius/);
  assert.doesNotMatch(surface, /box-shadow/);
  assert.doesNotMatch(normalized, /:hover/);
});

test('rules under the header when asked', () => {
  const divided = rule(`${ui}[data-divider]>[data-part-header]`);
  assert.match(
    divided,
    /border-block-end:var\(--slotted-border-width-thin,1px\) solid var\(--_rule\)/,
  );
});

/** On a surface the rule runs edge to edge: the header takes the inset back as margin and keeps it as padding. */
test('runs the rule edge to edge on a surface', () => {
  const surfaceRule = rule(`${ui}[data-ground='surface'][data-divider]>[data-part-header]`);
  assert.match(
    surfaceRule,
    /margin-inline:calc\(-1 \* var\(--slotted-section-inset,var\(--slotted-space-6,1rem\)\)\)/,
  );
  assert.match(surfaceRule, /padding-inline:var\(--slotted-section-inset,/);
});

/**
 * A section's heading is a label: small capitals, tracked, on the step its
 * size names — xs for sm and md, sm for lg — independent of its rank.
 */
test('sets the heading as a tracked label in small capitals, sized by size', () => {
  assert.match(rule(ui), /--slotted-section-heading-size-md,var\(--slotted-font-size-xs/);
  assert.match(
    rule(`${ui}[data-size='sm']`),
    /--slotted-section-heading-size-sm,var\(--slotted-font-size-xs/,
  );
  assert.match(
    rule(`${ui}[data-size='lg']`),
    /--slotted-section-heading-size-lg,var\(--slotted-font-size-sm/,
  );
  const heading = rule(`${ui}>[data-part-header]>[data-part-title]>[data-part-heading]`);
  assert.match(heading, /text-transform:uppercase/);
  assert.match(heading, /letter-spacing:0\.08em/);
  assert.match(heading, /color:var\(--_text\)/);
  assert.match(fragment, /<h4 data-part="heading"/, 'no scene shows a deeper rank');
});

/**
 * A section inside another is a subsection: mixed case, muted, one step
 * larger than the label above it, so the two levels differ in case, size and
 * tone — never in tone alone.
 */
test('sets a nested section heading in mixed case and the muted tone', () => {
  const nested = rule(`${ui} ${ui}>[data-part-header]>[data-part-title]>[data-part-heading]`);
  assert.match(nested, /text-transform:none/);
  assert.match(nested, /color:var\(--_muted\)/);
  assert.match(nested, /font-size:var\(--_subheading-size\)/);
  assert.match(rule(ui), /--slotted-section-subheading-size-md,var\(--slotted-font-size-md/);
  assert.match(
    rule(`${ui}[data-size='sm']`),
    /--slotted-section-subheading-size-sm,var\(--slotted-font-size-sm/,
  );
  assert.match(
    rule(`${ui}[data-size='lg']`),
    /--slotted-section-subheading-size-lg,var\(--slotted-font-size-lg/,
  );
});

/**
 * The distance between sections is the family's where they follow one
 * another in flow — a page's container, a family's body — and nowhere else,
 * so a stack's gap or a grid's areas are never added to it.
 */
test('owns the space between sibling sections and before a subsection', () => {
  assert.match(
    rule(`:is([data-ui-container],[data-part-body])>${ui} + ${ui}`),
    /margin-block-start:var\(--slotted-section-spacing,var\(--slotted-space-9,2rem\)\)/,
  );
  assert.match(
    rule(`${ui}>[data-part-body]>${ui}:not(:first-child)`),
    /margin-block-start:var\(--slotted-section-subsection-spacing,var\(--slotted-space-7,1\.25rem\)\)/,
  );
  assert.doesNotMatch(rule(ui), /(?<!scroll-)margin/);
  assert.doesNotMatch(
    normalized,
    /(^|[{}])\[data-ui-section\] \+ \[data-ui-section\]\{/,
    'a bare sibling rule would space grid items too',
  );
});

/**
 * A sticky header is chrome for what is under it: the body republishes where
 * the chrome ends, page plus header, and re-bridges the table's offset, so a
 * column header inside stops under the section's header and not under the
 * page's. Layers add up.
 */
test('republishes the sticky top for what is under a sticky header', () => {
  assert.match(rule(`${ui}[data-sticky]`), /--_above:var\(--slotted-page-sticky-top,0px\)/);
  const body = rule(`${ui}[data-sticky]>[data-part-body]`);
  assert.match(
    body,
    /--slotted-page-sticky-top:calc\(var\(--_above\) \+ var\(--slotted-section-header-size,0px\)\)/,
  );
  assert.match(body, /--slotted-table-sticky-offset:var\(--slotted-page-sticky-top\)/);
});

/** Stuck, the header keeps air under the chrome; at rest the margin takes it back. */
test('gives a stuck header air under the chrome without moving it at rest', () => {
  const header = rule(`${ui}[data-sticky]>[data-part-header]`);
  assert.match(header, /padding-block-start:var\(--slotted-space-4,0\.5rem\)/);
  assert.match(header, /margin-block-start:calc\(-1 \* var\(--slotted-space-4,0\.5rem\)\)/);
});

test('publishes its raised ground to the families inside it', () => {
  assert.match(rule(`${ui}[data-ground='surface']`), /--slotted-ground:var\(--_ground\)/);
});

/**
 * The heading, the tags and the actions are items of one grid row and share
 * the heading's baseline, whatever the title holds above or below it. The
 * title is a subgrid of the header's rows; the tags have a column of their
 * own beside the heading and never leave it.
 */
test('sets the heading, the tags and the actions on one baseline row', () => {
  const header = `${ui}>[data-part-header]`;
  assert.match(rule(header), /align-items:baseline/);
  assert.match(rule(header), /display:grid/);
  assert.match(rule(header), /container-type:inline-size/);
  const title = rule(`${header}>[data-part-title]`);
  assert.match(title, /grid-template-rows:subgrid/);
  assert.match(title, /grid-template-columns:minmax\(min-content,max-content\) 1fr/);
  assert.match(rule(`${header}>[data-part-title]>[data-part-eyebrow]`), /grid-row:1/);
  assert.match(rule(`${header}>[data-part-title]>[data-part-heading]`), /grid-row:2/);
  const tags = rule(`${header}>[data-part-title]>[data-part-tags]`);
  assert.match(tags, /grid-column:2/);
  assert.match(tags, /grid-row:2/);
  assert.match(tags, /align-items:baseline/);
  assert.match(rule(`${header}>[data-part-title]>[data-part-description]`), /grid-row:3/);
  assert.match(rule(`${header}>[data-part-actions]`), /grid-row:2/);
});

/** Only the actions leave the heading's row, and only on a narrow header. */
test('moves the actions, never the tags, to a row of their own when narrow', () => {
  const narrow = normalized.split('@container (inline-size < 20rem){')[1] ?? '';
  assert.match(narrow, /\[data-part-actions\]\{grid-column:1 \/ -1;grid-row:4/);
  assert.doesNotMatch(narrow, /data-part-tags/);
});
