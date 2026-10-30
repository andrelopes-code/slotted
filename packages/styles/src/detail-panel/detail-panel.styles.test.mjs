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
    new URL('../../../../specs/components/detail-panel/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./detail-panel.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./detail-panel.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.detailPanel;
const column = `${ui}>[data-part-body]>[data-ui-container]`;
const columns = `${column}>[data-part-columns]`;
const section = `${columns}>[data-part-main]>[data-part-section]`;

function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

/** The rules inside the one container query, as one string. */
const wide = normalized.split('@container detail-panel (min-width:600px){')[1] ?? '';

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
});

/**
 * The content is other families — a section has a `body`, a
 * description-list a `description`, a result-state a `message` — so every
 * rule reaches its part with a child combinator from the part that owns it.
 */
test('reaches its own parts with a child combinator, never a descendant one', () => {
  for (const part of member.parts) {
    if (part === 'root') continue;
    const descendant = new RegExp(`\\[data-ui-detail-panel\\][^{]*? \\[data-part-${part}\\]`);
    assert.ok(!descendant.test(normalized), `a descendant rule reaches ${part}`);
  }
});

/**
 * The root is the query container and the body is two elements in, with the
 * container family between them so the columns align with the header's own
 * container. A query container cannot change its own tracks.
 */
test('queries its own width from the root and lays the columns out three elements in', () => {
  const root = rule(ui);
  assert.match(root, /container-name:detail-panel/);
  assert.match(root, /container-type:inline-size/);
  assert.match(rule(columns), /display:grid/);
  assert.match(rule(columns), /grid-template-columns:minmax\(0,1fr\)/);
  assert.ok(wide.includes(`${columns}{grid-template-columns:minmax(0,1fr) var(--_aside-size);}`));
  assert.ok(
    wide.includes(
      `${ui}[data-aside='start']>[data-part-body]>[data-ui-container]>[data-part-columns]{grid-template-columns:var(--_aside-size) minmax(0,1fr);}`,
    ),
  );
  assert.ok(
    wide.includes(
      `${ui}[data-aside='none']>[data-part-body]>[data-ui-container]>[data-part-columns]{grid-template-columns:minmax(0,1fr);}`,
    ),
  );
  /* Width is the container's: no media query reads the viewport's. */
  assert.doesNotMatch(normalized, /@media[^{]*width/);
});

/**
 * Narrow, the aside follows the main column with a rule above it; wide, it
 * stands beside it with the rule at the gap's distance from both, and
 * `order: -1` moves it to the start when the axis says so. The aside is
 * never hidden.
 */
test('reflows the aside under the body instead of hiding it', () => {
  const aside = rule(`${columns}>[data-part-aside]`);
  assert.match(aside, /border-block-start:var\(--_rule-size\) solid var\(--_rule\)/);
  assert.match(aside, /padding-block-start:var\(--_gap\)/);
  assert.match(aside, /overflow-wrap:anywhere/);
  assert.ok(wide.includes('border-inline-start:var(--_rule-size) solid var(--_rule)'));
  assert.ok(wide.includes('padding-inline-start:var(--_gap)'));
  assert.ok(wide.includes('order:-1'));
  assert.doesNotMatch(normalized, /display:none[^}]*\}[^{]*aside/);
});

/** The three sizes move the aside's track, the gap and the inset together. */
test('states the aside track and the gap per size, on the space scale', () => {
  assert.match(rule(ui), /--_aside-size:var\(--slotted-detail-panel-aside-size-md,16rem\)/);
  assert.match(rule(ui), /--_gap:var\(--slotted-detail-panel-gap-md,var\(--slotted-space-8/);
  assert.match(
    rule(ui),
    /--_inset-block:var\(--slotted-detail-panel-inset-block-md,var\(--slotted-space-8/,
  );
  assert.match(rule(`${ui}[data-size='sm']`), /--slotted-detail-panel-aside-size-sm,14rem/);
  assert.match(
    rule(`${ui}[data-size='sm']`),
    /--slotted-detail-panel-gap-sm,var\(--slotted-space-7/,
  );
  assert.match(rule(`${ui}[data-size='lg']`), /--slotted-detail-panel-aside-size-lg,18rem/);
  assert.match(
    rule(`${ui}[data-size='lg']`),
    /--slotted-detail-panel-gap-lg,var\(--slotted-space-9/,
  );
});

/**
 * Under `scroll=self` the root is the scroll container, so the page-header
 * sticks inside it and a flex parent may shrink it.
 */
test('becomes the scroll container when asked and never otherwise', () => {
  const self = rule(`${ui}[data-scroll='self']`);
  assert.match(self, /overflow:auto/);
  assert.match(self, /min-block-size:0/);
  assert.match(self, /overscroll-behavior:contain/);
  assert.doesNotMatch(rule(ui), /overflow/);
});

/**
 * A section under `tabs` is the tabpanel: hidden by the attribute, in the
 * tab sequence with the outward ring, fading in as `tabs`'s own panel does.
 * Under `stacked` a section is scrolled under the chrome by a link.
 */
test('makes a section the tabpanel under tabs and a scroll target under stacked', () => {
  assert.match(rule(section), /scroll-margin-block-start:var\(--slotted-page-sticky-top,0px\)/);
  assert.match(rule(`${section}[hidden]`), /display:none/);
  const ring = rule(`${section}[role='tabpanel']:focus-visible`);
  assert.match(
    ring,
    /outline:var\(--slotted-focus-ring-width,2px\) solid var\(--slotted-focus-ring-color,Highlight\)/,
  );
  assert.match(ring, /outline-offset:var\(--slotted-focus-ring-offset,2px\)/);
  const arriving = rule(
    `${ui}[data-layout='tabs']>[data-part-body]>[data-ui-container]>[data-part-columns]>[data-part-main]>[data-part-section]:not([hidden])`,
  );
  assert.match(
    arriving,
    /animation:slotted-detail-panel-section-in var\(--slotted-duration-short\) var\(--slotted-easing-enter\)/,
  );
  assert.match(fragment, /data-part="section" role="tabpanel" tabindex="0"/);
  assert.match(fragment, /data-part="section"[^>]*\bhidden\b/);
});

test('puts a tabbed section’s own controls in a row at the inline end', () => {
  const actions = rule(`${section}>[data-part-section-actions]`);
  assert.match(actions, /display:flex/);
  assert.match(actions, /justify-content:flex-end/);
  assert.match(actions, /gap:var\(--slotted-control-gap-md,8px\)/);
});

/**
 * The footer stays at the bottom of whatever scrolls, under the chrome a
 * page publishes there, and paints the ground so what passes under it is
 * covered. The aside does not stick: see the contract.
 */
test('sticks the footer at the bottom and paints it, and sticks nothing else', () => {
  const footer = rule(`${ui}>[data-part-footer]`);
  assert.match(footer, /position:sticky/);
  assert.match(footer, /inset-block-end:var\(--slotted-page-sticky-bottom,0px\)/);
  assert.match(
    footer,
    /background-color:var\(--slotted-detail-panel-footer-background,var\(--_ground\)\)/,
  );
  assert.match(footer, /margin-block-start:auto/);
  assert.match(footer, /z-index:var\(--slotted-z-index-sticky,100\)/);
  assert.match(rule(ui), /--_ground:var\(--slotted-page-ground,var\(--slotted-surface,Canvas\)\)/);
  assert.equal(normalized.match(/position:sticky/g).length, 1);
});

/** The message stands where the body stood and is tall enough to read as the record's absence. */
test('gives the message the body’s place and a height', () => {
  const message = rule(`${column}>[data-part-message]`);
  assert.match(message, /display:grid/);
  assert.match(message, /place-items:center/);
  assert.match(message, /min-block-size:calc\(4 \* var\(--slotted-space-12,4rem\)\)/);
});

/** The waiting shape is skeleton's; the family paints none of its own. */
test('draws no placeholder of its own while loading', () => {
  assert.doesNotMatch(normalized, /data-loading/);
  assert.match(fragment, /data-loading[\s\S]*data-ui="skeleton"/);
});

/** Nothing in the family answers a pointer: it holds content, not a control. */
test('paints no hover and no active state', () => {
  const selectors = normalized.replace(/@media[^{]*/g, '');
  assert.doesNotMatch(selectors, /:hover/);
  assert.doesNotMatch(selectors, /:active/);
});

/** A theme draws the footer as a material with tokens of its own; reduced transparency drops the filter. */
test('filters the footer’s backdrop from its own token, except under reduced transparency', () => {
  const footer = rule(`${ui}>[data-part-footer]`);
  assert.match(footer, /backdrop-filter:var\(--slotted-detail-panel-footer-backdrop-filter,none\)/);
  assert.ok(
    normalized.includes(
      `@media (prefers-reduced-transparency:reduce),(forced-colors:active){${ui}>[data-part-footer]{-webkit-backdrop-filter:none;backdrop-filter:none;}}`,
    ),
  );
});
