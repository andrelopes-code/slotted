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
    new URL('../../../../specs/components/saved-views/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./saved-views.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./saved-views.harness.html', import.meta.url), 'utf8'),
);
const tokens = JSON.parse(
  readFileSync(new URL('./saved-views.tokens.json', import.meta.url), 'utf8'),
);
const normalized = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.savedViews;

/** Every declaration the selector receives, across every rule whose list names it. */
function rule(selector) {
  return normalized
    .split('}')
    .map((block) => block.split('{').slice(-2))
    .filter(([selectors]) => (selectors?.split(',') ?? []).includes(selector))
    .map(([, body]) => body ?? '')
    .join('');
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${ui}[data-part-root]{`), 'no base rule for the root');
  assert.ok(normalized.includes(`${ui}[data-part-panel]{`), 'no base rule for the panel');
});

test('styles every part the contract declares', () => {
  for (const part of member.parts) {
    if (part === 'root' || part === 'panel') continue;
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
  assert.match(fragment, /role="group"/);
  assert.match(fragment, /aria-current="true"/);
  assert.match(fragment, /data-modified/);
});

/**
 * The panel is portalled out of the root, so it carries the family's
 * identifier itself — the same answer `filter-bar`'s rule and `table`'s filter
 * panel give — and its width is the one family token the design names.
 */
test('sizes the panel by its own token, inside the room the positioner leaves', () => {
  const panel = rule(`${ui}[data-part-panel]`);
  assert.match(
    panel,
    /grid-template-columns:minmax\(0,var\(--slotted-saved-views-panel-inline-size,18rem\)\)/,
  );
  assert.match(panel, /max-inline-size:100%/);
  assert.ok(tokens.includes('--slotted-saved-views-panel-inline-size'));
});

/** §4.7: the modified mark is a dot in the accent solid beside its word, never color alone. */
test('marks a modified view with an accent dot and a word', () => {
  assert.match(css, /--slotted-tone-accent-solid/);
  assert.match(fragment, /data-part="modified"[^>]*>[^<]*Modified/);
});

/**
 * A glyph is the library's `Glyph` inside an `icon` box, drawn by the binding
 *: the sheet paints none,
 * and the harness writes each one as an element.
 */
test('draws every glyph as an icon element, never as a mask', () => {
  assert.doesNotMatch(css, /mask-image|var\(--slotted-icon-/);
  for (const glyph of ['chevron-down', 'check', 'ellipsis', 'pin', 'rotate-ccw']) {
    assert.match(
      fragment,
      new RegExp(`<span data-ui="icon"[^>]*><svg data-part="glyph" data-glyph="${glyph}">`),
      glyph,
    );
  }
  assert.doesNotMatch(normalized, /content:'[^']+'/);
});

/** Truncation never removes content from the DOM: the trigger clips, the list wraps. */
test('truncates the trigger’s name and wraps a long name in the list', () => {
  assert.match(rule(`${ui}>[data-part-trigger]>[data-label]`), /text-overflow:ellipsis/);
  assert.match(
    rule(`${ui}[data-part-panel] [data-part-apply]>[data-label]`),
    /overflow-wrap:anywhere/,
  );
});

test('draws the focus ring from the foundation on every control the family owns', () => {
  for (const part of ['trigger', 'revert', 'apply', 'actions']) {
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]:focus-visible`),
      `${part} has no focus-visible rule`,
    );
  }
  assert.match(css, /--slotted-focus-ring-color/);
});

/**
 * The check and the default mark sit on the name's text, not on its line box
 * (`docs/build-briefing.md`, "A mark beside a line of text is aligned to the
 * text"). Both were centerd in a box one line tall, which set the pin high and
 * loose beside "Default". The row aligns its items on the baseline, each mark
 * is the icon's own size, and it moves down until its center lands on the
 * middle of the band between cap height and x-height.
 */
test('sets the check and the default mark on the text band of the name', () => {
  const panel = `${ui}[data-part-panel]`;
  const apply = rule(`${panel} [data-part-apply]`);
  assert.match(apply, /align-items:baseline/);
  const band = 'translate:0 calc(var(--_icon-size-sm) / 2 - (1cap + 1ex) / 4)';
  for (const mark of [
    `${panel} [data-part-apply]>[data-ui-icon]`,
    `${panel} [data-part-apply]>[data-part-default-mark]`,
  ]) {
    assert.ok(rule(mark).includes(band), `${mark} is not on the text band`);
  }
  /* The check is an `icon` at `sm`; the default mark is a box of that size holding one. */
  assert.match(
    rule(`${panel} [data-part-apply]>[data-part-default-mark]`),
    /block-size:var\(--_icon-size-sm\)/,
  );
});
