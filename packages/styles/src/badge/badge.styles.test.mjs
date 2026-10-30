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
    new URL('../../../../specs/components/badge/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./badge.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./badge.harness.html', import.meta.url), 'utf8'),
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
  .replace(/\s*([{};,:])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const anchor = `${ui}[data-part-anchor]`;

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
  for (const part of contract.members.badge.parts) {
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
});

/**
 * `anchor` contains the root instead of sitting inside it, so it is the one
 * part that carries the family identifier itself. Every rule names both
 * attributes, which is what stops a rule meant for the box from reaching the
 * frame it sits in.
 */
test('names the family and the part together, so the frame is never the box', () => {
  for (const selector of normalized.matchAll(/(^|\})([^{}]+)\{/g)) {
    for (const part of (selector[2] ?? '').split(',')) {
      if (!part.includes(`[data-part-anchor]`) && !part.includes(`[data-part-root]`)) continue;
      assert.ok(part.includes(ui), `"${part.trim()}" reaches a part without naming the family`);
    }
  }
});

/**
 * A value is answered either by a rule of its own or by being the default the
 * base rule already states. Writing a rule for the default as well would put
 * the same five declarations in the sheet twice, and the second copy is the one
 * that goes stale.
 */
test('answers every value of every axis the contract names', () => {
  const owner = { placement: anchor, overlap: anchor };
  const { defaults } = contract.members.badge;
  for (const [axis, values] of Object.entries(contract.axes)) {
    if (axis === 'live') continue;
    for (const value of values) {
      const base = owner[axis] ?? root;
      const answered =
        normalized.includes(`${base}[data-${axis}='${value}']`) ||
        (defaults[axis] === value && normalized.includes(`${base}{`));
      assert.ok(answered, `Missing ${axis} ${value}`);
    }
  }
});

/**
 * `live` is the only axis with no paint: it decides a role, and a role is the
 * binding's to write. A rule keyed on it would be a second answer to a question
 * the accessibility tree already holds.
 */
test('leaves the announcement policy to the accessibility tree', () => {
  assert.ok(!normalized.includes(`[data-live=`), 'live must not be painted');
});

test('routes every tone through the same five local properties', () => {
  for (const tone of contract.axes.tone) {
    const body = tone === 'secondary' ? rule(root) : rule(`${root}[data-tone='${tone}']`);
    assert.ok(body, `Missing tone ${tone}`);
    for (const local of ['--_solid:', '--_on-solid:', '--_border:', '--_surface:', '--_text:']) {
      assert.ok(body.includes(local), `Tone ${tone} does not set ${local}`);
    }
  }
});

/**
 * A filled badge draws no rim: its edge is its own fill, so the chip is one
 * shape. The tinted and outlined ones draw the tone's `border` role, which is
 * also what keeps `soft` visible in `high-contrast`, where every tone surface
 * collapses to the page's own white.
 */
test('fills without a rim, and edges only what is not filled', () => {
  assert.ok(rule(`${root}[data-variant='solid']`).includes('background-color:var(--_solid'));
  assert.ok(rule(`${root}[data-variant='solid']`).includes('border-color:var(--_edge'));
  assert.ok(rule(root).includes('--_edge:var(--_solid)'));

  for (const variant of ['soft', 'outline']) {
    assert.ok(
      rule(`${root}[data-variant='${variant}']`).includes('border-color:var(--_border'),
      `${variant} does not take its edge from the tone`,
    );
  }
  assert.ok(rule(`${root}[data-variant='soft']`).includes('background-color:var(--_surface'));
  assert.ok(rule(`${root}[data-variant='outline']`).includes('background-color:transparent'));
});

/**
 * The one tone whose fill is the page's own colour: `#ffffff` in
 * `high-contrast`, 1.23:1 in `light`. It takes the `solid-hover` step so a
 * filled neutral badge is not the same rectangle as a tinted one, and it is the
 * only tone whose filled form keeps an edge.
 */
test('excepts the neutral tone, whose fill is the page', () => {
  assert.ok(rule(root).includes('--_solid:var(--slotted-tone-secondary-solid-hover)'));
  assert.equal(rule(`${root}[data-tone='secondary']`).trim(), '--_edge:var(--_border);');
  for (const tone of ['accent', 'success', 'warning', 'danger']) {
    assert.ok(
      !rule(`${root}[data-tone='${tone}']`).includes('--_edge:'),
      `${tone} draws a rim on a filled chip`,
    );
  }
});

/**
 * A flex container centres the line box, and a line box is not symmetric around
 * the letters inside it: measured on this family, a word with no descender sat
 * 2.19 pixels high in a 24-pixel badge. `text-box` centres the ink instead, and
 * it needs a block container — a flex container's text lives in an anonymous
 * item no selector can reach, which is why the part exists.
 */
test('gives the text a box of its own, and trims it where the engine can', () => {
  assert.ok(normalized.includes(`${ui} [data-part-label]{`));

  const guarded = normalized.split('@supports (text-box:trim-both cap alphabetic){')[1] ?? '';
  const supported = guarded.split('}')[0];
  assert.ok(supported.includes('text-box:trim-both cap alphabetic'), 'the trim is not guarded');
  /**
   * A box trimmed to the cap and the baseline leaves descenders and tall
   * diacritics outside itself, and the clip beheaded them. The padding buys the
   * clip region room and the negative margin spends none of the layout's.
   */
  assert.ok(supported.includes('padding-block:0.3em'));
  assert.ok(supported.includes('margin-block:-0.3em'));
});

/**
 * The dot is the only badge whose whole meaning is a graphic, so WCAG 2.2
 * 1.4.11 binds its edge. `--slotted-border-strong` is the one border token the
 * theme holds to 3:1 against the surface; the tone borders are held to nothing,
 * and `secondary` measures 2.56:1 in `light`.
 */
test('rims the dot with the one border the theme holds to a ratio', () => {
  assert.ok(
    rule(`${root}[data-shape='dot']`).includes(
      'border-color:var(--slotted-badge-dot-border-color,var(--slotted-border-strong',
    ),
  );
});

/** Type and glyph move with density; inset and gap are too small to. */
test('takes its type from the scale that answers density', () => {
  assert.ok(rule(root).includes('--_font-size:var(--slotted-control-font-size-md'));
  assert.ok(rule(root).includes('--_icon-size:var(--slotted-control-icon-size-sm'));
  assert.ok(
    rule(`${root}[data-size='sm']`).includes('--_font-size:var(--slotted-control-font-size-sm'),
  );
  assert.ok(
    rule(`${root}[data-size='lg']`).includes('--_font-size:var(--slotted-control-font-size-lg'),
  );
});

/**
 * No height token. The block size is the line box plus the inset, so a badge
 * cannot disagree with the type it holds, and the same sum is what makes a
 * one-figure pill a circle.
 */
test('derives its box from its own type rather than from a height', () => {
  const body = rule(root);
  assert.ok(body.includes('--_block-size:calc('));
  assert.ok(body.includes('min-block-size:var(--_block-size)'));
  assert.ok(body.includes('min-inline-size:var(--_block-size)'));
  assert.ok(!/--slotted-badge-height/.test(css), 'a height token would be a second answer');
});

/**
 * A badge holds a count, a status or a short piece of metadata, so a badge that
 * reflowed into a paragraph would have stopped being one: the length is the
 * content's error and the family reports it. The clipping is visual — the whole
 * string stays in the DOM, in the accessibility tree and findable by a page
 * search — which is what the briefing's rule protects. It forbids removing
 * content, not clipping it.
 */
test('keeps one line and clips it, rather than reflowing into a block', () => {
  assert.ok(rule(root).includes('white-space:nowrap'));
  assert.ok(!/overflow-wrap/.test(css), 'a badge does not break its own words');
  const label = rule(`${ui} [data-part-label]`);
  assert.ok(label.includes('overflow:hidden'));
  assert.ok(label.includes('text-overflow:ellipsis'));
  assert.ok(label.includes('min-inline-size:0'), 'the box cannot shrink, so nothing clips');
});

/** A count is short by construction and hangs outside its host's box. */
test('never clips the badge anchored to a corner', () => {
  assert.ok(rule(`${anchor} > ${root}`).includes('max-inline-size:none'));
});

test('counts in figures of one width', () => {
  assert.ok(rule(root).includes('font-variant-numeric:tabular-nums'));
});

/**
 * `translate` has no logical form, so the inline half of the overhang is
 * multiplied by the direction the frame is read in. Which corner and how far in
 * from it stay logical and mirror on their own.
 *
 * The page's own correction is inside the multiplied half rather than beside
 * it: a badge nudged two pixels into its host has to stay two pixels into it in
 * a mirrored document (BD1).
 */
test('mirrors the frame instead of shipping a second stylesheet', () => {
  assert.ok(rule(`${anchor}:dir(rtl)`).includes('--_dir:-1'));
  assert.ok(
    rule(`${anchor} > ${root}`).includes(
      'translate:calc((var(--_overhang-inline) + var(--_offset-inline)) * var(--_dir))' +
        ' calc(var(--_overhang-block) + var(--_offset-block))',
    ),
  );
  for (const physical of ['top:', 'right:', 'bottom:', 'left:']) {
    assert.ok(!normalized.includes(`;${physical}`), `the frame states ${physical}`);
  }
});

/**
 * The two the page states, and the two the sheet reads. Both default to nought,
 * so the frame that says nothing is the frame this family shipped before (BD1).
 */
test('takes the correction of the corner from a token on each axis', () => {
  const frame = rule(anchor);
  assert.ok(frame.includes('--_offset-inline:var(--slotted-badge-anchor-offset-x,0px)'));
  assert.ok(frame.includes('--_offset-block:var(--slotted-badge-anchor-offset-y,0px)'));
});

/** A badge over a card, a toolbar or a coloured row is not on the page's ground. */
test('separates the anchored badge from its host with a colour a theme can retune', () => {
  assert.ok(
    rule(`${anchor} > ${root}`).includes(
      'var(--slotted-badge-ring-color,var(--slotted-surface,Canvas))',
    ),
  );
});

/**
 * A badge is not a command. Nothing in the sheet may answer a pointer, which is
 * also why `states.test.mjs` has nothing to guard here.
 */
test('answers focus and refuses hover and press', () => {
  assert.ok(normalized.includes(`${root}:focus-visible{`));
  assert.ok(!/:hover/.test(css), 'a badge is not a command');
  assert.ok(!/:active/.test(css), 'a badge is not a command');
});

test('keeps an edge under forced colours, where every tone is discarded', () => {
  assert.ok(
    normalized.includes(`@media (forced-colors:active){${root}{border-color:currentColor`),
    'a solid, a soft and an outline badge are otherwise the same rectangle',
  );
});

/** The fragment is a third place the DOM is written, and it can drift. */
test('renders every part in the harness fragment', () => {
  for (const part of contract.members.badge.parts) {
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
});

/**
 * A dot says nothing a screen reader can read, so every scene that draws one
 * carries the words beside it. The reference pages document the same rule; this
 * is what keeps the harness from teaching the opposite.
 */
test('never draws a dot without the words it cannot say', () => {
  for (const [, name, scene = ''] of fragment.matchAll(
    /<section data-scene="([^"]+)"([\s\S]*?)<\/section>/g,
  )) {
    if (!/data-shape="dot"/.test(scene)) continue;
    assert.match(scene, /data-ui="visually-hidden"/, `the ${name} scene draws a dot and no words`);
  }
});

test('hands its glyph size to an icon placed in a slot', () => {
  // The icon family reads `--slotted-icon-size` from its container; a bare
  // glyph host reads the slot's font-size instead. Both are the slot's scale.
  const rule = normalized.split(`${ui} [data-part-end]{`)[1]?.split('}')[0] ?? '';
  assert.ok(rule.includes('--slotted-icon-size:var(--_icon-size)'));
  assert.ok(rule.includes('font-size:var(--_icon-size)'));
});
