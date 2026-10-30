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
    new URL('../../../../specs/components/status-indicator/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./status-indicator.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./status-indicator.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
/** Collapsed rather than stripped, for the reason `badge` records. */
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const { defaults, parts } = contract.members.statusIndicator;

/** One entry per rule, keyed on the whole selector list. See `skeleton`. */
function collectRules(sheet) {
  const collected = [];
  let selector = '';
  for (let index = 0; index < sheet.length; index += 1) {
    const character = sheet[index];
    if (character === '}') {
      selector = '';
      continue;
    }
    if (character !== '{') {
      selector += character;
      continue;
    }
    const close = sheet.indexOf('}', index);
    const nested = sheet.indexOf('{', index + 1);
    if (nested === -1 || nested > close) {
      collected.push({ selector: selector.trim(), body: sheet.slice(index + 1, close) });
      index = close;
    }
    selector = '';
  }
  return collected;
}

const rules = collectRules(normalized);
const rule = (selector) => rules.find((entry) => entry.selector === selector)?.body ?? '';

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${root}{`), 'the family has no base rule keyed on data-ui');
});

/**
 * Every part but one. `announcement` carries no paint of this family's: it is
 * clipped by `visually-hidden`, which is the family that owns hiding text, and
 * a second copy of the clip here would be a second answer that goes stale.
 *
 * It is still named once, in a `:has()` that takes the mark's gap back when
 * the label holds nothing else — which is a measurement rather than a paint,
 * and the reason this test asks about declarations instead of about the string.
 */
test('styles every part it paints, and leaves the announcement to the family that clips it', () => {
  for (const part of parts) {
    if (part === 'announcement') continue;
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
  const announcementRules = rules.filter(({ selector }) =>
    selector.includes(`[data-part-announcement]`),
  );
  assert.equal(announcementRules.length, 1, 'the announcement is painted rather than measured');
  assert.equal(announcementRules[0]?.body, 'margin-inline-end:0;');
});

/**
 * The tone each status speaks in, read from the contract rather than restated.
 * The map is the one fact the stylesheet, both bindings and the contract test
 * all have to agree about, and a rename in one of the five tones would
 * otherwise be a silent repaint here.
 */
test('paints every status in the tone the contract maps it to', () => {
  for (const [status, tone] of Object.entries(contract.statusTones)) {
    const body = rule(`${root}[data-status='${status}']`);
    assert.ok(body.length > 0, `no rule paints the ${status} status`);
    assert.ok(
      body.includes(`--_text:var(--slotted-tone-${tone}-text`),
      `${status} does not speak in ${tone}`,
    );
  }
});

/**
 * The glyph is the family's non-chromatic alternative, so the artwork each
 * status draws is contract rather than a choice made in the sheet. The sheet
 * paints none of it; every icon mark in the fragment holds the `Glyph` element
 * the contract names for its status.
 */
test('draws the glyph the contract names for every status', () => {
  assert.ok(!/var\(--slotted-icon-(?!size)/.test(declarations), 'the sheet paints a glyph token');
  const marks = [
    ...fragment.matchAll(
      /<[a-z]+\b([^>]*data-mark="icon"[^>]*)>\s*<span data-part="mark" aria-hidden="true"\s*>\s*<span data-ui="icon" data-part="root" aria-hidden="true"\s*>\s*<svg data-part="glyph" data-glyph="([a-z-]+)"/g,
    ),
  ];
  assert.equal(marks.length, (fragment.match(/data-mark="icon"/g) ?? []).length);
  for (const [, attributes, glyph] of marks) {
    const status = /data-status="([a-z]+)"/.exec(attributes)[1];
    assert.equal(
      glyph,
      contract.statusGlyphs[status],
      `${status} draws artwork the contract does not name`,
    );
  }
});

/**
 * `unknown` and `neutral` share a tone, so the mark is the only thing that can
 * tell them apart — and it has to do it without colour, which is what makes
 * the difference survive `high-contrast` and greyscale.
 */
test('tells the two grey statuses apart by shape rather than by colour', () => {
  assert.equal(contract.statusTones.neutral, contract.statusTones.unknown);
  assert.ok(rule(`${root}[data-status='unknown']`).includes('--_solid:transparent'));
  const ring = rule(`${ui}[data-mark='dot'][data-status='unknown'] [data-part-mark]::before`);
  assert.ok(ring.includes('border:var(--slotted-border-width-thick,2px) dashed var(--_rim)'));
  assert.ok(
    ring.includes('inset:calc(-1 * var(--_halo-width))'),
    'the hollow ring ends where a lit dot’s halo ends',
  );
});

test('answers every value of every axis that has a paint', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    if (axis === 'live') continue;
    for (const value of values) {
      const answered =
        normalized.includes(`[data-${axis}='${value}']`) ||
        (defaults[axis] === value && normalized.includes(`${root}{`));
      assert.ok(answered, `Missing ${axis} ${value}`);
    }
  }
});

test('leaves the announcement policy to the accessibility tree', () => {
  assert.ok(!normalized.includes('[data-live='), 'live decides a role, not a paint');
});

/**
 * The disc is a whole number of pixels from the space scale, and its rim is
 * the fill itself — a rim in another colour drew a bullseye around every tone
 * in dark. `warning` is the one fill below WCAG 2.2 1.4.11's 3:1 on the light
 * surface, and it alone takes an edge: the tone's border role, the same hue a
 * step darker.
 */
test('sizes the disc on the space scale and rims it in its own fill', () => {
  assert.ok(rule(root).includes('--_dot-size:var(--slotted-space-4'));
  assert.ok(rule(`${root}[data-size='sm']`).includes('--_dot-size:var(--slotted-space-3'));
  assert.ok(
    !/--_dot-size:[^;]*cap\b/.test(normalized),
    'a cap-sized disc lands on a fractional pixel',
  );
  assert.ok(
    rule(root).includes(
      '--_rim:var(--slotted-status-indicator-mark-border-color,var(--_edge,var(--_solid)))',
    ),
  );
  assert.ok(
    rule(`${root}[data-status='warning']`).includes('--_edge:var(--slotted-tone-warning-border)'),
  );
  assert.ok(
    rule(`${root}[data-status='unknown']`).includes('--_edge:var(--slotted-border-strong)'),
  );
  const dot = rule(`${ui}[data-mark='dot'] [data-part-mark]`);
  assert.ok(dot.includes('background-color:var(--_solid'));
  assert.ok(dot.includes('border:var(--_rim-width) solid var(--_rim'));
});

/**
 * The mark is inside the first line, centred on the capitals — `0.5cap` above
 * the baseline, rounded to the device pixel — and its own bottom edge is its
 * baseline whatever it holds. The label beside it is an `inline-block`, so its
 * lines after the first hang under the first word, and it lends its first
 * baseline to a table row. Only an inline root becomes an `inline-block`: a
 * cell keeps its own display and padding.
 */
test('puts the mark on the first line, however far the label runs', () => {
  const mark = rule(`${ui} [data-part-mark]`);
  assert.ok(mark.includes('contain:layout'));
  assert.ok(mark.includes('display:inline-flex'));
  assert.ok(mark.includes('margin-inline-end:var(--_gap)'));
  assert.ok(
    mark.includes('vertical-align:round(nearest,calc(0.5cap - var(--_mark-size) / 2),0.5px)'),
  );
  assert.ok(rule(root).includes('white-space:nowrap'));
  assert.ok(rule(`${root}:not(td,th,li,div,p)`).includes('display:inline-block'));
  assert.ok(
    rule(root).includes('line-height:round(up,1em * var(--slotted-line-height-md,1.5),2px)'),
  );
  assert.ok(!/align-items|1lh/.test(normalized), 'the mark is placed by the line, not by a box');
});

/**
 * The opposite of `badge`, which clips its label to one line. A status is
 * often a sentence, and half a sentence is a wrong instruction rather than a
 * shorter one.
 *
 * `break-word` and never `anywhere`: both break the unbreakable token, and
 * only `anywhere` also reports a min-content size of one character, which
 * collapsed “Build 4821 failed” into fourteen lines of one letter inside an
 * auto-sized grid column on the reference page.
 */
test('wraps the label and breaks the token nothing else can', () => {
  const label = rule(`${ui} [data-part-label]`);
  assert.ok(label.includes('display:inline-block'));
  assert.ok(label.includes('baseline-source:first'));
  assert.ok(label.includes('max-inline-size:calc(100% - var(--_mark-size) - var(--_gap))'));
  assert.ok(label.includes('white-space:normal'));
  assert.ok(label.includes('overflow-wrap:break-word'));
  assert.ok(!/overflow-wrap:anywhere/.test(normalized), 'anywhere collapses an auto-sized column');
  assert.ok(
    rule(root).includes('min-inline-size:0'),
    'a long token would size the container’s track instead of breaking',
  );
  assert.ok(!/text-overflow/.test(label), 'a status label is never clipped');
});

/** A second, quieter line in the label's own column. */
test('sets the detail on its own muted line under the words', () => {
  const detail = rule(`${ui} [data-part-detail]`);
  assert.ok(detail.includes('display:block'));
  assert.ok(detail.includes('color:var(--slotted-text-muted'));
});

/**
 * A mark with no visible words still carries its own word, out of flow — so a
 * gap after the mark puts a bare dot off the centre of the cell it was meant
 * to sit in.
 */
test('takes the gap back when the label holds nothing a reader can see', () => {
  assert.ok(
    normalized.includes(
      `${ui}:has(> [data-part-label] > [data-part-announcement]:only-child) > [data-part-mark]{margin-inline-end:0`,
    ),
  );
});

/**
 * The wave is a filled disc in the dot's rim colour, under the mark, and each
 * beat ends in a rest. It is the mark's own pseudo-element: no mark is a mask
 * any more, so nothing clips it. An icon mark does not pulse: a disc behind a
 * glyph fills its counters and blurs the silhouette the icon mark exists to
 * keep.
 */
test('pulses a filled wave behind a dot, and none behind a glyph', () => {
  const wave = rule(`${ui}[data-pulse] [data-part-mark]::after`);
  assert.ok(wave.includes('animation:slotted-status-indicator-pulse'));
  assert.ok(wave.includes('background-color:var(--_rim)'));
  assert.ok(wave.includes('inset:0'));
  assert.ok(wave.includes('z-index:-1'));
  assert.ok(!wave.includes('border:'), 'a hairline ring reads as a grey circle');
  assert.ok(wave.includes('var(--slotted-easing-enter)'));
  assert.ok(rule(`${ui}[data-pulse]`).includes('isolation:isolate'));
  assert.ok(normalized.includes('70%,to{opacity:0;scale:3;}'));
  assert.equal(
    rule(`${ui}[data-mark='icon'][data-pulse] [data-part-mark]::after`),
    'content:none;',
  );
  assert.ok(!rule(`${ui}[data-mark='icon'] [data-part-mark]`).includes('mask'));
});

/** A band of the disc's own colour outside it, and none around the hollow ring. */
test('lights the dot with a halo of its own colour', () => {
  assert.ok(rule(root).includes('--_halo:color-mix(in oklab,var(--_rim) 20%,transparent)'));
  assert.ok(
    rule(`${ui}[data-mark='dot'] [data-part-mark]`).includes(
      'box-shadow:0 0 0 var(--_halo-width) var(--_halo)',
    ),
  );
  assert.ok(rule(`${root}[data-status='unknown']`).includes('--_halo:transparent'));
});

test('takes its duration from the motion scale rather than stating one', () => {
  assert.ok(!/\d+(\.\d+)?m?s(?![\w-])/.test(css), 'a literal duration escapes reduced motion');
  assert.ok(css.includes('--slotted-duration-loop-slow'));
});

/**
 * Stopped and removed, not slowed. A ring halted halfway through an expansion
 * is a rendering fault rather than a state, which is what `button` recorded
 * about its own loading band.
 */
test('withdraws the endless ring under reduced motion rather than shortening it', () => {
  const query = normalized.slice(normalized.indexOf('@media (prefers-reduced-motion:reduce)'));
  assert.ok(
    query.startsWith(
      `@media (prefers-reduced-motion:reduce){${ui}[data-pulse] [data-part-mark]::after{`,
    ),
  );
  assert.ok(query.includes('animation:none'));
  assert.ok(query.includes('content:none'));
});

/**
 * The system replaces every author colour, so the six statuses become one mark
 * and the only question left is whether it is visible. A dot painted from a
 * forced `Canvas` background is not — the defect `link` found on its own
 * external mark. The glyph is `currentColor` and needs no fill behind it.
 */
test('keeps the mark visible under forced colours and withdraws the ring', () => {
  const query = normalized.slice(normalized.indexOf('@media (forced-colors:active)'));
  assert.ok(query.includes(`${ui}[data-mark='dot'] [data-part-mark]{background-color:CanvasText`));
  assert.ok(
    query.includes(
      `${ui}[data-mark='dot'][data-status='unknown'] [data-part-mark]{background-color:Canvas`,
    ),
  );
  assert.ok(query.includes(`${ui}[data-pulse] [data-part-mark]::after{content:none`));
});

/**
 * A status is furniture until a consumer makes the root a link. Only then does
 * it answer the pointer, on the words alone: an underline fades in on hover
 * and the words take the muted role on press, both on motion tokens.
 */
test('answers a pointer only on a root the consumer made a link', () => {
  const pointer = rules.filter(({ selector }) => /:hover|:active(?![-\w])/.test(selector));
  assert.ok(pointer.length > 0);
  for (const { selector } of pointer) {
    assert.ok(
      selector.startsWith(`${root}:any-link:not([data-disabled]):`),
      `${selector} answers a pointer on a status`,
    );
  }
  const link = rule(`${root}:any-link`);
  assert.ok(link.includes('text-decoration-color:transparent'));
  assert.ok(link.includes('color var(--slotted-duration-short) var(--slotted-easing-standard)'));
  assert.ok(
    link.includes(
      'text-decoration-color var(--slotted-duration-short) var(--slotted-easing-standard)',
    ),
  );
  assert.ok(
    rule(`${root}:any-link:not([data-disabled]):hover`).includes(
      'text-decoration-color:currentColor',
    ),
  );
  assert.ok(
    rule(`${root}:any-link:not([data-disabled]):active`).includes('color:var(--slotted-text-muted'),
  );
  assert.ok(rule(root).includes('color:inherit'), 'a linked status keeps the page colour');
});

/**
 * The ring is painted anyway, because `render` and an Angular host element
 * both let a consumer make the root a link — the decision `badge` took first.
 */
test('paints the focus ring for a root the consumer made focusable', () => {
  assert.ok(rule(`${root}:focus-visible`).includes('outline:var(--slotted-focus-ring-width'));
});

/** The fragment is a third place the DOM is written, and it can drift. */
test('renders every part and every painted axis value in the harness fragment', () => {
  for (const part of parts) {
    assert.match(fragment, new RegExp(`data-part="${part}"`), `no scene renders the ${part} part`);
  }
  for (const [axis, values] of Object.entries(contract.axes)) {
    if (axis === 'live') continue;
    for (const value of values) {
      assert.match(
        fragment,
        new RegExp(`data-${axis}="${value}"`),
        `no scene renders ${axis}="${value}"`,
      );
    }
  }
  assert.match(fragment, /data-pulse=""/, 'no scene renders the pulse');
});

/**
 * The family's own rule, held against the place it is likeliest to be
 * contradicted: a nameless dot in a harness teaches the opposite of what the
 * reference pages say. Every indicator whose label holds no words carries the
 * clipped one instead.
 */
test('never renders a mark without a word, visible or clipped', () => {
  const labels = [...fragment.matchAll(/data-part="label"[^>]*>([\s\S]*?)<\/span/g)];
  assert.ok(labels.length >= 20, `only ${labels.length} labels found in the fragment`);
  for (const [, held] of labels) {
    const words = held.replace(/<[^>]*>/g, '').trim();
    assert.ok(
      words.length > 0 || /data-part="announcement"/.test(held),
      `a mark is rendered with no name at all: ${held.slice(0, 60)}`,
    );
  }
});
