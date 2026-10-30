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
    new URL('../../../../specs/components/avatar/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./avatar.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./avatar.harness.html', import.meta.url), 'utf8'),
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

/** Every rule in the sheet, as a selector list and the declarations it carries. */
const rules = [...normalized.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter(([, selector]) => !selector.includes('@'))
  .map(([, selector, body]) => ({
    selectors: selector.split(',').map((one) => one.trim()),
    body,
  }));

/** The declarations of the first rule whose selector list names `selector`. */
function rule(selector) {
  return rules.find((candidate) => candidate.selectors.includes(selector))?.body ?? '';
}

/** Whether any rule in the sheet is keyed on `selector`. */
function selects(selector) {
  return rules.some((candidate) => candidate.selectors.includes(selector));
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${root}{`), 'the family has no base rule keyed on data-ui');
});

test('styles every part the contract declares', () => {
  for (const part of contract.members.avatar.parts) {
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
});

test('names the family and the part together, so a rule for the box stays on the box', () => {
  for (const selector of normalized.matchAll(/(^|\})([^{}]+)\{/g)) {
    for (const part of (selector[2] ?? '').split(',')) {
      if (!part.includes(`[data-part-root]`)) continue;
      assert.ok(part.includes(ui), `"${part.trim()}" reaches the root without naming the family`);
    }
  }
});

/**
 * A value is answered either by a rule of its own or by being the default the
 * base rule already states. `tone: auto` is the exception, and it is resolved
 * before the DOM: the binding hashes the name into one of the five and writes
 * that, so `data-tone="auto"` never reaches a stylesheet.
 */
test('answers every value of every axis the contract names', () => {
  const { defaults } = contract.members.avatar;
  /**
   * The base rule states the neutral tone, so `secondary` needs no rule of its
   * own; `idle`, `loading` and `error` all render the same avatar, because what
   * they have in common is that there is no picture to show yet.
   */
  const stated = { tone: 'secondary' };
  for (const [axis, values] of Object.entries(contract.axes)) {
    for (const value of values) {
      if (axis === 'tone' && value === 'auto') continue;
      if (axis === 'status' && value !== 'loaded') continue;
      if (stated[axis] === value) continue;
      const answered =
        rules.some((candidate) =>
          candidate.selectors.some((one) => one.includes(`[data-${axis}='${value}']`)),
        ) || defaults[axis] === value;
      assert.ok(answered, `Missing ${axis} ${value}`);
    }
  }
});

/**
 * `auto` is a value the binding resolves and never a value the sheet paints. A
 * rule keyed on it would be a second answer to a question the hash in
 * `@slotted/core/identity` already settles, and the two would disagree the
 * first time one of them changed.
 */
test('never paints the derived tone, because the binding has already resolved it', () => {
  assert.ok(!normalized.includes(`[data-tone='auto']`));
});

test('routes every tone through the same six local properties', () => {
  for (const tone of contract.autoTonePalette) {
    const body = tone === 'secondary' ? rule(root) : rule(`${root}[data-tone='${tone}']`);
    assert.ok(body, `Missing tone ${tone}`);
    for (const local of [
      '--_solid:',
      '--_solid-edge:',
      '--_on-solid:',
      '--_border:',
      '--_surface:',
      '--_text:',
    ]) {
      assert.ok(body.includes(local), `Tone ${tone} does not set ${local}`);
    }
  }
});

/**
 * The neutral tone twice over, both times for the reason `badge` recorded:
 * `secondary.solid` is the surface colour in all three schemes, so a filled
 * neutral avatar with that fill would be a hole in the page, and with no rim it
 * would be a smudge in `high-contrast`, where its fill is `#e6e6e6` on white.
 */
test('excepts the neutral tone, whose fill is the page it sits on', () => {
  assert.ok(rule(root).includes('--_solid:var(--slotted-tone-secondary-solid-hover)'));
  assert.ok(rule(root).includes('--_solid-edge:var(--_border)'));
  for (const tone of ['accent', 'success', 'warning', 'danger']) {
    assert.ok(
      rule(`${root}[data-tone='${tone}']`).includes(
        `--_solid-edge:var(--slotted-tone-${tone}-solid)`,
      ),
      `${tone} draws a rim around its own fill`,
    );
  }
});

/**
 * One length decides the box, and everything else the family scales is a
 * fraction of it. A second scale would be a set of sizes that could disagree
 * with the first one, which is what the size steps in the theme exist to
 * prevent.
 */
test('derives its type, its glyph and its corner from the one length', () => {
  const body = rule(root);
  assert.ok(body.includes('--_size:var(--slotted-avatar-size,var(--slotted-avatar-size-md'));
  assert.ok(body.includes('block-size:var(--_size)'));
  assert.ok(body.includes('inline-size:var(--_size)'));
  assert.ok(/--_initials-size:var\(--slotted-avatar-initials-size,calc\(var\(--_size\)/.test(body));
  assert.ok(/--_glyph-size:var\(--slotted-avatar-glyph-size,calc\(var\(--_size\)/.test(body));
  assert.ok(
    /--_radius:var\(--slotted-avatar-radius,round\(nearest,calc\(var\(--_size\)/.test(
      rule(`${root}[data-shape='square']`),
    ),
  );
});

/**
 * Each step declares the public token rather than the private one, which is
 * what makes an instance's own size beat a container's opinion of it: a
 * declaration on the element wins over one inherited into it. The mechanism
 * `icon` established in wave 1.
 */
test('scales through the token a container and an instance can both reach', () => {
  for (const size of contract.axes.size) {
    assert.ok(
      rule(`${root}[data-size='${size}']`).includes(
        `--slotted-avatar-size:var(--slotted-avatar-size-${size}`,
      ),
      `${size} does not declare the public size token`,
    );
  }
});

/**
 * The picture lies over the initials rather than replacing them, so it can
 * arrive rather than appear. Both move on the motion scale, which the theme
 * collapses under `prefers-reduced-motion`.
 */
test('crosses the picture over the letters instead of swapping them', () => {
  const image = rule(`${ui} [data-part-image]`);
  assert.ok(image.includes('position:absolute'));
  assert.ok(image.includes('opacity:0'));
  assert.ok(image.includes('object-fit:cover'));
  assert.ok(image.includes('transition:opacity var(--slotted-duration-short)'));
  assert.ok(rule(`${ui}[data-status='loaded'] [data-part-image]`).includes('opacity:1'));
  assert.ok(rule(`${ui}[data-status='loaded'] [data-part-fallback]`).includes('opacity:0'));
  assert.ok(
    rule(root).includes('transition:border-color'),
    'the edge changes colour when the picture arrives and must cross with it',
  );
});

/**
 * The last step of the fallback order, and the only artwork the family owns.
 * The binding draws it as the `person` glyph in an `Icon`; the sheet only sizes
 * the icon from the slot, and paints nothing of its own.
 */
test('sizes the person glyph from the slot, and paints no icon of its own', () => {
  assert.ok(rule(`${ui} [data-part-fallback]`).includes('--slotted-icon-size:var(--_glyph-size)'));
  assert.ok(!normalized.includes('mask-image'), 'the glyph is an element, not a mask');
});

/**
 * A flex container centres the line box, and a line box is not symmetric around
 * the letters inside it. Measured on this family with the Geist face at
 * `compact`, two initials sat 0.56 pixels high in the 32-pixel disc and 0.68
 * high in the 26-pixel one; at `comfortable`, 1.13 high in the 64-pixel one.
 * `text-box` centres the ink instead, and it needs a block container — a flex
 * container's text lives in an anonymous item no selector can reach. The
 * fallback has no label part to carry the trim, so the fallback itself becomes
 * the block, and only when it holds nothing but text: a projected logo is not
 * a line of type, and trimming the line it sits in would move it.
 */
test('centres the ink of the initials rather than their line box, where the engine can', () => {
  const guarded = normalized.split('@supports (text-box:trim-both cap alphabetic){')[1] ?? '';
  const trimmed = guarded.split('}')[0];
  assert.ok(
    trimmed.startsWith(`${ui} [data-part-fallback]:not(:has(> *)){`),
    'the trim applies to the fallback, and only to one holding text alone',
  );
  assert.ok(trimmed.includes('text-box:trim-both cap alphabetic'), 'the trim is not guarded');
  assert.ok(trimmed.includes('display:block'), 'the trim needs a block container');
  assert.ok(
    trimmed.includes('align-content:center'),
    'a block centres its line with align-content',
  );
  assert.ok(trimmed.includes('text-align:center'));
});

/**
 * WCAG 2.2 2.5.8. The overlay is out of flow and stated from all four edges at
 * once, which is the only form of it that stays centred.
 *
 * A size with `margin: auto` was the first form, and it centres a box that
 * fits. A box wider than the space it is placed in is over-constrained, and the
 * engine then keeps the start margin and puts the whole difference on the end
 * one: the 24-pixel target sat against the leading edge of a 20-pixel avatar
 * and hung four pixels off the trailing one. `tools/harness/out/review-loop/
 * av1/target.mjs` read the target as 22 × 22 at `compact` and 20 × 20 at
 * `dense` — the box, not the target — because the two corners on the leading
 * side answered no press (AV1).
 */
test('grows the hit area of an interactive avatar to the target minimum', () => {
  const hit = rule(`${root}:any-link::after`);
  assert.ok(hit.includes('inset:min(0px,calc((100% - var(--slotted-target-min'));
  assert.ok(hit.includes('position:absolute'));
  assert.ok(!hit.includes('margin:auto'), 'an over-constrained box is not centred by auto margins');
  for (const selector of [`button${ui}[data-part-root]::after`, `${root}[tabindex]::after`]) {
    assert.ok(selects(selector), `${selector} does not grow its hit area`);
  }
});

/**
 * The other half of AV1. The target hangs outside the box by design, and a box
 * that lets content out is a different claim: `audit.mjs` withdraws an overflow
 * finding against a box that states its content is clipped, and reports one
 * against every box that does not.
 *
 * The margin is what keeps the clip off the target. `calc()` is rejected by
 * this property in Chrome and computes to nought, so the length is written
 * plain.
 */
test('clips the interactive box rather than letting the target read as content', () => {
  for (const selector of [`${root}:any-link`, `button${ui}[data-part-root]`, `${root}[tabindex]`]) {
    const interactive = rule(selector);
    assert.ok(interactive.includes('overflow:clip'), `${selector} does not clip its content`);
    assert.ok(
      interactive.includes('overflow-clip-margin:var(--slotted-target-min'),
      `${selector} clips its own target`,
    );
    assert.ok(
      !/overflow-clip-margin:calc/.test(interactive),
      'calc() in overflow-clip-margin computes to nought',
    );
  }
});

/**
 * A picture is not a command. The three selectors are the ones the browser
 * itself treats as interactive, and each carries its own guard because
 * `states.test.mjs` reads one comma-separated selector at a time.
 */
test('answers hover only where the element is interactive, and never when disabled', () => {
  for (const selector of [
    `${root}:any-link:not([data-disabled]):hover`,
    `button${ui}[data-part-root]:not([data-disabled]):hover`,
    `${root}[tabindex]:not([data-disabled]):hover`,
  ]) {
    assert.ok(selects(selector), `${selector} is missing`);
  }
  for (const { selectors } of rules) {
    for (const selector of selectors) {
      if (/:active\b/.test(selector)) {
        assert.ok(
          /:not\(\[data-disabled\]\):active$/.test(selector),
          `${selector} presses a disabled avatar`,
        );
      }
    }
  }
});

/**
 * `render` makes the root a link or a button, and a command answers the press
 * with something other than its hover: a deeper state layer on the letters, a
 * thicker ring around a photograph.
 */
test('answers the press differently from the hover', () => {
  const hover = rule(`${root}:any-link:not([data-disabled]):hover`);
  const active = rule(`${root}:any-link:not([data-disabled]):active`);
  assert.ok(hover.includes('--slotted-avatar-state-layer-hover'));
  assert.ok(active.includes('--slotted-avatar-state-layer-active'));
  assert.ok(
    rule(`${ui}[data-status='loaded']:any-link:not([data-disabled]):active`).includes(
      '--slotted-avatar-ring-width:var(--slotted-border-width-thick',
    ),
  );
});

test('paints focus wherever the element turned out to be focusable', () => {
  assert.ok(rule(`${root}:focus-visible`).includes('outline:var(--slotted-focus-ring-width'));
});

/**
 * The photograph loses its hue and part of its opacity together. Grey alone
 * kept every luminance, so a deactivated portrait was the strongest thing in a
 * row of disabled avatars.
 */
test('switches a disabled avatar off without making it illegible', () => {
  const body = rule(`${root}[data-disabled]`);
  assert.ok(body.includes('--_surface:var(--slotted-disabled-background'));
  assert.ok(body.includes('--_text:var(--slotted-disabled-foreground'));
  assert.ok(body.includes('--_edge:var(--slotted-disabled-border'));
  assert.ok(
    rule(`${root}[data-disabled] [data-part-image]`).includes(
      'filter:var(--slotted-avatar-disabled-image-filter,grayscale(1) opacity(0.5))',
    ),
  );
});

/**
 * Stronger states are written after weaker ones at the same weight, so source
 * order carries the precedence `STATE_PRECEDENCE` declares rather than a
 * selector counted up to beat its neighbour.
 */
test('orders the edge rules the way the state precedence reads', () => {
  const at = (selector) => normalized.indexOf(`${selector}{`);
  assert.ok(at(`${root}[data-variant='solid']`) < at(`${root}[data-status='loaded']`));
  assert.ok(at(`${root}[data-status='loaded']`) < at(`${root}[data-disabled]`));
});

/**
 * The edge is a pseudo-element and not a border: a border would change the box
 * the picture is cropped into, and an inset shadow paints beneath content, so
 * it would disappear under the photograph.
 */
/**
 * The rim used to be a pseudo-element carrying `z-index: 1`, and that promotes
 * it into the nearest ancestor stacking context rather than into its own: in a
 * group every member's rim was drawn across the face on top of it. It is the
 * element's own border now, and the isolation keeps the picture in.
 */
test('keeps what it paints inside itself, so a neighbour is never drawn through', () => {
  const body = rule(root);
  assert.ok(body.includes('isolation:isolate'));
  assert.ok(body.includes('position:relative'));
  assert.ok(!selects(`${root}::before`), 'the rim must not be a second rounded shape');
});

/**
 * One border on one box has one curve. Drawn as a pseudo-element over the disc
 * it was two rounded shapes rasterised apart, and two antialiased curves over
 * the same path do not agree in the sub-pixel — a hairline of the page showed
 * through between the fill and its rim.
 *
 * Three longhands rather than the shorthand: an undefined colour makes a
 * `var()` shorthand invalid at computed-value time, and the width would fall
 * back to `medium` rather than to the family's own.
 */
test('draws its edge as its own border, on the box it already has', () => {
  const body = rule(root);
  assert.ok(body.includes('border-color:var(--_edge)'));
  assert.ok(body.includes('border-style:solid'));
  assert.ok(body.includes('border-width:var(--_edge-width)'));
  assert.ok(body.includes('box-sizing:border-box'), 'the rim must not change the size');
  assert.ok(body.includes('transition:border-color'), 'the rim crosses with the picture');
});

/**
 * The ring is off until a container asks for it, because a lone avatar overlaps
 * nothing. `avatar-group` is the container that asks.
 */
test('keeps the ring at nothing until something it overlaps turns it on', () => {
  assert.ok(rule(root).includes('--_ring-width:var(--slotted-avatar-ring-width,0)'));
  assert.ok(
    rule(root).includes('--_ring-color:var(--slotted-avatar-ring-color,var(--slotted-surface'),
  );
});

/**
 * The one rule a family may write for forced colours: the theme maps every tone
 * ground to `ButtonFace` or `Canvas`, so a tinted avatar and a filled one
 * become the same disc and `currentColor` is the only paint left that separates
 * a face from the page.
 */
test('keeps an edge when the operating system replaces the palette', () => {
  const forced = normalized.split('@media (forced-colors:active){')[1] ?? '';
  assert.ok(forced.includes('--_edge:currentColor'));
});

test('the harness fragment exercises every part and every declared state', () => {
  for (const part of contract.members.avatar.parts) {
    assert.match(fragment, new RegExp(`data-part="${part}"`), `no scene renders the ${part} part`);
  }
  for (const status of contract.axes.status) {
    assert.match(fragment, new RegExp(`data-status="${status}"`), `no scene renders ${status}`);
  }
  for (const size of contract.axes.size) {
    assert.match(fragment, new RegExp(`data-size="${size}"`), `no scene renders ${size}`);
  }
  for (const shape of contract.axes.shape) {
    assert.match(fragment, new RegExp(`data-shape="${shape}"`), `no scene renders ${shape}`);
  }
  for (const variant of contract.axes.variant) {
    assert.match(fragment, new RegExp(`data-variant="${variant}"`), `no scene renders ${variant}`);
  }
  assert.match(fragment, /data-disabled=""/);
  assert.match(fragment, /<a\b[^>]*data-ui="avatar"/, 'no scene renders an avatar that navigates');
  assert.match(fragment, /<button\b[^>]*data-ui="avatar"/, 'no scene renders an avatar that acts');
});
