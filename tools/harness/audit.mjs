import { fileURLToPath } from 'node:url';

import { launch } from './shoot.mjs';

/**
 * Measures a rendered page and reports the three failures a screenshot shows
 * and no offline test can: an element that collapsed to a sliver, content that
 * ran outside the box that owns it, and a mark that sits off the axis of the
 * text it annotates.
 *
 * All three are read as geometry rather than as causes. A demonstration
 * standing eighteen pixels wide inside a nine-hundred-pixel stage is broken
 * whether it collapsed because it answers its own width, because a flex item
 * shrank past its content, or because a column count halved the page twice
 * over. Naming the symptom is what makes the guard hold for the next cause
 * nobody predicted.
 *
 * ── What the page does, and what this file does ────────────────────────────
 *
 * The page measures and this file judges. Everything below `MEASURE` is a pure
 * function over records, so every rule the audit applies can be tested without
 * a browser — which is what three sessions of false findings cost before it
 * was split this way (G5, G7, G10). A rule that only exists inside a string
 * evaluated in Chrome is a rule nobody can put a case to.
 */

/**
 * Below this, an element is a sliver rather than a demonstration.
 *
 * The number is a guess about what a demonstration is for, and one family
 * demonstrates something smaller: a key of `kbd` stands 23.8 to 37 pixels wide
 * because a key is that wide, and the audit reported a hundred and twenty-six
 * of them (G12). A scene that shows something small by design says so with
 * `data-collapse-floor` on its `section`, and the stage carries the number
 * here.
 */
const COLLAPSE_FLOOR = 96;

/** A stage narrower than this has no room to collapse anything meaningfully. */
const STAGE_MINIMUM = 320;

/**
 * How long the page is given between two readings of how many stages it holds.
 *
 * A docs page mounts its blocks one at a time, so two readings this far apart
 * with the same count is what "it has stopped growing" means here. Shorter and
 * a slow block lands after the audit has measured; longer and every run pays
 * for it.
 */
export const SETTLE_INTERVAL = 250;

/**
 * Whether a page has stopped mounting stages.
 *
 * `counts` is every reading so far, oldest first. It has settled once two
 * consecutive readings agree and there is something to measure — a page that
 * has drawn nothing has not settled, it has not started.
 */
export function hasSettled(counts) {
  if (counts.length < 2) return false;
  const last = counts[counts.length - 1];
  return last > 0 && last === counts[counts.length - 2];
}

/** Overflow under this is a rounding artifact, not content leaving its box. */
const OVERFLOW_TOLERANCE = 2;

/**
 * How far a mark's center may sit from the center of the line it annotates.
 *
 * A font's ascent and descent are not symmetrical, so a mark centerd perfectly
 * on its line box still measures a quarter of a pixel from the middle of the
 * glyphs beside it. One pixel is above that floor and below anything a reader
 * would call aligned.
 *
 * The defect this catches was found by eye, three times, in three reviews, and
 * measured once: `block-size: 1lh` on a mark resolves against the *mark's own*
 * line-height, so a mark inside an element that left its line box at `normal`
 * stood 15 pixels tall beside a 19.5-pixel line and sat two pixels high. The
 * cure is structural — one line box, stated on the element the cells inherit
 * from — and this is what stops the next family from rediscovering it by eye.
 */
const AXIS_TOLERANCE = 1;

/**
 * Elements that never draw anything, whatever the stylesheet says about them.
 *
 * A harness fragment carries its own `script` and `style` where a scene needs
 * them, and both are children of the stage. Measured as demonstrations they are
 * nought pixels wide inside a 446-pixel stage, which is the shape of the worst
 * defect the collapse rule exists to catch — so the audit reported ninety of
 * them across the families and every one of them was the tool talking to itself
 * (G5).
 */
export const UNRENDERED_TAGS = new Set([
  'script',
  'style',
  'template',
  'link',
  'meta',
  'title',
  'noscript',
]);

/**
 * The stage children that collapsed to a sliver.
 *
 * The walk is here rather than in the page because two of its three rules are
 * about what an element *is* rather than about how wide it is, and both were
 * got wrong while they lived in a string:
 *
 * **An element that draws nothing is not a demonstration.** `script` and
 * `style` sit in a stage because the fragment put them there (G5).
 *
 * **An element with no box of its own is not a demonstration either — its
 * children are.** `display: contents` makes an element a wrapper the layout
 * does not see, so it measures nought however wide its content is, and the tag
 * group measured 0px in every scheme while the capture plainly showed the tags
 * (TG1). The walk descends through it and judges what it actually drew.
 *
 * **A scene may know better than the floor.** `node.floor` is what the scene
 * declared, and it wins over the argument for that branch of the walk: a key of
 * `kbd` is a demonstration at thirty pixels, and nothing outside the fragment
 * can know it (G12).
 */
export function collapsedElements(candidates, floor = COLLAPSE_FLOOR) {
  const found = [];

  const visit = (node, inherited) => {
    if (UNRENDERED_TAGS.has(node.tag)) return;
    const declared = node.floor ?? inherited;
    if (node.boxes === 0) {
      for (const child of node.children ?? []) visit(child, declared);
      return;
    }
    if (node.width < declared) {
      found.push({
        scene: node.scene,
        element: node.element,
        width: Math.round(node.width),
        stage: Math.round(node.stage),
      });
    }
  };

  for (const candidate of candidates) visit(candidate, floor);
  return found;
}

/**
 * The largest amount a square of `width` × `height` can gain on the inline axis
 * by being turned about its center: its diagonal, less the width it started at.
 *
 * A rotation moves no layout and changes no box, but the *bounding* box of a
 * turned element is its diagonal, and scrollable overflow is measured from
 * bounding boxes. So a fourteen-pixel ring inside a fourteen-pixel slot reports
 * up to twenty pixels of content, and the audit called it overflow every time a
 * button was photographed mid-spin (G10).
 */
export function turningExcess({ width, height }) {
  return Math.sqrt(width * width + height * height) - width;
}

/**
 * How much of an element's overflow something other than content explains: the
 * largest of what a turning descendant adds (G10), what a descendant hung
 * outside the box on purpose adds (G13), and what a pointer reach hung outside
 * it on purpose adds (DR5).
 *
 * Each is the size of one thing rather than a sum, because each is one
 * explanation for the same pixels. A box with a spinner in one corner and a
 * read-out over the other keeps whichever excuse is larger and reports anything
 * past it.
 *
 * The third exists because R2's own prescribed construction produced it: a
 * control whose picture is thinner than the WCAG 2.2 target reaches the floor
 * with a transparent pseudo-element around it, and a four-pixel separator with
 * a twenty-four-pixel reach therefore reports ten pixels of overflow on a side.
 * `placed` cannot see it — it walks elements, and a pseudo-element is not one.
 */
export function explainedExcess({ turning = 0, placed = 0, reach = 0 }) {
  return Math.max(turning, placed, reach);
}

/**
 * The elements whose content ran outside them.
 *
 * A finding is withdrawn when the whole of it fits inside what a turning
 * descendant can add: the ring is the same size it was laid out at, and the
 * pixels the audit is looking at belong to the corner of a square that is
 * halfway round. Overflow larger than that is content, and is still reported —
 * a slot holding both a spinner and something genuinely too wide keeps its
 * finding.
 *
 * The same withdrawal covers a descendant placed out of flow against a box
 * inside this one: `[data-part='bubble']` is 39 pixels wide over a 16-pixel
 * thumb because the thumb declared itself its containing block and hung it
 * there, and 693 of the 894 surviving findings were that one read-out counted
 * again at the thumb, the track, the control, the root and the stack (G13).
 * Placement is the stylesheet's answer to where a box goes; overflow is the
 * question of what did not fit. A panel positioned against something *outside*
 * this element is not placement by anything in it, and still reports.
 *
 * An element inside an SVG drawing is withdrawn before any of that. It has no
 * CSS box, so its client width is nought and its scroll width is the extent
 * of its glyphs: every axis label of a chart reported as text overflowing a
 * box of no pixels, 2090 times across the two chart pages. Whether the drawing
 * fits is the question asked of the `svg` element, which has a box and is
 * still measured.
 *
 * The tolerance applies to the explanation as well as to nought, because
 * `scrollWidth` is an integer over fractional boxes: a read-out hanging 16.68px
 * off a 16px thumb reports 33 against 16, and one pixel of rounding is the
 * whole of the difference.
 */
export function overflowingElements(candidates, tolerance = OVERFLOW_TOLERANCE) {
  return candidates
    .filter((node) => node.drawing !== true)
    .filter((node) => node.scrollWidth - node.clientWidth > explainedExcess(node) + tolerance)
    .map((node) => ({
      scene: node.scene,
      element: node.element,
      width: node.scrollWidth,
      stage: node.clientWidth,
    }));
}

/**
 * Whether a mark stands beside the line it was paired with, rather than above
 * or below it.
 *
 * A glyph on a row of its own — `result-state` puts one over its title by
 * design — has no axis to miss: it is aligned to a block, and the question the
 * audit asks about a mark is a question about a line. Two boxes that share no
 * band of the page share no line, and that is the whole of the test (G7).
 */
export function annotatesTheLine({ markTop, markBottom, lineTop, lineBottom }) {
  if (markTop === undefined || lineTop === undefined) return true;
  return markTop < lineBottom && lineTop < markBottom;
}

/**
 * The marks whose center misses the center of the line beside them. Kept out of
 * the page so the judgement is testable without a browser: the page measures,
 * this decides.
 *
 * A mark whose line is text no reader can see has no axis to miss either. A
 * status with no words of its own carries its name in a `visually-hidden` span
 * — a clipped box of one pixel — and the audit measured the dot against it,
 * 1.25px, eighteen times, while the same dot beside every visible label of the
 * family measured 0 to 0.5px (SI1).
 */
export function offAxisMarks(marks, tolerance = AXIS_TOLERANCE) {
  return marks
    .filter((mark) => mark.hidden !== true)
    .filter((mark) => annotatesTheLine(mark))
    .map((mark) => ({ ...mark, offset: +(mark.markCenter - mark.textCenter).toFixed(2) }))
    .filter((mark) => Math.abs(mark.offset) > tolerance);
}

const MEASURE = `(() => {
  const stages = [...document.querySelectorAll('.slotted-demo-stage, .stage')];
  const label = (node) => {
    const scene = node.closest('.slotted-demo-scene, figure');
    const caption = scene?.querySelector('.slotted-demo-scene__label, figcaption');
    return (caption?.textContent ?? node.closest('[id]')?.id ?? '').trim().slice(0, 70);
  };
  const describe = (node) =>
    node.tagName.toLowerCase() +
    (node.dataset.ui ? '[data-ui=' + node.dataset.ui + ']' : '') +
    (node.dataset.part ? '[data-part=' + node.dataset.part + ']' : '');

  /**
   * How much a turning descendant can add to this element's scrollable
   * overflow. A rotation is read off the computed matrix — \`matrix(a,b,c,d,..)\`
   * is axis-aligned only while \`b\` and \`c\` are nought — and off the \`rotate\`
   * property, which a family may animate instead of \`transform\`.
   */
  const turningExcessOf = (node) => {
    let most = 0;
    for (const child of node.querySelectorAll('*')) {
      const style = getComputedStyle(child);
      const matrix = /matrix\\(([^)]*)\\)/.exec(style.transform ?? '');
      const parts = matrix ? matrix[1].split(',').map(Number) : [];
      const skewed = parts.length >= 4 && (Math.abs(parts[1]) > 1e-6 || Math.abs(parts[2]) > 1e-6);
      const turned = (style.rotate ?? 'none') !== 'none' && !/^0(deg|rad|turn|grad)?$/.test(style.rotate.trim());
      if (!skewed && !turned) continue;
      const box = { width: child.offsetWidth, height: child.offsetHeight };
      const excess = Math.sqrt(box.width * box.width + box.height * box.height) - box.width;
      if (excess > most) most = excess;
    }
    return most;
  };

  /**
   * Whether an element is the containing block an out-of-flow descendant was
   * placed against. An absolutely positioned box resolves against the nearest
   * positioned ancestor; a fixed one against the viewport, unless an ancestor
   * paints in a way that captures it — which is exactly what the harness stage
   * does with \`contain: layout paint\` for an overlay scene.
   */
  const capturesFixed = (style) =>
    (style.transform ?? 'none') !== 'none' ||
    (style.filter ?? 'none') !== 'none' ||
    (style.perspective ?? 'none') !== 'none' ||
    /paint|layout|strict|content/.test(style.contain ?? '') ||
    (style.willChange ?? 'auto').includes('transform');

  const containingBlockOf = (node, position) => {
    for (let parent = node.parentElement; parent !== null; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (position === 'absolute' && style.position !== 'static') return parent;
      if (capturesFixed(style)) return parent;
    }
    return null;
  };

  /**
   * How far past this element's padding box a descendant hangs *by placement*:
   * the largest overhang, on the inline axis, among out-of-flow descendants
   * whose containing block lies inside this element. A read-out hung on a thumb
   * overhangs the thumb, and the same pixels overhang every box the thumb
   * stands in, which is why the box that placed it is not the only one that has
   * to forgive it (G13).
   */
  /**
   * How far past this element a transparent pointer reach hangs, read from the
   * negative inline insets of an absolutely positioned pseudo-element on the
   * element itself or on a child of it.
   *
   * A pseudo-element has no node to walk to, so its geometry is read from the
   * declaration that placed it: an inset of minus ten pixels is ten pixels of
   * deliberate overhang, which is the construction R2 names for a target
   * thinner than the WCAG floor.
   */
  const reachExcessOf = (node) => {
    let most = 0;
    for (const element of [node, ...node.children]) {
      for (const which of ['::before', '::after']) {
        const style = getComputedStyle(element, which);
        if (style.content === 'none' || style.position !== 'absolute') continue;
        for (const side of ['left', 'right']) {
          const value = Number.parseFloat(style[side]);
          if (Number.isFinite(value) && value < 0 && -value > most) most = -value;
        }
      }
    }
    return most;
  };

  const placedExcessOf = (node) => {
    const box = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const padStart = box.left + parseFloat(style.borderLeftWidth || '0');
    const padEnd = box.right - parseFloat(style.borderRightWidth || '0');

    let most = 0;
    for (const child of node.querySelectorAll('*')) {
      const position = getComputedStyle(child).position;
      if (position !== 'absolute' && position !== 'fixed') continue;
      const against = containingBlockOf(child, position);
      if (against === null || !node.contains(against)) continue;
      const rect = child.getBoundingClientRect();
      const over = Math.max(rect.right - padEnd, padStart - rect.left, 0);
      if (over > most) most = over;
    }
    return most;
  };

  /** A stage child, and the children it stands in for when it has no box. */
  const candidateOf = (node, stageWidth, floor) => ({
    scene: label(node),
    element: describe(node),
    tag: node.tagName.toLowerCase(),
    width: node.getBoundingClientRect().width,
    stage: stageWidth,
    floor,
    boxes: node.getClientRects().length,
    children: [...node.children].map((child) => candidateOf(child, stageWidth, floor)),
  });

  const candidates = [];
  const overflow = [];

  for (const stage of stages) {
    const stageWidth = stage.getBoundingClientRect().width;
    if (stageWidth < ${STAGE_MINIMUM}) continue;

    /* What the scene declared about how small its subject may legitimately be.
       Absent, the audit's own floor decides (G12). */
    const declared = (stage.dataset.collapseFloor ?? '').trim();
    const floor = declared === '' || !Number.isFinite(Number(declared)) ? null : Number(declared);

    for (const child of stage.children) candidates.push(candidateOf(child, stageWidth, floor));

    if (stage.scrollWidth > stage.clientWidth) {
      overflow.push({
        scene: label(stage),
        element: 'the stage itself',
        scrollWidth: stage.scrollWidth,
        clientWidth: stage.clientWidth,
        turning: turningExcessOf(stage),
        placed: placedExcessOf(stage),
        reach: reachExcessOf(stage),
      });
    }
  }

  for (const node of document.querySelectorAll('.slotted-demo-stage *, .stage *')) {
    if (node.scrollWidth <= node.clientWidth) continue;
    if (getComputedStyle(node).overflowX !== 'visible') continue;
    overflow.push({
      scene: label(node),
      element: describe(node),
      drawing: node instanceof SVGElement && node.ownerSVGElement !== null,
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
      turning: turningExcessOf(node),
      placed: placedExcessOf(node),
      reach: reachExcessOf(node),
    });
  }

  /**
   * Every mark on the page, paired with the line of text it sits beside.
   *
   * A mark is an element painting a glyph from the scale — a mask, which is
   * what this library draws every component-owned icon with. The text is the
   * nearest sibling that has any, following first and preceding second, which
   * is the order a mark reads in: an icon annotates the label after it.
   *
   * The comparison is against the *first line's* own rectangle rather than the
   * sibling's box, because a label that wrapped onto three lines has a box
   * whose center no mark should ever be aligned to.
   *
   * A pseudo-element mark has no box to measure and is invisible here. So is a
   * mark with no text beside it, which is a mark centerd in a control of its
   * own and has no axis to miss.
   */
  const firstTextNode = (node) => {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
      acceptNode: (text) =>
        text.textContent.trim().length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    return walker.nextNode();
  };

  /**
   * A range over an *element* returns one rectangle per child box, so the first
   * one is the whole of the title — 39 pixels when it wraps — and every glyph
   * beside a title that wrapped was reported off its axis by half the second
   * line (G7). A range over a text node returns one rectangle per line box, and
   * the first of those is the line the mark actually sits on.
   */
  const firstLineOf = (node) => {
    const text = firstTextNode(node);
    if (text === null) return null;
    const range = document.createRange();
    range.selectNodeContents(text);
    const rects = [...range.getClientRects()].filter((rect) => rect.height > 0);
    if (rects[0] === undefined) return null;
    return { rect: rects[0], hidden: hiddenFromReaders(text.parentElement, node) };
  };

  /**
   * Whether the text is on the page for a reader or only for a screen reader.
   *
   * A status with no words of its own carries its name in a
   * \`visually-hidden\` span, and the audit paired the dot with that name: a
   * 1px box, absolutely positioned, clipped to nothing, whose text still
   * returns a rectangle. Eighteen findings of 1.25px against a line no reader
   * has ever seen (SI1). The test is the mechanism every implementation of
   * that pattern uses — a clip, or a box of a pixel with its overflow cut —
   * rather than a class name this library happens to write.
   */
  const hiddenFromReaders = (from, stopAt) => {
    for (let node = from; node !== null; node = node.parentElement) {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      if (style.visibility === 'hidden' || style.opacity === '0') return true;
      if ((style.clipPath ?? 'none') !== 'none') return true;
      if (style.overflow !== 'visible' && (box.width < 2 || box.height < 2)) return true;
      if (node === stopAt) break;
    }
    return false;
  };

  const textBeside = (node) => {
    const siblings = [
      ...[...node.parentElement?.children ?? []].filter((sibling) => sibling !== node),
    ];
    const after = siblings.filter((sibling) => node.compareDocumentPosition(sibling) & Node.DOCUMENT_POSITION_FOLLOWING);
    const before = siblings.filter((sibling) => !after.includes(sibling)).reverse();
    return [...after, ...before].find((sibling) => sibling.textContent.trim().length > 0) ?? null;
  };

  const marks = [];
  for (const node of document.querySelectorAll('.slotted-demo-stage *, .stage *')) {
    const style = getComputedStyle(node);
    if ((style.maskImage ?? 'none') === 'none' && (style.webkitMaskImage ?? 'none') === 'none') continue;
    const box = node.getBoundingClientRect();
    if (box.height === 0 || box.width === 0) continue;

    const sibling = textBeside(node);
    if (!sibling) continue;
    const found = firstLineOf(sibling);
    if (!found) continue;
    const line = found.rect;

    /* A mark twice the height of the line it sits beside is a picture rather
       than a glyph, and a picture is aligned to a block, not to an axis. */
    if (box.height > line.height * 2) continue;

    marks.push({
      scene: label(node),
      element: describe(node),
      markCenter: +((box.top + box.bottom) / 2).toFixed(2),
      textCenter: +((line.top + line.bottom) / 2).toFixed(2),
      markTop: +box.top.toFixed(2),
      markBottom: +box.bottom.toFixed(2),
      lineTop: +line.top.toFixed(2),
      lineBottom: +line.bottom.toFixed(2),
      hidden: found.hidden,
    });
  }

  return {
    stages: stages.length,
    documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    candidates,
    overflow,
    marks,
  };
})()`;

/**
 * How long a page is given to mount every stage. Thirty seconds held for every
 * family until `app-shell`: eighteen scenes of a whole application each, and
 * the Angular page bootstraps them one at a time — it reached the deadline at
 * thirty-three of forty-two, and the audit reported a clean page it had read
 * three quarters of. A page that needs longer says so with `--deadline`.
 */
export const DEADLINE = 30000;

export async function audit({ url, width = 1280, density = 'comfortable', deadline = DEADLINE }) {
  const { devtools, close } = await launch();

  try {
    await devtools.send('Page.enable');
    await devtools.send('Runtime.enable');
    await devtools.send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const loaded = devtools.once('Page.loadEventFired');
    await devtools.send('Page.navigate', { url });
    await loaded;

    if (density !== 'comfortable') {
      await devtools.send('Runtime.evaluate', {
        expression: `document.documentElement.dataset.slottedDensity = ${JSON.stringify(density)}`,
      });
    }

    /**
     * A Storybook docs page mounts after the load event, so measuring at load
     * measures an empty document — which reports no defect and no stages, and
     * reads exactly like a clean page.
     *
     * It also mounts its blocks *one at a time*, and only as they come into
     * view. Waiting for the first stage and then measuring caught two stages of
     * a page holding twenty-four; waiting for the count to stop growing while
     * standing at the top of the document caught eleven of a picker page
     * holding thirty-nine, because a page whose every scene draws an open panel
     * pauses longer than one poll between two blocks. Both read exactly like a
     * clean page.
     *
     * So the wait is for the count to stop growing **and** for the document to
     * have been walked to its end — `hasSettled` is the rule over the counts,
     * and it is a pure function so a case can be put to it; where the reader
     * has scrolled to is a property of the page rather than of the counts, so
     * it is asked here and nowhere else. The walk is a viewport at a time
     * rather than a jump to the bottom: a block that was never in view on the
     * way down is a block that never mounted.
     */
    const { result: waited } = await devtools.send('Runtime.evaluate', {
      expression: `new Promise((done) => {
        const deadline = Date.now() + ${deadline};
        const counts = [];
        const atBottom = () =>
          window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
        const settle = () => {
          window.scrollTo(0, 0);
          requestAnimationFrame(() => requestAnimationFrame(() => done(true)));
        };
        const poll = () => {
          counts.push(document.querySelectorAll('.slotted-demo-stage, .stage').length);
          const last = counts[counts.length - 1];
          const stable = counts.length >= 2 && last > 0 && last === counts[counts.length - 2];
          if (stable && atBottom()) return settle();
          if (Date.now() > deadline) return done(last > 0);
          if (stable) window.scrollBy(0, window.innerHeight * 0.9);
          setTimeout(poll, ${SETTLE_INTERVAL});
        };
        poll();
      })`,
      awaitPromise: true,
      returnByValue: true,
    });

    if (waited.value !== true) {
      throw new Error(`${url} rendered no demonstration stage within ${deadline} ms`);
    }

    const { result } = await devtools.send('Runtime.evaluate', {
      expression: MEASURE,
      returnByValue: true,
    });

    devtools.close();
    const measured = result.value;
    return {
      stages: measured.stages,
      documentOverflow: measured.documentOverflow,
      collapsed: collapsedElements(measured.candidates ?? []),
      overflowing: overflowingElements(measured.overflow ?? []),
      offAxis: offAxisMarks(measured.marks ?? []),
    };
  } finally {
    await close();
  }
}

function report(findings, { url, width }) {
  const lines = [`${url} at ${width}px — ${findings.stages} stages`];

  for (const { scene, element, width: measured, stage } of findings.collapsed) {
    lines.push(`  collapsed  ${measured}px inside a ${stage}px stage  ${element}  ${scene}`);
  }
  for (const { scene, element, width: measured, stage } of findings.overflowing) {
    lines.push(`  overflows  ${measured}px out of ${stage}px  ${element}  ${scene}`);
  }
  for (const { scene, element, offset } of findings.offAxis ?? []) {
    const direction = offset < 0 ? 'above' : 'below';
    lines.push(
      `  off-axis   ${Math.abs(offset)}px ${direction} the line it annotates  ${element}  ${scene}`,
    );
  }
  if (findings.documentOverflow > OVERFLOW_TOLERANCE) {
    lines.push(`  the page itself scrolls sideways by ${findings.documentOverflow}px`);
  }

  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [url, ...rest] = process.argv.slice(2);
  if (!url) {
    throw new Error(
      'usage: node tools/harness/audit.mjs <url> [--width 1280] [--density comfortable|compact|dense] [--deadline 30000]',
    );
  }

  const options = { url, width: 1280, density: 'comfortable', deadline: DEADLINE };
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index]?.replace(/^--/, '');
    const value = rest[index + 1];
    if (flag === 'width') options.width = Number(value);
    else if (flag === 'density') options.density = String(value);
    else if (flag === 'deadline') options.deadline = Number(value);
    else throw new Error(`unknown option ${rest[index]}`);
  }

  const findings = await audit(options);
  console.log(report(findings, options));

  if (
    findings.collapsed.length > 0 ||
    findings.overflowing.length > 0 ||
    findings.offAxis.length > 0 ||
    findings.documentOverflow > OVERFLOW_TOLERANCE
  ) {
    process.exitCode = 1;
  }
}
