import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./top-navigation.css', import.meta.url), 'utf8');
const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/top-navigation/contract.json', import.meta.url),
    'utf8',
  ),
);
const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');

/** The rules inside one container query, as `selector { body }` pairs. */
function rulesUnder(condition) {
  const at = stripped.indexOf(`@container slotted-top-navigation (${condition})`);
  assert.notEqual(at, -1, `the family does not answer ${condition}`);
  const open = stripped.indexOf('{', at);
  let depth = 1;
  let end = open + 1;
  for (; end < stripped.length && depth > 0; end += 1) {
    if (stripped[end] === '{') depth += 1;
    else if (stripped[end] === '}') depth -= 1;
  }
  const block = stripped.slice(open + 1, end - 1);
  return [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
    selector: selector.replace(/\s+/g, ' ').trim(),
    body,
  }));
}

/**
 * The three steps are literal because `@container (inline-size < var(--x))`
 * is invalid CSS, and the same three numbers reach the script that writes
 * `data-collapsed`: the stylesheet decides the picture and the script decides
 * the panel. Three literals in two places is how they drift, and this is what
 * stops it.
 */
test('folds at the three steps the contract states, and at no other', () => {
  const conditions = [
    ...stripped.matchAll(/@container\s+slotted-top-navigation\s+\(([^)]*)\)/g),
  ].map(([, condition]) => condition.trim());

  assert.deepEqual(conditions, [
    `inline-size < ${contract.collapseAt.low}px`,
    `inline-size < ${contract.collapseAt.medium}px`,
    `inline-size < ${contract.collapseAt.high}px`,
  ]);
  assert.match(css, /container-name: slotted-top-navigation;/);
  assert.match(css, /container-type: inline-size;/);
});

/**
 * Each step folds the items of one priority and nothing of another, and an
 * item that names no priority is a medium one — the default the contract
 * declares — so a consumer who writes nothing gets a bar that folds where the
 * shell goes to overlay.
 */
test('each step hides the items of its own priority', () => {
  const low = rulesUnder(`inline-size < ${contract.collapseAt.low}px`);
  const medium = rulesUnder(`inline-size < ${contract.collapseAt.medium}px`);
  const high = rulesUnder(`inline-size < ${contract.collapseAt.high}px`);

  const hides = (rules, priority) =>
    rules.some(({ selector, body }) => selector.includes(priority) && /display: none/.test(body));
  assert.ok(hides(low, "[data-priority='low']"), 'low does not fold at the low step');
  assert.ok(
    hides(medium, ":not([data-priority='low']):not([data-priority='high'])"),
    'an item with no priority does not fold at the medium step',
  );
  assert.ok(hides(high, "[data-priority='high']"), 'high does not fold at the high step');
  assert.equal(contract.priority.default, 'medium');
});

/**
 * `more` exists in the DOM whenever the list does and shows itself from the
 * stylesheet alone, as soon as the list holds an item of the priority that
 * just folded — so a server render at a narrow width already has the button.
 * The script shows it by the count it writes, which is what a list whose
 * folded items have all moved into the panel is left with.
 */
test('shows more from the stylesheet when something folds, and from the count the script writes', () => {
  assert.match(stripped, /\[data-part-item\]:has\(> \[data-part-more\]\) \{\s*display: none;/);
  assert.match(
    stripped,
    /\[data-part-item\]:has\(> \[data-part-more\]\[data-overflow\]\) \{\s*display: flex;/,
  );
  for (const step of ['low', 'medium', 'high']) {
    const rules = rulesUnder(`inline-size < ${contract.collapseAt[step]}px`);
    assert.ok(
      rules.some(
        ({ selector, body }) =>
          selector.includes(':has(> [data-part-more])') && /display: flex/.test(body),
      ),
      `${step} folds something and shows no more`,
    );
  }
});

/**
 * Below the medium step the field gives way to its toggle, and open it takes
 * the whole bar: the brand, the context, the navigation and the actions leave
 * the eye while the search is open, and the close stands at its end.
 */
test('gives the search its toggle below the medium step, and the bar while open', () => {
  const rules = rulesUnder(`inline-size < ${contract.collapseAt.medium}px`);
  const find = (fragment) => rules.find(({ selector }) => selector.includes(fragment));
  assert.match(find(':not([data-search-open]) [data-part-search]').body, /display: none/);
  assert.match(
    find(':not([data-search-open]) [data-part-search-toggle]').body,
    /display: inline-flex/,
  );
  assert.match(find('[data-search-open] [data-part-search-close]').body, /display: inline-flex/);
  assert.match(find('[data-search-open] > :is([data-part-brand]').body, /display: none/);
  assert.match(
    stripped,
    /\[data-part-search-toggle\],\s*\[data-ui-top-navigation\] \[data-part-search-close\] \{\s*display: none;/,
  );
});

/**
 * The field stands at the start of the middle: the free space is after it,
 * never shared round it, because the end clusters are never the same width
 * and a field centerd between them is centerd on nothing.
 */
test('stands the search at the start of the middle and grows it to its measure', () => {
  const at = css.indexOf('[data-ui-top-navigation] [data-part-search] {');
  assert.notEqual(at, -1);
  const body = css.slice(css.indexOf('{', at), css.indexOf('\n  }', at));
  assert.match(body, /margin-inline:\s*0 auto/);
  assert.match(body, /flex:\s*1 10000 var\(--_search-size\)/);
  assert.match(body, /max-inline-size:\s*var\(--_search-size\)/);
});

/**
 * The name leaves the eye and not the DOM: a `home` whose name were
 * `display: none` would have no accessible name but the mark's. Help leaves
 * the bar for the panel at the same step; the context left at the medium one,
 * where a workspace switcher and a field stopped fitting side by side.
 */
test('clips the name below the high step rather than removing it', () => {
  const high = rulesUnder(`inline-size < ${contract.collapseAt.high}px`);
  const name = high.find(({ selector }) => selector.includes('[data-part-name]'));
  assert.ok(name, 'no rule for the name at the high step');
  assert.match(name.body, /clip-path: inset\(50%\)/);
  assert.doesNotMatch(name.body, /display: none/);
  const help = high.find(({ selector }) =>
    selector.includes('[data-part-actions] > [data-part-help]'),
  );
  assert.ok(help, 'help does not leave the bar at the high step');
  assert.match(help.body, /display: none/);

  const medium = rulesUnder(`inline-size < ${contract.collapseAt.medium}px`);
  const context = medium.find(({ selector }) => selector.endsWith('> [data-part-context]'));
  assert.ok(context, 'context does not leave the bar at the medium step');
  assert.match(context.body, /display: none/);
});

/**
 * A container query resolves against the content box and the width gate
 * measures the border box, so the root carries no inline padding: the framed
 * bar's edge is on its first and last clusters, and the two agree to the
 * pixel.
 */
test('keeps the root free of inline padding, so the query and the script measure one box', () => {
  const root = /\[data-ui-top-navigation\]\[data-frame\] \{([^}]*)\}/.exec(stripped)?.[1] ?? '';
  assert.doesNotMatch(root, /padding-inline/);
  assert.match(root, /--_edge: var\(--_inset\)/);
  assert.match(
    stripped,
    /\[data-part-brand\] \{[^}]*padding-inline-start: calc\(var\(--_edge\) \+ var\(--_row-inset\)\)/,
  );
  assert.match(
    stripped,
    /\[data-part-actions\] \{[^}]*padding-inline-end: calc\(var\(--_edge\) \+ var\(--_row-inset\)\)/,
  );
});

/**
 * The panel stands inside the root, under the bar, placed by the stylesheet
 * rather than by the positioner; it stays in the DOM closed, out of sight and
 * out of the tab order by `visibility`, so opening is a transition from a
 * computed style. Below the high step it takes the root's width.
 */
test('places the panel under the bar, inside the root, and hides it from Tab while closed', () => {
  assert.match(stripped, /\[data-part-panel\] \{[^}]*position: absolute;/);
  assert.match(stripped, /\[data-part-panel\] \{[^}]*visibility: hidden;/);
  assert.match(stripped, /\[data-part-panel\]\[data-open\] \{[^}]*visibility: visible;/);
  assert.match(stripped, /\[data-ui-top-navigation\] \{[^}]*position: relative;/);
  assert.doesNotMatch(css, /--slotted-positioner-/);
  const rules = rulesUnder(`inline-size < ${contract.collapseAt.high}px`);
  const panel = rules.find(({ selector }) => selector.endsWith('[data-part-panel]'));
  assert.match(panel.body, /inset-inline: var\(--_edge\)/);
});

/** R1, in this family's own words: the ground says current, no band does. */
test('says current with the ground and paints no bar', () => {
  assert.match(
    css,
    /\[data-part-link\]:is\(\[data-current\], \[aria-current='page'\]\) \{[^}]*--_current-background/,
  );
  assert.doesNotMatch(css, /data-marker/);
  /* The edge is the foundation's `--slotted-current-edge`, as side-navigation reads it. */
  assert.match(
    css,
    /--_current-edge:\s*var\(\s*--slotted-top-navigation-current-edge,\s*var\(--slotted-current-edge,\s*transparent\)\s*\)/,
  );
  assert.doesNotMatch(css, /--_current-edge:[^;]*--slotted-border-subtle/);
});

/**
 * The bar reads what the shell publishes, each with the family's own fallback
 * so a bar outside the shell measures the same.
 */
test('reads every row property the contract names', () => {
  for (const property of contract.reads) {
    assert.match(css, new RegExp(`var\\(\\s*${property},`), `${property} is not read`);
  }
});

/**
 * Every mark the family draws is the Glyph element the contract names beside
 * the part that draws it, rendered by the binding; the sheet paints none.
 */
test('paints no mark of its own', () => {
  assert.doesNotMatch(css, /mask-image/);
  assert.doesNotMatch(
    css,
    /--slotted-icon-(bell|chevron-down|circle-question|ellipsis|search|x)\b/,
  );
  assert.doesNotMatch(css, /::before\s*\{[^}]*content: ''/);
});

/**
 * `app-shell` styles its own brand cluster with a descendant selector that
 * reaches this family's `brand` inside the shell's banner and clipped `home`
 * to a sliver. The root part is named in the selector so the family's rule
 * outranks it; the shell's own reopening narrows the leak at its source.
 */
test('outranks the shell selector that reaches its brand', () => {
  assert.match(css, /\[data-ui-top-navigation\]\[data-part-root\] > \[data-part-brand\] \{/);
});

/**
 * A product has global controls the family did not foresee — approvals, tasks
 * — and they stand in the same cluster as the bell. `action` is the family's
 * shape for them: the same square, ink, hover, focus and disabled treatment
 * as the controls the family marks, with the consumer's own glyph inside at
 * the control's glyph size, and `count` positioned over its corner.
 */
test('gives every icon-only control, the consumer action included, the same shape and states', () => {
  const rules = [...stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
    selector: selector.replace(/\s+/g, ' ').trim(),
    body,
  }));
  const shape = rules.find(
    ({ selector, body }) =>
      selector.includes('[data-part-notifications]') &&
      /min-inline-size: var\(--_control-height\)/.test(body),
  );
  assert.ok(shape, 'no shared square for the icon-only controls');
  assert.match(shape.body, /position: relative/);
  const parts = [...shape.selector.matchAll(/\[data-part-([a-z-]+)\]/g)].map(([, part]) => part);
  assert.ok(parts.includes('action'), 'action does not share the square of the marked controls');
  /* A part that joins the shape joins every state, or it is a control that looks right at rest only. */
  for (const part of parts) {
    for (const state of [
      ['hover', /background-color: var\(--_hover-background\)/],
      ['active', /background-color: var\(--_active-background\)/],
      ['focus-visible', /outline:/],
      ['disabled', /cursor: not-allowed/],
    ]) {
      const [pseudo, expectation] = state;
      /* The pseudo-class attached to the control: a space before it would make it a descendant. */
      const attached = new RegExp(`[)\\]](:[a-z-]+(\\([^)]*\\))?)*:${pseudo}`);
      const rule = rules.find(
        ({ selector, body }) =>
          selector.includes(`[data-part-${part.toLowerCase()}]`) &&
          attached.test(selector) &&
          !new RegExp(`\\s:${pseudo}`).test(selector) &&
          expectation.test(body),
      );
      assert.ok(rule, `${part} has no ${pseudo} treatment`);
    }
  }
  const glyph = rules.find(
    ({ selector, body }) =>
      /\[data-part-action\] > :not\(\[data-part-count\]\)/.test(selector) &&
      /font-size: var\(--_icon-size\)/.test(body),
  );
  assert.ok(glyph, 'the glyph inside action is not sized at the control glyph size');
  assert.match(glyph.body, /inline-size: var\(--_icon-size\)/);
  assert.match(stripped, /\[data-part-action\]\s*\{[^}]*--slotted-icon-size: var\(--_icon-size\)/);
});

/**
 * The count is type, and it is sized as the type it is: the control scale's
 * small step, on a disc the height of that type's line, with a space step of
 * inset on either side of the figures. It used to be a fraction of the bell —
 * 14 pixels holding 10-pixel semibold figures with two pixels of inset — and
 * the figures were crushed against the edge and sat high, because a flex
 * container centers the line box and not the ink. A block container can trim
 * the line to the cap and the baseline; a flex container cannot.
 */
test('sizes the count from the small type step and centers its figures on the ink', () => {
  const rule = stripped.match(/\[data-ui-top-navigation\] \[data-part-count\]\s*\{([^}]*)\}/)?.[1];
  assert.ok(rule, 'no count rule');
  assert.match(rule, /--_count-font: var\(--slotted-control-font-size-sm/);
  assert.match(rule, /--_count-size: calc\(var\(--_count-font\) \* var\(--slotted-line-height-xs/);
  assert.match(rule, /font-size: var\(--_count-font\)/);
  assert.match(rule, /padding-inline: var\(--slotted-space-2/);
  assert.match(rule, /min-inline-size: var\(--_count-size\)/);
  assert.match(rule, /align-content: center/);
  assert.doesNotMatch(rule, /display: inline-flex/);
  const trimmed = stripped.match(
    /@supports \(text-box: trim-both cap alphabetic\)\s*\{\s*\[data-ui-top-navigation\] \[data-part-count\]\s*\{([^}]*)\}/,
  )?.[1];
  assert.ok(trimmed, 'the count is not trimmed to its ink');
  assert.match(trimmed, /text-box: trim-both cap alphabetic/);
});

/**
 * The brand gives way to the name's ellipsis and no further: the marks never
 * fold. As a flex item with `min-inline-size: 0`, the cluster shrank under its
 * own marks on a phone with seven touch-sized controls in the actions, and the
 * marks it could not hold spilled over the cluster beside it. The minimum is
 * the marks, which is what `home` contributes when the name stands in a
 * `minmax(0, 1fr)` track: a grid track that contributes nothing to the
 * container's min-content size, so the brand's automatic minimum is the marks
 * alone and the name still shrinks to its ellipsis.
 */
test('never shrinks the brand under its marks', () => {
  const brand = stripped.match(
    /\[data-ui-top-navigation\]\[data-part-root\] > \[data-part-brand\] \{([^}]*)\}/,
  )?.[1];
  assert.ok(brand);
  assert.doesNotMatch(brand, /min-inline-size:\s*0/);
  const home = stripped.match(/\[data-ui-top-navigation\] \[data-part-home\] \{([^}]*)\}/)?.[1];
  assert.ok(home);
  assert.match(home, /display:\s*inline-grid/);
  assert.match(home, /grid-template-columns:\s*auto minmax\(0, 1fr\)/);
  /* Below the high step the name is out of flow; the empty track would keep its gap. */
  const high = rulesUnder(`inline-size < ${contract.collapseAt.high}px`);
  const narrowHome = high.find(({ selector }) => selector.endsWith('[data-part-home]'));
  assert.ok(narrowHome, 'no rule for home at the high step');
  assert.match(narrowHome.body, /grid-template-columns:\s*auto/);
});
