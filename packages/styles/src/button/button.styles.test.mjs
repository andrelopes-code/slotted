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
    new URL('../../../../specs/components/button/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./button.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./button.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, ' ').replace(/\s*([{};,:])\s*/g, '$1');
const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
/**
 * The same sheet with every space taken out. A selector's shape survives a
 * formatter reflowing it across three lines; an assertion written against one
 * particular line break does not.
 */
const dense = normalized.replace(/\s+/g, '');

/** The declarations of the first rule whose selector starts with `selector`. */
function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

/**
 * Every selector in the sheet, one entry per comma-separated selector, with
 * the whitespace a formatter puts inside `:not()` taken back out. A guard
 * printed as `:not( [data-loading] )` guards exactly as much as one printed on
 * a single line, and an assertion that cannot see it reads as satisfied.
 */
function selectors() {
  return [...declarations.matchAll(/(^|\})([^{}]+)\{/g)]
    .map(([, , selector]) => selector.trim())
    .filter((selector) => selector.length > 0 && !selector.startsWith('@'))
    .flatMap((selector) => selector.split(','))
    .map((selector) =>
      selector.replace(/\s+/g, ' ').replace(/\(\s+|\s+\)/g, (match) => match.trim()),
    );
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${ui}{`), 'the family has no base rule keyed on data-ui');
});

/**
 * The whole point of the rebuild. Button aliased the density scale into
 * `--slotted-button-*` and therefore never saw the larger control the theme
 * emits under `@media (pointer: coarse)`.
 */
test('reads control geometry directly rather than through a family alias', () => {
  assert.doesNotMatch(
    declarations,
    /--slotted-button-/,
    'the family declares a token of its own again',
  );
  for (const size of ['sm', 'md', 'lg']) {
    for (const scale of ['height', 'padding-inline', 'font-size', 'icon-size', 'gap']) {
      assert.match(
        css,
        new RegExp(`--slotted-control-${scale}-${size}`),
        `no size step reads --slotted-control-${scale}-${size}`,
      );
    }
  }
});

test('gives each of the three steps its own geometry and nothing else', () => {
  for (const size of ['sm', 'lg']) {
    const step = rule(`${ui}[data-size='${size}']`);
    assert.ok(step.includes(`--_height:var(--slotted-control-height-${size}`), size);
    assert.ok(step.includes(`--_font-size:var(--slotted-control-font-size-${size}`), size);
    assert.ok(step.includes(`--_gap:var(--slotted-control-gap-${size}`), size);
    assert.doesNotMatch(step, /background|color:/, `${size} decides a color as well as a size`);
  }
});

test('paints each tone the contract declares from that tone alone', () => {
  for (const tone of contract.axes.tone) {
    const painted = tone === 'accent' ? rule(ui) : rule(`${ui}[data-tone='${tone}']`);
    assert.ok(painted.length > 0, `${tone} has no rule`);
    for (const role of ['solid', 'on-solid', 'text']) {
      assert.ok(
        painted.includes(`var(--slotted-tone-${tone}-${role})`),
        `${tone} does not read its own ${role}`,
      );
    }
  }
});

test('gives every variant the contract declares a rule of its own', () => {
  for (const variant of contract.axes.variant) {
    assert.ok(
      rule(`${ui}[data-variant='${variant}']`).includes('background:'),
      `${variant} paints no surface`,
    );
  }
});

/**
 * The paint axis lost `soft` at the visual review. The tone `surface` role it
 * read belongs to the families a tinted rectangle is, and this one stops
 * reading it rather than leaving a private property nothing consumes.
 */
test('no longer paints a tinted fill, or reads the role that drew it', () => {
  assert.ok(!contract.axes.variant.includes('soft'));
  assert.doesNotMatch(declarations, /data-variant='soft'/);
  assert.doesNotMatch(declarations, /--_surface/);
  assert.doesNotMatch(declarations, /-surface\)/, 'a tone surface is still read somewhere');
});

/**
 * In the `high-contrast` scheme every tone surface is the page's own white, so
 * a filled control with no border is a rectangle of nothing. Every variant but
 * `ghost` draws an edge for that reason, and the disabled state keeps one.
 */
test('keeps an edge on every variant that is not bare', () => {
  assert.ok(rule(`${ui}[data-variant='solid']`).includes('border-color:var(--_edge'));
  assert.ok(rule(`${ui}[data-variant='ghost']`).includes('border-color:transparent'));
  assert.ok(
    rule(
      `${ui}[data-variant='solid']:disabled,${ui}[data-variant='solid'][data-disabled]`,
    ).includes('border-color:var(--slotted-disabled-border'),
  );
});

/**
 * A fill is its own edge. Anything else — the tone's `border` role, a neutral
 * from the foundation — reads as a line laid over the control rather than as
 * the edge of it. The one exception is the neutral tone, whose fill is 1.23:1
 * against the surface in light and the page's own white in `high-contrast`: a
 * control with no edge at all cannot be found, so it takes the next step of
 * its own ramp and nothing stronger.
 */
test('lets a fill be its own edge, except the one that is the page', () => {
  assert.ok(rule(ui).includes('--_edge:var(--_solid)'));
  assert.ok(rule(`${ui}[data-tone='secondary']`).includes('--_edge:var(--_solid-active)'));

  for (const tone of ['accent', 'success', 'warning', 'danger']) {
    assert.ok(!rule(`${ui}[data-tone='${tone}']`).includes('--_edge:'), `${tone} borrows an edge`);
  }
  assert.doesNotMatch(declarations, /--_edge:var\(--slotted-border-strong/);
  assert.doesNotMatch(declarations, /--_border/, 'a tone border role is still read somewhere');
});

/**
 * The shadow belongs to the frame, not to the family. `ghost` draws neither a
 * fill nor an edge, so a shadow under it is a rectangle nobody drew — a
 * toolbar of ghost actions read as a row of invisible cards for as long as the
 * base rule carried it. Disabled loses it for the reason `text-field` states:
 * nothing a person cannot reach is lifted off the page.
 */
test('lifts only the variants that draw a frame', () => {
  const shadow = 'box-shadow:var(--slotted-control-shadow';

  assert.ok(!rule(ui).includes(shadow), 'the base rule lifts every member again');
  assert.ok(rule(`${ui}[data-variant='solid']`).includes(shadow));
  assert.ok(rule(`${ui}[data-variant='outline']`).includes(shadow));
  assert.ok(
    !rule(`${ui}[data-variant='ghost']`).includes('box-shadow'),
    'a bare control casts a shadow',
  );
  /* A ghost toggle that is on has taken a fill and an edge, so it is framed. */
  assert.ok(rule(`${ui}[data-pressed]:not(:disabled):not([data-disabled])`).includes(shadow));
  assert.ok(rule(`${ui}:disabled,${ui}[data-disabled]`).includes('box-shadow:none'));
});

/**
 * A saturated border on all five tones turned a row of actions into a row of
 * status chips. The edge of an outline button is neutral and its label carries
 * the tone. The neutral is the control step, the edge a field carries at rest:
 * `--slotted-border-strong` made the outline button the darkest line on the
 * form, and the foundation keeps that step for the line between two surfaces.
 */
test('draws an outline button with a neutral edge and a tone label', () => {
  const outline = rule(`${ui}[data-variant='outline']`);
  assert.ok(outline.includes('border-color:var(--slotted-control-border-color'));
  assert.ok(!outline.includes('border-color:var(--slotted-border-strong'));
  assert.ok(outline.includes('color:var(--_text'));
  assert.ok(!outline.includes('border-color:var(--_border'));
});

/**
 * A pressed toggle is the tone's fill, and one edge like every other control.
 * The first rebuild grew the border to carry the extra weight, which moved
 * every control in the row; the second drew a ring inside the border instead,
 * which cost no space and read as a control with two edges. The state is a
 * color, and `aria-pressed` is what announces it.
 *
 * The guard is on the pressed selector rather than on the sheet. It was
 * written as a ban on `::after` anywhere, which is a proxy that stopped
 * holding the moment the family had a second thing to draw: the waiting band
 * is a pseudo-element too, and it is not an edge and not on this state.
 */
test('says pressed the way the foundation says selected, and with one edge like every other control', () => {
  const pressed = rule(`${ui}[data-pressed]:not(:disabled):not([data-disabled])`);
  assert.ok(pressed.includes('background:var(--slotted-tone-accent-subtle-active'));
  assert.ok(pressed.includes('border-color:var(--slotted-tone-accent-border'));
  assert.ok(pressed.includes('color:var(--slotted-tone-accent-text'));
  assert.ok(pressed.includes('box-shadow:var(--slotted-control-shadow'));
  /* On is one color across the system, not a shade of each tone's own. */
  assert.doesNotMatch(pressed, /--_solid|--_on-solid|--_edge/);

  const drawn = selectors().filter(
    (selector) => selector.includes('[data-pressed]') && /::(after|before)/.test(selector),
  );
  assert.deepEqual(drawn, [], 'the family draws a second edge again');
});

/**
 * A toggle that is on and a toggle that is off never hover on the same
 * ground: off hovers on the neutral step, on hovers on the accent ground's
 * own hover step. Measured in `light`, the two are `#f1f5f9` and `#eff6ff`.
 */
test('hovers a pressed toggle on the accent ground, never on the neutral one', () => {
  const on = rule(
    `${ui}[data-pressed]:hover:not(:disabled):not([data-disabled]):not([data-loading])`,
  );
  assert.equal(on, 'background:var(--slotted-tone-accent-subtle-hover,Highlight);');
  const pressing = rule(
    `${ui}[data-pressed]:active:not(:disabled):not([data-disabled]):not([data-loading])`,
  );
  assert.ok(pressing.startsWith('background:var(--slotted-tone-accent-subtle-active,Highlight);'));
  assert.doesNotMatch(on, /secondary-subtle-hover/);
});

/**
 * The whole reason this family was rebuilt a second time. A state may change
 * a color and nothing else: a border width, a padding, a margin or a size
 * written under a state selector moves every control in the row when the
 * state turns on.
 */
test('changes no geometry when a state changes', () => {
  const stateful =
    /(:hover|:active(?![-\w])|:focus-visible|:disabled|\[data-(disabled|loading|pressed)\])/;
  const offenders = [];

  for (const match of declarations.matchAll(/(^|\})([^{}]+)\{([^{}]*)\}/g)) {
    const [, , selector, body] = match;
    if (!stateful.test(selector) || selector.includes('::after')) continue;
    for (const property of ['border-width', 'padding', 'margin', 'inline-size', 'block-size']) {
      if (new RegExp(`(^|;)\\s*${property}\\s*:`).test(body)) {
        offenders.push(`${selector.trim()} sets ${property}`);
      }
    }
  }

  assert.deepEqual(offenders, [], `a state moves the layout:\n  ${offenders.join('\n  ')}`);
});

/**
 * A hovered control changes its fill and nothing else, in one step of the
 * control's transition: 120ms on the theme's short duration, on the theme's
 * standard curve. A filled control takes the tone's hover step, which the
 * theme derives from the fill by lightening it; a bare control takes the
 * neutral hover ground whatever its tone, so five outline actions in a row
 * hover as five buttons and not as five status chips.
 */
test('hovers by lightening the fill, or by the one neutral ground under a bare control', () => {
  const hovering = [...declarations.matchAll(/(?<=^|\})([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selector]) => /:hover/.test(selector) && !/\[data-pressed\]:hover/.test(selector))
    .map(([, selector, body]) => ({
      selector: selector.replace(/\s+/g, ''),
      body: body.replace(/\s+/g, ''),
    }));
  assert.ok(hovering.length >= 2, 'the family paints no hover');
  for (const { selector, body } of hovering) {
    assert.match(body, /^background:[^;]+;$/, `"${selector}" changes more than the fill on hover`);
  }
  const solid = hovering.find(({ selector }) => selector.includes("[data-variant='solid']"));
  assert.equal(solid?.body, 'background:var(--_solid-hover,Highlight);');
  const bare = hovering.find(({ selector }) => selector.includes("[data-variant='outline']"));
  assert.ok(
    bare?.selector.includes("[data-variant='ghost']"),
    'outline and ghost hover as two rules',
  );
  assert.equal(bare?.body, 'background:var(--slotted-tone-secondary-subtle-hover,ButtonFace);');
  assert.doesNotMatch(
    declarations,
    /--_subtle-hover/,
    'a tone still carries a hover ground of its own',
  );
  assert.match(
    rule(ui),
    /background-color var\(--slotted-control-transition-duration\) var\(--slotted-control-transition-easing\)/,
  );
});

/**
 * Being unavailable and being unreachable are two decisions. A control that
 * stays in the tab sequence with `aria-disabled` can be reached and has to be
 * read, so it takes muted text on the neutral subtle ground under a subtle
 * edge — measured at 4.97:1, 6.91:1 and 11.76:1 across the three schemes —
 * where a natively disabled one keeps the disabled tokens, which the theme
 * holds to 3:1 only. It was one grey before this, and a disabled accent
 * action was the same rectangle as a resting neutral one.
 */
test('keeps an unavailable control legible, and leaves the disabled grey to :disabled', () => {
  const reachable = rule(`${ui}[data-disabled]:not(:disabled)`);
  assert.equal(reachable, 'color:var(--slotted-text-muted,GrayText);');
  const filled = rule(
    `${ui}[data-variant='solid'][data-disabled]:not(:disabled),${ui}[data-pressed][data-disabled]:not(:disabled)`,
  );
  assert.ok(filled.includes('background:var(--slotted-tone-secondary-subtle-hover'));
  assert.ok(filled.includes('border-color:var(--slotted-border-subtle'));
  assert.ok(
    rule(`${ui}[data-variant='outline'][data-disabled]:not(:disabled)`).includes(
      'border-color:var(--slotted-border-subtle',
    ),
  );
  assert.ok(
    !rule(`${ui}[data-variant='ghost'][data-disabled]:not(:disabled)`),
    'a ghost that is unavailable took a fill or an edge',
  );
  /* The native state keeps its own tokens, which say "cannot be operated". */
  assert.ok(
    rule(`${ui}:disabled,${ui}[data-disabled]`).includes('color:var(--slotted-disabled-foreground'),
  );
});

/**
 * A press answers at once and releases at the control's pace: the `:active`
 * rules enter on the instant step and the base rule's duration eases the
 * release. A filled control drops one hairline and loses its shadow — the
 * control that was lifted off the page is put down on it; a bare control has
 * nothing to put down, so only its ground changes, to the darker neutral step
 * that pairs with the neutral hover ground.
 */
test('presses a filled control down by a hairline, and a bare one only in color', () => {
  /* Every space taken out, because the selectors are reflowed across lines. */
  const compact = declarations.replace(/\s+/g, '');
  const block = (selector) => compact.split(`${selector}{`)[1]?.split('}')[0] ?? '';
  const guard = ':not(:disabled):not([data-disabled]):not([data-loading]):not([data-pressed])';
  const solid = block(`${ui}[data-variant='solid']:active${guard}`);
  assert.equal(
    solid,
    'background:var(--_solid-active,Highlight);box-shadow:none;transform:translateY(var(--slotted-border-width-thin,1px));transition-duration:var(--slotted-duration-instant);',
  );
  const bare = block(
    `${ui}[data-variant='outline']:active${guard},${ui}[data-variant='ghost']:active${guard}`,
  );
  assert.equal(
    bare,
    'background:var(--slotted-tone-secondary-subtle-active,ButtonFace);transition-duration:var(--slotted-duration-instant);',
  );
  assert.doesNotMatch(
    declarations,
    /--_subtle-active/,
    'a tone still carries a press ground of its own',
  );
  /* The release eases back: transform is in the base transition list. */
  assert.match(
    rule(ui),
    /transform var\(--slotted-control-transition-duration\) var\(--slotted-control-transition-easing\)/,
  );
});

test('holds hover and active back for every stronger state', () => {
  const weak = selectors().filter((selector) => /:hover|:active(?![-\w])/.test(selector));
  assert.ok(weak.length > 0, 'the family paints no interactive state at all');
  for (const selector of weak) {
    assert.ok(
      selector.includes(':not(:disabled)') && selector.includes(':not([data-disabled])'),
      `"${selector}" answers a pointer on a disabled control`,
    );
  }
  /**
   * Every one of these selectors mentions `[data-pressed]`, because the ones
   * that are not about a toggle hold themselves back for it. What separates
   * them is whether the compound targets it.
   */
  const momentary = weak.filter((candidate) => !/\[data-pressed\]:(hover|active)/.test(candidate));
  assert.equal(momentary.length + 2, weak.length, 'the toggle answers the pointer twice, no more');
  for (const selector of momentary) {
    assert.ok(
      selector.includes(':not([data-loading])'),
      `"${selector}" answers a pointer on a control that is still working`,
    );
  }
});

test('shows focus only when the keyboard asked for it, and without moving anything', () => {
  const focus = rule(`${ui}:focus-visible`);
  assert.ok(focus.includes('outline:'), 'focus is not drawn as an outline');
  assert.ok(focus.includes('outline-offset:var(--slotted-focus-ring-offset'));
  assert.doesNotMatch(focus, /border-width|padding|margin|inset/, 'focus changes the layout');
});

/**
 * `opacity: 0` rather than `visibility: hidden` or an unmounted label:
 * the first keeps the label in the flow, so the control cannot change size,
 * and in the accessibility tree, so the accessible name survives the wait and
 * combines with the indicator's own.
 *
 * It applies only to the control that has nowhere else to put the ring. A
 * control with a start or end visual gives the ring that box and keeps its
 * label readable, which is the difference between a button that is waiting
 * and a colored rectangle with nothing in it.
 */
test('waits without losing the size or the name of the control', () => {
  const faded = dense.match(
    /\[data-loading\]:has\(>\[data-part-indicator\]\)>:not\(\[data-part-indicator\]\)\{([^}]*)\}/,
  );
  assert.ok(faded, 'the label of a control with no visual slot is not hidden');
  assert.ok(faded[1].includes('opacity:0'));
  assert.doesNotMatch(css, /visibility:hidden/);
  assert.doesNotMatch(css, /display:none/);
  assert.ok(rule(`${ui}[data-loading]`).includes('cursor:progress'));
});

/**
 * The ring is the `spinner` sheet's, drawn once for every family that waits;
 * this family only says how big it is — its own glyph box, through the size
 * token that sheet reads — and where it sits. It drew the ring itself before
 * this, as a border with one transparent side, and the second family to wait
 * would have copied it.
 */
test('sizes the ring to the glyph it stands in for, wherever it is drawn', () => {
  const indicator = rule(`${ui} [data-part-indicator]`);
  assert.ok(
    indicator.includes('--slotted-spinner-size:var(--_icon-size)'),
    'the ring is not the icon size',
  );
  assert.ok(indicator.includes('flex:none'), 'the ring can be squeezed inside its slot');
  assert.doesNotMatch(indicator, /border|animation|border-radius/);
  assert.doesNotMatch(css, /slotted-button-spin/, 'the family still draws a ring of its own');

  const centerd = dense.split(`${ui}>[data-part-indicator]{`)[1]?.split('}')[0] ?? '';
  assert.ok(centerd.includes('position:absolute'), 'the ring without a slot is in the flow');
  assert.ok(centerd.includes('inset:0'));
  assert.ok(centerd.includes('margin:auto'));
});

test('stops the ring under reduced motion rather than slowing it', () => {
  const query = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(query, /animation:\s*none/);
  assert.doesNotMatch(css, /(?<![\w-])\d+(?:\.\d+)?m?s(?![\w-])/, 'a duration is written by hand');
});

/**
 * The band replaces the ring on a control that has words in it, and what that
 * buys is the words: the ring had to be drawn over the label of a control with
 * no visual slot, so the reader lost the name of the action they pressed.
 */
test('waits behind the label rather than over it', () => {
  const sweep = dense
    .split(`${ui}:not([data-shape])[data-loading]:has([data-part-indicator])::after{`)[1]
    ?.split('}')[0];
  assert.ok(sweep, 'no band is drawn');
  assert.ok(sweep.includes('position:absolute'), 'the band is in the flow');
  assert.ok(sweep.includes('inset:0'));
  assert.ok(sweep.includes('pointer-events:none'), 'the band takes the press from the label');
  assert.ok(sweep.includes('border-radius:inherit'), 'the band ignores the shape of the control');
  assert.match(
    sweep,
    /background-image:linear-gradient\([^)]*currentcolor/i,
    'the band has a tone',
  );

  const restored = dense
    .split(
      `${ui}:not([data-shape])[data-loading]:has(>[data-part-indicator])>:not([data-part-indicator]){`,
    )[1]
    ?.split('}')[0];
  assert.ok(restored?.includes('opacity:1'), 'the label stays hidden behind the band');

  const stepped = dense
    .split(`${ui}:not([data-shape])[data-loading][data-part-indicator]{`)[1]
    ?.split('}')[0];
  assert.ok(stepped?.includes('opacity:0'), 'the ring is drawn under the band');
  assert.ok(stepped.includes('position:absolute'), 'the ring keeps the width of the glyph');
});

/**
 * `loadingDelay` holds the picture back without letting the action through
 * (contract invariant). The band is the picture of a control with words in
 * it, so it waits for the indicator the delay holds back, rather than for
 * `data-loading`, which the refusal sets at once.
 */
test('holds the band back for as long as loadingDelay holds the ring', () => {
  const sweeps = [...dense.matchAll(/([^{}]*::after)\{/g)].map(([, selector]) =>
    selector.slice(selector.lastIndexOf('}') + 1),
  );
  assert.ok(sweeps.length > 0, 'no band is drawn');
  for (const selector of sweeps) {
    assert.ok(
      selector.includes(':has([data-part-indicator])'),
      `${selector} sweeps before the delay has passed`,
    );
  }
});

/**
 * The band has no still form: one frozen halfway across a control is a
 * rendering fault, not a state. Both conditions are written as what the band
 * needs rather than as an undo, so the ring is what the family does by default
 * and an engine that drops either one is left with a state rather than with
 * nothing.
 */
test('draws the band only where it can move and be seen', () => {
  /**
   * Read off the sheet rather than through `selectors()`: the band lives
   * inside two nested at-rules, and that helper splits on braces.
   */
  const sweeps = [...dense.matchAll(/([^{}]*::after)\{/g)].map(([, selector]) =>
    selector.slice(selector.lastIndexOf('}') + 1),
  );
  assert.ok(sweeps.length > 0, 'no band is drawn');
  for (const selector of sweeps) {
    assert.ok(selector.includes(':not([data-shape])'), `${selector} sweeps an icon-only control`);
  }

  const guarded = declarations
    .slice(
      declarations.indexOf('@media (prefers-reduced-motion: no-preference)'),
      declarations.indexOf(`${ui} [data-part-start],`),
    )
    .replace(/\s+/g, '');
  assert.ok(guarded.includes('@medianot(forced-colors:active)'), 'the band outlives the gradient');
  for (const selector of [
    ...sweeps,
    `${ui}:not([data-shape])[data-loading] [data-part-indicator]`,
  ]) {
    assert.ok(guarded.includes(selector.replace(/\s+/g, '')), `${selector} is drawn unguarded`);
  }
});

/**
 * A flex container centers the line box, and a line box is not symmetric
 * around the letters in it: the word sat up to 1.2 pixels above the center of
 * the glyph beside it. Trimming to the cap and the baseline centers the ink
 * instead. The padding is what the trim costs a label that wraps — the
 * half-leading that keeps a second line off the border.
 */
test('centers the ink of the label rather than the box the ink sits in', () => {
  const guarded = css.slice(css.indexOf('@supports (text-box: trim-both cap alphabetic)'));
  assert.ok(guarded.length > 0, 'the trim is applied unguarded, or not at all');
  assert.match(guarded, /text-box:\s*trim-both cap alphabetic/);
  assert.match(
    guarded,
    /padding-block:\s*calc\(\(var\(--slotted-line-height-sm/,
    'the trim takes the leading a wrapped label needs and does not give it back',
  );
});

/**
 * A glyph reaches closer to the edge of the box than a letter does, so the
 * side holding one is inset less. Measuring one padding against two different
 * shapes is what makes an icon look pushed towards the middle.
 */
test('insets the side that holds a glyph less than the side that holds a word', () => {
  assert.ok(dense.includes('--_padding-inline-visual:max('));
  for (const [part, side] of [
    ['start', 'padding-inline-start'],
    ['end', 'padding-inline-end'],
  ]) {
    assert.ok(
      dense.includes(
        `${ui}:not([data-shape]):has(>[data-part-${part.toLowerCase()}]){${side}:var(--_padding-inline-visual)`,
      ),
      `the ${part} side is not compensated`,
    );
  }
});

/**
 * A label is one line at its own width and never breaks inside a word: broken
 * anywhere, a button in a row shrank to one letter and "Corrigir" took three
 * lines. Held narrower than its label by its container, it ends in an ellipsis.
 */
test('keeps the label on one line, cut by an ellipsis only when the control is held narrower', () => {
  const label = rule(`${ui} [data-part-label]`);
  assert.ok(label.includes('white-space:nowrap'));
  assert.ok(label.includes('text-overflow:ellipsis'));
  assert.ok(label.includes('overflow:hidden'));
  assert.doesNotMatch(css, /overflow-wrap:\s*anywhere/);
  assert.ok(label.includes('line-height:var(--slotted-line-height-sm'));
  assert.ok(rule(ui).includes('min-block-size:var(--_height)'), 'the control cannot grow');
  assert.ok(rule(ui).includes('max-inline-size:100%'), 'the control can outgrow its container');
});

/**
 * A control is exactly the height the density states. Block padding is added
 * to the label's line box, so at `dense` four pixels of it took the small and
 * the medium step to the same 27.4 pixels: the density stopped meaning the
 * height the theme states, and two steps of the scale collapsed into one.
 */
/**
 * A field trigger — a command launcher, an entry with its shortcut — reads
 * with the label at the start and the end slot at the inline end. Centerd
 * together, the two read as one word.
 */
test('spreads the label and the end slot to opposite edges under justify between', () => {
  assert.match(rule(`${ui}[data-justify='between']`), /justify-content:space-between/);
  const label = rule(`${ui}[data-justify='between'] > [data-part-label]`);
  assert.match(label, /flex:1 1 auto/);
  assert.match(label, /text-align:start/);
  assert.match(rule(`${ui}[data-justify='between'] > [data-part-end]`), /inline-size:auto/);
  /* The default centers, from the base rule. */
  assert.match(rule(ui), /justify-content:center/);
});

test('is the height its density states, at every step of the scale', () => {
  assert.ok(rule(ui).includes('padding-block:0'), 'block padding inflates the control');

  const lineHeight = 1.45;
  const geometry = {
    comfortable: { sm: [30, 12], md: [34, 12], lg: [38, 14] },
    compact: { sm: [26, 12], md: [28, 12], lg: [32, 13] },
    dense: { sm: [24, 12], md: [26, 12], lg: [30, 12] },
  };

  for (const [density, steps] of Object.entries(geometry)) {
    for (const [step, [height, fontSize]] of Object.entries(steps)) {
      const lineBox = fontSize * lineHeight + 2;
      assert.ok(
        lineBox <= height,
        `${density}/${step}: a single line is ${lineBox}px inside a ${height}px control`,
      );
    }
  }
});

/**
 * WCAG 2.2 SC 2.5.8 in both axes. Theme validation guarantees the block axis
 * through the control height; the inline axis of a square control is the
 * family's own, so the family states the floor.
 */
test('keeps an icon-only target above the minimum in both axes', () => {
  const square = rule(`${ui}[data-shape]`);
  assert.ok(square.includes('aspect-ratio:1'));
  assert.ok(square.includes('inline-size:var(--_height)'));
  assert.ok(square.includes('min-inline-size:var(--slotted-target-min'));
  assert.ok(square.includes('min-block-size:max(var(--_height),var(--slotted-target-min'));
  assert.ok(
    rule(`${ui}[data-shape='circle']`).includes('border-radius:var(--slotted-radius-full'),
    'a circular icon button is not round',
  );
});

/**
 * The theme remaps every token it owns. This block is only for what the family
 * paints itself — the transparent borders of `ghost` and of a control at rest.
 */
test('restores the edge forced colors would leave the family without', () => {
  const query = css.slice(css.indexOf('@media (forced-colors: active)'));
  assert.match(query, /border-color:\s*ButtonBorder/);
  assert.match(query, /border-color:\s*Highlight/);
  assert.match(query, /border-color:\s*GrayText/);
});

test('exercises every declared part in the harness fragment', () => {
  const parts = new Set(Object.values(contract.members).flatMap((member) => member.parts));
  for (const part of parts) {
    assert.ok(fragment.includes(`data-part="${part}"`), `no scene renders the ${part} part`);
  }
  assert.match(fragment, new RegExp(`data-ui="${contract.ui}"`));
});

test('exercises every declared axis and attribute state in the harness fragment', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    for (const value of values) {
      assert.ok(
        fragment.includes(`data-${axis}="${value}"`),
        `no scene renders ${axis}="${value}"`,
      );
    }
  }
  for (const attribute of Object.values(contract.stateAttributes)) {
    assert.ok(fragment.includes(attribute), `no scene renders ${attribute}`);
  }
});
