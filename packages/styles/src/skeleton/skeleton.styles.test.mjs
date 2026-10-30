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
    new URL('../../../../specs/components/skeleton/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./skeleton.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./skeleton.harness.html', import.meta.url), 'utf8'),
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
const text = `${ui}[data-part-text]`;
const region = `${ui}[data-part-region]`;
const { defaults, parts } = contract.members.skeleton;

/**
 * Every rule in the sheet, keyed on the whole selector list rather than on a
 * prefix of it. Splitting on a prefix reads the wrong rule the moment one
 * selector list ends with another: `[data-part-line]` is the tail of the
 * base paint rule as well as a rule of its own, and the first version of this
 * file asserted the paragraph's geometry against the paint.
 */
const rules = collectRules(normalized);

/**
 * A one-level walk rather than a regular expression. Two attempts with a
 * pattern read the wrong rule: one matched a selector list by its tail, so
 * `[data-part-line]` found the base paint rule it is the end of, and the
 * next consumed each closing brace and so skipped every other rule.
 */
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

/** The declarations of the rule whose selector list is exactly `selector`. */
function rule(selector) {
  return rules.find((entry) => entry.selector === selector)?.body ?? '';
}

const paint = `${root}[data-loading],${text}[data-loading] [data-part-line]`;
const line = `${ui} [data-part-line]`;

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
 */
test('styles every part it paints, and leaves the announcement to the family that clips it', () => {
  for (const part of parts) {
    if (part === 'announcement') continue;
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
  assert.ok(
    !normalized.includes(`[data-part-announcement]`),
    'the announcement is clipped by visually-hidden, not by this sheet',
  );
  assert.match(fragment, /data-part="announcement"[^>]*|data-ui="visually-hidden"/);
});

/**
 * `region` and `text` contain roots rather than sitting inside them, so a rule
 * written for the box must never reach the frame around it. Both attributes on
 * every selector is what stops that, and it is the invariant `badge` learned
 * from the same shape.
 */
test('names the family and the part together, so the frame is never the box', () => {
  for (const { selector } of rules) {
    for (const part of selector.split(',')) {
      if (!/\[data-part-(root|text|region)\]/.test(part)) continue;
      assert.ok(part.includes(ui), `"${part.trim()}" reaches a part without naming the family`);
    }
  }
});

/**
 * `size` is answered only where it means something. It is the avatar scale, so
 * it sizes the two round shapes and nothing else; `text` takes its height from
 * the type around it and `block` from the consumer or the content it covers.
 * `live` decides a role rather than a paint, as it does in `badge`.
 */
test('answers every value of every axis that has a paint', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    if (axis === 'live') continue;
    for (const value of values) {
      if (axis === 'size') {
        for (const shape of contract.sizedShapes) {
          assert.ok(
            normalized.includes(`${root}[data-shape='${shape}'][data-size='${value}']`),
            `Missing size ${value} for ${shape}`,
          );
        }
        continue;
      }
      const answered =
        normalized.includes(`[data-${axis}='${value}']`) ||
        (defaults[axis] === value && normalized.includes(`${root}{`));
      assert.ok(answered, `Missing ${axis} ${value}`);
    }
  }
});

test('leaves the announcement policy to the accessibility tree', () => {
  assert.ok(!normalized.includes('[data-live='), 'live must not be painted');
});

/**
 * The fill means "a surface that is not available yet", which is what
 * `--slotted-disabled-background` already means — carried a little toward the
 * text colour, because in the dark scheme that token is one step from the
 * ground and a page of placeholders read as an empty page. The rim is the
 * second half of the same problem: in `high-contrast` the fill is the page's
 * own white, and the rim is what the box is left with.
 */
test('fills with the surface that is not available, and rims it for the scheme that has no fill', () => {
  const body = rule(paint);
  assert.ok(
    body.includes(
      '--_fill:var(--slotted-skeleton-fill,color-mix(in oklab,var(--slotted-disabled-background',
    ),
  );
  assert.ok(
    body.includes('--_edge:var(--slotted-skeleton-border-color,var(--slotted-border-subtle'),
  );
  assert.ok(body.includes('border:var(--slotted-skeleton-border-width'));
  assert.ok(body.includes('box-sizing:border-box'), 'the rim would grow the reserved geometry');
});

/**
 * The band is the fill carried further along the axis the fill was derived on,
 * which answers the objection this family recorded in August against having a
 * shimmer at all. It is darker than the fill in light and lighter in dark —
 * Ant Design's answer to the same problem, and the only direction that is a
 * direction in three schemes rather than two.
 */
test('derives the shimmer highlight instead of inventing a colour for it', () => {
  const body = rule(paint);
  assert.ok(body.includes('--_highlight:var(--slotted-skeleton-highlight-color,color-mix('));
  assert.ok(body.includes('color-mix(in oklab,var(--_fill) 86%,var(--slotted-text'));
  assert.ok(!/#[0-9a-f]{3,8}/i.test(declarations), 'a literal colour would be a scale of its own');
});

/**
 * The claim the family is built on: `n` rows occupy exactly the `n` line boxes
 * of the paragraph they stand in, at every density, because the row is `1lh`
 * and the bar inside it is `1em`. Every surveyed implementation types a pixel
 * height here instead.
 */
test('reserves exactly the line boxes the words will occupy', () => {
  assert.ok(rule(text).includes('grid-auto-rows:var(--slotted-skeleton-row-size,1lh)'));
  assert.ok(rule(line).includes('block-size:var(--slotted-skeleton-line-size,1cap)'));
  assert.ok(
    rule(`${root}[data-shape='text']`).includes('--_line:var(--slotted-skeleton-line-size,1cap)'),
  );
});

/**
 * One line is a sentence, not a paragraph that ran out. Chakra guards this in
 * TypeScript and Carbon does not guard it at all.
 */
test('shortens the last row only when there is more than one', () => {
  assert.ok(
    normalized.includes(`${ui} [data-part-line]:last-child:not(:only-child){`),
    'a lone row would be cut short',
  );
});

/** The bar sits on the optical centre of the type, not on its baseline. */
test('centres the inline bar on the cap line, as link does its marker', () => {
  assert.ok(rule(`${root}[data-shape='text']`).includes('vertical-align:calc(0.5cap'));
});

/**
 * A placeholder that resolves to nothing is a hole no capture and no reader
 * can point at, so a block with neither a stated height nor content is one
 * line tall.
 */
test('never resolves to an invisible box', () => {
  assert.ok(
    rule(`${root}[data-shape='block']`).includes(
      'min-block-size:var(--slotted-skeleton-min-block-size,1lh)',
    ),
  );
  assert.ok(rule(root).includes('min-block-size:var(--slotted-skeleton-border-width'));
});

/**
 * The covering form, told apart from the drawn one by the DOM rather than by
 * an attribute the binding would have to invent. `visibility` hides an element
 * child; a bare text node is not an element, and only the colour reaches it.
 */
test('takes the geometry of the content it covers, and hides both kinds of child', () => {
  const body = rule(`${root}[data-loading]:not(:empty)`);
  assert.ok(body.includes('block-size:var(--slotted-skeleton-block-size,auto)'));
  assert.ok(body.includes('inline-size:var(--slotted-skeleton-inline-size,auto)'));
  assert.ok(body.includes('color:transparent'));
  assert.ok(rule(`${root}[data-loading]:not(:empty) > *`).includes('visibility:hidden'));
});

/**
 * Loaded, the element stops taking part in layout rather than being removed,
 * so the content lands where it would have landed with no placeholder at all
 * and nothing the consumer wrote is remounted on the way through.
 */
test('steps out of layout once the content has arrived', () => {
  assert.ok(
    normalized.includes(`${root}:not([data-loading]),${text}:not([data-loading]){display:contents`),
  );
});

const layers = (animation) =>
  `${root}[data-animation='${animation}'][data-loading]::after,${ui}[data-animation='${animation}'][data-loading] [data-part-line]::after`;

/** The body of a `@keyframes` block, which the one-level walk does not reach. */
function keyframes(name) {
  const start = normalized.indexOf(`@keyframes ${name}{`);
  assert.ok(start !== -1, `@keyframes ${name} is declared`);
  let depth = 0;
  for (let index = start; index < normalized.length; index += 1) {
    if (normalized[index] === '{') depth += 1;
    if (normalized[index] === '}' && --depth === 0) return normalized.slice(start, index + 1);
  }
  return '';
}

/**
 * The first loop animated a registered, inherited custom property, and every
 * placeholder restyled on every frame — 2.7 seconds of style in every 3 on the docs'
 * data-grid page with one loading grid on it. A keyframe that holds only
 * `opacity` or `transform` is one the compositor runs without the page.
 */
test('animates only what the compositor runs, on a layer over the fill', () => {
  assert.ok(!/@property/.test(css), 'an animated custom property restyles every frame');
  const frames = keyframes('slotted-skeleton-pulse') + keyframes('slotted-skeleton-sweep');
  for (const declaration of frames.match(/[\w-]+(?=:)/g) ?? []) {
    assert.ok(['opacity', 'transform'].includes(declaration), `a keyframe animates ${declaration}`);
  }
  for (const animation of ['pulse', 'shimmer']) {
    const body = rule(
      `${root}[data-animation='pulse'][data-loading]::after,${root}[data-animation='shimmer'][data-loading]::after,${ui}[data-animation='pulse'][data-loading] [data-part-line]::after,${ui}[data-animation='shimmer'][data-loading] [data-part-line]::after`,
    );
    assert.ok(
      body.includes('position:absolute'),
      `the ${animation} layer is not drawn over the box`,
    );
    assert.ok(
      body.includes('inset-block:0;inset-inline:0'),
      'the layer covers the box inside its rim',
    );
  }
  assert.ok(
    rule(
      `${root}[data-loading]:not([data-animation='none']),${text}[data-loading]:not([data-animation='none']) [data-part-line]`,
    ).includes('overflow:clip'),
    'the band would draw past the corners of the box',
  );
});

/**
 * Boxes drawn in one render start in one frame. A box mounted later starts its
 * own cycle, and the phase is how a consumer — or a capture — names the point
 * it starts at.
 */
test('starts a box at the phase it is given', () => {
  assert.ok(
    normalized.includes(
      'animation-delay:calc(var(--slotted-skeleton-phase,0) * var(--slotted-duration-loop-slow) * -1)',
    ),
  );
});

test('takes its duration from the motion scale rather than stating one', () => {
  assert.ok(!/\d+(\.\d+)?m?s(?![\w-])/.test(css), 'a literal duration escapes reduced motion');
  assert.ok(css.includes('--slotted-duration-loop-slow'));
});

/**
 * A reset under `reduce` loses on specificity to the rules that select a
 * layer (`[data-ui][data-part][data-animation][data-loading]::after` against
 * `[data-ui]::after`), so the loop ran under reduced motion. The loop is named
 * only where motion is allowed.
 */
test('starts the loop only where reduced motion is not asked for', () => {
  const starts = normalized.match(/animation-name:slotted-skeleton-/g) ?? [];
  const query = normalized.slice(
    normalized.indexOf('@media (prefers-reduced-motion:no-preference)'),
  );
  const guarded =
    query.slice(0, query.indexOf('}}') + 2).match(/animation-name:slotted-skeleton-/g) ?? [];
  assert.equal(starts.length, 2, 'the pulse and the sweep are named');
  assert.equal(guarded.length, starts.length, 'a loop starts outside no-preference');
  assert.ok(
    !/animation:slotted-skeleton/.test(normalized),
    'a shorthand would name a loop unguarded',
  );
});

test('stops the endless loop under reduced motion rather than shortening it', () => {
  const query = normalized.slice(normalized.indexOf('@media (prefers-reduced-motion:reduce)'));
  assert.ok(
    query.startsWith(
      `@media (prefers-reduced-motion:reduce){${ui}::after,${ui} [data-part-line]::after{animation:none`,
    ),
  );
});

/**
 * The theme remaps the fill and the rim on the family's behalf. A
 * `background-image` is not remapped, so the sweep is the one thing this
 * family has to withdraw itself.
 */
test('withdraws the sweep under forced colours, where a gradient is not replaced', () => {
  const query = normalized.slice(normalized.indexOf('@media (forced-colors:active)'));
  assert.ok(
    query.includes(
      `${root}[data-loading]::after,${text}[data-loading] [data-part-line]::after{background-image:none`,
    ),
  );
});

/** The sweep runs with the text; neither `transform` nor a gradient has a logical form. */
test('mirrors the sweep instead of shipping a second stylesheet', () => {
  assert.ok(
    rule(
      `${root}[data-animation='shimmer'][data-loading]:dir(rtl)::after,${ui}[data-animation='shimmer'][data-loading]:dir(rtl) [data-part-line]::after`,
    ).includes('animation-direction:reverse'),
  );
});

/**
 * The band has to be on the box for most of the cycle. The band is the middle
 * 72 per cent of a layer the box's size, travelling one box either side, so it
 * enters at one edge and leaves at the other. A first version of the sweep
 * moved the band outside the box for most of every cycle.
 */
test('carries the band across the box rather than past it', () => {
  const body = rule(layers('shimmer'));
  assert.ok(body.includes('transparent 14%,var(--_highlight) 50%,transparent 86%'));
  const sweep = keyframes('slotted-skeleton-sweep');
  assert.match(sweep, /from\{transform:translateX\(-100%\);?\}/);
  assert.match(sweep, /to\{transform:translateX\(100%\);?\}/);
});

/**
 * The pulse fades the trough over the fill, never the box. Fading the box took
 * its rim with it, and in the dark scheme the shape came within a hair of the
 * ground once a cycle and back — which is what a reader sees as a flicker.
 */
test('dims the fill without fading the box off the page', () => {
  const body = rule(layers('pulse'));
  assert.ok(body.includes('background-color:var(--_trough)'));
  assert.ok(body.includes('opacity:0'));
  const boxes = rules.filter(
    (entry) => !entry.selector.includes('::after') && !/^(from|to|\d+%)$/.test(entry.selector),
  );
  for (const entry of boxes) {
    assert.ok(!/opacity/.test(entry.body), `${entry.selector} fades the box and its rim`);
  }
});

/**
 * A region with no definite inline size is a flex item that shrinks to content
 * whose content is a percentage of it. Measured at two pixels inside a
 * 599-pixel column before this rule existed.
 */
test('never lets the region collapse to its own content', () => {
  assert.ok(
    rule(region).includes('inline-size:var(--slotted-skeleton-inline-size,100%)'),
    'a region inside a flex column takes every placeholder in it down with it',
  );
  assert.ok(rule(region).includes('min-inline-size:0'));
});

/** A placeholder is furniture. Nothing in the sheet may answer a pointer. */
test('answers no pointer at all', () => {
  assert.ok(!/:hover/.test(css), 'a placeholder is not a control');
  assert.ok(!/:active(?![-\w])/.test(css), 'a placeholder is not a control');
  assert.ok(!/:focus/.test(css), 'a placeholder is never focused');
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
});

/**
 * The two states the family can be in, both photographed. A family that paints
 * a state and never captures it has not been looked at, and `loaded` is the
 * easy one to forget because it is the state in which the family draws nothing.
 */
test('stages the loaded state as well as the loading one', () => {
  assert.match(fragment, /data-scene="loaded"/);
  assert.match(fragment, /data-loading=""/);
});

/**
 * Every placeholder in the fragment is out of the accessibility tree, and
 * every one inside a region is out of the tab order too. The reference pages
 * document the rule; this is what stops the harness teaching the opposite.
 */
test('hides every placeholder it renders, and makes a loading region unreachable', () => {
  for (const [, attributes] of fragment.matchAll(/<(?:span|div)([^>]*data-loading=""[^>]*)>/g)) {
    if (/data-part="region"/.test(attributes)) {
      assert.match(attributes, /aria-busy="true"/, 'a loading region does not report itself busy');
      continue;
    }
    assert.match(attributes, /aria-hidden="true"/, 'a placeholder is read out as content');
  }
  /**
   * Scene by scene rather than by matching the region's own closing tag: the
   * first version of this assertion keyed on the fragment's indentation, which
   * is Prettier's decision and not this family's.
   */
  for (const [, name, scene = ''] of fragment.matchAll(
    /<section data-scene="([^"]+)"([\s\S]*?)<\/section>/g,
  )) {
    if (!/data-part="region"[^>]*data-loading=""/.test(scene.replace(/\n\s*/g, ' '))) continue;
    for (const [, attributes] of scene.matchAll(/<(?:span|div)([^>]*data-loading=""[^>]*)>/g)) {
      if (/data-part="region"/.test(attributes)) continue;
      assert.match(
        attributes,
        /\binert\b/,
        `the ${name} scene lets focus fall into content that is not ready`,
      );
    }
  }
});
