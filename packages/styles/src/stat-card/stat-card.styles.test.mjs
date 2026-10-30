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
    new URL('../../../../specs/components/stat-card/contract.json', import.meta.url),
    'utf8',
  ),
);
const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const css = readFileSync(new URL('./stat-card.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./stat-card.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const { parts } = contract.members['stat-card'];

/** Every innermost rule, with the at-rule it sits in. */
function collectRules(sheet) {
  const collected = [];
  const stack = [];
  let selector = '';
  for (let index = 0; index < sheet.length; index += 1) {
    const character = sheet[index];
    if (character === '}') {
      stack.pop();
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
      /* A rule inside the family's `@scope` names its root `:scope`; the
         assertions name it by its identifier, which is the same element. */
      const scoped = stack.some((frame) => frame.startsWith('@scope'));
      collected.push({
        selector: scoped
          ? selector
              .trim()
              .split(',')
              .map((item) => item.replace(/^:scope/, ui))
              .join(',')
          : selector.trim(),
        body: sheet.slice(index + 1, close),
        scope:
          stack.find((frame) => frame.startsWith('@media') || frame.startsWith('@container')) ?? '',
      });
      index = close;
      selector = '';
    } else {
      stack.push(selector.trim());
      selector = '';
    }
  }
  return collected;
}

const rules = collectRules(normalized);
const rule = (selector, scope = '') =>
  rules.find((entry) => entry.selector === selector && entry.scope === scope);
const body = (selector, scope) => rule(selector, scope)?.body ?? '';

test('lives in the component layer', () => {
  assert.match(css, /^@layer slotted\.components \{/m);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(rule(ui));
});

test('styles every part the contract declares, and the harness renders each', () => {
  for (const part of parts) {
    if (part === 'root') continue;
    assert.ok(normalized.includes(`[data-part-${part.toLowerCase()}]`), `${part} is never painted`);
    assert.ok(fragment.includes(`data-part="${part}"`), `${part} never appears in the harness`);
  }
});

/**
 * The root is the query container and the body is the grid, one element in.
 * `container-type: inline-size` makes an element a container for its
 * descendants and not for itself (`docs/build-briefing.md`).
 */
test('measures itself on the root and lays out one element in', () => {
  const root = body(ui);
  assert.ok(root.includes('container-type:inline-size'));
  assert.ok(root.includes('container-name:stat-card'));
  assert.ok(root.includes('display:flex'));
  assert.ok(root.includes('flex-direction:column'));
  assert.ok(body(`${ui} [data-part-body]`).includes('display:grid'));
  assert.ok(body(`${ui} [data-part-body]`).includes('flex:1 1 auto'));
});

/**
 * The figure's column is floored at its min-content and the trend's column
 * shrinks to nothing: a value is never broken to make room for a chart, and
 * the trend gives way instead.
 */
test('gives the value its width and lets the trend give way', () => {
  const grid = body(`${ui} [data-part-body]`);
  assert.ok(
    grid.includes('grid-template-columns:minmax(min-content,1fr) minmax(0,var(--_trend-size))'),
  );
  assert.ok(body(`${ui} [data-part-value]`).includes('overflow-wrap:break-word'));
  assert.doesNotMatch(body(`${ui} [data-part-value]`), /anywhere/);
});

/**
 * The figure sits at the top of the row that grows and the trend at the
 * bottom when stacked, so a row of cards stretched to one height keeps its
 * values level at the top and its charts level at the bottom.
 */
test('levels a row of cards: figures at the top, stacked trends at the bottom', () => {
  assert.ok(body(`${ui} [data-part-body]`).includes('grid-template-rows:auto minmax(0,1fr) auto'));
  assert.ok(body(`${ui} [data-part-figure]`).includes('align-self:start'));
  assert.ok(body(`${ui} [data-part-trend]`).includes('align-self:stretch'));
  assert.ok(body(`${ui}[data-layout='stacked'] [data-part-trend]`).includes('align-self:end'));
});

/**
 * Beside the figure the trend takes the figure's height, floored at the
 * sparkline's step; on the last row it bleeds through the inset to the card's
 * edges and takes a height of its own.
 */
test('sizes the trend to the figure beside it and bleeds it to the edges below it', () => {
  const beside = body(`${ui} [data-part-trend] > *`);
  assert.ok(beside.includes('block-size:auto'));
  assert.ok(beside.includes('min-block-size:var(--_trend-floor)'));
  for (const scope of [undefined, '@container stat-card (max-width:219px)']) {
    const selector = scope
      ? `${ui} [data-part-trend]`
      : `${ui}[data-layout='stacked'] [data-part-trend]`;
    const below = body(selector, scope);
    assert.ok(below.includes('margin-inline:calc(-1 * var(--_inset-inline))'));
    assert.ok(below.includes('margin-block-end:calc(-1 * var(--_inset-block))'));
    assert.ok(below.includes('overflow:clip'));
    assert.ok(
      body(selector.replace('[data-part-trend]', '[data-part-trend] > *'), scope).includes(
        'block-size:var(--_trend-block)',
      ),
    );
  }
  /* The message comes before the trend, so the trend is the last row and its
     bleed meets the bottom edge. */
  assert.match(body(`${ui}[data-layout='stacked'] [data-part-body]`), /'message'\s*'trend'/);
});

test('stacks the trend under the figure below 220 pixels, and steps the value down', () => {
  const scope = '@container stat-card (max-width:219px)';
  assert.ok(body(`${ui} [data-part-body]`, scope).includes("'trend'"));
  assert.ok(body(`${ui} [data-part-trend]`, scope).includes('align-self:end'));
  assert.ok(body(`${ui} [data-part-value]`, scope).includes('font-size:var(--_value-size-narrow)'));
});

/** A trend narrower than forty pixels is a smear, and the region hides it. */
test('hides a trend that was left no room', () => {
  const trend = body(`${ui} [data-part-trend]`);
  assert.ok(trend.includes('container-type:inline-size'));
  assert.equal(
    body(`${ui} [data-part-trend] > *`, '@container stat-card-trend (max-width:39px)'),
    'visibility:hidden;',
  );
});

test('answers every fill, and lets plain give up its frame and its inset', () => {
  for (const fill of contract.axes.fill) {
    if (fill === 'outline') continue;
    assert.ok(rule(`${ui}[data-fill='${fill}']`), `${fill}`);
  }
  const plain = body(`${ui}[data-fill='plain']`);
  assert.ok(plain.includes('--_surface:transparent'));
  assert.ok(plain.includes('--_edge:transparent'));
  assert.ok(plain.includes('--_inset-inline:0'));
});

test('scales the figure by size, reaching the new 4xl step at lg', () => {
  assert.ok(body(`${ui}[data-size='sm']`).includes('--slotted-font-size-2xl'));
  assert.ok(body(ui).includes('--slotted-font-size-3xl'));
  assert.ok(body(`${ui}[data-size='lg']`).includes('--slotted-font-size-4xl'));
});

/**
 * The delta wears the tone's text role and nothing else: no chip, no fill.
 * The mark is one glyph turned over for a fall and `minus` for no change; the
 * binding renders the glyph, and the sheet only sizes and turns its box.
 */
test('paints the delta in the tone it earned and turns one glyph for the fall', () => {
  for (const tone of contract.axes.tone) {
    assert.ok(rule(`${ui} [data-part-delta][data-tone='${tone}']`), tone);
  }
  const indicator = body(`${ui} [data-part-indicator]`);
  assert.ok(indicator.includes('--slotted-icon-size:var(--_indicator-size)'));
  assert.doesNotMatch(indicator, /mask|background/);
  /* The fall is the rise reflected across the horizontal axis; the mirror in
     a right-to-left document is the `directional` icon box, not the sheet. */
  assert.equal(
    body(`${ui} [data-part-delta][data-trend='down'] [data-part-indicator] > [data-ui-icon]`),
    'rotate:x 180deg;',
  );
  assert.doesNotMatch(css, /\bscale\s*:/);
  assert.doesNotMatch(body(`${ui} [data-part-delta]`), /background/);
});

/** The harness draws the glyph each trend's binding renders. */
test('draws trending-up for a rise or a fall and minus for no change', () => {
  const deltas = [
    ...fragment.matchAll(
      /data-trend="(up|down|flat)"[^>]*>\s*<span data-part="indicator" aria-hidden="true"\s*>\s*<span data-ui="icon" data-part="root" aria-hidden="true"\s*>\s*<svg data-part="glyph" data-glyph="([a-z-]+)"/g,
    ),
  ];
  assert.equal(deltas.length, (fragment.match(/data-part="indicator"/g) ?? []).length);
  for (const [, trend, glyph] of deltas) {
    assert.equal(glyph, trend === 'flat' ? 'minus' : 'trending-up', trend);
  }
});

/** A signed number in a right-to-left document keeps its sign in front. */
/**
 * The unit is spaced from the figure by the value's own gap, whichever side
 * it stands on. Spaced by a margin reset with `:first-child`, a unit after
 * the figure — `96.1<unit>%</unit>`, the reference page's own form — was the
 * value's first element child and lost its margin: the sign hugged the digit.
 */
test('spaces the unit from the figure on either side, without a first-child reset', () => {
  const value = body(`${ui} [data-part-value]`);
  assert.ok(value.includes('display:inline-flex'));
  assert.ok(value.includes('align-items:baseline'));
  assert.match(value, /gap:0\.\d+em/);
  assert.equal(rule(`${ui} [data-part-value] > [data-part-unit]:first-child`), undefined);
  assert.ok(!body(`${ui} [data-part-unit]`).includes('margin-inline'));
});

test('lays the value and the delta out by their own content', () => {
  assert.ok(body(`${ui} [data-part-value]`).includes('unicode-bidi:plaintext'));
  assert.ok(body(`${ui} [data-part-delta]`).includes('unicode-bidi:plaintext'));
});

/**
 * The trend region hands the card's tone to the sparkline inside it through
 * the property the sparkline reads when it has no tone of its own, and hands
 * it the card's ground for the marker's ring.
 */
test('hands its tone and its ground to the sparkline in its trend', () => {
  for (const tone of ['success', 'danger', 'warning', 'accent', 'secondary']) {
    assert.equal(
      body(`${ui}[data-tone='${tone}'] [data-part-trend]`),
      `--slotted-sparkline-color:var(--slotted-tone-${tone}-text);`,
    );
  }
  assert.ok(!rule(`${ui}[data-tone='neutral'] [data-part-trend]`), 'neutral hands nothing');
  assert.ok(
    body(`${ui} [data-part-trend]`).includes('--slotted-sparkline-ring-color:var(--_surface)'),
  );
});

/** The placeholder is the region's child, so the rules that size a sparkline size it. */
test('keeps the trend in the same box while it loads', () => {
  assert.ok(!rule(`${ui}[data-loading] [data-part-trend]`));
});

/**
 * The value is an inline flex line, so its height is its content's: a text
 * placeholder is one cap tall, and a card loading was fourteen pixels shorter
 * than the same card loaded — every box under a row of figures moved when the
 * answer arrived.
 */
test('keeps the value the height of one of its own lines while it loads', () => {
  assert.equal(
    body(`${ui}[data-loading] [data-part-value]`),
    'min-block-size:calc(var(--_value-size) * var(--_value-line));',
  );
  const scope = '@container stat-card (max-width:219px)';
  assert.equal(
    body(`${ui}[data-loading] [data-part-value]`, scope),
    'min-block-size:calc(var(--_value-size-narrow) * var(--_value-line-narrow));',
  );
});

/**
 * The action inherited the document's line: its link stood 19 pixels tall in
 * the fallback face and 21 in the web face, so the header grew as the font
 * arrived and every card under it moved. It takes the label's size and line,
 * the line of the header it stands in.
 */
/**
 * Text a consumer sets on one line — `white-space: nowrap` with an ellipsis —
 * has the whole line as its min-content. The message spans both columns and
 * the figure's column is floored at its min-content, so that line widened the
 * column past the card and the header, figure and message left it by the
 * difference. The three text regions give the grid no intrinsic width.
 */
test('keeps a consumer’s one-line text out of the width of the grid', () => {
  for (const part of ['header', 'message', 'comparison']) {
    assert.match(body(`${ui} [data-part-${part.toLowerCase()}]`), /contain:inline-size/, part);
  }
});

test('sets the action on the label’s own line, whatever face has arrived', () => {
  const action = body(`${ui} [data-part-action]`);
  assert.match(action, /font-size:var\(--_label-size\)/);
  assert.match(action, /line-height:var\(--_label-line\)/);
});

test('says a failed value in the danger tone and a missing one in the muted step', () => {
  assert.equal(
    body(`${ui}[data-status='error'] [data-part-message]`),
    'color:var(--slotted-tone-danger-text);',
  );
  assert.ok(
    rule(
      `${ui}[data-status='empty'] [data-part-value],${ui}[data-status='error'] [data-part-value]`,
    ),
  );
});

test('exercises every axis value, the loading state and both statuses', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    for (const value of values) {
      const attribute = axis === 'goodWhen' ? 'good-when' : axis;
      assert.ok(
        fragment.includes(`data-${attribute}="${value}"`),
        `${axis}=${value} is never shown`,
      );
    }
  }
  assert.ok(fragment.includes('data-loading=""'));
  assert.ok(fragment.includes('data-ui="skeleton" data-part="region"'), 'one region per card');
});

/**
 * On a finger the card's one control is a full target among controls grown to
 * 44 pixels: the link or button in `action` gets a transparent halo that
 * reaches the comfortable size, and the header keeps its height (Nexora's
 * phone overview measured the link at 21 pixels).
 */
test('gives the action a comfortable target on a coarse pointer', () => {
  const coarse = rules.filter(
    (entry) =>
      entry.scope.includes('pointer:coarse') &&
      entry.selector.startsWith(ui) &&
      entry.selector.includes('[data-part-action]') &&
      entry.selector.includes('::before'),
  );
  assert.equal(coarse.length, 1, 'no halo on the action under a coarse pointer');
  assert.match(coarse[0].body, /--slotted-target-comfortable/);
  assert.match(coarse[0].body, /position:absolute/);
});

/**
 * The card's part rules stop at a nested family: a badge in `status` has a
 * `label` part of its own, and the card's `label` rule painted it in the
 * card's muted ink. Every rule that reaches a part is inside the family's
 * `@scope`, whose limit is the content of a family root nested inside the
 * card. The limit is anchored at `:scope`: written `[data-ui]:not(:scope) > *`
 * it matched the card's own root under a parent that carries `data-ui`, a
 * `Grid`, and no part rule applied. The computed
 * style is compared in Chrome by `tools/harness/scenarios/stat-card-nested.mjs`.
 */
test('reaches its own parts and stops at a nested family', () => {
  const flat = declarations.replace(/\s+/g, ' ');
  assert.doesNotMatch(flat, /\[data-ui-stat-card\][^{,]*\s\[data-part-/);
  for (const block of flat.match(/@scope \([^)]*\) to \([^{]*\) \{/g) ?? []) {
    assert.equal(block, '@scope ([data-ui-stat-card]) to (:scope [data-ui] > *) {');
  }
  assert.ok((flat.match(/@scope /g) ?? []).length > 0);
});
