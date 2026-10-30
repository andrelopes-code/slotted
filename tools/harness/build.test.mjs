import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DENSITIES,
  DIRECTIONS,
  SCHEMES,
  WIDTHS,
  composedFamilies,
  parseScenes,
  renderHarness,
  scopeControlNames,
  scopeGlyphMasks,
} from './build.mjs';
import { captureClip, captureName, parseArguments } from './shoot.mjs';

const fragment = `
<section data-scene="default"><b class="x">one</b></section>
<section data-scene="current"><b class="x">two</b></section>
`;

const render = () =>
  renderHarness({
    family: 'demo',
    fragment,
    familyCss: '.x { color: red }',
    themeCss: '[data-slotted-theme="default"] { --t: 1px }',
  });

test('names the theme the stylesheet it was handed was built from', () => {
  assert.match(render(), /data-slotted-theme="default"/);
  assert.match(
    renderHarness({
      family: 'demo',
      fragment,
      familyCss: '',
      themeCss: '[data-slotted-theme="other"] { --t: 2px }',
      theme: 'other',
    }),
    /data-slotted-theme="other"/,
  );
});

test('emits one document carrying both stylesheets', () => {
  const html = render();
  assert.match(html, /^<!doctype html>/i);
  assert.ok(html.includes('.x { color: red }'), 'the family stylesheet is missing');
  assert.ok(html.includes('--t: 1px'), 'the theme is missing');
});

test('renders every scene in every scheme at every width', () => {
  const html = render();
  for (const scene of ['default', 'current']) {
    for (const scheme of SCHEMES) {
      for (const width of WIDTHS) {
        assert.ok(
          html.includes(`id="${scene}-${scheme}-${width}"`),
          `missing cell ${scene}-${scheme}-${width}`,
        );
      }
    }
  }
});

/**
 * The review page is the one a reviewer opens by hand, and it is where the
 * defect lived: cells were laid on a grid of `minmax(320px, 1fr)` tracks while
 * each stage carries a definite 240, 420 or 720 pixel width, so every stage
 * wider than its track was drawn over the cells beside it. A reviewer reported
 * it as "impossible to check anything", which is what an overlapping page is.
 *
 * The layout may not size a cell independently of the stage inside it. A
 * wrapping row of content-sized boxes has no track to overflow; a grid with a
 * definite track always can, because `repeat(auto-fill, …)` needs a definite
 * maximum and the three stage widths are three different definite values.
 */
test('sizes each cell by its own stage, so no stage is drawn over its neighbour', () => {
  const html = render();
  assert.match(html, /main \{ display: flex; flex-wrap: wrap \}/);
  assert.match(html, /\.cell \{ flex: 1 0 auto;/);
  assert.ok(
    !/main \{[^}]*display: grid/.test(html),
    'a definite grid track is what the widest stage overflowed',
  );
});

/**
 * The gaps a reviewer reported between the tiles were the page's own ground,
 * seen under every cell shorter than its neighbour. Two rules let it through:
 * `align-items: start`, which sized each cell to its own content while the flex
 * line took the height of the tallest, and a one-pixel gap over a coloured
 * background, which reads as a hairline only while every cell is one size — and
 * the cells are three sizes by design.
 *
 * A cell must therefore fill its line, and the separator must belong to the box
 * it separates.
 */
test('lets no cell leave the page ground showing beside it', () => {
  const html = render();
  assert.ok(
    !/main \{[^}]*align-items: start/.test(html),
    'a cell sized to its own content leaves the line height under it empty',
  );
  assert.ok(
    !/main \{[^}]*gap: 1px/.test(html),
    'a one-pixel gap over a ground is what showed through between uneven tiles',
  );
  assert.match(
    html,
    /\.cell \{ flex: 1 0 auto;/,
    'a cell that does not grow leaves its line short',
  );
  assert.match(html, /\.cell \{[^}]*border-inline-end: 1px solid/);
});

/**
 * The page lays its cells out on its own `main`, and a family that renders a
 * `main` of its own — `app-shell` — sits inside a cell. An unscoped `main`
 * rule made the shell's content region a wrapping flex row, and every scene's
 * page shrank to the width of its widest line.
 */
test('lays out its own main and no main a family renders', () => {
  const html = render();
  assert.match(html, /body > main \{ display: flex; flex-wrap: wrap \}/);
  assert.doesNotMatch(html, /\n\s*main \{/);
});

/**
 * Grouped scheme-major the three stage widths alternated at every step, so no
 * two neighbouring cells were the same size. Width-major puts the three schemes
 * of one scene at one size side by side, which is both tidier and the
 * comparison the page is for.
 */
/**
 * A wrapped line that holds the tail of one width group and the head of the
 * next puts a 720-pixel tile beside a 240-pixel one, which is the mosaic a
 * reviewer read as disorder. The break ends the line and carries no size.
 */
test('ends the line after each width group, so no line mixes two sizes', () => {
  const html = render();
  assert.match(html, /\.break \{ flex-basis: 100%; block-size: 0 \}/);
  const breaks = [...html.matchAll(/<div class="break"><\/div>/g)];
  assert.equal(breaks.length, 2 * WIDTHS.length, 'one break per scene per width');

  const between = html.split('<div class="break"></div>');
  for (const chunk of between.slice(0, -1)) {
    const widths = [...chunk.matchAll(/id="[a-z-]+-[a-z-]+-(\d+)"/g)].map(([, width]) => width);
    assert.equal(new Set(widths).size, 1, `a line holds one width, found ${widths.join(', ')}`);
  }
});

test('groups the cells by width, so neighbouring cells are the same size', () => {
  const order = [...render().matchAll(/id="default-([a-z-]+)-(\d+)"/g)].map(
    ([, scheme, width]) => `${width}:${scheme}`,
  );
  assert.deepEqual(order.slice(0, 3), ['240:light', '240:dark', '240:high-contrast']);
  assert.deepEqual(order.slice(3, 6), ['420:light', '420:dark', '420:high-contrast']);
  assert.deepEqual(order.slice(6, 9), ['720:light', '720:dark', '720:high-contrast']);
});

test('shows one cell on a filtered page and hides the rest', () => {
  const html = render();
  assert.match(html, /body\[data-only\] \.cell \{ display: none \}/);
  assert.match(html, /body\[data-only\] \.cell\.shown \{ display: block \}/);
});

test('gives each cell the scheme attribute the theme selects on', () => {
  assert.match(render(), /data-slotted-scheme="dark"/);
});

test('captures the high-contrast scheme, not only light and dark', () => {
  assert.deepEqual(SCHEMES, ['light', 'dark', 'high-contrast']);
  assert.match(render(), /data-slotted-scheme="high-contrast"/);
});

test('applies density and direction to the page rather than to each cell', () => {
  const html = render();
  assert.deepEqual(DENSITIES, ['comfortable', 'compact', 'dense']);
  assert.deepEqual(DIRECTIONS, ['ltr', 'rtl']);
  assert.match(html, /q\.get\('density'\)/);
  assert.match(html, /q\.get\('dir'\)/);
  assert.match(html, /documentElement\.dataset\.slottedDensity = density/);
  assert.match(html, /documentElement\.dir = direction/);
});

/**
 * A capture is evidence only while it says which axes it was taken on. The
 * caption is baked at build time and cannot know them, so two captures of the
 * same scene at two densities carried the same label and the reader had no way
 * to tell them apart inside the image.
 */
test('names the density and the direction in every caption it captions', () => {
  const html = render();
  assert.match(html, /<span data-axes><\/span>/);
  assert.match(html, /querySelectorAll\('\[data-axes\]'\)/);
  assert.match(html, /documentElement\.dataset\.slottedDensity/);
  assert.match(html, /documentElement\.dir/);
});

test('paints each stage on the theme surface it is judged against', () => {
  assert.match(render(), /background: var\(--slotted-surface\)/);
});

test('defaults every axis and names each one in the file it writes', () => {
  const options = parseArguments(['demo']);
  assert.deepEqual(options, {
    family: 'demo',
    outDir: options.outDir,
    active: undefined,
    at: undefined,
    focus: undefined,
    hover: undefined,
    motion: undefined,
    scene: undefined,
    scrollbars: 'hide',
    zoom: '100',
    scheme: 'light',
    width: '420',
    density: 'comfortable',
    dir: 'ltr',
  });
  assert.equal(captureName(options), 'demo-light-comfortable-ltr-420.png');
});

test('captures a focused element, because a focus ring is judged from an image', () => {
  const options = parseArguments(['demo', '--focus', '[data-focusable] a']);
  assert.equal(options.focus, '[data-focusable] a');
  assert.equal(captureName(options), 'demo-focus-data-focusable-a-light-comfortable-ltr-420.png');
});

/**
 * Hover and press exist in no capture the shooter could take before this: a
 * headless page has no pointer, so a family could paint a hover fill nobody
 * ever looked at. The pseudo-class is forced through the protocol instead of
 * simulated with a mouse, because a moved pointer also scrolls, hovers whatever
 * it passes over, and cannot reach `:active` at all without holding a button
 * down for the length of the capture.
 */
test('captures hover and press, which a headless page has no pointer to produce', () => {
  const hovered = parseArguments(['demo', '--hover', "[data-ui='card']"]);
  assert.equal(hovered.hover, "[data-ui='card']");
  assert.equal(captureName(hovered), 'demo-hover-data-ui-card-light-comfortable-ltr-420.png');

  const pressed = parseArguments(['demo', '--active', "[data-ui='card']"]);
  assert.equal(pressed.active, "[data-ui='card']");
  assert.equal(captureName(pressed), 'demo-active-data-ui-card-light-comfortable-ltr-420.png');
});

test('keeps a hovered capture and a pressed capture of one element apart', () => {
  const hovered = parseArguments(['demo', '--hover', 'a']);
  const pressed = parseArguments(['demo', '--active', 'a']);
  assert.notEqual(captureName(hovered), captureName(pressed));
});

/**
 * A page is photographed the instant it loads, so every animation on it sits at
 * the start of its first cycle — and the start of a cycle is where an expanding
 * ring, a sweep or a pulse is indistinguishable from nothing at all.
 * `status-indicator` produced three captures of an invisible pulse for that
 * reason, and no reader of those images could have told the animation apart
 * from an unimplemented one.
 */
test('captures a moment inside an animation, which loading the page cannot reach', () => {
  const options = parseArguments(['demo', '--at', '800']);
  assert.equal(options.at, '800');
  assert.equal(captureName(options), 'demo-light-comfortable-ltr-420-at800ms.png');
});

test('keeps two moments of one animation in two files, and the default out of both', () => {
  const early = parseArguments(['demo', '--at', '200']);
  const late = parseArguments(['demo', '--at', '900']);
  assert.notEqual(captureName(early), captureName(late));
  assert.equal(captureName(parseArguments(['demo'])), 'demo-light-comfortable-ltr-420.png');
});

/**
 * Headless Chrome answers `prefers-reduced-motion: reduce` by default, so every
 * capture taken before this axis existed was taken by a reader who had asked
 * for stillness — and the foundation requires every infinite animation to be
 * guarded by exactly that query. Both answers have to be reachable, and neither
 * of them may be whatever the browser happens to say.
 */
test('states the reader’s motion preference instead of inheriting the browser’s', () => {
  const still = parseArguments(['demo', '--motion', 'reduce']);
  assert.equal(still.motion, 'reduce');
  assert.equal(captureName(still), 'demo-light-comfortable-ltr-420-motion-reduce.png');

  const moving = parseArguments(['demo', '--motion', 'no-preference']);
  assert.equal(captureName(moving), 'demo-light-comfortable-ltr-420-motion-no-preference.png');
  assert.throws(() => parseArguments(['demo', '--motion', 'off']), /reduce, no-preference/);
});

/**
 * The shooter has always launched Chrome with `--hide-scrollbars`, which keeps
 * a page-level bar out of a full-page capture and makes one family
 * unphotographable: `scroll-area` decided the scrollbar is the platform's,
 * themed through `scrollbar-color`, and the tool that judges the picture was
 * hiding the thing the family is about.
 */
test('can photograph a scrollbar, and hides one by default', () => {
  const hidden = parseArguments(['demo']);
  assert.equal(hidden.scrollbars, 'hide');
  assert.equal(captureName(hidden), 'demo-light-comfortable-ltr-420.png');

  const shown = parseArguments(['demo', '--scrollbars', 'show']);
  assert.equal(shown.scrollbars, 'show');
  assert.equal(captureName(shown), 'demo-light-comfortable-ltr-420-scrollbars.png');

  assert.throws(() => parseArguments(['demo', '--scrollbars', 'yes']), /hide, show/);
});

test('refuses a moment that is not a whole number of milliseconds', () => {
  assert.throws(() => parseArguments(['demo', '--at', 'halfway']), /whole number of milliseconds/);
  assert.throws(() => parseArguments(['demo', '--at', '1.5']), /whole number of milliseconds/);
});

test('keeps two focus targets in the same combination in two files', () => {
  const first = parseArguments(['demo', '--focus', 'a']);
  const second = parseArguments(['demo', '--focus', 'button']);
  assert.notEqual(captureName(first), captureName(second));
});

test('reads every axis by name', () => {
  const options = parseArguments([
    'demo',
    '--scheme',
    'high-contrast',
    '--density',
    'dense',
    '--dir',
    'rtl',
    '--width',
    '240',
    '--out',
    '/somewhere',
  ]);
  assert.equal(options.scheme, 'high-contrast');
  assert.equal(options.density, 'dense');
  assert.equal(options.dir, 'rtl');
  assert.equal(options.width, '240');
  assert.equal(options.outDir, '/somewhere');
});

test('narrows a capture to one scene and says so in the file name', () => {
  const options = parseArguments(['demo', '--scene', 'emphasis']);
  assert.equal(options.scene, 'emphasis');
  assert.equal(captureName(options), 'demo-emphasis-light-comfortable-ltr-420.png');
  assert.match(render(), /q\.get\('scene'\)/);
  assert.match(render(), /dataset\.scene === scene/);
});

test('refuses an axis value the harness cannot render', () => {
  assert.throws(() => parseArguments(['demo', '--density', 'roomy']), /density must be one of/);
  assert.throws(() => parseArguments(['demo', '--scheme']), /needs a value/);
  assert.throws(() => parseArguments(['--scheme', 'dark']), /usage/);
});

/**
 * A family whose smallest meaningful layout is wider than the widest default
 * stage could not be photographed at all: `app-shell`, while it answered its
 * own inline size at 768 pixels, rendered the narrow layout at all three defaults, and the
 * wide one — the navigation as a column, the pane beside the content, the rail
 * — never reached an image. A fixed-width stage does not answer it, because
 * the capture is clipped to the width the shooter was asked for.
 */
test('lets one scene state the widths it is worth photographing at', () => {
  const html = renderHarness({
    family: 'demo',
    fragment: `
      <section data-scene="wide" data-widths="420 1080"><b>one</b></section>
      <section data-scene="narrow"><b>two</b></section>
    `,
    familyCss: '',
    themeCss: '',
  });

  for (const scheme of SCHEMES) {
    assert.ok(html.includes(`id="wide-${scheme}-1080"`), `missing wide-${scheme}-1080`);
    assert.ok(html.includes(`id="wide-${scheme}-420"`), `missing wide-${scheme}-420`);
    assert.equal(
      html.includes(`id="wide-${scheme}-240"`),
      false,
      'a declared width list is the whole list',
    );
    for (const width of WIDTHS) {
      assert.ok(
        html.includes(`id="narrow-${scheme}-${width}"`),
        'a scene that declares nothing keeps the three',
      );
    }
  }
});

test('reads a scene declared width list, and only whole pixel counts', () => {
  const [wide, narrow] = parseScenes(
    '<section data-scene="wide" data-widths="420 1080"><b>a</b></section>' +
      '<section data-scene="narrow"><b>b</b></section>',
  );
  assert.deepEqual(wide.widths, [420, 1080]);
  assert.equal(narrow.widths, null);
});

/** A width that is not a whole number of pixels can only produce a blank capture. */
test('takes a width outside the three the page ships, and nothing that is not a width', () => {
  assert.equal(parseArguments(['demo', '--width', '1080']).width, '1080');
  assert.throws(
    () => parseArguments(['demo', '--width', 'wide']),
    /width must be a whole number of pixels/,
  );
  assert.throws(() => parseArguments(['demo', '--width', '0']), /whole number of pixels/);
});

test('sizes each cell so a container query has something to answer', () => {
  assert.match(render(), /inline-size:\s*240px/);
});

test('refuses a fragment that declares no scene', () => {
  assert.throws(
    () =>
      renderHarness({ family: 'demo', fragment: '<b>no scene</b>', familyCss: '', themeCss: '' }),
    /no scene/i,
  );
});

test('keeps the scene markup verbatim, so the harness shows the real DOM', () => {
  assert.ok(render().includes('<b class="x">one</b>'));
});

/**
 * An overlay family's layer is `position: fixed`, and a stage is not a
 * containing block for one. Without this a page's nine cells each paint a
 * full-viewport layer over the whole page, and the capture shows one layer and
 * eight it covered.
 */
test('contains a fixed layer inside the stage of a scene that asks for it', () => {
  const html = renderHarness({
    family: 'demo',
    fragment: '<section data-scene="modal" data-fixed><b>layer</b></section>',
    familyCss: '',
    themeCss: '',
  });

  assert.match(html, /data-scene="modal"\s+data-fixed/, 'the stage does not carry the flag');
  assert.match(html, /\.stage\[data-fixed\][^}]*contain: layout paint/);
});

test('leaves a scene that does not ask for containment untouched by it', () => {
  assert.doesNotMatch(render(), /data-scene="default"\s+data-fixed/);
  assert.equal(parseScenes('<section data-scene="a"><b>x</b></section>')[0].fixed, false);
  assert.equal(
    parseScenes('<section data-scene="a" data-fixed><b>x</b></section>')[0].fixed,
    true,
    'the flag is not read from the section',
  );
});

/**
 * G12. The audit takes 96px for the width under which a stage child is a sliver
 * rather than a demonstration, and one family demonstrates something smaller: a
 * key of `kbd` is 23.8 to 37 pixels wide because a key is that wide, and 126
 * findings said so. Only the scene knows, so the scene says it and the stage
 * carries the number to the audit.
 */
test('carries the floor a scene declares for how small its subject may be', () => {
  const html = renderHarness({
    family: 'demo',
    fragment: '<section data-scene="keys" data-collapse-floor="20"><b>K</b></section>',
    familyCss: '',
    themeCss: '',
  });

  assert.match(html, /data-scene="keys"\s+data-collapse-floor="20"/);
  assert.equal(
    parseScenes('<section data-scene="keys" data-collapse-floor="20"><b>x</b></section>')[0].floor,
    20,
  );
});

test('leaves a scene that declared no floor to the one the audit brought', () => {
  assert.doesNotMatch(render(), /data-collapse-floor/);
  assert.equal(parseScenes('<section data-scene="a"><b>x</b></section>')[0].floor, null);
});

test('photographs the page once, at the scale the emulation already set', () => {
  const clip = captureClip({ width: '420', contentHeight: 553 });
  assert.equal(clip.scale, 1, 'a second scale factor repeats the top of the page below the fold');
  assert.equal(clip.width, 500);
  assert.equal(clip.height, 553);
});

test('clips to the content, not to the viewport floor a short page never reaches', () => {
  assert.equal(captureClip({ width: '420', contentHeight: 553.4 }).height, 554);
  assert.equal(captureClip({ width: '420', contentHeight: 0 }).height, 1);
});

/**
 * A family whose subject is how it composes with another cannot be looked at
 * alone. `button-group` joins buttons into one shape, repaints one seam of a
 * solid one and raises the focused one over its neighbour; with only its own
 * stylesheet on the page, every capture shows unstyled markup and there is
 * nothing to judge. The fragment already names the families it renders, in the
 * same `data-ui` that is the public identifier, so nothing new has to be
 * declared for the page to carry them.
 */
test('names the other families a fragment renders', () => {
  const composed = composedFamilies(
    `<section data-scene="s">
       <div data-ui="button-group"><button data-ui='button'></button></div>
       <div data-ui="button-group"></div>
     </section>`,
    'button-group',
  );
  assert.deepEqual(composed, ['button']);
});

test('carries a composed family stylesheet, before the family that composes it', () => {
  const html = renderHarness({
    family: 'demo',
    fragment,
    familyCss: '.x { color: red }',
    composedCss: '.y { color: blue }',
    themeCss: '',
  });
  assert.ok(html.includes('.y { color: blue }'), 'the composed stylesheet is missing');
  assert.ok(
    html.indexOf('.y { color: blue }') < html.indexOf('.x { color: red }'),
    'the family under review has to be able to override what it composes',
  );
});

/**
 * A control whose edges are drawn by two coincident borders looks correct at
 * 100% and comes apart at 110%: the browser snaps each border box to device
 * pixels on its own, so one boundary lands on a single column and the next
 * lands across two, and a bar of equal dividers renders with one of them twice
 * as thick. That defect reached a human review because no capture could show
 * it — the axis exists so the visual loop can.
 */
test('photographs the page at the reader\u2019s own zoom', () => {
  const zoomed = parseArguments(['demo', '--zoom', '150']);
  assert.equal(zoomed.zoom, '150');
  assert.equal(captureName(zoomed), 'demo-light-comfortable-ltr-420-zoom150.png');
});

test('keeps every capture taken before the axis existed named as it was', () => {
  assert.equal(parseArguments(['demo']).zoom, '100');
  assert.equal(captureName(parseArguments(['demo'])), 'demo-light-comfortable-ltr-420.png');
});

test('refuses a zoom that is not a percentage', () => {
  assert.throws(() => parseArguments(['demo', '--zoom', '1.5']), /percentage/);
  assert.throws(() => parseArguments(['demo', '--zoom', '0']), /percentage/);
});

/**
 * A family whose own root is a `section` — `alert`, whose box is a landmark
 * rather than a live region — closed the scene around it when scenes were read
 * with a single non-greedy pattern. The first alert rendered correctly and
 * every one after it vanished, which is a defect no reader of the capture could
 * have told apart from a fragment that only declared one.
 */
test('reads a scene whose markup nests sections of its own', () => {
  const nested = `
<section data-scene="messages">
  <section data-ui="alert" data-part="root">first</section>
  <section data-ui="alert" data-part="root">second</section>
</section>
<section data-scene="after"><b>tail</b></section>
`;
  const scenes = parseScenes(nested);

  assert.deepEqual(
    scenes.map((scene) => scene.name),
    ['messages', 'after'],
  );
  assert.ok(scenes[0].markup.includes('first'), 'the first nested section is missing');
  assert.ok(scenes[0].markup.includes('second'), 'the scene closed at the first nested section');
  assert.ok(!scenes[0].markup.includes('tail'), 'the scene swallowed the one after it');
});

test('refuses a scene that is never closed rather than emitting half a page', () => {
  assert.throws(() => parseScenes('<section data-scene="open"><b>x</b>'), /never closed/);
});

/**
 * Nine copies of one scene on one page were nine copies of one radio group,
 * because a radio group with no `form` around it is scoped to the document. The
 * last `checked` won and eight cells photographed an empty set — a wrong
 * picture that no assertion about the markup could see.
 */
test('gives each cell its own radio group, so a checked radio survives every copy', () => {
  const html = renderHarness({
    family: 'demo',
    fragment: `<section data-scene="pick"><input type="radio" name="p" checked></section>`,
    familyCss: '',
    themeCss: '',
  });
  const names = [...html.matchAll(/name="([^"]+)"/g)].map(([, value]) => value);
  assert.equal(names.length, SCHEMES.length * WIDTHS.length);
  assert.equal(new Set(names).size, names.length, 'two cells share one radio group');
  assert.ok(
    names.every((value) => value.startsWith('p--')),
    'the consumer name is not kept as the stem',
  );
});

test('rewrites the name of a control and nothing else on the element', () => {
  const scoped = scopeControlNames(
    '<input data-part="control" type="radio" name="plan" id="plan-1" checked />',
    'light-420',
  );
  assert.match(scoped, /name="plan--light-420"/);
  assert.match(scoped, /id="plan-1"/);
  assert.match(scoped, /data-part="control"/);
});

test('leaves a name outside a control alone', () => {
  assert.equal(scopeControlNames('<a name="anchor"></a>', 'light-420'), '<a name="anchor"></a>');
});

/**
 * The filter read the scene out of the stage id and matched it by prefix, so
 * `--scene tile` also showed `tile-states` and `tile-row`: a capture that named
 * one scene and photographed three.
 */
test('narrows to the scene named and not to every scene whose name starts with it', () => {
  const html = renderHarness({
    family: 'demo',
    fragment: `<section data-scene="tile"><b>a</b></section>
<section data-scene="tile-states"><b>b</b></section>`,
    familyCss: '',
    themeCss: '',
  });
  assert.match(html, /data-scene="tile"/);
  assert.match(html, /data-scene="tile-states"/);
  assert.ok(
    html.includes('dataset.scene === scene'),
    'the filter still matches the scene by prefix',
  );
});

test('scopes a solid glyph’s mask to its cell, so each copy cuts its own symbol', () => {
  const markup = '<mask id="sl-glyph-harness-3"></mask><path mask="url(#sl-glyph-harness-3)"/>';
  assert.equal(
    scopeGlyphMasks(markup, 'dark-420'),
    '<mask id="sl-glyph-harness-3--dark-420"></mask><path mask="url(#sl-glyph-harness-3--dark-420)"/>',
  );
});
