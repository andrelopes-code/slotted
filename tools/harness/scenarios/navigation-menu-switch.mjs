import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { captureUrl, launch } from '../shoot.mjs';

/**
 * A navigation menu switching from one open section to the next, read frame
 * by frame: every panel on screen stands where the surface stands in every
 * frame of the move, and the surface is seen to move.
 *
 * The defect this holds was reported at the visual gate. The surface
 * transitioned its size and its place over 200 milliseconds while each panel
 * read the same measured numbers without a transition, so the arriving and
 * the leaving panels jumped to the end of the move and were drawn outside the
 * surface until it caught up — in a row and, more visibly, in a column. The
 * numbers are now registered lengths transitioned on the root, so the surface
 * and the panels read one interpolation.
 *
 * It also holds the second level's divider: it runs the second-level root's
 * whole height, not the height of its open section.
 *
 * Scenes `default`, `vertical` and `nested` of `navigation-menu.harness.html`.
 * Run: node tools/harness/scenarios/navigation-menu-switch.mjs
 * Exits non-zero when an assertion fails.
 */

const build = fileURLToPath(new URL('../build.mjs', import.meta.url));
execFileSync(process.execPath, [build, 'navigation-menu'], { stdio: 'ignore' });

const FRAMES = 24;

/**
 * Presses `to` in the scene's outer root and reads, every frame, the offset
 * of the surface and of every panel still drawn, in layout coordinates —
 * `offsetLeft` and `offsetTop` leave out the slide each panel makes, which is
 * the crossing and not a misplacement.
 */
const SWITCH = `async (scene, to) => {
  const stage = document.querySelector('.cell.shown .stage[data-scene="' + scene + '"]');
  const root = stage.querySelector('[data-ui="navigation-menu"]:not([data-nested])');
  const viewport = root.querySelector(':scope > [data-part="viewport"]');
  const panels = () => [...root.querySelectorAll(':scope > [data-part="list"] > [data-part="item"] > [data-part="content"]')]
    .filter((panel) => !panel.hidden);
  root.querySelector('[data-value="' + to + '"] > [data-part="trigger"]').click();
  const frames = [];
  for (let frame = 0; frame < ${FRAMES}; frame += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    frames.push({
      surface: { x: viewport.offsetLeft, y: viewport.offsetTop, w: viewport.offsetWidth, h: viewport.offsetHeight },
      panels: panels().map((panel) => ({ id: panel.id, x: panel.offsetLeft, y: panel.offsetTop })),
    });
  }
  return frames;
}`;

const DIVIDER = `(() => {
  const stage = document.querySelector('.cell.shown .stage[data-scene="nested"]');
  const nested = stage.querySelector('[data-ui="navigation-menu"][data-nested]');
  const open = nested.querySelector('[data-part="content"][data-open]').getBoundingClientRect();
  const box = nested.getBoundingClientRect();
  return {
    inside: open.left >= box.left - 1 && open.right <= box.right + 1,
    root: box.height,
    rule: parseFloat(getComputedStyle(nested, '::before').height),
    list: nested.querySelector(':scope > [data-part="list"]').getBoundingClientRect().height,
  };
})()`;

async function open(devtools, scene, width) {
  const url = captureUrl({
    family: 'navigation-menu',
    scheme: 'light',
    width: String(width),
    density: 'comfortable',
    dir: 'ltr',
    scene,
  });
  const loaded = devtools.once('Page.loadEventFired');
  await devtools.send('Page.navigate', { url: url.href });
  await loaded;
  await devtools.send('Runtime.evaluate', {
    expression: 'new Promise((resolve) => setTimeout(resolve, 600))',
    awaitPromise: true,
  });
}

async function evaluate(devtools, expression) {
  const { result, exceptionDetails } = await devtools.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(exceptionDetails.exception?.description ?? 'the scene did not run');
  }
  return result.value;
}

function holds(frames, label) {
  let moved = false;
  for (const [index, { surface, panels }] of frames.entries()) {
    const before = frames[index - 1]?.surface;
    if (before && ['x', 'y', 'w', 'h'].some((key) => before[key] !== surface[key])) moved = true;
    for (const panel of panels) {
      assert.ok(
        Math.abs(panel.x - surface.x) <= 1 && Math.abs(panel.y - surface.y) <= 1,
        `${label}, frame ${index}: ${panel.id} at ${panel.x},${panel.y}, surface at ${surface.x},${surface.y}`,
      );
    }
  }
  assert.ok(moved, `${label}: the surface never moved between sections`);
  console.log(`ok — ${label}: ${frames.length} frames, every panel on the surface`);
}

const { devtools, close } = await launch();
try {
  await devtools.send('Page.enable');
  await devtools.send('Runtime.enable');
  await devtools.send('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await open(devtools, 'default', 1024);
  holds(await evaluate(devtools, `(${SWITCH})('default', 'company')`), 'row, Products → Company');
  holds(await evaluate(devtools, `(${SWITCH})('default', 'products')`), 'row, Company → Products');

  await open(devtools, 'vertical', 720);
  holds(await evaluate(devtools, `(${SWITCH})('vertical', 'conta')`), 'column, Help → Account');

  await open(devtools, 'nested', 1024);
  const divider = await evaluate(devtools, DIVIDER);
  assert.ok(
    Math.abs(divider.rule - divider.root) <= 1 && divider.root >= divider.list,
    `the second level's divider is ${divider.rule}px in a ${divider.root}px root (list ${divider.list}px)`,
  );
  assert.ok(divider.inside, 'the second level stands its open section inside its own root');
  console.log(`ok — the second level's divider runs ${divider.rule}px, the root's height`);
} finally {
  devtools.close();
  await close();
}
