import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./app-shell.css', import.meta.url), 'utf8');
const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/app-shell/contract.json', import.meta.url),
    'utf8',
  ),
);

/** The body of the first rule whose selector matches, comments and all. */
function rule(selector) {
  const at = css.indexOf(selector);
  assert.notEqual(at, -1, `no rule for ${selector}`);
  const open = css.indexOf('{', at);
  const close = css.indexOf('\n  }', open);
  return { body: css.slice(open, close), at };
}

/**
 * The breakpoint is a literal because `@container (inline-size: var(--x))` is
 * invalid CSS, and the same number has to reach script: the stylesheet decides
 * where the navigation is drawn and the script decides whether `Escape`, the
 * focus scope and `inert` are in play. Two literals is how the two drift apart.
 */
test('reads the same breakpoint the contract states, and no other', () => {
  const conditions = [...css.matchAll(/@container\s+slotted-app-shell\s+\(([^)]*)\)/g)].map(
    ([, condition]) => condition.trim(),
  );

  assert.ok(conditions.length > 0, 'the family answers no width at all');
  for (const condition of conditions) {
    assert.match(
      condition,
      new RegExp(`^inline-size (>=|<) ${contract.overlayAt}px$`),
      `${condition} states a width the contract does not`,
    );
  }
});

/**
 * The defect this test exists for, in the reviewer's words: the overlaid
 * navigation showed "just a dark scrim and nothing else".
 *
 * `navMode` is an axis a consumer may state at any width. With the layer's
 * geometry inside the narrow container query, forcing the mode on a wide screen
 * left the region a static column while the script applied the veil, the focus
 * scope and `inert` — a dark screen with nothing on it. The mode owns the
 * geometry; the width only ever decides the mode.
 */
test('draws the layer from the mode, never from the width', () => {
  const layer = rule("[data-nav-mode='overlay'] > [data-part-nav] {");
  assert.match(layer.body, /position:\s*absolute/);
  assert.match(layer.body, /z-index:/);
  assert.match(layer.body, /translate:\s*-100% 0/);

  /* Every `@container` before it has already closed, so the rule is not inside
     one: a width query would put the mode back under the width's control. */
  const before = css.slice(0, layer.at);
  const opened = (before.match(/@container/g) ?? []).length;
  const closed = (before.match(/\n {2}\}\n/g) ?? []).length;
  assert.ok(opened <= closed, 'the layer is written inside a width query');
});

/**
 * `container-type: inline-size` makes an element a query container for its
 * descendants and not for itself, so the root cannot rewrite its own template
 * from its own query. Every region places itself instead.
 */
test('never rewrites the root template from the root own query', () => {
  const blocks = css.slice(css.indexOf('@container slotted-app-shell'));
  assert.equal(/grid-template/.test(blocks), false);
  assert.match(css, /container-type:\s*inline-size/);
});

/**
 * An absolutely positioned grid child placed into a definite area takes *that
 * area* as its containing block rather than the grid's padding box. The panel
 * therefore stops under the banner without anyone measuring it — and when the
 * area was the body row alone, `max-inline-size: 80%` resolved against a column
 * with nothing in it and clamped a 240-pixel panel to zero.
 */
/**
 * A column shares the screen with the content and earns every pixel; a layer
 * covers content the reader cannot reach, so its width costs nothing but the
 * strip that says where to press to leave. The layer takes its own measure —
 * wider than the column — and stops one mark and two gutters short of the
 * frame, which on a phone is what the eighty per cent it replaced left as a
 * sliver of unreachable content beside a narrow panel.
 */
test('draws the layer wider than the column and leaves a strip to press', () => {
  const layer = rule("[data-nav-mode='overlay'] > [data-part-nav] {").body;
  assert.match(
    layer.replace(/\s+/g, ''),
    /inline-size:min\(var\(--_nav-overlay-size\),calc\(100%-var\(--_row-mark\)-2\*var\(--_gutter\)\)\)/,
  );
  assert.doesNotMatch(layer, /max-inline-size:\s*80%/);
  assert.match(css, /--_nav-overlay-size: var\(--slotted-app-shell-nav-overlay-size, 20rem\)/);
});

test('gives the layer the rows it should cover, and the veil the same ones', () => {
  assert.match(
    rule("[data-nav-mode='overlay'] > [data-part-nav] {").body,
    /grid-area:\s*2 \/ 1 \/ -1 \/ -1/,
  );
  assert.match(rule('> [data-part-scrim] {').body, /grid-area:\s*2 \/ 1 \/ -1 \/ -1/);
});

/**
 * A closed layer stands one whole width outside the frame, and a transformed
 * box still counts towards the scrollable overflow of every scroll container
 * above it. Measured in the `navModes` story: the closed end-side panel gave
 * the document 192 pixels of horizontal overflow once the demo frame's clip
 * was lifted, and inside that frame the focus scope's first `focus()` scrolled
 * the frame 240 pixels to the hidden panel, which the slide then clamped back
 * frame by frame — the whole page jumped and returned. The frame clips its own
 * inline axis, so a layer outside it is outside of nothing that can scroll;
 * the block axis stays open, because the frame grows with its content under
 * `scroll='document'` and nothing leaves it that way.
 */
test('clips its own inline axis, so a closed layer moves no scroll', () => {
  const root = rule('[data-ui-app-shell] {').body.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(root, /overflow-x:\s*clip/);
  assert.match(root, /overflow-y:\s*visible/);
  assert.match(root, /overflow-inline:\s*clip/);
  assert.match(root, /overflow-block:\s*visible/);
  assert.doesNotMatch(
    root,
    /overflow-clip-margin/,
    'a margin is a strip of the layer left in the frame',
  );
});

/**
 * On the inset plane the layer is a card: a border, a radius, a shadow. The
 * column it replaces has no edge of its own, so its rows may run to the
 * region's limit; a card whose row grounds meet its border reads as a panel
 * with no padding — the Nexora overlay, and the `navModes` story at 420
 * pixels. The card insets every row by the row inset, header, body and footer
 * alike, so the marks stay in one column and the consumer's header row, which
 * writes the same inset, keeps standing over them.
 */
test('insets the rows of the overlay card on the inset plane', () => {
  /* The card and the sheet alike: every layer has an edge, and the parts read
     the inset the layer states. */
  const layer = rule("[data-nav-mode='overlay'] > [data-part-nav] {").body;
  assert.match(layer, /--_nav-inset:\s*var\(--_row-inset\)/);
  assert.match(layer, /padding-inline:\s*0/);
  const parts = rule(
    '> [data-part-nav]\n    > :is([data-part-nav-header], [data-part-nav-body], [data-part-nav-footer]) {',
  ).body;
  assert.match(parts, /padding-inline:\s*calc\(var\(--_nav-inset\) \+ var\(--_row-ring-inset\)\)/);
});

/**
 * The card is a wide screen's arrangement: a gutter, a radius and an edge on
 * all four sides read as one raised sheet among regions. On a phone, where
 * the navigation has become a layer, the same card is a frame around a
 * column of content that has no room to spare — a gutter on every side and
 * rounded corners against the screen's own. The content then meets the
 * frame's edges and keeps one rule, under the banner, for the seam the
 * gutter used to draw. Keyed on the mode, as every other layer rule is, with
 * the width answering only for a shell whose mode is not yet decided.
 */
test('flushes the content on the inset plane once the navigation is a layer', () => {
  const flush = rule(
    "[data-canvas='inset'][data-nav-mode='overlay'] > [data-part-main] {",
  ).body.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(flush, /border-block-end:\s*0/);
  assert.match(flush, /border-inline:\s*0/);
  assert.match(flush, /border-radius:\s*0/);
  assert.match(flush, /box-shadow:\s*none/);
  assert.match(flush, /margin:\s*0/);
  assert.doesNotMatch(flush, /border-block-start:\s*0/, 'the seam under the banner stays');

  const narrow =
    /@container slotted-app-shell \(inline-size < 600px\) \{([\s\S]*?)\n {2}\}\n/.exec(css)?.[1] ??
    '';
  assert.match(
    narrow,
    /:not\(\[data-nav-mode\]\)\[data-canvas='inset'\]\s*>\s*\[data-part-main\]/,
    'a shell not yet measured draws the narrow picture from the width',
  );
});

/**
 * One grid of measures. Every left edge in the frame is one of two sums of the
 * three, and they are published because the rows inside the regions belong to
 * `side-navigation`, wave 8.
 */
test('publishes the measures its rows stand on', () => {
  for (const token of Object.keys(contract.published).filter((key) => key.startsWith('--'))) {
    assert.match(css, new RegExp(`${token}: var\\(--_row-`), `${token} is not published`);
  }
  /* A row is text, not a control: the type composes the type scale. */
  const flat = css.replace(/\s+/g, ' ');
  assert.match(
    flat,
    /--_row-font-size: var\( ?--slotted-app-shell-row-text-size, var\(--slotted-font-size-sm/,
  );
  assert.match(
    flat,
    /--_row-line-height: var\( ?--slotted-app-shell-row-text-line-height, var\(--slotted-line-height-sm/,
  );
  /* And a row is as tall as its mark box, or the mark is off-centre in it. */
  assert.match(css, /--slotted-app-shell-row-height: var\(--_row-mark\)/);
  /* The control in the bar is the mark column, or it does not stand over the
     marks in the column. */
  const toggle = rule('[data-part-aside-toggle] {');
  assert.match(toggle.body, /inline-size:\s*var\(--_row-mark\)/);
  assert.match(toggle.body, /block-size:\s*var\(--_row-mark\)/);
  /* A rail is one mark column with a row's inset on each side, so it is
     centred in itself rather than being a column with its air on one side. */
  assert.match(css, /--_rail-size:[\s\S]*?var\(--_row-mark\) \+ var\(--_row-inset\) \* 2/);
});

/**
 * The frame is one plane under `inset` and the gutter separates it. A rule
 * *across* it would be the hairline the plane replaced — the banner's own
 * bottom edge included, which outlived the decision by a pass. A closed
 * outline is a different thing: it is the card's own edge, and it goes with
 * the radius and the elevation on the same rule.
 */
test('separates the inset canvas with a gutter and not with a rule', () => {
  for (const [, body] of css.matchAll(/\[data-canvas='inset'\][^{]*\{([^}]*)\}/g)) {
    assert.equal(
      /border-(block|inline)(-start|-end)?:\s*var\(--_rule-width\)/.test(body),
      false,
      'the inset canvas draws a rule between two regions',
    );
    if (/border:\s*var\(--_rule-width\)/.test(body)) {
      assert.match(body, /border-radius:/, 'a closed outline without a radius is a rule');
    }
  }
  /* Every seam the family draws is where two regions touch without a gutter:
     under `flush`, inside the `panel` card, under the banner in the content's
     card, or beside a rail of its own. The whole selector is read: a selector
     list spans lines and the canvas is written before the part. */
  const seams = [...css.matchAll(/var\(--_seam\)/g)];
  assert.ok(seams.length >= 10, 'the seams read the one property');
  for (const hit of seams) {
    const open = css.lastIndexOf('{', hit.index);
    const start = Math.max(css.lastIndexOf('}', open), css.lastIndexOf('*/', open)) + 1;
    const selector = css.slice(start, open);
    if (/--_seam:/.test(css.slice(open, hit.index))) continue;
    assert.match(
      selector,
      /data-canvas='flush'|data-canvas='panel'|data-primary='main'|data-part-nav-rail/,
      `${selector.trim().replace(/\s+/g, ' ')} draws a seam where a gutter separates`,
    );
    assert.doesNotMatch(selector, /data-canvas='(inset|floating)'/);
  }
  assert.match(css, /border-radius:\s*var\(--_radius\)/);
  assert.match(css, /box-shadow:\s*var\(--_elevation\)/);
  /* The gutter is a margin, so the navigation's own box is the strip a reader
     sees and a rail is centred in itself. */
  const inset = rule("[data-canvas='inset'] > [data-part-nav] {");
  assert.match(inset.body, /margin-inline-start:\s*var\(--_gutter\)/);
  assert.equal(/padding-inline-start/.test(inset.body), false);
});

/**
 * Every region is repaintable on its own, and the plane only decides the
 * default. A shell whose column is dark over a light frame is one declaration.
 */
test('gives every region a ground and an ink of its own', () => {
  for (const region of ['banner', 'nav', 'main', 'aside', 'footer']) {
    const body = rule(`> [data-part-${region.toLowerCase()}] {`).body.replace(/\s+/g, ' ');
    assert.match(
      body,
      new RegExp(`background-color: var\\( ?--slotted-app-shell-${region}-surface,`),
      `${region} cannot be repainted on its own`,
    );
    assert.match(
      body,
      new RegExp(
        `color: var\\( ?--slotted-app-shell-${region}-color, var\\(--slotted-app-shell-color, var\\(--slotted-text`,
      ),
      `${region} has no ink of its own`,
    );
    /* Not a local held on the frame. A `var()` resolves where the declaration
       stands, so a default kept on the root hands a region carrying
       `data-slotted-scheme="dark"` the light scheme's ink over its own dark
       ground — which is what the harness photographed before this. */
    assert.equal(
      /var\(--_(banner|nav|main|aside|footer)-(surface|ink)\)/.test(body),
      false,
      `${region} reads a paint the frame resolved for it`,
    );
    /* And the plane is a second declaration on the region, not a second local. */
    assert.match(
      rule(`[data-canvas='flush'] > [data-part-${region.toLowerCase()}] {`).body.replace(
        /\s+/g,
        ' ',
      ),
      new RegExp(`background-color: var\\( ?--slotted-app-shell-${region}-surface,`),
      `${region} takes no ground of its own under flush`,
    );
  }
  /* And the control is of the region it stands in, whatever that was painted:
     read from a token it kept the light scheme's ink over a dark column. */
  assert.match(rule('[data-part-aside-toggle] {').body, /color: color-mix\(in oklab, currentcolor/);
});

/**
 * The closed strip is centred in itself under both planes. It was not: the
 * gutter was `padding-inline-start` on the region, so the fifty-pixel strip
 * carried twelve pixels on one side and none on the other — once under `inset`
 * as `padding`, and once more under `flush` after the first was fixed.
 */
test('adds nothing to one side of the region under either plane', () => {
  const inset = rule("[data-canvas='inset'] > [data-part-nav] {");
  assert.equal(/padding-inline/.test(inset.body), false, 'inset pads the region on one side');
  /* Every inline padding the region takes is the one symmetric inset, and the
     closed width counts it on both sides. */
  const onOneSide = /padding-inline-(start|end)/;
  for (const [, body] of css.matchAll(/> \[data-part-nav\] \{([^}]*)\}/g)) {
    assert.equal(onOneSide.test(body), false, 'a rule pads the region on one side');
  }
  assert.match(
    rule("[data-nav-mode='inline'] > [data-part-nav] {").body,
    /inline-size:\s*calc\(\s*var\(--_rail-size\) \+ 2 \* \(var\(--_nav-inset\) \+ var\(--_row-ring-inset\)\) \+ var\(--_nav-edges\)\s*\)/,
  );
  assert.match(rule("[data-canvas='flush'] {").body, /--_nav-inset:\s*var\(--_row-inset\)/);
});

/**
 * The rail is a width and nothing else. What a destination shows at that width
 * belongs to `side-navigation`, which answers the region's own query rather
 * than being told.
 */
/**
 * A control a product puts in the column draws its focus ring outside its box,
 * and the body clips at its padding box. The three parts pad by the ring's
 * reach and publish it, and the head and the foot reserve the gutter the body
 * reserves, so the three share one content edge with classic scrollbars.
 */
test('pads the column parts by the focus ring and shares the body gutter', () => {
  assert.match(
    css,
    /--_row-ring-inset:\s*calc\(\s*var\(--slotted-focus-ring-width, 2px\) \+ var\(--slotted-focus-ring-offset, 2px\)\s*\)/,
  );
  const parts = rule(
    '> [data-part-nav]\n    > :is([data-part-nav-header], [data-part-nav-body], [data-part-nav-footer]) {',
  ).body;
  assert.match(parts, /--slotted-app-shell-row-ring-inset:\s*var\(--_row-ring-inset\)/);
  const ends = rule(
    '[data-ui-app-shell] > [data-part-nav] > [data-part-nav-header],\n  [data-ui-app-shell] > [data-part-nav] > [data-part-nav-footer] {',
  ).body;
  assert.match(ends, /overflow:\s*hidden/);
  assert.match(ends, /scrollbar-gutter:\s*stable/);
});

test('makes the navigation region a query container of its own', () => {
  assert.match(css, /container-name:\s*slotted-app-shell-nav/);
});

/**
 * And the bar, for the same reason: under `primary='nav'` the bar is the
 * frame's width less the navigation's, so a bar told the frame's width is told
 * a width it does not have. A 428-pixel frame with a 288-pixel column left the
 * bar 140 pixels and four controls that needed 196.
 */
test('makes the bar a query container of its own', () => {
  assert.match(css, /container-name:\s*slotted-app-shell-banner/);
  /* And it may be narrower than what it holds without pushing the frame out. */
  const actions = rule('> [data-part-banner] > [data-part-actions] {');
  assert.match(actions.body, /min-inline-size:\s*0/);
});

/** Every part the contract declares is painted, and no rule names another. */
test('paints every part the contract declares and no other', () => {
  const painted = new Set([...css.matchAll(/\[data-part-([a-z-]+)\]/g)].map(([, part]) => part));
  const declared = new Set(contract.members.appShell.parts);

  for (const part of declared) {
    if (part === 'root') continue;
    assert.ok(painted.has(part), `${part} is declared and never painted`);
  }
  for (const part of painted) {
    assert.ok(declared.has(part), `the stylesheet paints ${part}, which is not a declared part`);
  }
});

/**
 * The mark on the disclosure control is the pair the contract names, drawn as
 * the Glyph element the binding renders: the stylesheet paints no glyph and
 * only turns the box.
 */
test('paints no disclosure mark of its own', () => {
  assert.equal(/mask-image/.test(css), false);
  assert.equal(/--slotted-icon-(panel|chevrons)/.test(css), false);
  assert.equal(/toggle'\]::before/.test(css), false);
});

/**
 * The pane is a layer by its mode and a column by the width, exactly as the
 * navigation is — the same defect the navigation's test exists for would put
 * the pane's geometry under the width's control.
 */
test('draws the pane layer from the mode, and the pane column from the width', () => {
  const layer = rule("[data-aside-mode='overlay'] > [data-part-aside] {");
  assert.match(layer.body, /position:\s*absolute/);
  assert.match(layer.body, /grid-area:\s*2 \/ 1 \/ -1 \/ -1/);
  assert.match(layer.body, /translate:\s*100% 0/);
  const before = css.slice(0, layer.at);
  const opened = (before.match(/@container/g) ?? []).length;
  const closed = (before.match(/\n {2}\}\n/g) ?? []).length;
  assert.ok(opened <= closed, 'the pane layer is written inside a width query');

  /* Every width rule for the pane leaves the layer alone. */
  const queries = css.slice(css.indexOf('@container slotted-app-shell ('));
  for (const hit of [...queries.matchAll(/> \[data-part-aside\]/g)]) {
    const start =
      Math.max(queries.lastIndexOf('}', hit.index), queries.lastIndexOf('{', hit.index)) + 1;
    const selector = queries.slice(start, hit.index).replace(/\s+/g, '');
    assert.match(selector, /:not\(\[data-aside-mode/, `${selector} places the layer by width`);
  }
  /* Closed, the pane leaves the layout: it has no rail. */
  const shut = css.indexOf(
    ":not([data-aside-mode='overlay']) > [data-part-aside]:not([data-open])",
  );
  assert.notEqual(shut, -1, 'a closed pane has no rule');
  assert.match(css.slice(shut, css.indexOf('}', shut)), /display:\s*none/);
});

/** The pane pins its ends and scrolls its middle, as the column does. */
test('gives the pane a pinned head, a scrolling body and a pinned foot', () => {
  assert.match(rule('> [data-part-aside] > [data-part-aside-body] {').body, /flex:\s*1 1 auto/);
  const ends = rule('> [data-part-aside] > [data-part-aside-header],').body;
  assert.match(ends, /flex:\s*0 0 auto/);
  assert.match(ends, /padding-block:\s*var\(--_row-inset\)/);
  /* And the middle of the bar grows, so a bar is three clusters and no void. */
  const centre = rule('> [data-part-banner] > [data-part-centre] {').body;
  assert.match(centre, /flex:\s*1 1 auto/);
  assert.match(centre, /min-inline-size:\s*0/);
});

/**
 * The two scrolling bodies draw the bar `scroll-area` draws: a reserved
 * gutter, so a column that grows past its height moves no row sideways; the
 * thin platform bar, so an overlay bar has a gutter to sit in rather than the
 * row's own chevron; and the family's ink on it. Three declarations, the same
 * three, on both bodies.
 */
test('gives both scrolling bodies a gutter and the thin themed bar', () => {
  for (const selector of [
    '> [data-part-nav] > [data-part-nav-body] {',
    '> [data-part-aside] > [data-part-aside-body] {',
  ]) {
    const { body } = rule(selector);
    assert.match(body, /scrollbar-gutter:\s*stable/, `${selector} reserves no gutter`);
    assert.match(body, /scrollbar-width:\s*thin/, `${selector} draws the wide bar`);
    assert.match(
      body,
      /scrollbar-color:\s*var\(--_scrollbar-thumb\)\s+var\(--_scrollbar-track\)/,
      `${selector} leaves the bar unthemed`,
    );
  }
  const root = rule('[data-ui-app-shell] {').body;
  assert.match(root, /--_scrollbar-thumb:\s*var\(\s*--slotted-app-shell-scrollbar-thumb-color/);
  assert.match(
    root,
    /--_scrollbar-track:\s*var\(--slotted-app-shell-scrollbar-track-color,\s*transparent\)/,
  );
});

/**
 * One control, two regions. The pane's control is the navigation's turned,
 * and both read their state — the root's attribute for the navigation, the
 * control's own `aria-expanded` for the pane, because the pane's attribute is
 * on the region and the control may stand outside it.
 */
test('draws the pane control as the navigation control turned', () => {
  assert.match(
    css,
    /\[data-part-nav-toggle\],\s*\[data-ui-app-shell\] \[data-part-aside-toggle\] \{/,
  );
  assert.match(
    css,
    /:not\(\[data-nav-side='end'\]\)\s+\[data-part-aside-toggle\]\s*>\s*\[data-ui-icon\]/,
  );
});

/**
 * Without a rule the two page surfaces were two per cent apart. The tone is a
 * ground of its own, and the subtle pair the controls inside it read is
 * recomputed from that ground, or a hover on it paints the ground itself.
 */
test('separates by a tone that recalibrates the controls standing on it', () => {
  assert.match(rule("[data-separation='tone'] > [data-part] {").body, /--_seam:\s*none/);
  assert.match(
    css,
    /--slotted-app-shell-tone-surface,\s*color-mix\(in oklab, var\(--slotted-surface\), var\(--slotted-text\) 4\.5%\)/,
  );
  const toned = css.slice(
    css.indexOf('/* ── Separation by tone'),
    css.indexOf('/* ── A rail of its own'),
  );
  assert.match(
    toned,
    /--slotted-tone-secondary-subtle-hover:\s*color-mix\(\s*in oklab,\s*var\(--_ground\),\s*var\(--slotted-text\) 4%/,
  );
  assert.match(
    toned,
    /--slotted-tone-secondary-subtle-active:\s*color-mix\(\s*in oklab,\s*var\(--_ground\),\s*var\(--slotted-text\) 7%/,
  );
  /* A tone separates nothing where every ground is Canvas. */
  const forced = css.slice(css.indexOf('@media (forced-colors: active)'));
  assert.match(
    forced,
    /\[data-separation='tone'\] > \[data-part\] \{\s*--_seam: var\(--_rule-width\) solid CanvasText/,
  );
});

/**
 * `--_seam` declared on the root resolved the root's border colour, so the
 * property written on one region recoloured nothing there. The chain is
 * declared again on every region, where a `var()` reads the region's scope.
 */
test('re-reads the seam colour in each region', () => {
  const region = rule('[data-ui-app-shell] > [data-part] {').body;
  assert.match(region, /--_rule:\s*var\(--slotted-app-shell-border-color,/);
  assert.match(region, /--_seam:\s*var\(--_rule-width\) solid var\(--_rule\)/);
});

/** One box for a card over two regions, and none once the navigation is a layer. */
test('paints a card over several regions as the root pseudo-element', () => {
  const card = rule("[data-ui-app-shell][data-canvas='panel']::before {");
  assert.match(css, /content: '';\s*grid-area: 1 \/ 2 \/ 3 \/ 3;/);
  assert.ok(card.at > 0);
  assert.match(rule("[data-nav-mode='overlay'][data-canvas]::before {").body, /content:\s*none/);
});

/** Closing to the rail keeps the strip and takes the column out after the move. */
test('closes a two-level navigation to its own strip', () => {
  const grid = rule('> [data-part-nav]:has(> [data-part-nav-rail]) {');
  assert.match(
    grid.body,
    /grid-template-columns:\s*var\(--_rail-size\) minmax\(var\(--_nav-size\), 1fr\)/,
  );
  const closed = css.slice(
    css.indexOf("[data-nav-mode='inline']:not([data-open])\n    > [data-part-nav]:has"),
  );
  assert.match(closed, /transition: visibility var\(--_duration\) step-end;\s*visibility: hidden;/);
  assert.match(css, /background-image: var\(--slotted-app-shell-frame-image, none\)/);
});

/**
 * The body stands on the inset the head and the foot stand on, so what a pane
 * holds lines up with its title and no consumer pads it by hand; content that
 * brings its own inset says so with the word `drawer` uses.
 */
test('stands the pane body on the row inset, and drops it under data-inset none', () => {
  const body = rule('> [data-part-aside] > [data-part-aside-body] {').body;
  assert.match(body, /padding-block:\s*var\(--slotted-space-5, 0\.75rem\)/);
  assert.match(body, /padding-inline:\s*calc\(var\(--_row-inset\) \+ var\(--_row-gap\)\)/);
  const bare = rule("> [data-part-aside] > [data-part-aside-body][data-inset='none'] {").body;
  assert.match(bare, /padding:\s*0/);
});

/**
 * The edge the reader moves is the column's alone: a layer keeps its size step
 * and a row under the content has no inline edge to move. It is drawn nowhere
 * by default and shown only by the wide query, under a mode that is not the
 * layer's.
 */
test('draws the pane edge on the column and never on the layer', () => {
  const edge = rule('[data-ui-app-shell] > [data-part-aside] > [data-part-aside-resizer] {');
  assert.match(edge.body, /display:\s*none/);
  assert.match(edge.body, /cursor:\s*col-resize/);
  assert.match(edge.body, /touch-action:\s*none/);
  assert.match(edge.body, /position:\s*absolute/);

  const wide = css.slice(css.indexOf('@container slotted-app-shell (inline-size >= 600px)'));
  const column = wide.slice(0, wide.indexOf('@container slotted-app-shell (inline-size < 600px)'));
  assert.ok(
    column
      .replace(/\s+/g, ' ')
      .includes(
        ":not([data-aside-mode='overlay']) > [data-part-aside] > [data-part-aside-resizer]:not([hidden]) { display: flex;",
      ),
    'the wide query shows no edge on the column',
  );
  const positive = css.replaceAll(":not([data-aside-mode='overlay'])", '');
  for (const hit of positive.matchAll(
    /\[data-aside-mode='overlay'\][^{,]*\[data-part-aside-resizer\]/g,
  )) {
    assert.fail(`${hit[0]} draws the edge on the layer`);
  }

  /* On the inner edge: the start of an end pane, the end of a start pane. */
  assert.match(edge.body, /inset-inline-start:\s*0/);
  const start = rule("[data-nav-side='end'] > [data-part-aside] > [data-part-aside-resizer] {");
  assert.match(start.body, /inset-inline-end:\s*0/);
  assert.match(start.body, /inset-inline-start:\s*auto/);
});

/** The splitter's mark at rest, grown under the hand, the drag and the keyboard; the ring for the keyboard. */
test('draws the pane edge as the splitter mark at rest and a ring under the keyboard', () => {
  const first = rule('> [data-part-line]:first-child {').body;
  assert.match(first, /linear-gradient\(to bottom, transparent, var\(--_resizer-rest\)\)/);
  const grip = rule('> [data-part-aside-resizer] > [data-part-grip] {').body;
  assert.match(grip, /color:\s*var\(--_resizer-rest\)/);
  assert.match(
    rule('[data-ui-app-shell] > [data-part-aside] > [data-part-aside-resizer] {').body,
    /--_resizer-rest:\s*var\(--slotted-splitter-line-color,/,
  );
  const lit = css.indexOf('> [data-part-aside-resizer]:not([data-disabled]):hover,');
  assert.notEqual(lit, -1, 'the edge answers no hover');
  const selector = css.slice(lit, css.indexOf('{', lit));
  assert.match(selector, /aside-resizer\]:focus-visible/);
  assert.match(selector, /\[data-dragging\] > \[data-part-aside\] > \[data-part-aside-resizer\]/);
  const ring = rule('> [data-part-aside] > [data-part-aside-resizer]:focus-visible {').body;
  assert.match(ring, /outline:\s*var\(--slotted-focus-ring-width, 2px\) solid/);
  /* The reach is a transparent box, so the target holds the floor while the line stays thin. */
  const reach = rule('> [data-part-aside] > [data-part-aside-resizer]::before {').body;
  assert.match(reach, /var\(--_resizer-reach\)/);
  assert.match(
    rule('[data-ui-app-shell] > [data-part-aside] > [data-part-aside-resizer] {').body,
    /--_resizer-reach:\s*var\(--slotted-target-min, 24px\)/,
  );
});

/**
 * The extent is a fraction of the shell, written as `cqi`: the root is the
 * query container, so the unit resolves against the shell's own inline size
 * from inside the pane's `auto` track, where a percentage would resolve against
 * the track the pane itself sizes.
 */
test('turns the extent into the width of the column and leaves the layer on its step', () => {
  const wide = css.slice(css.indexOf('@container slotted-app-shell (inline-size >= 600px)'));
  const column = wide.indexOf(":not([data-aside-mode='overlay']) > [data-part-aside] {");
  assert.notEqual(column, -1);
  assert.match(
    wide.slice(column, wide.indexOf('}', column)),
    /inline-size:\s*var\(--slotted-app-shell-aside-extent, var\(--_aside-size\)\)/,
  );
  assert.match(
    rule("[data-ui-app-shell][data-aside-mode='overlay'] > [data-part-aside] {").body,
    /inline-size:\s*var\(--_aside-size\);/,
  );
  const tokens = JSON.parse(
    readFileSync(new URL('./app-shell.tokens.json', import.meta.url), 'utf8'),
  );
  assert.ok(tokens.includes('--slotted-app-shell-aside-extent'));
});

/**
 * The frame of the wait is the box of `main`, and nothing but a restatement
 * keeps it so: every rule that gives `main` a margin or a corner has a twin
 * for `progress` with the same selector and the same values. A new canvas
 * rule written for `main` alone puts the bar off the edge of the card, in the
 * one arrangement nobody photographed.
 */
test('keeps the frame of the wait on the box of the content in every arrangement', () => {
  const GEOMETRY =
    /^(margin(-block|-inline)?(-start|-end)?|border(-(start|end)-(start|end))?-radius)$/;
  const splitList = (list) => {
    const out = [];
    let depth = 0;
    let from = 0;
    for (let index = 0; index < list.length; index += 1) {
      if (list[index] === '(') depth += 1;
      if (list[index] === ')') depth -= 1;
      if (list[index] === ',' && depth === 0) {
        out.push(list.slice(from, index));
        from = index + 1;
      }
    }
    out.push(list.slice(from));
    return out.map((selector) => selector.replace(/\s+/g, ' ').replace(/\( /g, '(').trim());
  };
  const rules = [];
  for (const [, list, body] of css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .matchAll(/([^{};]+)\{([^{}]*)\}/g)) {
    const geometry = body
      .split(';')
      .map((declaration) => declaration.trim())
      .filter((declaration) => GEOMETRY.test(declaration.split(':')[0].trim()))
      .map((declaration) => declaration.replace(/\s+/g, ' '))
      .sort();
    for (const selector of splitList(list)) rules.push({ selector, geometry });
  }

  const mains = rules.filter(
    ({ selector, geometry }) => / > \[data-part-main\]$/.test(selector) && geometry.length > 0,
  );
  assert.ok(mains.length >= 9, `found ${mains.length} rules giving main a box`);
  for (const { selector, geometry } of mains) {
    const twin = selector.replace(/\[data-part-main\]$/, '[data-part-progress]');
    const found = rules.filter((rule) => rule.selector === twin);
    assert.ok(found.length > 0, `${twin} is missing`);
    assert.deepEqual(found.at(-1).geometry, geometry, `${twin} disagrees with main`);
  }

  const frame = rule('[data-ui-app-shell] > [data-part-progress] {').body;
  assert.match(frame, /grid-area: 2 \/ 2 \/ 3 \/ 3/);
  assert.match(frame, /pointer-events: none/);
  assert.match(frame, /overflow: clip/);
  assert.doesNotMatch(frame, /background|border:|box-shadow/);
});

/**
 * Under `canvas="inset"` the navigation stands on the sunken frame, and the
 * secondary tone's hover is 0.011 lighter than it in the light scheme: a
 * side-navigation row's hover was the frame itself. The tokens are recomputed
 * from the ground the navigation stands on, as the tone separation does.
 */
test('recalibrates the hover of controls on an inset navigation', () => {
  const inset = rule("[data-canvas='inset'] > [data-part-nav] {").body;
  assert.match(
    inset,
    /--slotted-tone-secondary-subtle-hover:\s*color-mix\(\s*in oklab,\s*var\(--slotted-app-shell-nav-surface, var\(--_frame\)\),\s*var\(--slotted-text\) 4%/,
  );
  assert.match(
    inset,
    /--slotted-tone-secondary-subtle-active:\s*color-mix\(\s*in oklab,\s*var\(--slotted-app-shell-nav-surface, var\(--_frame\)\),\s*var\(--slotted-text\) 7%/,
  );
});

/**
 * A region holding one column taller than itself — no `nav-body` to scroll —
 * lost the column's foot under `overflow: hidden`. The region clips its inline
 * axis, which the width transition needs, and scrolls its block axis.
 */
test('the navigation region scrolls what overflows it along the block axis', () => {
  const { body } = rule('[data-ui-app-shell] > [data-part-nav] {');
  assert.match(body, /overflow-x: hidden;/);
  assert.match(body, /overflow-y: auto;/);
  assert.doesNotMatch(body, /overflow: hidden;/);
});
