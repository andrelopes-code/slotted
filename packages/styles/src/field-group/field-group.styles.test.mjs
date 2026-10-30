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
    new URL('../../../../specs/components/field-group/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./field-group.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./field-group.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const member = contract.members.fieldGroup;

function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${root}{`), 'the family has no base rule keyed on data-ui');
});

test('styles every part the contract declares', () => {
  for (const part of member.parts) {
    if (part === 'root') continue;
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
});

/**
 * The user agent's fieldset carries a border, a padding and a
 * `min-inline-size: min-content`. The last is the one that matters: without it
 * a group refuses to shrink below the width of its widest control, and a form
 * in a drawer overflows the drawer.
 */
test('undoes the three things a user agent gives every fieldset', () => {
  const base = rule(root);
  assert.match(base, /border:0/);
  assert.match(base, /margin:0/);
  assert.match(base, /padding:0/);
  assert.match(base, /min-inline-size:0/);
});

/**
 * A `legend` inside a grid or flex container is laid out by rules of its own in
 * every engine, so the fieldset stays a block and the grid that holds the
 * fields is an element the family draws.
 */
test('keeps the legend out of the box that lays the fields out', () => {
  assert.match(rule(root), /display:block/);
  assert.match(rule(`${ui}>[data-part-content]`), /display:flex/);
});

/**
 * GOV.UK recommends the legend hold the page's own heading on a page asking one
 * question, so a reader hears it once. The heading keeps its own type — a
 * `font: inherit` here would shrink every question page's title to the size of
 * a form label — and loses only the block break and the margins that would put
 * the necessity marker on a line of its own.
 */
test('lets the legend hold a page heading without breaking the line', () => {
  const heading = rule(`${ui}>[data-part-legend]>:is(h1,h2,h3,h4,h5,h6)`);
  assert.match(heading, /display:inline/);
  assert.match(heading, /margin:0/);
  assert.ok(!heading.includes('font:inherit'), 'the legend overrides the page heading’s own type');
});

test('keeps the necessity marker in a bidi run of its own', () => {
  assert.match(rule(`${ui}>[data-part-legend]>[data-part-mark]`), /unicode-bidi:isolate/);
});

/**
 * A question stands over its choices at a field's label distance. What is said
 * about a section stands one step further from the section than the fields
 * stand from each other: held at the same value, the description read as
 * belonging to the field under it rather than to the group.
 */
test('separates what is said about the set from the set itself', () => {
  assert.match(
    rule(root),
    /--_content-gap:var\(--slotted-field-group-content-gap,var\(--slotted-field-row-gap,var\(--slotted-space-3/,
  );
  assert.match(
    rule(`${root}[data-kind='section']`),
    /--_content-gap:var\(--slotted-field-group-section-content-gap,var\(--slotted-space-7/,
  );
  assert.match(
    rule(root),
    /--_field-gap:var\(--slotted-field-group-field-gap,var\(--slotted-space-6/,
  );
  assert.match(rule(`${root}>[data-part-content]`), /margin-block-start:var\(--_content-gap\)/);
});

/**
 * A row wraps rather than squeezing. `--slotted-field-group-track-min` is the
 * width a field is given before the row breaks, and the contract records why it
 * is a literal.
 */
test('wraps a row instead of squeezing the controls in it', () => {
  const row = rule(`${ui}[data-orientation='horizontal']>[data-part-content]`);
  assert.match(row, /flex-direction:row/);
  assert.match(row, /flex-wrap:wrap/);
  assert.match(
    rule(`${ui}[data-orientation='horizontal']>[data-part-content]>*`),
    /flex:1 1 var\(--slotted-field-group-track-min/,
  );
  assert.ok('--slotted-field-group-track-min' in contract.literals);
});

/**
 * The platform disables the controls; the family mutes the words. A legend is
 * not a control, so nothing in the fieldset's own `disabled` reaches it.
 *
 * The fields inside are muted by the group providing `disabled` to them rather
 * than by a descendant selector, because a field used outside a group would
 * then have no disabled appearance at all.
 */
test('mutes the name the platform cannot disable, and nothing else', () => {
  assert.match(
    rule(
      `${root}[data-disabled]>[data-part-legend],${root}[data-disabled]>[data-part-legend]>[data-part-mark]`,
    ),
    /color:var\(--slotted-disabled-foreground\)/,
  );
  assert.ok(
    !normalized.includes(`${root}[data-disabled] [data-ui-field]`),
    'the group reaches into a field to paint it',
  );
});

test('withdraws an empty message unless the form asked for its line', () => {
  assert.match(
    normalized,
    new RegExp(
      `\\[data-ui-inline-message\\]:not\\(\\[data-reserve\\]\\):has\\(\\[data-part-text\\]:empty\\)\\{display:none`,
    ),
  );
});

/** The group renders the family it is meant to hold, so the harness shows both. */
test('shows the family it exists to hold', () => {
  assert.match(fragment, /data-ui="field"/);
});

/**
 * F1, stated once for the set and the fields inside it: the group's messages
 * take the field's type — `xs` from the type scale, and a weight up for an
 * outcome over the help.
 */
test('sets the type of what the group says the way the field does', () => {
  const message = rule(`${root}>[data-ui-inline-message]`);
  assert.match(message, /font-size:var\(--slotted-font-size-xs,0\.75rem\)/);
  const outcome = normalized.split(`${root}>[data-ui-inline-message][data-tone='danger']`)[1];
  assert.match(
    outcome ?? '',
    /^,[^{]*\[data-tone='success'\]\{font-weight:var\(--slotted-font-weight-medium,500\);\}/,
  );
  assert.equal(contract.messageMark, 'none', 'the group asks for a mark again (F2)');
});

/**
 * `inline-message` zeroes its root's margin with two attributes, the weight of
 * `root > * + *`, so at equal weight the stylesheet loaded last decided the gap:
 * on the site the Angular error sat 4px nearer its legend than React's. The
 * message's own rule carries a third attribute and wins in any load order.
 */
test('spaces its messages from the legend whatever order the message stylesheet loads in', () => {
  const selector = `${root}>* + [data-ui-inline-message]`;
  const body = rule(selector);
  assert.match(body, /margin-block-start:var\(--_message-gap\)/, `${selector} sets no message gap`);
  const weight = (selector.match(/\[/g) ?? []).length;
  assert.ok(weight > 2, 'the message gap does not outweigh the message family root rule');
});
