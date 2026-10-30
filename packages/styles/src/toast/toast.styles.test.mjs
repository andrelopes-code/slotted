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
    new URL('../../../../specs/components/toast/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./toast.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./toast.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
/**
 * Whitespace collapsed rather than removed: a descendant selector and a
 * multi-word value both lose their meaning when every space goes. Parentheses
 * are collapsed too, because the formatter breaks a long value across lines.
 */
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const item = `${ui}>[data-part-list]>[data-part-item]`;

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

/**
 * The defect this test was written from. A message holds other families —
 * a `button` in its actions, a `progress-indicator` in its mark — and three of
 * those families name a part `root`, `icon`, `label` or `indicator`. Written as
 * a descendant of the family, `[data-ui-toast] [data-part-icon]` masked an
 * icon button's own icon and `[data-part-root]` resized a spinner into a
 * fixed region. Every inner part is therefore reached through the element that
 * owns it, and nothing in this sheet is a bare descendant of the family.
 */
test('never reaches a part that belongs to a family nested inside it', () => {
  const bare = [...normalized.matchAll(/\[data-ui-toast\](?![>[])\s?\[data-part-([a-z-]+)\]/g)];
  assert.deepEqual(
    bare.map(([, part]) => part),
    [],
    'a part is selected as a loose descendant, so a nested family carries the same name',
  );
});

/**
 * A region pinned over a page's content must not eat a press meant for the
 * page, and the messages inside it must still answer one. Every surveyed
 * implementation does this and none of them states it.
 */
test('lets a press through the region and not through a message', () => {
  assert.match(rule(root), /pointer-events:none/);
  assert.match(rule(`${ui}>[data-part-list]`), /pointer-events:none/);
  assert.match(rule(item), /pointer-events:auto/);
});

/**
 * The countdown and the timer are one number. Reading a duration token here
 * would make the bar as long as the theme says instead of as long as the
 * message was given, and stating a literal would put it outside the query that
 * collapses durations under reduced motion.
 */
test('draws the countdown from the duration the message was given', () => {
  const bar = rule(`${item}>[data-part-progress]`);
  assert.match(bar, /animation-duration:var\(--slotted-toast-duration/);
  assert.match(bar, /animation-play-state:var\(--slotted-toast-play-state/);
  assert.ok(contract.runtimeProperties.includes('--slotted-toast-duration'));
  assert.ok(contract.runtimeProperties.includes('--slotted-toast-play-state'));
});

/**
 * The three pause conditions are hover, focus inside, and a hidden document,
 * and the third is invisible to CSS. Resolving any of them here would let the
 * picture and the timer disagree, which is the whole reason the play state is
 * published as one value.
 */
test('never decides for itself whether the countdown is running', () => {
  assert.ok(!/animation-play-state:running/.test(normalized.replace(/,running\)/g, '')));
  assert.ok(!/:hover[^{]*\{[^}]*animation/.test(normalized));
});

/** Six placements, none of which names a physical edge. */
test('answers every placement the contract declares', () => {
  for (const placement of contract.axes.placement) {
    assert.ok(
      normalized.includes(`[data-placement='${placement}']`) ||
        normalized.includes(`[data-placement^='${placement.split('-')[0]}']`),
      `${placement} is not answered by any rule`,
    );
  }
  assert.ok(!/inset-(?:left|right|top|bottom)/.test(normalized));
});

/**
 * The stack reads its depth from the index, so one rule serves any depth, and
 * it says that depth in ink: a message is a box of words, and R7 keeps a scale
 * off one. The dimming is written on the open message, because the closed
 * style is the `opacity: 0` a message arrives from and leaves into.
 */
test('draws the pile from the index rather than from a rule per message', () => {
  const stacked = rule(`${ui}[data-stacking='stack']>[data-part-list]>[data-part-item]`);
  const open = rule(`${ui}[data-stacking='stack']>[data-part-list]>[data-part-item][data-open]`);
  assert.ok(!/scale/.test(stacked), 'a box of words may not be scaled (R7)');
  assert.match(open, /opacity:calc\(1 - min\(var\(--slotted-toast-index/);
  assert.match(stacked, /z-index:calc\(var\(--slotted-toast-count/);
  assert.ok(
    !/--slotted-toast-index:\s*\d/.test(normalized),
    'the sheet states an index of its own',
  );
});

/** Every part the contract declares is drawn, and every scene can show it. */
test('draws every part the contract declares, and shows it in the harness', () => {
  for (const part of contract.members.toast.parts) {
    assert.ok(normalized.includes(`[data-part-${part.toLowerCase()}]`), `${part} is never styled`);
    assert.ok(fragment.includes(`data-part="${part}"`), `${part} appears in no scene`);
  }
});

/**
 * The mark is `alert`'s (R5): a filled disc a step above the title's `1em`,
 * rounded to even pixels, hung from the first line's baseline by a whole-pixel
 * offset. A message about a failure draws the same silhouette as the alert
 * about it. `packages/styles/src/status-mark.test.mjs` holds the same rule for
 * every family that draws one.
 */
test('places the mark on the title’s first line, as alert does', () => {
  assert.match(rule(item), /--_mark-size:round\(nearest,1\.2em,2px\)/);
  const mark = rule(`${item}>[data-part-icon]`);
  assert.match(mark, /align-self:baseline/);
  assert.match(mark, /block-size:var\(--_mark-size\)/);
  assert.match(mark, /inline-size:var\(--_mark-size\)/);
  assert.match(mark, /inset-block-start:round\(nearest,\(var\(--_mark-size\) - 1cap\) \/ 2,1px\)/);
  assert.match(mark, /margin-block-start:calc\(-1 \* var\(--_mark-size\)\)/);
  assert.match(rule(`${item}>[data-part-content]`), /align-self:baseline/);
  /* The glyph is a hand-drawn status mark whose silhouette fills its box, so
     the icon box is the disc; the sheet paints no mark. */
  assert.match(mark, /--slotted-icon-size:var\(--_mark-size\)/);
  assert.doesNotMatch(normalized, /mask-image/);
  assert.ok(!normalized.includes(`[data-part-icon]::before`), 'the mark is a pseudo-element');
  for (const [, glyph] of fragment.matchAll(
    /<svg data-part="glyph" data-glyph="(circle[a-z-]*)"(?! data-solid)/g,
  ))
    assert.fail(`the harness draws ${glyph} as an outline`);
});

/**
 * An even line box: at 13-pixel type the scale's 1.5 gave 19.5, and a message
 * of one line was 45.5 pixels tall. Rounded, the line is 20 at 13 and 18 at 12,
 * and every message lands on a whole pixel.
 */
test('rounds the line box to an even number of pixels', () => {
  assert.match(rule(item), /line-height:round\(nearest,calc\(var\(--_line-height\) \* 1em\),2px\)/);
});

/**
 * White at eight per cent over the `danger` fill moved OKLab lightness by
 * 0.019, under the 0.02 a surface step has to reach; ten moves it by 0.025.
 */
test('steps the close control by at least a surface step on every ground', () => {
  assert.match(rule(item), /currentcolor var\(--slotted-toast-state-layer-hover,10%\)/);
  assert.match(rule(item), /currentcolor var\(--slotted-toast-state-layer-active,16%\)/);
});

/**
 * The gaps between messages are the region's while the reader is in it: a
 * pointer crossing one left the region, cleared the pause and closed the pile.
 */
test('keeps the pointer in the region across the gap between two messages', () => {
  assert.match(rule(`${ui}[data-expanded]>[data-part-list]`), /pointer-events:auto/);
  /* A pile's messages are positioned, so its list is given the open pile's
     measured height or it covers no gap at all. */
  assert.match(
    rule(`${ui}[data-stacking='stack'][data-expanded]>[data-part-list]`),
    /block-size:var\(--slotted-toast-stack-height/,
  );
  assert.ok(contract.runtimeProperties.includes('--slotted-toast-stack-height'));
});

/**
 * The loading mark is `progress-indicator`'s contained loader. The mark's slot
 * gives it the mark's size and ink, so the disc that waits and the disc that
 * answers are one silhouette on every variant.
 */
test('sizes and inks the loader in the mark’s box', () => {
  const mark = rule(`${item}>[data-part-icon]`);
  assert.match(mark, /--slotted-progress-indicator-size:var\(--_mark-size\)/);
  assert.match(mark, /--slotted-progress-indicator-indicator-color:var\(--_mark\)/);
  assert.match(
    mark,
    /--slotted-progress-indicator-track-color:color-mix\(in oklab,var\(--_mark\) 24%,var\(--_ground\)\)/,
  );
  const loading = fragment.split('data-scene="loading"')[1]?.split('</section>')[0] ?? '';
  assert.match(loading, /data-shape="morph"/);
  assert.match(loading, /data-contained=""/);
});

/** A neutral message states no severity, so no scene draws it a mark. */
test('draws no mark on a secondary message', () => {
  assert.equal(contract.toneGlyphs.secondary, null);
  assert.doesNotMatch(fragment, /data-glyph="circle"/);
});

/**
 * Under reduced motion the bar is a full rule. Pausing it held whatever width
 * the forwards fill had reached over the declared one.
 */
test('draws the countdown as a full rule under reduced motion', () => {
  const reduced = normalized.split('@media (prefers-reduced-motion:reduce){')[1] ?? '';
  const bar = reduced.split(`${item}>[data-part-progress]{`)[1]?.split('}')[0] ?? '';
  assert.match(bar, /animation-name:none/);
  assert.match(bar, /inline-size:100%/);
});

/**
 * The slot carries the colour and the glyph strokes with `currentcolor`, so
 * one rule repaints the mark on a solid message and one repaints it under
 * forced colours.
 */
test('lets one colour reach the mark, so forced colours can replace it', () => {
  assert.match(rule(`${item}>[data-part-icon]`), /color:var\(--_mark\)/);
  assert.match(rule(`${item}[data-variant='solid']`), /--_mark:var\(--_on-solid\)/);
  assert.match(normalized, /forced-colors[^@]*\[data-part-icon\]\{color:CanvasText/);
});

/** A mark a page supplies takes the same box: it is an icon on the same line. */
test('gives a supplied mark the box the family draws its own in', () => {
  const mark = rule(`${item}>[data-part-icon]`);
  assert.match(mark, /display:flex/);
  assert.match(mark, /align-items:center/);
  assert.match(mark, /justify-content:center/);
});

/**
 * A word no language can break must not size the words' own track. The
 * 240-pixel capture showed `Zwischenspeicherung` setting the track to 183
 * pixels inside a box of 155: `break-word` wraps only after the track has
 * already grown to fit the word. `anywhere` lowers the min-content size the
 * grid reads, and the clamped track is the other half.
 */
test('breaks an unbreakable title inside the message rather than growing it', () => {
  assert.match(rule(`${item}>[data-part-content]`), /grid-template-columns:minmax\(0,1fr\)/);
  for (const part of ['title', 'description']) {
    const words = rule(`${item}>[data-part-content]>[data-part-${part.toLowerCase()}]`);
    assert.match(words, /overflow-wrap:anywhere/, `${part} keeps break-word`);
    assert.match(words, /min-inline-size:0/, `${part} does not shrink`);
  }
});
