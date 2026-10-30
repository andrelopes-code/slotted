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
    new URL('../../../../specs/components/result-state/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./result-state.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./result-state.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
/**
 * Whitespace is collapsed rather than removed: a descendant selector and a
 * multi-word value both lose their meaning when every space goes. Parentheses
 * are collapsed too, because the formatter breaks a long value across lines and
 * leaves `var( --token`, which no assertion here spells.
 */
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const member = contract.members.resultState;

/** The declarations of the first rule whose selector starts with `selector`. */
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
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
});

/**
 * The layout decision the anatomy rests on. `content` is the live region, so
 * the mark, the actions and the footer cannot be inside it — they are placed as
 * its siblings, and a stylesheet that nested them would be describing a
 * different family from the one the contract declares.
 */
test('places the mark, the actions and the footer outside the region that announces', () => {
  for (const part of ['media', 'content', 'actions', 'footer']) {
    assert.ok(
      normalized.includes(`${ui}>[data-part-${part.toLowerCase()}]`),
      `${part} is not placed as a child of the root`,
    );
  }
});

/**
 * The status paints nothing (RS1). It set a tone and a silhouette per value —
 * a tray, a struck magnifier, a lock — drawn at the title's size above the
 * title, and R5's limit is what removed it: a tone glyph alone on an empty
 * surface, in relation to nothing, is the pattern the rule refuses. What the
 * region is reporting is in its words.
 *
 * The attribute stays on the root, because it is what a page keys its own
 * illustration on, and the stylesheet may not key a colour or a mask on it
 * again.
 */
test('paints no status, in no tone and with no mask', () => {
  for (const status of contract.axes.status) {
    assert.ok(
      !normalized.includes(`[data-status='${status}']`),
      `${status} is painted by a rule again`,
    );
  }
  assert.ok(!/mask-image|mask-size|mask-position/.test(normalized), 'the family draws a mask');
  assert.ok(!/--slotted-tone-/.test(normalized), 'the family paints a tone');
});

/**
 * With nothing in it the box is withdrawn rather than left standing at zero: a
 * box of no height is still an item in the grid, and the row gap would keep a
 * band of empty space above the title exactly where the glyph used to be.
 *
 * `--slotted-result-state-media` is the way to put a picture there without
 * projecting a node, and it is painted as an image: the drawing is the page's
 * own, in its own colours. Unset, the declaration is invalid at computed-value
 * time and the box paints nothing.
 */
test('withdraws the picture box when there is no picture', () => {
  const empty = rule(`${ui}>[data-part-media]:empty`);
  assert.match(empty, /display:none/);
  assert.match(empty, /background:var\(--slotted-result-state-media\) center \/ contain no-repeat/);
  assert.match(empty, /block-size:var\(--_media-size\)/);
});

/**
 * The family reflows on its own inline size — the actions stack, and the
 * `inline` row becomes a column — so it owns a named container. The anonymous
 * form would resolve against whichever ancestor happened to be a container
 * first, which for a result state inside a card inside a page is not the box
 * the decision is about.
 */
test('owns a named container and states its own width', () => {
  const base = rule(root);
  assert.match(base, /container-name:slotted-result-state/);
  assert.match(base, /container-type:inline-size/);
  assert.match(base, /inline-size:100%/);
  assert.match(normalized, /@container slotted-result-state \(max-width:20rem\)/);
});

/**
 * At `inline` reach the mark, the words and the controls share one line, and
 * all three are held to it by the same rule: a box exactly one line box tall,
 * with the content centred inside it. The root carries the title's own type so
 * that `1lh` on any child resolves against the line the title draws.
 *
 * Both halves were reported from the picture. `1lh` read on the mark itself
 * resolved against the mark's inherited twelve pixels rather than the title's
 * thirteen, and the mark sat two and a half pixels above its own line. The
 * controls were worse: a control taller than a line made the grid row thirty
 * pixels deep, so the mark and the words sat at the top of it while the control
 * sat in the middle. `align-content` rather than `align-items` is what centres
 * the control, because the row is allowed to wrap and a wrapping flex container
 * aligns its lines.
 */
test('puts the words and the controls on one line at inline reach', () => {
  const base = rule(root);
  assert.match(base, /font-size:var\(--_title-font-size\)/);
  assert.match(base, /line-height:var\(--_title-line-height\)/);

  const actions = rule(`${ui}[data-reach='inline']>[data-part-actions]`);
  assert.match(actions, /block-size:1lh/);
  assert.match(actions, /align-self:start/);
  assert.match(actions, /align-content:center/);

  /* Below the breakpoint the controls leave that line, so the box goes back to
     its own height rather than squashing them into one. */
  assert.match(
    normalized.split('@container slotted-result-state (max-width:20rem){')[1] ?? '',
    /\[data-reach='inline'\]>\[data-part-actions\]\{block-size:auto/,
  );
});

/**
 * Measure belongs to `container` and to it alone —
 * `docs/build-briefing.md`. Polaris caps its empty state at four hundred pixels
 * and Atlassian ships a `width: narrow`; a second family answering the same
 * question is what that decision exists to prevent.
 */
test('caps no measure of its own', () => {
  assert.doesNotMatch(normalized, /max-inline-size:(?!100%)/);
});

/**
 * Prose from the type scale, the mark from the control scale. The ladder is two
 * steps of the type scale between the title and the description at every reach,
 * and it is checked here because the first draft shipped one step at `section`
 * and read as a single block of text with one line in bold.
 */
test('steps the type by reach, and takes every step from one scale', () => {
  assert.match(rule(root), /--slotted-font-size-xl/);
  assert.match(rule(root), /--slotted-font-size-md/);
  assert.match(rule(`${root}[data-reach='inline']`), /--slotted-font-size-sm/);
  assert.match(rule(`${root}[data-reach='inline']`), /--slotted-font-size-xs/);
  assert.match(rule(`${root}[data-reach='page']`), /--slotted-font-size-3xl/);
  assert.match(rule(`${root}[data-reach='page']`), /--slotted-font-size-lg/);
  assert.doesNotMatch(
    normalized,
    /--_title-font-size:var\(--slotted-result-state-title-font-size,var\(--slotted-control-font-size/,
  );
});

/**
 * Density reaches this family through the mark, because control geometry is the
 * only size scale the theme restates per density. `page` takes a proportion of
 * that box rather than a sixth step on a scale, which is the rule Avatar's own
 * scale is written under.
 */
test('answers density through the mark rather than through the words', () => {
  assert.match(rule(root), /--slotted-control-height-md/);
  assert.match(rule(`${root}[data-reach='inline']`), /--slotted-control-icon-size-md/);
  assert.match(
    rule(`${root}[data-reach='page']`),
    /calc\(var\(--slotted-control-height-lg[^)]*\) \* 1\.5\)/,
  );
});

/**
 * The one state the family paints. The root carries `tabindex="-1"` so an
 * application that has just emptied a table can send the reader to the message,
 * and a reader who arrives has to see where they are.
 */
test('paints focus and nothing else', () => {
  assert.match(normalized, /\[data-ui-result-state\]\[data-part-root\]:focus-visible\{/);
  /* `:active` is excluded only where it selects: `forced-colors:active` is a
     media feature, not a state the family paints. */
  for (const state of [/:hover/, /:active[{,]/, /\[data-disabled/, /\[data-loading/]) {
    assert.doesNotMatch(normalized, state);
  }
  assert.deepEqual(member.states, ['default', 'focus-visible']);
});

/**
 * The arrival is the message, so a live region enters and a hidden one leaves
 *. The
 * entry is gated on `live` for `alert`'s reason: `@starting-style` applies on
 * first paint as well, and a region that is not announcing is not arriving.
 * Every duration and curve is a motion token, which is what lets the theme
 * collapse them under reduced motion.
 */
test('enters when it announces and leaves when it is hidden, on motion tokens alone', () => {
  assert.match(
    normalized,
    /@starting-style\{\[data-ui-result-state\]\[data-part-root\]:is\(\[data-live='polite'\],\[data-live='assertive'\]\)/,
  );
  const hidden = rule(`${root}[hidden]`);
  assert.match(hidden, /display:none/);
  assert.match(hidden, /--slotted-easing-exit/);
  assert.match(rule(root), /--slotted-easing-enter/);
  assert.match(rule(root), /transition-behavior:allow-discrete/);
  for (const match of normalized.matchAll(/transition:([^;}]+)/g)) {
    assert.doesNotMatch(
      match[1] ?? '',
      /\ball\b|\d+m?s\b/,
      'a transition names all or a literal time',
    );
    assert.match(match[1] ?? '', /--slotted-duration-/);
  }
});

/**
 * Each drawing is a rule of its own on the media box, in the neutral surface
 * and border roles, and the picture leans the other way in a right-to-left
 * page because depth is read from the reading edge. Under forced colours the
 * drawing keeps the theme's own system-colour mapping rather than the
 * browser's, which would erase every fill and leave the stack as three
 * outlines on top of one another.
 */
test('draws each illustration from neutral roles, mirrored in rtl and kept under forced colours', () => {
  for (const drawing of contract.axes.illustration.filter((value) => value !== 'none')) {
    assert.ok(
      normalized.includes(`[data-illustration='${drawing}']>[data-part-media]`),
      `${drawing} draws nothing`,
    );
  }
  assert.match(normalized, /:dir\(rtl\)/);
  assert.match(normalized, /forced-color-adjust:none/);
  assert.doesNotMatch(normalized, /\[data-illustration='none'\]/);
});

/**
 * The fragment is the third place this family's DOM is written and it drifts.
 * Every part has to appear in it, and the two structural facts have to be
 * visible rather than described.
 */
test('exercises every part in the harness fragment', () => {
  for (const part of member.parts) {
    assert.ok(fragment.includes(`data-part="${part}"`), `the fragment never renders ${part}`);
  }
  for (const status of contract.axes.status) {
    assert.ok(fragment.includes(`data-status="${status}"`), `the fragment never renders ${status}`);
  }
  for (const reach of contract.axes.reach) {
    assert.ok(fragment.includes(`data-reach="${reach}"`), `the fragment never renders ${reach}`);
  }
  for (const align of contract.axes.align) {
    assert.ok(fragment.includes(`data-align="${align}"`), `the fragment never renders ${align}`);
  }
  for (const drawing of contract.axes.illustration.filter((value) => value !== 'none')) {
    assert.ok(
      fragment.includes(`data-illustration="${drawing}"`),
      `the fragment never renders ${drawing}`,
    );
  }
});

test('writes the live role on the text and on nothing else in the fragment', () => {
  for (const [live, role] of Object.entries(contract.liveRoles)) {
    if (role === null) continue;
    assert.ok(
      fragment.includes(`data-live="${live}"`),
      `the fragment never renders the ${live} region`,
    );
    assert.ok(fragment.includes(`role="${role}"`), `the fragment never writes role="${role}"`);
  }
  for (const match of fragment.matchAll(/role="(status|alert)"/g)) {
    const before = fragment.slice(0, match.index).lastIndexOf('data-part=');
    assert.ok(
      fragment.slice(before, match.index).includes('data-part="content"'),
      'a live role is written on a part other than content',
    );
  }
});

/**
 * The mark carries no information a reader needs, because the title and the
 * description already say what it says. An illustration that adds information
 * is not decorative, and what it adds belongs in the description.
 */
test('hides the mark from assistive technology in the fragment', () => {
  for (const match of fragment.matchAll(/data-part="media"([^>]*)>/g)) {
    assert.match(match[1] ?? '', /aria-hidden="true"/, 'a media box is exposed to a reader');
  }
});
