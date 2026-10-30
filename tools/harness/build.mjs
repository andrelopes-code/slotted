import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { drawGlyphs } from './glyph.mjs';
import { attachScript, bundleScript, splitFragment } from './script.mjs';

export const SCHEMES = ['light', 'dark', 'high-contrast'];
export const WIDTHS = [240, 420, 720];
export const DENSITIES = ['comfortable', 'compact', 'dense'];
export const DIRECTIONS = ['ltr', 'rtl'];

const SCENE_OPEN = /<section\s+data-scene="([^"]+)"((?:\s+[a-z-]+(?:="[^"]*")?)*)\s*>/g;
const SECTION_TAG = /<section\b|<\/section\s*>/g;
const IDENTIFIER = /data-ui=['"]([a-z0-9-]+)['"]/g;

/**
 * The scenes a fragment declares, read by counting `section` tags rather than
 * by stopping at the first closing one.
 *
 * A single non-greedy pattern was enough while no family's own root was a
 * `section`. `alert`'s is — a message with a name is a `region` landmark, which
 * is the answer Primer's Banner reaches and the reason the family does not
 * write a live role on its box — so the first alert in a scene closed the scene
 * around it, and every alert after it disappeared from the page. Nothing in the
 * capture said so: the picture was a correct rendering of one alert.
 *
 * A scene may declare `data-fixed`, which the stage carries. See the page
 * stylesheet below for what it is and why an overlay family needs it.
 *
 * A scene may also declare `data-collapse-floor`, which the stage carries for
 * the audit to read. See `tools/harness/audit.mjs` for what the floor is; the
 * short of it is that a key of `kbd` is thirty pixels wide because a key is
 * thirty pixels wide, and only the scene knows that (G12).
 */
export function parseScenes(fragment) {
  const scenes = [];
  SCENE_OPEN.lastIndex = 0;

  for (let open = SCENE_OPEN.exec(fragment); open !== null; open = SCENE_OPEN.exec(fragment)) {
    const start = open.index + open[0].length;
    SECTION_TAG.lastIndex = start;

    let depth = 1;
    let end = -1;
    for (let tag = SECTION_TAG.exec(fragment); tag !== null; tag = SECTION_TAG.exec(fragment)) {
      depth += tag[0].startsWith('</') ? -1 : 1;
      if (depth === 0) {
        end = tag.index;
        break;
      }
    }

    if (end === -1) throw new Error(`the scene "${open[1]}" is never closed`);
    const attributes = open[2] ?? '';
    const floor = /data-collapse-floor="(\d+(?:\.\d+)?)"/.exec(attributes);
    /**
     * The widths this scene is worth photographing at, when the three the page
     * ships are not among them.
     *
     * `app-shell` found the gap while the shell's own breakpoint was 768 pixels:
     * every one of the three default widths rendered the narrow layout and the
     * wide one — the navigation as a column, the pane beside the content, the
     * rail — could not be photographed at all. A fixed-width stage does not
     * answer it either, because the capture is clipped to the width the shooter
     * was asked for.
     *
     * It is opt-in per scene and changes nothing for a family that declares
     * nothing, which is what keeps a screen-sized family from adding a fourth
     * column to every other family's review page.
     */
    const widths = /data-widths="([\d\s]+)"/.exec(attributes);
    scenes.push({
      name: open[1],
      markup: fragment.slice(start, end),
      fixed: attributes.includes('data-fixed'),
      floor: floor === null ? null : Number(floor[1]),
      widths:
        widths === null
          ? null
          : widths[1]
              .trim()
              .split(/\s+/)
              .map(Number)
              .filter((width) => Number.isInteger(width) && width > 0),
    });
    SCENE_OPEN.lastIndex = end;
  }

  return scenes;
}

/**
 * The other families a fragment renders, read from the fragment itself.
 *
 * A family whose subject is how it composes with another cannot be looked at
 * alone: `button-group` joins buttons into one shape, repaints one seam of a
 * solid one and raises the focused one over its neighbour, and with only its
 * own stylesheet on the page every capture shows unstyled markup. Nothing new
 * has to be declared for the page to carry them, because the fragment already
 * names them in the same `data-ui` that is the public identifier.
 */
export function composedFamilies(fragment, family) {
  return [...new Set([...fragment.matchAll(IDENTIFIER)].map(([, name]) => name))]
    .filter((name) => name !== family)
    .sort();
}

/**
 * The page is framework-free on purpose. One authored stylesheet serves both
 * React and Angular, so plain markup carrying the theme and the family's CSS
 * previews both — and it renders in milliseconds, where a Storybook build
 * takes tens of seconds. Refinement needs many iterations, not two.
 *
 * Scheme and width multiply the cells, because a reader compares them side by
 * side. Density and direction are applied to the whole page instead: they are
 * axes a capture is taken *in*, and multiplying every cell by six would make
 * the review view unreadable to reach the same coverage.
 */
/**
 * A radio group is scoped to its form owner, and a fragment with no `form` of
 * its own owns the document. The builder emits every scene nine times, so nine
 * copies of one scene were nine copies of one radio group: the last `checked`
 * in the page won and the eight cells above it photographed an empty set. The
 * `name` is therefore made per cell.
 *
 * It is the one identifier rewritten. `id` and `for` stay verbatim, because a
 * duplicated `id` costs a screenshot nothing — the shooter scopes `--focus` and
 * the pointer to the cell it is capturing — and rewriting them would edit the
 * DOM the harness exists to show. Wrapping each stage in a `form` was the other
 * way to scope the group and is not open: two fragments already declare a
 * `form`, and a nested one is dropped by the parser.
 */
export function scopeControlNames(markup, suffix) {
  return markup.replace(/<input\b[^>]*>/g, (tag) =>
    tag.replace(/\bname="([^"]*)"/g, (_, value) => `name="${value}--${suffix}"`),
  );
}

/**
 * A solid glyph cuts its symbol out with a `<mask>` the svg references by id,
 * and `url(#id)` resolves to the first element with that id in the document:
 * nine copies of one scene drew nine discs with nothing cut out, because the
 * eight later ones pointed at a mask in a hidden cell. The mask's id and its
 * reference are therefore made per cell, like a radio group's `name`; nothing
 * else a fragment writes is rewritten.
 */
export function scopeGlyphMasks(markup, suffix) {
  return markup.replace(/sl-glyph-harness-\d+/g, (id) => `${id}--${suffix}`);
}

/**
 * The theme name selects the block the stylesheet emits, so the attribute in
 * the document and the theme the stylesheet was built from have to agree. A
 * page that names one theme and loads another paints nothing.
 */
export function renderHarness({
  family,
  fragment,
  familyCss,
  composedCss = '',
  pageCss = '',
  themeCss,
  theme = 'default',
}) {
  const scenes = parseScenes(fragment);
  if (scenes.length === 0) {
    throw new Error(`${family}: the harness fragment declares no scene`);
  }

  /**
   * Width first, scheme second. Read scheme-major the three widths alternated
   * at every step, so no two neighbouring cells were the same size and the
   * page read as a mosaic. Grouped by width, each run of three is the same
   * scene at the same size in the three schemes — which is also the comparison
   * a reviewer actually makes.
   */
  const cells = scenes.flatMap(({ name, markup, fixed, floor, widths }) =>
    (widths ?? WIDTHS).flatMap(
      (width) =>
        SCHEMES.map(
          (scheme) => `
      <figure class="cell" data-scheme="${scheme}">
        <figcaption>${name} · ${scheme} · ${width}px<span data-axes></span></figcaption>
        <div
          class="stage"
          id="${name}-${scheme}-${width}"
          data-scene="${name}"${fixed ? '\n          data-fixed' : ''}${
            typeof floor === 'number' ? `\n          data-collapse-floor="${floor}"` : ''
          }
          data-slotted-scheme="${scheme}"
          style="inline-size: ${width}px"
        >${scopeGlyphMasks(scopeControlNames(markup, `${scheme}-${width}`), `${scheme}-${width}`)}</div>
      </figure>`,
        ).join('') +
        /* One scene at one width in the three schemes is a line of its own.
           Left to wrap freely a line held the tail of one width group and the
           head of the next — a 720-pixel tile beside a 240-pixel one — which is
           the mosaic a reviewer read as disorder. The break carries no size and
           no border; it only ends the line. */
        '<div class="break"></div>',
    ),
  );

  return `<!doctype html>
<html lang="en" dir="ltr" data-slotted-theme="${theme}" data-slotted-density="comfortable">
<meta charset="utf-8">
<title>${family} harness</title>
<style>${themeCss}</style>
<style>${composedCss}</style>
<style>${familyCss}</style>
<style>${pageCss}</style>
<style>
  body { margin: 0; font: 12px ui-sans-serif, system-ui, sans-serif; background: #eceef1 }
  .cell { margin: 0; padding: 12px }
  .cell[data-scheme="dark"] { background: #0b0b0d; color: #fafafa }
  .cell[data-scheme="light"] { background: #ffffff; color: #0f172a }
  .cell[data-scheme="high-contrast"] { background: #ffffff; color: #000000 }
  .cell > figcaption { font: 11px ui-monospace, monospace; opacity: 0.55; padding-block-end: 8px }
  .stage {
    border: 1px dashed rgb(128 128 128 / 0.35);
    padding: 12px;
    resize: horizontal;
    overflow: auto;
    background: var(--slotted-surface);
    color: var(--slotted-text);
  }
  /* An overlay family positions its layer against the viewport, and a stage is
     not a containing block for a fixed descendant. Nine cells of one page would
     each paint a full-viewport layer, over the page and over each other, and
     the capture would show one dialog and eight it had covered.

     Containing the layout makes the stage the containing block for fixed and
     absolutely positioned descendants; containing the paint clips them to it.
     The pair is what lets a layer be photographed in a cell. It is opt-in per
     scene, because containment also changes where an existing family's own
     absolutely positioned parts resolve, and no family that does not ask for it
     may be moved by it. */
  .stage[data-fixed] { contain: layout paint }
  /* A layer takes its parent's size and gives none back, so a stage holding
     only a layer would be zero pixels tall and the capture would be empty. The
     scene supplies the page behind the scrim; this is the floor under it, and
     it is deep enough to hold a panel rather than only to prove one exists. */
  .stage[data-fixed] { min-block-size: 420px }
  /* A cell is exactly as wide as the stage it holds, and the row wraps.
     Laid out on a grid of minmax(320px, 1fr) tracks, a 420-pixel stage
     overflowed its track and a 720-pixel one overflowed it by four hundred
     pixels — drawn over the cells beside it, on every family's review page.
     The earlier fix gave the *filtered* page one column and left the review
     page overlapping, which is the page a reviewer opens by hand.
     A track cannot both hold the widest stage and pack the narrow ones, because
     repeat(auto-fill, ...) needs a definite maximum and the stages are three
     different definite widths. Wrapping boxes sized by their own content is the
     layout that has no track to overflow. */
  /* No align-items, so every cell on a wrapped line takes the height of the
     tallest one and its own scheme background fills it. Read as start, each
     cell was only as tall as its content, and the page's own ground showed
     through under every cell shorter than its neighbour — the gaps a reviewer
     saw between the tiles. A line of cells is a line, not a shelf of boxes.

     The separator is an edge on the cell rather than a gap over a coloured
     ground, for the same reason: an edge belongs to the box it separates and
     has nothing to leak through. */
  body > main { display: flex; flex-wrap: wrap }
  /* Grows to fill its line and never shrinks. A basis that did not grow left
     the ground of the page showing to the right of every short line: a
     720-pixel stage is one cell on a 1440-pixel window, and the other seven
     hundred pixels were bare.
     Growing costs the stage nothing, because the stage states its own width;
     what grows is the cell around it. Shrink stays at zero, which is what keeps
     a stage from ever being squeezed under the width its caption claims. */
  .cell { flex: 1 0 auto; border-inline-end: 1px solid #c9ccd2; border-block-end: 1px solid #c9ccd2 }
  .break { flex-basis: 100%; block-size: 0 }
  body[data-only] .cell { display: none }
  body[data-only] .cell.shown { display: block }
</style>
<main>${cells.join('')}</main>
<script>
  /* The shooter asks for one combination so each capture is legible on its own.
     Opened without a query, the page shows everything, which is the review view.
     Density and direction are page-wide: they change how a cell renders, not
     which cells exist. */
  const q = new URLSearchParams(location.search);
  const scheme = q.get('scheme');
  const width = q.get('width');
  const density = q.get('density');
  const direction = q.get('dir');
  const scene = q.get('scene');
  if (density) document.documentElement.dataset.slottedDensity = density;
  if (direction) document.documentElement.dir = direction;
  /* Baked at build time, the caption could not know the two axes the page
     applies to itself, so a dense RTL capture and a comfortable LTR one carried
     the same label. The reader compares images, not file names. */
  for (const axes of document.querySelectorAll('[data-axes]')) {
    axes.textContent =
      ' · ' + document.documentElement.dataset.slottedDensity + ' · ' + document.documentElement.dir;
  }
  if (scheme || width || scene) {
    document.body.dataset.only = '';
    for (const cell of document.querySelectorAll('.cell')) {
      const id = cell.querySelector('.stage').id;
      const okScheme = !scheme || id.includes('-' + scheme + '-');
      const okWidth = !width || id.endsWith('-' + width);
      const okScene = !scene || cell.querySelector('.stage').dataset.scene === scene;
      if (okScheme && okWidth && okScene) cell.classList.add('shown');
    }
  }
</script>
</html>
`;
}

async function main() {
  const args = process.argv.slice(2);
  const family = args.find((argument) => !argument.startsWith('--'));
  if (!family) throw new Error('usage: node tools/harness/build.mjs <family> [--theme=<name>]');

  const theme =
    args.find((argument) => argument.startsWith('--theme='))?.slice('--theme='.length) ?? 'default';

  const root = new URL('../../', import.meta.url);
  const read = (path) => readFile(new URL(path, root), 'utf8');

  const fragment = await read(`packages/styles/src/${family}/${family}.harness.html`);
  const composed = await Promise.all(
    composedFamilies(fragment, family).map((name) =>
      read(`packages/styles/src/${name}/${name}.css`).catch(() => ''),
    ),
  );

  /* A family whose picture needs script carries a page stylesheet and a
     module script beside its scenes; see `script.mjs`. A fragment with
     neither renders exactly as before. */
  const { scenes, css, script } = splitFragment(fragment);
  let html = renderHarness({
    family,
    fragment: drawGlyphs(scenes),
    familyCss: await read(`packages/styles/src/${family}/${family}.css`),
    composedCss: composed.join('\n'),
    pageCss: css,
    themeCss: await read(`packages/themes/dist/styles.css`),
    theme,
  });
  if (script.trim()) html = attachScript(html, await bundleScript(script, root));

  const out = new URL('tools/harness/out/', root);
  await mkdir(out, { recursive: true });
  await writeFile(new URL(`${family}.html`, out), html);
  console.log(fileURLToPath(new URL(`${family}.html`, out)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
