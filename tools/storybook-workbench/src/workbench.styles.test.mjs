import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { WORKBENCH_FONT_CODE, WORKBENCH_FONT_SANS } from './fonts.ts';

const css = await readFile(new URL('./workbench.css', import.meta.url), 'utf8');

/**
 * Prettier writes CSS with single quotes and wraps a long value over several
 * lines; the JavaScript copy is one double-quoted string. The comparison is of
 * the stacks, not of the formatting either side ended up with.
 */
const fontStack = (name) =>
  css
    .match(new RegExp(`--slotted-workbench-${name}:\\s*([^;]+);`))?.[1]
    .replace(/\s+/g, ' ')
    .replaceAll("'", '"')
    .trim();

/**
 * The same box as two tracks, for a panel that stands *beside* the page rather
 * than over it. A drawer in `inline` mode has no scrim and no portal: the page
 * reflows because the consumer's own grid says so, and a demonstration that hid
 * that grid would be claiming the family writes a margin it deliberately does
 * not. Added when `drawer` needed to show a persistent panel.
 */
test('offers a two-track box for a panel that stands beside the page', () => {
  const rule =
    /\.slotted-demo-viewport\[data-layout='shell'\]\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';

  assert.match(rule, /display:\s*grid/);
  assert.match(rule, /grid-template-columns:/);

  /* The primitive owns both tracks. Leaving the page half to the story would
     send it reaching for the inline padding `reference-pages.test.mjs` refuses. */
  const page =
    /\.slotted-demo-viewport\[data-layout='shell'\]\s*>\s*:last-child\s*\{([\s\S]*?)\}/.exec(
      css,
    )?.[1] ?? '';
  assert.match(page, /padding:/);
  assert.match(page, /min-inline-size:\s*0/);
});

/**
 * The primitive a family that pins itself to a viewport edge is demonstrated
 * inside. `contain: paint` is what makes the box the containing block for a
 * fixed-position child; without it a page-level bar escapes its scene, draws
 * over the page navigation, and every scene declaring one draws in the same
 * place. Added when `progress-indicator` needed to show `placement="page"`.
 */
test('offers a box a fixed-position demonstration can be pinned inside', () => {
  const rule = /\.slotted-demo-viewport\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';

  assert.match(rule, /contain:\s*paint/);
  assert.match(rule, /position:\s*relative/);
  assert.match(rule, /block-size:/);
  /**
   * `contain: paint` clips what escapes and is not what a positioning engine
   * walks: an engine reads `overflow`, so a layer measured inside this box was
   * told the whole viewport was available and ran out of the scene.
   */
  assert.match(rule, /overflow:\s*hidden/);
});

/**
 * The same box, tall enough to hold a layer. Four rems holds a bar across the
 * top of a page and clips a dialog at both edges, so an overlay family asks for
 * the taller one and the scrim reads as a scrim.
 */
test('offers a viewport tall enough for an overlay family to open inside', () => {
  const rule = /\.slotted-demo-viewport\[data-size='tall'\]\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';

  assert.match(rule, /block-size:/);
});

/**
 * The primitive a family that pins something to a scroll container is
 * demonstrated inside. A sticky heading holds still only while something
 * scrolls past it, and a stage as long as its content shows nothing: the box
 * has to be shorter than what it holds and it has to scroll. Added when `list`
 * needed to show a group heading staying put over its own rows.
 */
/**
 * The screen a family fills: the child of a `data-fill` viewport takes its
 * height. Added when `event-calendar`'s month in a phone room ended half way
 * down the screen.
 */
test('offers a screen a family fills', () => {
  const rule =
    /\.slotted-demo-viewport\[data-fill\]\s*>\s*\*\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';

  assert.match(rule, /block-size:\s*100%/);
});

test('offers a box a sticky demonstration can be scrolled inside', () => {
  const rule = /\.slotted-demo-scroll\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';

  assert.match(rule, /overflow:\s*auto/);
  assert.match(rule, /block-size:/);
});

/**
 * The primitive a family that answers its own width is demonstrated inside: a
 * room of a stated width, one of five a reader recognises, that scrolls
 * sideways where the page is narrower than it. Added when `top-navigation`'s
 * page showed one folded picture eighteen times, because the documentation
 * column is narrower than the bar's widest step and a grid column narrower
 * than its narrowest. The wide room came with `dashboard-grid`, whose widest
 * class starts at 1024 pixels of its own width: a ground and a viewport inset
 * inside the 1024 room left the grid 936 and drew the tablet picture under the
 * desktop caption.
 */
test('offers a room of a stated width for a family that answers its own', () => {
  const room = /\.slotted-demo-room\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  assert.match(room, /overflow-x:\s*auto/);
  assert.match(room, /max-inline-size:\s*100%/);

  const viewport =
    /\.slotted-demo-room > \.slotted-demo-viewport\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  assert.match(viewport, /inline-size:\s*var\(--slotted-demo-room\)/);
  assert.match(viewport, /box-sizing:\s*content-box/);

  const rooms = [...css.matchAll(/\.slotted-demo-room\[data-room='([a-z]+)'\]\s*\{([\s\S]*?)\}/g)];
  assert.deepEqual(
    rooms.map(([, name]) => name),
    ['wide', 'desktop', 'laptop', 'tablet', 'phone'],
  );
  const widths = rooms.map(([, , body]) =>
    Number(/--slotted-demo-room:\s*(\d+)px/.exec(body)?.[1]),
  );
  assert.deepEqual(widths, [1280, 1024, 900, 640, 375]);
});

test('workbench CSS keeps the reference-sheet layout and accessibility invariants', () => {
  assert.match(css, /@import '@fontsource-variable\/geist';/);
  assert.match(css, /@import '@fontsource-variable\/geist-mono';/);
  assert.match(css, /max-inline-size:\s*1480px/);
  assert.match(css, /\.slotted-matrix-scroll\s*\{[\s\S]*?overflow-x:\s*auto/);
  assert.match(css, /@media \(max-width:\s*760px\)/);
  assert.match(css, /\.slotted-code-drawer summary:focus-visible/);
  assert.match(css, /\[data-slotted-scheme='dark'\]\s*\{/);
  assert.match(css, /\.slotted-visually-hidden\s*\{[\s\S]*?clip-path:\s*inset\(50%\)/);
  assert.match(
    css,
    /\.slotted-matrix-scroll:focus-visible,[\s\S]*?\.slotted-token-scroll:focus-visible\s*\{/,
  );
});

/**
 * The page's two headings are the page's children, not every `h1` and `h2`
 * under it: a family's own heading inside a demonstration keeps the margin
 * and the alignment it declares.
 */
test('workbench CSS addresses the page’s own headings as its children', () => {
  assert.match(css, /\.slotted-reference-page__title-row > h1\s*\{/);
  assert.match(css, /\.slotted-reference-page__section > h2\s*\{/);
  assert.doesNotMatch(css, /\.slotted-reference-page h[1-6]\s*[{,]/);
});

/**
 * The page's grey ring is for the page's own controls. Unlayered, the rule
 * outranked every family stylesheet, and a focused `Button` in the `dark`
 * scheme measured `#d4d4d8` where the theme says `#60a5fa` (R3). A family's
 * ring is the one the theme states, so `[data-ui]` roots and everything under
 * them are stood out of — with `:where`, so the page's own controls keep the
 * specificity they had.
 */
test('workbench CSS leaves the focus ring of a demonstrated family to the family', () => {
  const selector =
    /\.slotted-workbench-preview\s+:where\(button, a, summary\):where\(:not\(\[data-ui\], \[data-ui\] \*\)\):focus-visible,/;
  assert.match(css, selector);
  assert.doesNotMatch(
    css,
    /\.slotted-workbench-preview\s+:where\(button, a, summary\):focus-visible/,
  );
});

/**
 * A painted ground a story can stand a block-level family on, and the one that
 * states a scheme rather than inverting a surface. Both were added when `alert`
 * needed to show that its quiet variant survives a dark region — which it does
 * only when the region restates the tone roles, and does not when a single
 * surface token is flipped underneath it.
 */
/**
 * `stack` keeps every child at its own width, which a family whose members are
 * blocks cannot use: a component declaring `container-type: inline-size` has an
 * intrinsic width of zero, so a stage that shrink-wraps it collapses it to one
 * character. `block` is the column that fills instead.
 */
/**
 * The page's own prose is muted and 13.5 pixels; a paragraph a family renders
 * inside a canvas is neither. `alert`'s description is a `p`, and on a `solid`
 * alert the page was drawing it in grey on a saturated ground — a contrast the
 * family does not ship, on the one page a reader judges it from.
 *
 * `inherit` is what the reset must not use. It hands the element the
 * workbench's own type and ink rather than the family's: `inline-message` is a
 * `p`, so a field error came out at the page's 16 pixels in the page's ink
 * instead of at 12 pixels in the danger ink. `revert-layer` is the keyword that
 * rolls the property back to `slotted.components`, and the reset is addressed
 * to `[data-ui]` roots and their descendants so a demonstration's own prose is
 * left alone.
 */
test('workbench CSS returns a family’s own type and ink inside the demonstration', () => {
  const reset =
    /\.slotted-workbench-preview :is\(\[data-ui\], \[data-ui\] \*\):not\(\[class\*='slotted-demo-'\]\),\s*\.slotted-reference-page :is\(\[data-ui\], \[data-ui\] \*\):not\(\[class\*='slotted-demo-'\]\)\s*\{([\s\S]*?)\}/;

  const declarations = css.match(reset)?.[1];
  assert.ok(declarations, 'Missing the demonstration reset');
  for (const property of ['color', 'font-family', 'font-size', 'font-weight', 'line-height']) {
    assert.match(declarations, new RegExp(`${property}:\\s*revert-layer`));
  }
  assert.doesNotMatch(declarations, /:\s*inherit/);
  assert.ok(
    css.search(reset) > css.indexOf('.slotted-reference-page p,'),
    'the reset has to come after the rule it stands out of the way of',
  );
});

/**
 * A demonstration primitive inside a library element keeps its own
 * declarations. `app-shell` projects a product's rows into its regions, every
 * one a descendant of `[data-ui="app-shell"]`, and the reset reverted their
 * type to a layer that declares none: sixteen pixels in the user agent's button
 * face, which is the navigation the reviewer read as careless.
 */
test('the demonstration reset leaves a demonstration primitive its own declarations', () => {
  const selectors = [
    ...css.matchAll(
      /^\.slotted-(?:workbench-preview|reference-page) :is\(\[data-ui\], \[data-ui\] \*\)([^,{]*)/gm,
    ),
  ];
  assert.ok(selectors.length >= 2, 'the reset is written twice, once per page kind');
  for (const [, tail] of selectors) {
    assert.match(
      tail,
      /:not\(\[class\*='slotted-demo-'\]\)/,
      'the reset reaches a demonstration primitive',
    );
  }
});

test('workbench CSS offers a column whose children fill it', () => {
  assert.match(
    css,
    /\.slotted-demo-stage\[data-layout='block'\]\s*\{[\s\S]*?align-items:\s*stretch[\s\S]*?flex-direction:\s*column[\s\S]*?flex-wrap:\s*nowrap/,
  );
});

test('workbench CSS offers a stack whose children take its width', () => {
  assert.match(css, /\.slotted-demo-stack\[data-stretch\]\s*\{[\s\S]*?justify-items:\s*stretch/);
});

test('workbench CSS offers a scheme-bearing ground, and a ground that stacks', () => {
  assert.match(
    css,
    /\.slotted-demo-surface\[data-surface='scheme'\]\s*\{[\s\S]*?background:\s*var\(--slotted-surface\)/,
  );
  assert.match(
    css,
    /\.slotted-demo-surface\[data-flow='stack'\]\s*\{[\s\S]*?flex-direction:\s*column/,
  );
});

/**
 * A wrapping column inside a stage that the grid hands a definite height grows
 * to break the circularity, the defect the block stage already names. The
 * stacked ground inherited `flex-wrap: wrap` from the row it is by default, and
 * `dashboard-grid` measured the cost: a ground of 1737 pixels around 1129 of
 * content, because the grid inside it is a size container and its height at the
 * intrinsic width is the one-column height.
 */
test('workbench CSS keeps a stacked ground from wrapping', () => {
  const rule = /\.slotted-demo-surface\[data-flow='stack'\]\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';

  assert.match(rule, /flex-wrap:\s*nowrap/);
});

test('dark workbench uses a neutral carbon surface scale', () => {
  const darkScheme = css.match(/\[data-slotted-scheme='dark'\]\s*\{([\s\S]*?)\}/)?.[1];

  assert.ok(darkScheme, 'Missing dark workbench scheme');
  assert.match(darkScheme, /--slotted-workbench-canvas:\s*#09090b/);
  assert.match(darkScheme, /--slotted-workbench-panel:\s*#111113/);
  assert.match(darkScheme, /--slotted-workbench-panel-subtle:\s*#18181b/);
  assert.match(darkScheme, /--slotted-workbench-panel-strong:\s*#27272a/);
  assert.match(darkScheme, /--slotted-workbench-border:\s*#27272a/);
  assert.match(darkScheme, /--slotted-workbench-text:\s*#fafafa/);
  assert.match(darkScheme, /--slotted-workbench-muted:\s*#a1a1aa/);
});

test('workbench CSS composes demonstrations as a continuous component lab', () => {
  assert.match(
    css,
    /\.slotted-component-lab\s*\{[\s\S]*?border:\s*1px solid var\(--slotted-workbench-border\)/,
  );
  assert.match(
    css,
    /\.slotted-component-lab__section\s*\{[\s\S]*?grid-template-columns:\s*minmax\(150px, 0\.24fr\) minmax\(0, 1fr\)/,
  );
  assert.match(
    css,
    /\.slotted-demo-grid\s*\{[\s\S]*?display:\s*grid[\s\S]*?gap:\s*var\(--slotted-workbench-scene-gap\)/,
  );
  assert.match(css, /\.slotted-demo-row\s*\{[\s\S]*?align-items:\s*center/);
  assert.match(css, /\.slotted-demo-scene__label\s*\{[\s\S]*?font-weight:\s*700/);
});

test('workbench CSS gives matrices stable geometry and centered non-empty cells', () => {
  assert.match(css, /\.slotted-matrix\s*\{[\s\S]*?inline-size:\s*100%/);
  assert.match(css, /\.slotted-matrix__cell\s*\{[\s\S]*?text-align:\s*center/);
  assert.match(css, /\.slotted-matrix__cell\s*>\s*\*\s*\{[\s\S]*?vertical-align:\s*middle/);
});

test('matrix cells never stretch icon-only controls out of their square footprint', () => {
  assert.match(
    css,
    /\.slotted-matrix__cell\s*>\s*\.slotted-button:not\(\[data-part-root='icon'\]\)\s*\{[\s\S]*?min-inline-size:\s*92px/,
  );
  assert.doesNotMatch(css, /\.slotted-matrix__cell\s*>\s*\.slotted-button\s*\{/);
  assert.match(
    css,
    /\.slotted-matrix__cell\s*>\s*\.slotted-demo-row\s*\{[\s\S]*?justify-content:\s*center/,
  );
});

test('workbench does not own icon glyph data', () => {
  assert.doesNotMatch(css, /slotted-demo-icon|mask-image:\s*url\(["']data:image\/svg\+xml/);
});

/**
 * An embedded canvas neither fills the viewport nor starts on its own border.
 * Both were wrong in turn: the story used to be a screen tall with the
 * component in the top quarter, and the correction for that took the margin
 * away with the height.
 */
test('embedded docs canvases are neither viewport-height nor edge to edge', () => {
  assert.match(
    css,
    /\.slotted-workbench-preview--embedded\s*\{[\s\S]*?background:\s*transparent;[\s\S]*?min-block-size:\s*0;[\s\S]*?padding:\s*16px;/,
  );
  assert.match(
    css,
    /@media \(max-width:\s*760px\)\s*\{[\s\S]*?\.slotted-workbench-preview:not\(\.slotted-workbench-preview--embedded\)\s*\{[\s\S]*?padding:\s*12px;/,
  );
});

/**
 * The stage owns the distance between the things placed on it. Before this,
 * two demonstrations dropped into a stage touched unless the story remembered
 * a row or a stack wrapper, and the ones that forgot were reviewed as if the
 * component had no margin of its own.
 */
test('a demonstration stage cannot place two examples against each other', () => {
  assert.match(
    css,
    /\.slotted-demo-stage\s*\{[\s\S]*?flex-wrap:\s*wrap[\s\S]*?gap:\s*var\(--slotted-demo-gap, 12px\)/,
  );
  assert.match(
    css,
    /\.slotted-demo-stage\[data-layout='stack'\]\s*\{[\s\S]*?flex-direction:\s*column/,
  );
  assert.match(
    css,
    /\.slotted-demo-stage\[data-layout='prose'\] > \* \+ \*\s*\{[\s\S]*?margin-block-start/,
  );
});

/**
 * A story that needs a coloured ground, a raised panel or a dense row reaches
 * for a primitive built from foundation tokens. The alternative is an inline
 * style, which answers no scheme switch and no density.
 */
test('demonstrations paint their context with tokens rather than inline styles', () => {
  /**
   * A surface is a ground, and a ground owns the distance between the examples
   * on it. Four shortcuts placed on an inverse surface touched before this,
   * because the surface was a plain block and JSX siblings produce no
   * whitespace text node.
   */
  assert.match(
    css,
    /\.slotted-demo-surface\s*\{[\s\S]*?flex-wrap:\s*wrap[\s\S]*?gap:\s*var\(--slotted-demo-gap, 12px\)/,
  );
  /**
   * A menu row whose item is unavailable dims its label and the value beside
   * it. A family whose bare form inherits its colour cannot be shown honestly
   * against a label that stays bright.
   */
  assert.match(
    css,
    /\.slotted-demo-rows > \[data-disabled\],[\s\S]*?\+ \*\s*\{[\s\S]*?color:\s*var\(--slotted-disabled-foreground\)/,
  );
  assert.match(
    css,
    /\.slotted-demo-surface\[data-surface='inverse'\]\s*\{[\s\S]*?background:\s*var\(--slotted-surface-inverse\)/,
  );
  assert.match(
    css,
    /\.slotted-demo-surface\[data-surface='raised'\]\s*\{[\s\S]*?background:\s*var\(--slotted-surface-raised\)/,
  );
  assert.match(css, /\.slotted-demo-rows\s*\{[\s\S]*?grid-template-columns:\s*1fr auto/);
});

test('a reference page spaces every demonstration as caption, canvas and source', () => {
  assert.match(css, /\.slotted-reference-scenes\s*\{[\s\S]*?display:\s*grid[\s\S]*?gap:/);
  assert.match(css, /\.slotted-reference-scene__header h3\s*\{/);
  assert.match(
    css,
    /\.slotted-reference-scene \.slotted-code-drawer\s*\{[\s\S]*?margin-block-start/,
  );
  /**
   * The inset has to survive the docs theme's own `dl` reset, and the value
   * column has to be allowed to be narrower than its longest word.
   */
  assert.match(
    css,
    /\.slotted-reference-import__facts\s*\{[\s\S]*?grid-template-columns:\s*auto minmax\(0, 1fr\)[\s\S]*?padding:[^;]*!important/,
  );
});

/**
 * A page that clips its own import statement teaches the wrong import. Both
 * the code block and the tables wrap rather than running under the edge of the
 * page, where a scroll container hid them without saying so.
 */
test('a reference page never clips the code or the tables it exists to show', () => {
  /**
   * Both elements, not just the outer one. The docs theme sets
   * `white-space: pre` on the `code` inside, so a `pre` that wraps alone still
   * clips a long import at the column edge.
   */
  assert.match(
    css,
    /\.slotted-reference-import pre,\s*\.slotted-reference-import pre code\s*\{[\s\S]*?white-space:\s*pre-wrap/,
  );
  assert.match(css, /\.slotted-api-table th,[\s\S]*?\{[\s\S]*?white-space:\s*nowrap/);
  /**
   * Name, type and notes all carry a floor. Without one on the type column a
   * long union is broken a character at a time, which is unreadable in a way
   * a horizontal scrollbar is not.
   */
  assert.match(css, /\.slotted-api-table td:nth-child\(2\)\s*\{[\s\S]*?min-inline-size:\s*20ch/);
  assert.match(css, /\.slotted-api-table td code,[\s\S]*?\{[\s\S]*?overflow-wrap:\s*anywhere/);
});

/**
 * The `<pre>` carries the monospaced family; the `<code>` inside it carries the
 * user-agent's own and every highlighted token span carries the docs theme's
 * sans stack. Both beat inheritance, so without this rule the snippet a reader
 * copies is set in a proportional face.
 */
test('every snippet renders in the monospaced family its block declares', () => {
  assert.match(
    css,
    /\.slotted-code-drawer__source,[\s\S]*?\{[\s\S]*?font:[^;]*var\(--slotted-workbench-font-code\)/,
  );
  assert.match(
    css,
    /\.slotted-code-drawer__source code,\s*\.slotted-code-drawer__source code \*,[\s\S]*?font:\s*inherit/,
  );
});

/**
 * Storybook takes its two stacks as JavaScript and the workbench sets its own
 * in CSS, so the same two strings live on both sides of that boundary. They
 * are written once in `fonts.ts`; this holds the CSS copy to it.
 *
 * `ui-monospace` stays out of the code stack: on Linux Chrome the keyword
 * resolves to the platform's default proportional face instead of falling
 * through, so naming it before a real monospaced font sets code in a
 * proportional one while still reporting a monospaced `font-family`.
 */
test('the workbench sets type in one pair of stacks', () => {
  assert.equal(fontStack('font-sans'), WORKBENCH_FONT_SANS);
  assert.equal(fontStack('font-code'), WORKBENCH_FONT_CODE);
  assert.match(WORKBENCH_FONT_CODE, /^"Geist Mono Variable"/);
  assert.doesNotMatch(WORKBENCH_FONT_CODE, /ui-monospace/);
  assert.doesNotMatch(css, /font(-family)?:[^;]*ui-monospace/);
});

test('scenes placed side by side start their stages on the same line', () => {
  assert.match(
    css,
    /\.slotted-demo-grid > \.slotted-demo-scene\s*\{[\s\S]*?grid-template-rows:\s*subgrid/,
  );
  assert.match(css, /\.slotted-demo-grid\s*\{[\s\S]*?grid-auto-rows:\s*auto/);

  /**
   * A scene is read at the full width of the page unless the story says
   * otherwise. Two columns were the default, so a family that never asked was
   * reviewed in half the room it will actually get — and a family that reflows
   * was corrected against a constraint no consumer imposes.
   */
  assert.match(
    css,
    /\.slotted-demo-grid\s*\{[\s\S]*?repeat\(var\(--slotted-demo-columns, 1\)/,
    'the demo grid defaults to one column',
  );
  for (const columns of ['2', '3']) {
    assert.match(
      css,
      new RegExp(
        `\\.slotted-demo-grid\\[data-columns='${columns}'\\]\\s*\\{\\s*--slotted-demo-columns: ${columns}`,
      ),
      `a story can still ask for ${columns} columns`,
    );
  }
});

/**
 * `subgrid` outside a grid parent stops the stage at its own `min-block-size`,
 * and everything taller than that is drawn over the scenes below.
 */
test('a scene outside a demonstration grid asks for no subgrid', () => {
  const scene = css.match(/\n\.slotted-demo-scene\s*\{([\s\S]*?)\}/)?.[1];

  assert.ok(scene, 'Missing .slotted-demo-scene rule');
  assert.doesNotMatch(scene, /subgrid/);
  assert.doesNotMatch(scene, /grid-row/);
});

/**
 * The matrix declares a minimum width and scrolls inside its own container.
 * As a flex item with `min-width: auto` that container stopped shrinking and
 * covered the scene beside it, so the stage clamps what it holds.
 */
test('nothing placed on a stage can grow wider than the stage', () => {
  assert.match(
    css,
    /\.slotted-demo-stage > \*\s*\{[\s\S]*?max-inline-size:\s*100%[\s\S]*?min-inline-size:\s*0/,
  );
});

/**
 * A set of choices is a list, and a family whose root can be substituted for a
 * `li` needs somewhere valid to put it. The user agent brings a marker and an
 * inset with a `ul`, and a stray bullet in a demonstration is the kind of
 * defect a reader finds and a test does not.
 */
test('the demonstration list is a list with no marker and no inset', () => {
  const list = css.match(/\n\.slotted-demo-list\s*\{([\s\S]*?)\}/)?.[1];

  assert.ok(list, 'Missing .slotted-demo-list rule');
  assert.match(list, /list-style:\s*none/);
  assert.match(list, /margin:\s*0/);
  assert.match(list, /padding:\s*0/);
  assert.match(list, /min-inline-size:\s*0/);
});

/**
 * The step between the bar and the dialog. A layer anchored beside its trigger
 * fills neither four rems nor twenty-two, and `tooltip`'s first rendered page
 * put a button at the top of a box four times its height with the rest blank —
 * the empty canvas the page contract refuses.
 */
test('offers a viewport an anchored layer fills rather than rattles around in', () => {
  const rule = /\.slotted-demo-viewport\[data-size='layer'\]\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';

  assert.match(rule, /block-size:/);
});

/**
 * A family that owns a screen's width and decides its own height takes a
 * viewport that follows its content, inset like a page.
 */
test('offers a viewport as tall as what it holds, for a screen that decides its height', () => {
  const rule =
    /\.slotted-demo-viewport\[data-size='content'\]\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';

  assert.match(rule, /block-size:\s*auto/);
  assert.match(rule, /padding:\s*var\(--slotted-space-/);
});

/**
 * Centring is an attribute of its own rather than part of a height, because an
 * anchored family wants its trigger in the middle at every size and a family
 * that pins something to an edge of the box wants the opposite.
 */
test('offers a viewport that puts what it holds in the middle, at any size', () => {
  const rule =
    /\.slotted-demo-viewport\[data-place='center'\]\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';

  assert.match(rule, /align-items:\s*center/);
  assert.match(rule, /justify-items:\s*center/);
});

/**
 * The page states its accessibility notes and its composition surface as lists,
 * and the two rules that give those lists their typography reached into every
 * demonstration as well: a `ul` a family renders took eighteen pixels of inset
 * per level, and every `li` after the first took seven of margin.
 *
 * `tree` is where it became visible — its guide line spans one row, so a margin
 * between rows broke the line and an inset per level walked it inward — but
 * `list`, `list-item` and `breadcrumb` had been carrying the same two numbers
 * on their own pages.
 */
test('keeps the page typography out of the lists a family renders', () => {
  const inset =
    /\.slotted-reference-page :is\(\[data-ui\] :is\(ul, ol\), ul\[data-ui\], ol\[data-ui\]\)\s*\{([\s\S]*?)\}/.exec(
      css,
    )?.[1] ?? '';
  assert.match(inset, /padding-inline-start:\s*revert-layer/);

  const between =
    /\.slotted-reference-page \[data-ui\] li \+ li\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  assert.match(between, /margin-block-start:\s*revert-layer/);

  /* Both have to come after the rules they answer, because they match with the
     same weight the cascade breaks by order. */
  assert.ok(
    css.indexOf('[data-ui] li + li') > css.indexOf('.slotted-reference-page li + li'),
    'the guard is written before the rule it answers',
  );
});

/**
 * Storybook's Angular renderer mounts each story in a custom element named
 * after the story id, and an unknown element is `display: inline`. An inline
 * box establishes no width, so the intrinsic width of what is inside travels
 * up: `table`'s reference page was drawn 3901 pixels wide inside a 1265-pixel
 * page and every scene was clipped at the right edge, while the same stories in
 * React — mounted into a `div` — measured 1265.
 *
 * The rule names the element that holds the preview rather than the renderer's
 * own element names, so the next renderer to invent a wrapper is covered
 * without another rule.
 */
test('gives a story a block box that cannot outgrow the page', () => {
  const rule = /:has\(> \.slotted-workbench-preview\)\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  assert.match(rule, /display:\s*block/);
  assert.match(rule, /max-inline-size:\s*100%/);
});

/**
 * A demonstration of stickiness needs a box that scrolls, not one that clips.
 * `table`'s header can stay inside its own scroller or inside whatever scrolls
 * outside it, and the second has no picture unless a story can stand a table in
 * something that scrolls — which a story cannot write for itself, because a
 * story that reaches for an inline style is refused.
 */
test('offers a viewport that scrolls, for a family whose behaviour is about scrolling', () => {
  const rule = /\.slotted-demo-viewport\[data-scroll\]\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  assert.match(rule, /overflow:\s*auto/);
  /* `contain: paint` on the plain viewport clips instead of scrolling, so the
     scrolling one has to give it up or the scrollbar never appears. */
  assert.match(rule, /contain:\s*none/);
});

/**
 * The scrolling box has to read as a page, or the demonstration inside it is
 * still a stage. `table`'s page-mode header sticks to what scrolls outside the
 * family, and a box holding nothing but the table draws the same picture the
 * family's own scroller draws: the behaviour is only visible when a heading and
 * a paragraph scroll away above the table while the header stays.
 */
test('offers a viewport laid out as a page, so content can scroll past a demonstration', () => {
  const rule =
    /\.slotted-demo-viewport\[data-layout='page'\]\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  /* A sticky element resolves against the scrollport inset by the scroll
     container's own padding, so the box that scrolls carries none: the padding
     is the content's, or a page-mode header stops a padding short of the top. */
  assert.match(rule, /padding:\s*0/);
  const page = /\.slotted-demo-page\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  assert.match(page, /display:\s*grid/);
  assert.match(page, /gap:\s*var\(--slotted-space-/);
  assert.match(page, /padding:\s*var\(--slotted-space-/);
  /* The grid owns the rhythm, so the browser's own margins on the prose come
     off — two spacings on one gap read as neither. */
  assert.match(css, /\.slotted-demo-page > :is\(h1, h2, h3, h4, h5, p\)/);
  /* A page with a bar of its own says where a sticky header stops, which is
     what the offset token is for. A page without one leaves it at nought. */
  const shell = /:has\(> \.slotted-demo-page__bar\)\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  assert.match(shell, /--slotted-table-sticky-offset:/);
});

/**
 * A scroller with no height has nothing to scroll, and a story may not write
 * one inline: an inline length answers no density and no scheme. The two
 * demands meet in a primitive rather than in a `style` attribute.
 */
test('offers a bounded height, so a demonstration can be made to overflow', () => {
  const rule = /\.slotted-demo-bound\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  assert.match(rule, /max-block-size:/);
  assert.match(css, /\.slotted-demo-bound--tall/);
});

/**
 * A family that paints no frame of its own still has to be shown inside one,
 * because the frame is what a product puts round it — and `scroll-area`'s
 * anatomy exists to keep that frame off the element its veil is on.
 */
test('offers a frame from the foundation, for a family that paints none', () => {
  const rule = /\.slotted-demo-frame\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  assert.match(rule, /border: 1px solid var\(--slotted-border-subtle\)/);
  assert.match(rule, /border-radius: var\(--slotted-radius-md\)/);
});

/**
 * The scale had a panel size and nothing above it. A family that owns a whole
 * screen — a page, a page header that snaps, a shell, a split view — drawn in
 * a box the height of a card is a picture of a different component, and the
 * correction made against that box is a correction against a constraint no
 * application imposes.
 */
test('offers a box the size of a screen, for a family that owns one', () => {
  const rule =
    /\.slotted-demo-viewport\[data-size='screen'\]\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';

  /* Not the whole window: the caption above and the snippet below are part of
     the demonstration, and a box that fills the viewport hides both. */
  assert.match(rule, /block-size:\s*min\(80vh, 46rem\)/);

  /* And a floor, or a short window collapses the picture the size exists for. */
  assert.match(rule, /min-block-size:\s*32rem/);

  const tall = /\.slotted-demo-viewport\[data-size='tall'\]\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  assert.match(tall, /block-size:\s*22rem/, 'the panel size is still the step below it');
});

/**
 * A page that fills gives its body an exact height and the panes inside it
 * scroll on their own. The demonstration needs two of them, and a story may
 * not write the grid inline.
 */
test('offers two panes that scroll themselves, for a page that fills', () => {
  const split = /\.slotted-demo-split\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  assert.match(split, /display:\s*grid/);
  assert.match(split, /grid-template-columns:/);
  /* A grid item may not shrink below its content unless told; the panes must. */
  assert.match(split, /min-block-size:\s*0/);
  const pane = /\.slotted-demo-split__pane\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  assert.match(pane, /overflow:\s*auto/);
  assert.match(pane, /min-block-size:\s*0/);
});

/**
 * A code drawer scrolls its own long lines. The track the scenes stack in
 * must be allowed to shrink to nothing, or the drawer's longest line widens
 * it and carries every stage past the column.
 */
test('keeps an open code drawer from widening the scenes column', () => {
  const rules = [...css.matchAll(/\.slotted-reference-scenes\s*\{([\s\S]*?)\}/g)].map((m) => m[1]);
  assert.ok(
    rules.some((rule) => /grid-template-columns:\s*minmax\(0,\s*1fr\)/.test(rule)),
    'the scenes track shrinks below its content',
  );
});

/**
 * A two-column grid stacks below 760 pixels like the three-column one: the
 * attribute selector outranks the class, so it needs a rule of its own.
 */
test('stacks a two-column grid in a narrow window', () => {
  const narrow = [...css.matchAll(/@media \(max-width: 760px\)\s*\{([\s\S]*?)\n\}/g)].map(
    (m) => m[1],
  );
  assert.ok(
    narrow.some((block) =>
      /\.slotted-demo-grid\[data-columns='2'\]\s*\{\s*--slotted-demo-columns:\s*1;/.test(block),
    ),
    'the two-column grid drops to one column below 760px',
  );
});

/**
 * A separator has no demonstration without two regions to separate, and the
 * regions cannot be painted by the story: `specs/reference-pages.test.mjs`
 * refuses an inline style, and rightly — it answers no scheme and no density.
 *
 * The rule that matters is the last one: the sized region reads
 * `--slotted-splitter-value` rather than holding a measure of its own. A
 * workspace that held its own number would keep moving with the family removed,
 * which is a demonstration of the workspace.
 */
test('offers two regions whose boundary the demonstrated family moves', () => {
  const workspace = /\.slotted-demo-workspace\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  assert.match(workspace, /display:\s*flex/, 'the two regions sit along one axis');
  assert.match(workspace, /overflow:\s*hidden/, 'a region cannot spill past the boundary');

  const region = /\.slotted-demo-workspace__region\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  assert.match(
    region,
    /var\(--slotted-splitter-value/,
    'the sized region reads the property the family writes, rather than holding a measure of its own',
  );
  assert.match(region, /flex:\s*none/, 'the region keeps the measure it was given');

  const body = /\.slotted-demo-workspace__body\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  assert.match(body, /flex:\s*1/, 'the other region takes whatever is left');
  assert.match(body, /min-inline-size:\s*0/, 'and may be narrower than its own content');
});

/**
 * `app-shell` documents a navigation region whose contents belong to
 * `side-navigation`, wave 8. Without a destination row the reference pages show
 * the region holding bare links, which photographs the missing family rather
 * than the one being documented — and the rail, whose whole point is that a
 * destination answers the width it is given, shows nothing at all.
 */
test('offers a destination row that answers the rail it is put in', () => {
  assert.match(css, /a\.slotted-demo-nav-item,\n\.slotted-demo-nav-item,/);
  /* Every number a row carries is one the shell publishes: the row states
     nothing of its own, which is what a product's own list does. */
  const nav = /\.slotted-demo-nav \{([^}]*)\}/.exec(css)?.[1] ?? '';
  for (const measure of ['inset', 'mark', 'gap', 'height', 'font-size', 'line-height']) {
    assert.match(nav, new RegExp(`--slotted-app-shell-row-${measure}`), `${measure} is not read`);
  }
  const item =
    /\.slotted-demo-nav-brand \{([^}]*)\}/.exec(
      css.slice(css.indexOf('a.slotted-demo-nav-item,')),
    )?.[1] ?? '';
  assert.ok(item.length > 0);
  assert.doesNotMatch(
    css.slice(css.indexOf('.slotted-demo-nav {')),
    /--slotted-control-font-size/,
    'a row is text, not a control',
  );
  /* The workspace and the account are rows too, and a rail has no room for
     their names: they wrapped one character per line before this existed. */
  assert.match(css, /\.slotted-demo-nav-brand\s*\{/);
  assert.match(css, /\.slotted-demo-nav-item__label\s*\{/);
  assert.match(css, /\.slotted-demo-nav-group\s*\{/);
  /* The region's own query container, not the shell's: the rail is a width the
     family inside answers, which is the decision app-shell's contract records. */
  assert.match(css, /@container slotted-app-shell-nav \(inline-size < \d+px\)/);
  const rail =
    /@container slotted-app-shell-nav \(inline-size < \d+px\) \{([\s\S]*?)\n\}/.exec(css)?.[1] ??
    '';
  assert.match(rail, /\.slotted-demo-nav-item__label,[\s\S]*display: none/);
  assert.match(rail, /\.slotted-demo-nav-aside/);
});

/**
 * What a bar's middle and a pane's body hold in a product: a search that is a
 * field, a trail, a record's fields on the pane's own inset. The first page put
 * a button where the search goes and a bare list where the pane's fields go.
 */
test('offers the furniture a shell demonstration needs and the family does not own', () => {
  assert.match(css, /\.slotted-demo-bar-search\s*\{/);
  assert.match(css, /\.slotted-demo-bar-crumbs\s*\{/);
  assert.match(css, /\.slotted-demo-bar-wordmark\s*\{/);
  assert.match(css, /\.slotted-demo-pane-title\s*\{/);
  /* The pane body stands on the shell's own inset, so neither pads by hand. */
  for (const name of ['pane-fields', 'pane-form']) {
    const body = new RegExp(`\\.slotted-demo-${name}\\s*\\{([^}]*)\\}`).exec(css)?.[1];
    assert.ok(body !== undefined, `${name} has no rule`);
    assert.doesNotMatch(body, /padding/, `${name} pads the pane body by hand`);
  }
  /* And a window around a screen, so a shell reads as an application. */
  const frame = /\.slotted-demo-viewport\[data-frame='window'\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  assert.match(frame, /border-radius/);
  assert.match(frame, /box-shadow/);
});

/**
 * The repaint primitive: the scene that shows a product giving one region its
 * own ground, without a story writing the declarations inline.
 */
test('repaints a shell region by region, for the theming scene', () => {
  assert.match(css, /\.slotted-demo-shell-repaint \{[^}]*--slotted-app-shell-banner-surface/);
  assert.match(
    css,
    /\.slotted-demo-shell-repaint-nav \{[^}]*--slotted-app-shell-nav-surface: var\(--slotted-surface-sunken\)/,
  );
});

/**
 * The anatomy primitive: a part drawn as its own name, so a page can show the
 * frame a family delivers next to the same frame with a product in it.
 */
test('draws a part as itself, for an anatomy scene', () => {
  assert.match(css, /\.slotted-demo-slot \{[^}]*border: 1px dashed/);
  assert.match(css, /\.slotted-demo-slot \{[^}]*font-family: var\(--slotted-font-family-mono\)/);
  assert.match(css, /\.slotted-demo-slot__note \{/);
});

/**
 * The account row is pressed, so it is a control: the reviewer read a bare
 * block of text with an avatar beside it as the worst thing in the column. It
 * carries the geometry of a destination row and the feedback of a button.
 */
test('makes the account row a control rather than a block of text', () => {
  assert.match(css, /button\.slotted-demo-nav-account,/);
  assert.match(css, /\.slotted-demo-nav-account:hover \{[^}]*background-color/);
  assert.match(css, /\.slotted-demo-nav-account:focus-visible \{[^}]*outline:/);
  assert.match(css, /\.slotted-demo-nav-account__more \{/);
  /* The row it shares its geometry with, and the two measures that make them
     one column: the inset every row stands on and the mark column. */
  const row = /\.slotted-demo-nav-brand \{([^}]*)\}/.exec(css)?.[1] ?? '';
  assert.match(row, /padding-inline: var\(--slotted-demo-nav-inset/);
  assert.match(row, /min-block-size: var\(--slotted-demo-nav-height/);
  assert.match(row, /border-radius:/);
  /* Two lines of text get their own block air. */
  const brand =
    /\.slotted-demo-nav-brand \{([^}]*)\}/.exec(
      css.slice(css.indexOf('.slotted-demo-nav-aside') - 600),
    )?.[1] ?? '';
  assert.match(brand, /padding-block: var\(--slotted-space-2\)/);
});

/**
 * A column narrower than the reflow thresholds families state for themselves —
 * `field` at 320 pixels — so a demonstration of the narrow layout is not drawn
 * in the wide one. The 360-pixel measure stays what it was.
 */
test('offers a drawer-width measure under every family reflow threshold', () => {
  assert.match(css, /\.slotted-demo-measure\s*\{\s*inline-size:\s*min\(100%,\s*360px\);/);
  const drawer =
    /\.slotted-demo-measure\[data-width='drawer'\]\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
  const width = Number(/min\(100%,\s*(\d+)px\)/.exec(drawer)?.[1]);
  assert.ok(width > 0 && width < 320, `the drawer measure is ${width}px, not under 320`);
});
