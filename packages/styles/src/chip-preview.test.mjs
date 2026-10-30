import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * SL4 — several chosen values are the chips they are, and the family draws
 * none of them.
 *
 * The chips are `tag`'s, worn as `data-ui` beside the row this family owns, so
 * the chip a reader removes in a select is the chip they know from everywhere
 * else and its geometry — the pill, the small step, the remove control floored
 * at the target minimum — is stated once. A family that painted a chip of its
 * own would be a second answer, drifting from the first the moment one of them
 * is retuned.
 *
 * `combobox` is not here on purpose: its own contract declines `multiple` and
 * defers a collection of values to `multi-select`, so it has no several to
 * preview (CB4).
 *
 * What a host needs from a chip it asks for through the two tokens `tag.css`
 * reads — `--slotted-tag-inset-block`, so a frame shorter than the chip at
 * `dense` can ask it to give up its air rather than its type, and
 * `--slotted-tag-border-color`, to mark one chip — set on the row and
 * inherited, never by naming the tag's identifier or its private hooks.
 * `tags-input` holds the same rule in its own styles test, because the popup
 * rules below do not apply to it.
 *
 * Each host names the row it owns, because the two arrangements are different
 * and the rule is the same. `select`'s row is a lane of the control, beside a
 * `button` that cannot contain a remove control; `multi-select`'s is inside the
 * control, beside the caret, because its control holds a real `input`.
 */
const HOSTS = [
  { family: 'select', row: '[data-ui-select][data-part-root] > [data-part-tags]' },
  { family: 'multi-select', row: '[data-ui-multi-select] [data-part-chips]' },
];

function sheet(family) {
  return readFileSync(`${source}${family}/${family}.css`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
}

function rule(css, selector) {
  const normalized = css
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,:])\s*/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')');
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

/**
 * The value a declaration ends up with, following one step of a family's own
 * private alias. A family may name the gap between its chips once and read that
 * name from both the row and the arithmetic that caps it; the rule being
 * checked is where the number comes from, not how many hops it takes.
 */
function resolve(css, value) {
  const alias = /^var\((--_[a-z0-9-]+)\)$/.exec(value.trim());
  if (alias === null) return value;
  const declared = new RegExp(`${alias[1]}:([^;]+);`).exec(css.replace(/\s+/g, ' '));
  return declared === null ? value : declared[1];
}

test('lays the chips out and paints none of them', () => {
  for (const { family, row: selector } of HOSTS) {
    const css = sheet(family);
    const row = rule(css, selector);
    assert.notEqual(row, '', `${family} lays out no chip row`);
    assert.match(row, /display:flex/);
    const gap = /(?:^|;)(?:column-)?gap:([^;]+)/.exec(row);
    assert.ok(gap, `${family} puts no gap between its chips`);
    assert.match(
      resolve(css, gap[1]),
      /var\(--slotted-space-2/,
      `${family} spaces its chips by a number rather than by the space scale`,
    );
    /* Nothing about a chip: no ground, no edge, no corner, no type. */
    assert.doesNotMatch(
      row,
      /background|border-radius|border:|font-size|font-weight/,
      `${family} paints the chips instead of placing them`,
    );
    assert.doesNotMatch(
      css,
      /\[data-ui-tag\]/,
      `${family} reaches into the tag sheet instead of standing beside it`,
    );
  }
});

/**
 * SL9. The row is a lane of the control's own row, not a row hanging over the
 * trigger. A row that hangs reserves no space, so the space it may use was an
 * arithmetic inset kept in step with the chevron and the clear button by hand —
 * and six chosen values ran under both of them. A track ends where the next
 * track begins, and no arithmetic can be out of date.
 *
 * The trigger is still a `button`, so the chips are still written beside it and
 * not in it: a remove control inside a button is a control inside a control.
 * It spans every lane, so the gaps between chips still belong to it and the
 * frame still opens the popup everywhere a chip is not.
 */
test('gives the chips a lane of the control and the final controls their own', () => {
  const css = sheet('select');
  const frame = rule(css, '[data-ui-select][data-part-root]');
  assert.match(frame, /display:grid/);
  assert.match(frame, /grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(
    rule(css, '[data-ui-select][data-part-root]:has(> [data-part-clear])'),
    /grid-template-columns:minmax\(0,1fr\) auto auto/,
    'the clear button has no lane of its own',
  );

  const row = rule(css, '[data-ui-select][data-part-root] > [data-part-tags]');
  assert.match(row, /grid-area:1 \/ 1 \/ 2 \/ 2/, 'the chips are not in the content lane');
  assert.doesNotMatch(row, /position:absolute/, 'the row still hangs over the trigger');
  assert.match(row, /pointer-events:none/);
  assert.match(
    rule(css, '[data-ui-select] > [data-part-trigger]'),
    /grid-area:1 \/ 1 \/ 2 \/ -1/,
    'the trigger is not the ground under every lane',
  );
  for (const part of ['arrow', 'busy']) {
    assert.match(
      rule(css, `[data-ui-select] > [data-part-${part.toLowerCase()}]`),
      /grid-area:1 \/ -2 \/ 2 \/ -1/,
      `${part} is not in the last lane`,
    );
  }
  assert.match(
    rule(css, '[data-ui-select] > [data-part-tags] > *'),
    /pointer-events:auto/,
    'the chips do not take their own presses back',
  );
});

/**
 * The height of the control does not answer the number of chosen values: one
 * line, and a row no taller than the inner box of a select that chose one
 * thing. The chips that do not fit are taken out by the collapse, which is why
 * `tag` has to honour `hidden` — the rule its own sheet is guarded for.
 */
test('keeps the row on one line and no taller than the control', () => {
  const css = sheet('select');
  const row = rule(css, '[data-ui-select][data-part-root] > [data-part-tags]');
  assert.match(row, /display:flex/);
  assert.doesNotMatch(row, /flex-wrap:wrap/, 'the chips wrap onto a second line');
  assert.match(row, /min-inline-size:0/, 'a chip can widen the lane it is in');
  assert.match(row, /overflow:hidden/);
});

/**
 * SL10. Everything that is chosen, at the top of the popup. The band is stuck
 * to the top of the scrollport rather than laid above it — the surface is the
 * scroller as well as the box — and it scrolls itself, so the list under it
 * keeps its own scroll. It is separated from the list by a rule from the border
 * scale and never by a shadow, and it is capped at two whole rows of chips.
 */
test('holds the chosen values in a band that scrolls itself', () => {
  for (const { family } of HOSTS) {
    const css = sheet(family);
    const band = rule(css, `[data-ui-${family.toLowerCase()}] [data-part-chosen]`);
    assert.notEqual(band, '', `${family} draws no band of chosen values`);
    assert.match(band, /position:sticky/);
    assert.match(band, /overflow-y:auto/);
    assert.match(band, /overscroll-behavior:contain/);
    assert.match(band, /flex-wrap:wrap/);
    assert.match(band, /max-block-size:calc\(2 \* var\(--slotted-target-min/);
    assert.match(band, /border-block-end:var\(--_border-width\) solid var\(--_border-color\)/);
    assert.doesNotMatch(band, /box-shadow/, 'the band is separated by a shadow instead of a rule');
    assert.doesNotMatch(band, /transition|animation/, 'the band animates its own box (R7)');
  }

  const css = sheet('select');
  /*
   * The list keeps its own scroll, which is what makes the two independent.
   * Which element is the list depends on `search`: without it the surface is
   * the scroller, and with it the surface is a column of a field and a list and
   * the list scrolls under a field that stays (SL11).
   */
  const scroller = rule(
    css,
    '[data-ui-select] > [data-part-content]:not([data-search]),' +
      '[data-ui-select] [data-part-list]',
  );
  assert.match(scroller, /overflow-y:auto/);
  assert.match(scroller, /overscroll-behavior:contain/);
});

/**
 * The sentence a control too narrow for a chip shows instead. It is taken out
 * of sight rather than out of the tree while the chips are shown: it is the
 * trigger's accessible name, and a button that changes what it is called when
 * the window is resized is a button nobody can refer to.
 */
test('keeps the sentence in the tree while the chips are shown', () => {
  const css = sheet('select');
  const hidden = rule(
    css,
    '[data-ui-select][data-part-root]:not([data-narrow]) [data-part-summary]',
  );
  assert.notEqual(hidden, '', 'the summary is never taken out of sight');
  assert.match(hidden, /clip-path:inset\(50%\)/);
  assert.doesNotMatch(hidden, /display:none/, 'the summary leaves the accessibility tree');
  assert.match(
    rule(css, '[data-ui-select][data-part-root][data-narrow] > [data-part-tags]'),
    /display:none/,
    'a control too narrow for a chip still draws one',
  );
});

/**
 * A chip in the control carries a `label` of its own, and the rule that lays
 * out an option's label would have put it in the popup's second column. The
 * rule is scoped to the option wherever a chip can stand beside it (SL4).
 */
test('scopes the option label to the option', () => {
  for (const { family } of HOSTS) {
    const css = sheet(family);
    assert.doesNotMatch(
      css.replace(/\s+/g, ' '),
      new RegExp(`\\[data-ui-${family}\\] \\[data-part-label\\] \\{`),
      `${family} lays out every label in the family, not only an option's`,
    );
    assert.match(
      css.replace(/\s+/g, ' '),
      new RegExp(`\\[data-ui-${family}\\] \\[data-part-item\\] > \\[data-part-label\\] \\{`),
      `${family} lays out no option label at all`,
    );
  }
});
