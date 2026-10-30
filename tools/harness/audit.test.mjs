import assert from 'node:assert/strict';
import test from 'node:test';

import {
  annotatesTheLine,
  collapsedElements,
  explainedExcess,
  hasSettled,
  offAxisMarks,
  overflowingElements,
  SETTLE_INTERVAL,
  turningExcess,
} from './audit.mjs';

/**
 * The audit reports three failures, and for three sessions it reported them
 * where there were none: a `script` counted as a collapsed demonstration (G5),
 * a glyph measured against the box of a title that wrapped instead of against
 * its first line (G7), and the diagonal of a spinning ring counted as content
 * leaving its slot (G10). Every one of those rules lived inside a string
 * evaluated in Chrome, where no case could be put to it.
 *
 * They live here now, and so do the cases. The numbers are measured ones, from
 * the harness pages named beside them.
 */

/* ── An element that collapsed to a sliver ─────────────────────────────── */

const child = (overrides) => ({
  scene: 'states · light · 420px · comfortable · ltr',
  element: 'div[data-ui=checkbox][data-part=root]',
  tag: 'div',
  width: 420,
  stage: 446,
  floor: null,
  boxes: 1,
  children: [],
  ...overrides,
});

test('reports a stage child that stands narrower than a demonstration', () => {
  const sliver = child({ width: 18, element: 'div[data-ui=stepper][data-part=root]' });
  assert.deepEqual(collapsedElements([sliver]), [
    {
      scene: sliver.scene,
      element: 'div[data-ui=stepper][data-part=root]',
      width: 18,
      stage: 446,
    },
  ]);
});

test('says nothing about a child that fills the stage it stands in', () => {
  assert.deepEqual(collapsedElements([child()]), []);
});

/**
 * G5. A harness fragment carries its own `script` where a scene needs one — the
 * `states` scene of `checkbox` sets `indeterminate` from JavaScript, because no
 * attribute can — and the element is a child of the stage. Measured as a
 * demonstration it is nought pixels wide inside a 446-pixel stage, which reads
 * exactly like the worst defect this rule exists to catch. Ninety findings
 * across the families were this.
 */
test('does not count an element that draws nothing as a demonstration', () => {
  const script = child({ tag: 'script', element: 'script', width: 0, boxes: 0 });
  const style = child({ tag: 'style', element: 'style', width: 0, boxes: 0 });
  const template = child({ tag: 'template', element: 'template', width: 0, boxes: 0 });
  assert.deepEqual(collapsedElements([script, style, template]), []);
});

/**
 * TG1. The `group` scene of `tag` renders an empty group on purpose — an
 * actions area built from a permission filter renders one often — and
 * `tag.css` hides it with `display: none`, which is the whole point of the
 * scene. The audit measured the hidden element at 0px in all three schemes and
 * called it collapsed, six times, while the capture plainly showed the tags
 * beside it.
 */
test('does not count an element the stylesheet took out of the layout', () => {
  const hidden = child({
    scene: 'group · light · 420px · comfortable · ltr',
    element: 'div[data-ui=tag][data-part=group]',
    width: 0,
    boxes: 0,
    children: [],
  });
  assert.deepEqual(collapsedElements([hidden]), []);
});

/**
 * An element with no box of its own is not a demonstration either — its
 * children are. `display: contents` makes a wrapper the layout does not see, so
 * it measures nought however wide its content is.
 */
test('judges what a box-less wrapper actually drew', () => {
  const wrapper = child({
    element: 'div[data-part=wrapper]',
    width: 0,
    boxes: 0,
    children: [
      child({ width: 400, element: 'div[data-part=wide]' }),
      child({ width: 12, element: 'div[data-part=narrow]' }),
    ],
  });
  assert.deepEqual(
    collapsedElements([wrapper]).map((finding) => finding.element),
    ['div[data-part=narrow]'],
  );
});

/**
 * G12. A key of `kbd` stands between 23.8 and 37 pixels wide because a key is
 * that wide — the whole of the `keys` scene is single caps — and the audit
 * called every one of them a collapsed demonstration: 126 findings, the largest
 * block left after G5, G7 and G10. The scene declares what it shows with
 * `data-collapse-floor` on its `section` and the stage carries the number.
 */
test('believes a scene that declares how small its subject is', () => {
  const key = child({
    scene: 'keys · light · 420px · comfortable · ltr',
    element: 'kbd[data-ui=kbd][data-part=root]',
    tag: 'kbd',
    width: 25.19,
    floor: 20,
  });
  assert.deepEqual(collapsedElements([key]), []);
});

/**
 * The declared floor is a floor and not an exemption: a key that lost its
 * legend or its inset is a collapsed key, and the scene said where that is.
 */
test('still reports a subject that fell under the floor its scene declared', () => {
  const crushed = child({
    scene: 'keys · light · 420px · dense · ltr',
    element: 'kbd[data-ui=kbd][data-part=root]',
    tag: 'kbd',
    width: 6,
    floor: 20,
  });
  assert.deepEqual(
    collapsedElements([crushed]).map((finding) => finding.width),
    [6],
  );
});

/**
 * The floor the scene declared descends through a wrapper the layout does not
 * see, because the wrapper is not the demonstration — its children are (TG1).
 */
test('carries the declared floor down to what the wrapper stood in for', () => {
  const wrapper = child({
    element: 'div[data-part=wrapper]',
    width: 0,
    boxes: 0,
    floor: 20,
    children: [child({ width: 25.19, element: 'kbd[data-ui=kbd][data-part=root]', floor: null })],
  });
  assert.deepEqual(collapsedElements([wrapper]), []);
});

/**
 * A scene declaring nothing is judged by the floor the audit brought, which is
 * what keeps the finding M3 was: a menu surface of eight commands standing
 * 91px wide inside a 446px stage, in a family that declares no floor.
 */
test('keeps its own floor for a scene that declared none', () => {
  const surface = child({
    element: 'div[data-ui=menu][data-part=root]',
    width: 91.33,
    floor: null,
  });
  assert.equal(collapsedElements([surface]).length, 1);
});

test('takes a floor, for a page that has reason to want another one', () => {
  const small = child({ width: 91, element: 'div[data-ui=menu][data-part=root]' });
  assert.equal(collapsedElements([small]).length, 1);
  assert.deepEqual(collapsedElements([small], 90), []);
});

test('rounds the measurement it reports, and keeps the scene', () => {
  const [finding] = collapsedElements([child({ width: 90.6, stage: 446.4 })]);
  assert.equal(finding.width, 91);
  assert.equal(finding.stage, 446);
  assert.equal(finding.scene, 'states · light · 420px · comfortable · ltr');
});

/* ── Content that ran outside the box that owns it ─────────────────────── */

const slot = (overrides) => ({
  scene: 'states · light · 420px · compact · ltr',
  element: 'span[data-part=start]',
  scrollWidth: 17,
  clientWidth: 14,
  turning: 0,
  placed: 0,
  ...overrides,
});

test('reports content that ran outside the box that owns it', () => {
  assert.deepEqual(overflowingElements([slot({ scrollWidth: 266, clientWidth: 240 })]), [
    {
      scene: 'states · light · 420px · compact · ltr',
      element: 'span[data-part=start]',
      width: 266,
      stage: 240,
    },
  ]);
});

test('leaves the inside of an SVG drawing to the svg that holds it', () => {
  const label = slot({ element: 'text', scrollWidth: 60, clientWidth: 0, drawing: true });
  const svg = slot({ element: 'svg', scrollWidth: 266, clientWidth: 240, drawing: false });
  assert.deepEqual(
    overflowingElements([label, svg]).map((finding) => finding.element),
    ['svg'],
  );
});

test('lets a rounding artefact through', () => {
  assert.deepEqual(overflowingElements([slot({ scrollWidth: 241, clientWidth: 240 })]), []);
});

/**
 * A rotation moves no layout and changes no box, but a turned square's
 * *bounding* box is its diagonal, and scrollable overflow is measured from
 * bounding boxes.
 */
test('measures what a turn can add to the inline axis', () => {
  assert.equal(+turningExcess({ width: 14, height: 14 }).toFixed(2), 5.8);
  assert.equal(turningExcess({ width: 10, height: 0 }), 0);
});

/**
 * G10. The `states` scene of `button` at `compact` holds a fourteen-pixel ring
 * that turns once a second, and the audit photographed it mid-spin: 17 pixels
 * of content in a 14-pixel slot, twice — once for the border ring `button`
 * drew before B4 and once for the masked glyph it draws now. Three pixels is
 * inside the 5.8 a fourteen-pixel square gains by turning.
 */
test('withdraws an overflow that fits inside what a turning descendant adds', () => {
  const spinning = slot({
    scrollWidth: 17,
    clientWidth: 14,
    turning: turningExcess({ width: 14, height: 14 }),
  });
  assert.deepEqual(overflowingElements([spinning]), []);
});

/**
 * A slot holding both a spinner and something genuinely too wide keeps its
 * finding: the withdrawal is the size of the turn, not the presence of one.
 */
test('keeps an overflow larger than the turn can account for', () => {
  const both = slot({
    scrollWidth: 40,
    clientWidth: 14,
    turning: turningExcess({ width: 14, height: 14 }),
  });
  assert.deepEqual(
    overflowingElements([both]).map((finding) => finding.width),
    [40],
  );
});

/**
 * G13. `[data-part='bubble']` is 39 pixels wide over a 16-pixel thumb because
 * the thumb declared itself its containing block and hung the read-out there,
 * and the same pixels were counted again at the track, the control, the root
 * and the stack: 693 of the 894 findings that survived G10 were this one
 * read-out. Placement is where the stylesheet said a box goes.
 */
test('withdraws an overflow that fits inside what a placed descendant hangs', () => {
  const thumb = slot({
    scene: 'origin · light · 420px · comfortable · ltr',
    element: 'div[data-part=thumb]',
    scrollWidth: 33,
    clientWidth: 16,
    placed: 16.68,
  });
  assert.deepEqual(overflowingElements([thumb]), []);
});

/**
 * The withdrawal is the size of the placement, not the presence of one: a box
 * holding both a read-out and something genuinely too wide keeps its finding.
 */
test('keeps an overflow larger than the placement can account for', () => {
  const both = slot({
    element: 'div[data-part=thumb]',
    scrollWidth: 90,
    clientWidth: 16,
    placed: 16.68,
  });
  assert.deepEqual(
    overflowingElements([both]).map((finding) => finding.width),
    [90],
  );
});

/**
 * A box that placed nothing out of flow explains nothing. `[data-part='control']`
 * of `slider` is `inline-size: 100%` with `box-sizing: content-box` and a
 * thumb's worth of padding on each side, so it stands 260px wide inside a 240px
 * root — in flow, past the end edge, in every scene and at every width — and
 * that is the finding this rule exists to keep.
 */
test('keeps an overflow that no placement and no turn explains', () => {
  const band = slot({
    scene: 'default · light · 240px · comfortable · ltr',
    element: 'div[data-part=control]',
    scrollWidth: 260,
    clientWidth: 240,
  });
  assert.deepEqual(
    overflowingElements([band]).map((finding) => finding.width),
    [260],
  );
});

/**
 * One explanation for one set of pixels: a box with a spinner in one corner and
 * a read-out over the other forgives whichever is larger, and reports past it.
 */
test('forgives the larger of a turn and a placement, never their sum', () => {
  assert.equal(explainedExcess({ turning: 5.8, placed: 16.68 }), 16.68);
  assert.equal(explainedExcess({ turning: 5.8 }), 5.8);
  assert.equal(explainedExcess({}), 0);
});

/**
 * A pointer reach is the third explanation, and R2's own construction is what
 * produced it: a control whose picture is thinner than the WCAG 2.2 target
 * reaches the floor with a transparent pseudo-element around it. `drawer`'s
 * separator is four pixels wide with a twenty-four-pixel reach, which reports
 * ten pixels of overflow on the end side and is none.
 */
test('forgives a transparent pointer reach hung outside a thin control', () => {
  const separator = {
    scene: 'side-start · light · 420px',
    element: 'div[data-part=resizer]',
    scrollWidth: 14,
    clientWidth: 4,
    reach: 10,
  };
  assert.deepEqual(overflowingElements([separator]), []);

  /* Past the reach it is content again, and still reported. */
  assert.deepEqual(
    overflowingElements([{ ...separator, scrollWidth: 40 }]).map((finding) => finding.width),
    [40],
  );
  assert.equal(explainedExcess({ turning: 5.8, placed: 2, reach: 10 }), 10);
});

test('takes a tolerance for the overflow it forgives', () => {
  const narrow = slot({ scrollWidth: 243, clientWidth: 240 });
  assert.equal(overflowingElements([narrow]).length, 1);
  assert.deepEqual(overflowingElements([narrow], 4), []);
});

/* ── A mark off the axis of the line it annotates ──────────────────────── */

/**
 * The numbers in these cases are measured ones, from
 * `tools/harness/out/menu.html` at 420 pixels in the light scheme, before and
 * after the fix that prompted the guard. A mark is `[data-part='icon']` and the
 * line it annotates is the first line of `[data-part='label']` beside it.
 */
const before = {
  scene: 'anatomy',
  element: 'span[data-part=icon]',
  markCentre: 151.14,
  textCentre: 153.14,
};
const after = {
  scene: 'anatomy',
  element: 'span[data-part=icon]',
  markCentre: 153.39,
  textCentre: 153.14,
};

test('reports a mark that sits above the line it annotates', () => {
  assert.deepEqual(offAxisMarks([before]), [{ ...before, offset: -2 }]);
});

/**
 * A font's ascent and descent are not symmetrical, so a mark centred exactly on
 * its line box still misses the middle of the glyphs by a quarter of a pixel.
 * A guard that reported that would be a guard nobody could satisfy.
 */
test('lets the asymmetry of a typeface through', () => {
  assert.deepEqual(offAxisMarks([after]), []);
});

test('reports a mark that sits below the line as readily as one above it', () => {
  const low = { ...before, markCentre: 156.14 };
  assert.deepEqual(offAxisMarks([low]), [{ ...low, offset: 3 }]);
});

test('keeps the scene and the element, so a finding can be found', () => {
  const [finding] = offAxisMarks([before]);
  assert.equal(finding.scene, 'anatomy');
  assert.equal(finding.element, 'span[data-part=icon]');
});

test('takes a tolerance, for a page that has reason to want a tighter one', () => {
  assert.deepEqual(offAxisMarks([after], 0.1), [{ ...after, offset: 0.25 }]);
  assert.deepEqual(offAxisMarks([before], 4), []);
});

/**
 * SI1. A status with no words of its own carries its name in a
 * `visually-hidden` span — one pixel, absolutely positioned, clipped to
 * nothing — and its text still returns a rectangle. The audit measured the dot
 * against it 18 times, at 1.25px in `comfortable` and 1px in `compact` and
 * `dense`, while the same dot beside every visible label of the family measured
 * 0 to 0.5px. There is no line there to be off the axis of.
 */
test('does not measure a mark against words no reader can see', () => {
  const announced = {
    scene: 'bare · light · 240px · comfortable · ltr',
    element: 'span[data-part=mark]',
    markCentre: 5154.5,
    textCentre: 5153.25,
    markTop: 5150,
    markBottom: 5159,
    lineTop: 5145.75,
    lineBottom: 5160.75,
    hidden: true,
  };
  assert.deepEqual(offAxisMarks([announced]), []);
  assert.deepEqual(
    offAxisMarks([{ ...announced, hidden: false }]).map((finding) => finding.offset),
    [1.25],
  );
});

test('says nothing about a page with no marks on it', () => {
  assert.deepEqual(offAxisMarks([]), []);
});

/**
 * G7, the second half. `result-state` puts its glyph on a row of its own above
 * the title, by design, and a glyph on its own row has no axis to miss: it is
 * aligned to a block. Two boxes that share no band of the page share no line.
 */
test('does not ask a glyph on a row of its own to sit on a line it never shared', () => {
  const stacked = {
    scene: 'reach · light · 420px · comfortable · ltr',
    element: 'span[data-part=icon]',
    markTop: 100,
    markBottom: 132,
    lineTop: 148,
    lineBottom: 168,
    markCentre: 116,
    textCentre: 158,
  };
  assert.equal(annotatesTheLine(stacked), false);
  assert.deepEqual(offAxisMarks([stacked]), []);
});

test('measures a glyph that shares the line, however far off it sits', () => {
  const beside = {
    scene: 'content · light · 240px · comfortable · ltr',
    element: 'span[data-part=icon]',
    markTop: 150,
    markBottom: 166,
    lineTop: 148,
    lineBottom: 168,
    markCentre: 158,
    textCentre: 148.25,
  };
  assert.equal(annotatesTheLine(beside), true);
  assert.deepEqual(
    offAxisMarks([beside]).map((finding) => finding.offset),
    [9.75],
  );
});

test('treats a record with no bands as one that shares its line', () => {
  assert.equal(annotatesTheLine({ markCentre: 1, textCentre: 2 }), true);
});

/**
 * The wait, as a rule a case can be put to. The audit measured a docs page as
 * soon as one stage existed, and a page that mounts its blocks one at a time
 * had two of twenty-four by then — which reported no defect and read exactly
 * like a clean page.
 */
test('waits for the stage count to stop growing, not for the first stage', () => {
  assert.equal(hasSettled([]), false, 'nothing read yet');
  assert.equal(hasSettled([2]), false, 'one reading is not two');
  assert.equal(hasSettled([2, 9]), false, 'still mounting');
  assert.equal(hasSettled([2, 9, 24, 24]), true, 'two readings agree');
  assert.equal(hasSettled([0, 0]), false, 'a page that drew nothing has not settled');
});

test('gives the page long enough between two readings to mount a block', () => {
  assert.ok(SETTLE_INTERVAL >= 100, 'shorter than a block takes to mount');
  assert.ok(SETTLE_INTERVAL <= 500, 'every run pays this twice at least');
});
