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
  readFileSync(new URL('../../../../specs/components/page/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./page.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./page.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.page;

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
  assert.match(fragment, /data-ui="page-header"/, 'no scene holds the header the page exists for');
});

/** The two answers to who scrolls, and what each does to the footer. */
test('grows under an ancestor scroller and scrolls itself under self', () => {
  assert.match(rule(ui), /min-block-size:100%/);
  const self = rule(`${ui}[data-scroll='self']`);
  assert.match(self, /block-size:100%/);
  const scroller = rule(`${ui}[data-scroll='self']>[data-part-scroll]`);
  assert.match(scroller, /overflow:auto/);
  assert.match(scroller, /min-block-size:0/);
  assert.match(rule(`${ui}>[data-part-footer]`), /position:sticky/);
  assert.match(rule(`${ui}>[data-part-footer]`), /inset-block-end:0/);
  assert.match(rule(`${ui}[data-scroll='self']>[data-part-footer]`), /position:static/);
});

/** The bridge to table, and the ground a sticky section header reads. */
test('bridges its fixed geometry to table and states its ground for sections', () => {
  const root = rule(ui);
  for (const [tableToken, pageProperty] of Object.entries(contract.bridge)) {
    assert.match(
      root,
      new RegExp(`${tableToken}:var\\(${pageProperty},0px\\)`),
      `${tableToken} is not bridged`,
    );
  }
  assert.match(root, /--slotted-page-ground:var\(--_ground\)/);
});

/**
 * Fill is a layout for the medium class and up. Below 600 pixels the body
 * grows with its content and the page scrolls: on a phone the chrome above a
 * filled list left its rows 155 of 667 pixels.
 */
test('fills when asked, from the compact size class up only', () => {
  const query = /@container slotted-page \(width\s*>=\s*600px\)\{(.*?\})\}/.exec(normalized);
  assert.ok(query, 'fill is not held behind a query on the compact size class');
  const inside = (selector) => query[1].split(`${selector}{`)[1]?.split('}')[0] ?? '';
  const body = inside(`${ui}[data-fill]>[data-part-scroll]>[data-part-body]`);
  assert.match(body, /display:flex/);
  assert.match(body, /min-block-size:0/);
  assert.match(inside(`${ui}[data-fill]>[data-part-scroll]>[data-part-body]>*`), /flex:1 1 auto/);
  assert.doesNotMatch(
    normalized.replace(query[0], ''),
    /\[data-fill\]/,
    'a fill rule applies below 600 pixels',
  );
});

test('paints the two grounds the contract names', () => {
  assert.match(rule(ui), /--slotted-page-background-sunken,var\(--slotted-surface-sunken/);
  assert.match(
    rule(`${ui}[data-ground='surface']`),
    /--slotted-page-background-surface,var\(--slotted-surface,/,
  );
});

/** The footer enters from below and leaves the same way, on presence's word. */
test('moves the footer on the presence status', () => {
  const moving = rule(
    `${ui}>[data-part-footer][data-status='entering'],${ui}>[data-part-footer][data-status='exiting']`,
  );
  assert.match(moving, /translate:0 100%/);
  assert.doesNotMatch(moving, /opacity/, 'a fade suppresses the footer’s backdrop filter');
  assert.match(rule(`${ui}>[data-part-footer]`), /transition:translate var\(--_duration\)/);
});

test('lays the footer actions out as one wrapping row aligned to the end', () => {
  const actions = rule(`${ui}>[data-part-footer]>*>[data-part-actions]`);
  assert.match(actions, /display:flex/);
  assert.match(actions, /justify-content:flex-end/);
  assert.match(actions, /flex-wrap:wrap/);
});

test('has no header part', () => {
  assert.ok(!normalized.includes('[data-part-header]'), 'a header part is styled');
});

/** The header's chrome changes height as it snaps; anchoring would turn that into a scroll. */
test('lets nothing under the scroll part anchor the scroll', () => {
  assert.match(rule(`${ui}>[data-part-scroll]`), /overflow-anchor:none/);
});

/**
 * The page answers its own width, as page-header does: a query container on
 * the inline axis alone, so the block-axis layout — at least the scrollport
 * tall, exactly the parent under self, stretched under fill — stays the flow's.
 */
test('is a query container on the inline axis, named for the family', () => {
  const root = rule(ui);
  assert.match(root, new RegExp(`container:${contract.responsive.container} / inline-size`));
  assert.doesNotMatch(root, /container-type:size/);
  assert.equal(contract.responsive.compact, '600px');
});

/** Compact, the gutters of every container in the page stop at step 4 of the space scale. */
test('caps the inset of its containers at step 4 below 600 pixels', () => {
  const compact =
    /@container slotted-page \(width < 600px\)\{([\s\S]*?)\}\}/.exec(normalized)?.[1] ?? '';
  const [selectors, body] = compact.split('{');
  for (let step = 5; step <= 12; step += 1) {
    assert.ok(
      selectors.split(',').includes(`${ui} [data-ui-container][data-inset='${step}']`),
      `inset ${step} is not capped`,
    );
  }
  for (let step = 0; step <= 4; step += 1) {
    assert.ok(!selectors.includes(`[data-inset='${step}']`), `inset ${step} is capped`);
  }
  assert.match(body ?? '', /--_inset:var\(--slotted-space-4,0\.5rem\)/);
});
