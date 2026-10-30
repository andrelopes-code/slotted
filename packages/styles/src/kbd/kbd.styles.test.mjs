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
  readFileSync(new URL('../../../../specs/components/kbd/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./kbd.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./kbd.harness.html', import.meta.url), 'utf8'),
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
const shortcut = `${ui}[data-part-shortcut]`;

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
  for (const part of contract.members.kbd.parts) {
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
});

/**
 * `shortcut` contains the roots instead of sitting inside one, so it is the
 * part that carries the family identifier itself. Every rule reaching either of
 * the two names both attributes, which is what stops a rule meant for one key
 * from reaching the combination that holds it.
 */
test('names the family and the part together, so the combination is never a key', () => {
  for (const selector of normalized.matchAll(/(^|\})([^{}@]+)\{/g)) {
    for (const part of (selector[2] ?? '').split(',')) {
      if (!part.includes(`[data-part-shortcut]`) && !part.includes(`[data-part-root]`)) continue;
      assert.ok(part.includes(ui), `"${part.trim()}" reaches a part without naming the family`);
    }
  }
});

/**
 * The height is a step of a scale, and nothing inside the cap moves it. As a
 * sum of the legend's line box the legend decided — `⌘` stood 27.92px beside an
 * `Esc` of 25.19 (K1) — and as a sum of the edges the variant decided: a
 * `raised` key stood 25.19 beside an `outline` key of 24.19. Every absolute
 * step reads the space scale, and the same length is the minimum inline size,
 * which is what makes a one-letter cap square instead of a slot.
 */
test('states one height per size, which no legend and no variant changes', () => {
  assert.ok(!declarations.includes('--slotted-kbd-height'), 'the family invents a height scale');
  assert.ok(!declarations.includes('--_own-size'), 'the height is a sum of what is inside');
  const base = rule(ui);
  assert.ok(base.includes('--_size:var(--slotted-space-8'));
  /* Inside a control the cap is the foundation's inner size; alone, its step. */
  assert.ok(base.includes('--_block-size:var(--slotted-control-inner-size,var(--_size))'));
  assert.ok(rule(`${ui}[data-size='xs']`).includes('--_size:var(--slotted-space-6'));
  assert.ok(rule(`${ui}[data-size='sm']`).includes('--_size:var(--slotted-space-7'));
  assert.ok(
    rule(`${ui}[data-size='lg']`).includes(
      '--_size:calc(var(--slotted-space-8,1.5rem) + var(--slotted-space-2,0.25rem))',
    ),
  );
  for (const variant of ['outline', 'soft', 'plain']) {
    assert.ok(!rule(`${ui}[data-variant='${variant}']`).includes('--_size'), variant);
  }

  const cap = rule(root);
  assert.ok(cap.includes('block-size:var(--_block-size)'), 'the height follows the legend');
  assert.ok(!cap.includes('min-block-size:'), 'a floor is a height the tallest legend states');
  assert.ok(cap.includes('min-inline-size:var(--_block-size)'));
});

/**
 * The other half of K1, which is what makes a stated height legible rather than
 * merely fixed: the legend's line box stops at its own em box, so a substituted
 * glyph cannot grow it, and the cell centres what is in it on both axes rather
 * than leaving the legend sitting on the line box it opened.
 */
test('centres the legend in a cell instead of in the line box it opened', () => {
  const cap = rule(root);
  assert.ok(cap.includes('display:inline-grid'));
  assert.ok(cap.includes('place-items:center'));
  assert.ok(cap.includes('line-height:1;'), 'the legend still carries leading of its own');
  assert.ok(cap.includes('font-variant-numeric:tabular-nums'));
});

/**
 * A cap centres the line box, and a line box is not symmetric around the
 * letters inside it. `text-box` centres the ink instead, and it needs a block
 * container — the text of a grid container lives in an anonymous item no
 * selector can reach, which is why the `legend` part exists.
 *
 * Unlike `badge` there is no clip region to buy room for, because a key label
 * is never truncated: `⌘`, `↑` and a descender all reach outside a box trimmed
 * to the cap and the baseline, and here they paint into the inset.
 */
test('gives the legend a box of its own, and trims it where the engine can', () => {
  assert.ok(normalized.includes(`${ui} [data-part-legend]`));

  const guarded = normalized.split('@supports (text-box:trim-both cap alphabetic){')[1] ?? '';
  const supported = guarded.split('}')[0];
  assert.ok(supported.includes('text-box:trim-both cap alphabetic'), 'the trim is not guarded');
  assert.ok(!normalized.includes(`${root}{overflow:hidden`), 'a cap that clips is a cap that lies');
});

/**
 * ARIA in HTML maps `kbd` to no role and declares it Naming Prohibited, so the
 * word a reader hears has to be content. The rule that hides it is restated
 * here rather than borrowed from the `visually-hidden` family: an accessible
 * name that disappears when a consumer forgets an import is not one.
 */
test('hides the spoken word itself, rather than depending on another family', () => {
  const name = rule(`${ui} [data-part-name]`);
  assert.ok(name.includes('position:absolute'));
  assert.ok(name.includes('clip-path:inset(50%)'));
  assert.ok(name.includes('inline-size:1px'));
  assert.ok(name.includes('block-size:1px'));
});

/**
 * A combination is one formula. The bidi algorithm renders `Ctrl + K` inside an
 * Arabic paragraph as a single left-to-right run, which is what macOS and
 * Windows show in a right-to-left locale; a mirrored `K + ⌘` is a shortcut no
 * operating system displays. Only the order of the caps is pinned — the
 * combination still sits where the paragraph puts it.
 */
test('pins the order of the keys, and lets the combination flow with the page', () => {
  const combination = rule(shortcut);
  assert.ok(combination.includes('direction:ltr'));
  assert.ok(combination.includes('flex-wrap:wrap'), 'a shortcut too wide for its column truncates');
  /**
   * Without this the wrap is a coincidence: an `inline-flex` box is sized by
   * its content, so a five-key combination in a 360-pixel column ran out of it
   * rather than breaking inside it.
   */
  assert.ok(combination.includes('max-inline-size:100%'), 'the combination never caps its width');
  assert.ok(!combination.includes('inset-inline'), 'the combination places itself');
});

/**
 * Chrome drops `box-shadow` outright under `forced-colors: active`, measured
 * while `badge` was built, so a key made of a shadow is a flat key exactly
 * where the affordance is most needed. The bottom edge is a border.
 */
test('raises the key with an edge that survives forced colours', () => {
  assert.ok(!declarations.includes('box-shadow'), 'the raised key is made of a shadow');
  assert.ok(
    rule(`${ui}[data-variant='raised']`).includes('--_base-width:var(--slotted-kbd-base-width'),
    'raised draws no bottom edge',
  );
  assert.ok(rule(root).includes('border-block-end:var(--_base-width) solid var(--_base)'));
});

/**
 * The base is the signal that says the word inside is a key, so it reads the
 * one border token the theme holds to 3:1 against the surface. The rim is the
 * edge a control draws: the strong token on all four sides was a frame round a
 * word. `outline` draws nothing but its edge, so it keeps the strong one all
 * round.
 */
test('draws the base with the one border the theme holds to a ratio', () => {
  const base = rule(ui);
  assert.ok(base.includes('var(--slotted-control-border-color'));
  assert.ok(base.includes('--_base:var(--slotted-border-strong'));
  assert.ok(
    rule(`${ui}[data-variant='outline']`).includes(
      '--_border:var(--slotted-kbd-border-color,var(--slotted-border-strong',
    ),
  );
});

/**
 * The face runs into the base: an image, so forced colours drop it with the
 * ground and keep the edges. It belongs to `raised` alone and leaves with the
 * available state.
 */
test('shades the raised face toward its base, and only while it is available', () => {
  assert.ok(rule(ui).includes('--_face:none'));
  assert.ok(rule(root).includes('background-image:var(--_face)'));
  const raised = rule(`${ui}[data-variant='raised']`);
  assert.ok(raised.includes('--_face:linear-gradient('));
  assert.ok(raised.includes('color-mix(in oklab,var(--_background),var(--_base) 10%)'));
  assert.ok(rule(`${ui}[data-disabled]`).includes('--_face:none'));
});

/**
 * A theme that re-tints the tone tokens in a region keeps a key cap opaque
 * through the family's own tokens. Each is read ahead of the token the variant
 * used before; `outline` and `plain` own no ground, so the surface token
 * reaches `raised` and `soft` alone.
 */
test('reads its own surface, rim and ink ahead of the tokens each variant used', () => {
  const base = rule(ui);
  assert.ok(base.includes('--_background:var(--slotted-kbd-surface,var(--slotted-surface-raised'));
  assert.ok(base.includes('--_border:var(--slotted-kbd-border-color,'));
  assert.ok(base.includes('--_color:var(--slotted-kbd-color,var(--slotted-text'));
  const soft = rule(`${ui}[data-variant='soft']`);
  assert.ok(soft.includes('--_background:var(--slotted-kbd-surface,var(--slotted-tone-secondary'));
  assert.ok(soft.includes('--_border:var(--slotted-kbd-border-color,var(--slotted-tone-secondary'));
  assert.ok(soft.includes('--_color:var(--slotted-kbd-color,var(--slotted-tone-secondary-text'));
  assert.ok(
    rule(`${ui}[data-variant='outline']`).includes('--_color:var(--slotted-kbd-color,inherit)'),
  );
  const plain = rule(`${ui}[data-variant='plain']`);
  assert.ok(plain.includes('--_color:var(--slotted-kbd-color,inherit)'));
  assert.ok(plain.includes('--_background:transparent'));
});

/**
 * `--slotted-surface-sunken` is the page's own colour on a sunken panel, where
 * a key painted with it would disappear. The neutral tone's surface is the step
 * `badge` calibrated to read on both.
 *
 * The edge is not decoration on this variant either: read in the
 * `high-contrast` scheme with no edge, the chip was gone outright and
 * `Ctrl + B` was a run of text.
 */
test('paints the tinted key from the neutral tone, and gives it the tone’s edge', () => {
  const soft = rule(`${ui}[data-variant='soft']`);
  assert.ok(soft.includes('var(--slotted-tone-secondary-surface)'));
  assert.ok(soft.includes('var(--slotted-tone-secondary-border)'));
  assert.ok(soft.includes('var(--slotted-tone-secondary-text)'));
  assert.ok(!declarations.includes('--slotted-surface-sunken'));
});

/**
 * Every ground this family paints is a token the theme already remaps, and
 * every edge it draws is a border token. There is no filled variant whose edge
 * is its own fill, which is the case `badge` had to write a rule for.
 */
test('writes no forced-colours rule, because it paints nothing the theme cannot reach', () => {
  assert.equal((declarations.match(/forced-colors/g) ?? []).length, 0);
});

/**
 * A plain key takes the colour of the text it sits in, which is what makes a
 * dimmed menu row dim its shortcut with no state set at all. The two variants
 * that own no ground keep owning none when they are unavailable: a disabled
 * `outline` that filled itself grey would be a grey rectangle on whatever
 * surface it was placed over.
 */
test('lets the bare key inherit, and never fills the two that own no ground', () => {
  /* Read on an inverse surface, an outlined key was near-black on near-black. */
  assert.ok(
    rule(`${ui}[data-variant='outline']`).includes('--_color:var(--slotted-kbd-color,inherit)'),
  );
  assert.ok(
    rule(`${ui}[data-variant='plain']`).includes('--_color:var(--slotted-kbd-color,inherit)'),
  );
  const bare = rule(
    `${ui}[data-variant='outline'][data-disabled],${ui}[data-variant='plain'][data-disabled]`,
  );
  assert.ok(bare.includes('--_background:transparent'));
});

/**
 * The monospaced face is chosen for its Latin, and its symbol coverage is
 * incidental: measured here, every modifier mark rendered visibly thinner and
 * smaller than `Esc` in the same cap. A mark is also not trimmed to the cap and
 * the baseline, because those are Latin metrics and a mark sat high against
 * them.
 */
test('sets a mark in the interface face, and does not trim it to a Latin band', () => {
  const mark = `${ui} [data-part-legend][data-legend='symbol']`;
  /* Two rules carry this selector, and the trim one is inside `@supports`. */
  const painted = normalized.split(`${mark}{`).at(-1) ?? '';
  assert.ok(painted.includes('font-family:var(--slotted-kbd-symbol-font-family'));
  assert.match(painted.split('}')[0] ?? '', /font-size:1\.[0-9]+em/);

  const guarded = normalized.split('@supports (text-box:trim-both cap alphabetic){')[1] ?? '';
  assert.ok(guarded.includes(`${mark}{text-box:normal`));
});

/**
 * A Mac joins with nothing, so the gap is the only thing holding a combination
 * together — and at the shared step it was the width of the space between two
 * separate shortcuts on the same line.
 */
test('tightens the combination the platform joins with nothing', () => {
  assert.ok(
    rule(`${shortcut}[data-platform='mac']`).includes('--_gap:var(--slotted-space-1'),
    'a Mac combination is as loose as the gap between two shortcuts',
  );
});

/** Every step of every axis the contract declares has a rule, or it is the default. */
test('answers every value of every axis', () => {
  for (const size of contract.axes.size) {
    if (size === contract.members.kbd.defaults.size) continue;
    assert.ok(normalized.includes(`${ui}[data-size='${size}']{`), `no rule for size ${size}`);
  }
  for (const variant of contract.axes.variant) {
    assert.ok(
      normalized.includes(`${ui}[data-variant='${variant}']`),
      `no rule for variant ${variant}`,
    );
  }
});

/**
 * The step no surveyed implementation ships. Every absolute size makes a key
 * inside an `h2` a stamp and one in fine print a slab; the relative step needs
 * its insets in the same unit, or a large key carries a small key's padding.
 */
test('scales the relative step by the text around it, insets included', () => {
  const inherited = rule(`${ui}[data-size='inherit']`);
  assert.ok(inherited.includes('--_font-size:0.8em'));
  for (const custom of ['--_size', '--_inset-inline', '--_gap']) {
    assert.match(inherited, new RegExp(`${custom}:[0-9.]+em`), `${custom} is not relative`);
  }
  /* 1.5 of a legend at 0.8 is 1.2 of the text: inside any line box of 1.3. */
  assert.ok(inherited.includes('--_size:1.5em'));
  assert.ok(normalized.includes(`${ui}[data-size='inherit']{--_size:round(nearest,1.5em,1px)`));
});

/**
 * Presentational, and the strongest state this family has: there is no hover
 * and no press for it to hold itself back for. The separator dims with the keys
 * it joins, because a bright `+` between two grey caps is the only thing on the
 * row that would still look available.
 */
test('dims the whole combination, separator included', () => {
  const disabled = rule(`${ui}[data-disabled]`);
  assert.ok(disabled.includes('--_color:var(--slotted-disabled-foreground'));
  assert.ok(disabled.includes('--_background:var(--slotted-disabled-background'));
  assert.ok(
    rule(`${ui}[data-disabled] [data-part-separator]`).includes(
      'color:var(--slotted-disabled-foreground',
    ),
  );
  assert.ok(!declarations.includes(':hover'), 'a key is not a control');
  assert.ok(!declarations.includes(':active'), 'a key is not a control');
});

/* ── The fragment is the third place this DOM is written ────────────────── */

test('renders every part the contract declares in at least one scene', () => {
  for (const part of contract.members.kbd.parts) {
    assert.match(fragment, new RegExp(`data-part="${part}"`), `no scene renders the ${part} part`);
  }
});

test('exercises every state the contract declares', () => {
  assert.match(fragment, /data-disabled/);
});

test('exercises every value of every axis', () => {
  for (const size of contract.axes.size) {
    assert.match(fragment, new RegExp(`data-size="${size}"`), `no scene renders size ${size}`);
  }
  for (const variant of contract.axes.variant) {
    assert.match(
      fragment,
      new RegExp(`data-variant="${variant}"`),
      `no scene renders variant ${variant}`,
    );
  }
  for (const platform of contract.axes.platform) {
    if (platform === 'auto' || platform === 'other') continue;
    assert.match(
      fragment,
      new RegExp(`data-platform="${platform}"`),
      `no scene renders platform ${platform}`,
    );
  }
});

/**
 * Every key whose legend is a symbol or an abbreviation hides that legend and
 * carries the word behind it. A scene that drew `⌘` and left it to be read
 * would be a scene proving the opposite of what the family claims.
 */
test('gives every hidden legend a word, and every word a hidden legend', () => {
  const legends = [...fragment.matchAll(/<span data-part="legend"([^>]*)>([^<]*)<\/span>/g)];
  assert.ok(legends.length > 10, 'the fragment shows too few legends to prove anything');
  for (const [, attributes, text] of legends) {
    const hidden = attributes.includes('aria-hidden');
    assert.equal(
      hidden,
      /data-key="/.test(fragment.split(`>${text}</span>`)[0]?.slice(-200) ?? ''),
      `the legend ${text} disagrees with its own key about being read`,
    );
  }
});
