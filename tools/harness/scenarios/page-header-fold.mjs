import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { captureUrl, launch } from '../shoot.mjs';

/**
 * A page header whose actions fold into the toolbar's menu, narrowed and then
 * widened again: the actions that folded come back.
 *
 * The defect this holds was found in the Nexora demo. At 1400 pixels a
 * supplier's header showed both actions, at 600 it showed none, and back at
 * 1400 it still showed none, while a fresh load at 1400 showed both. The slot
 * took its width from its own content, which after the fold was the trigger
 * alone, and it did not grow when the row did: the toolbar never changed size,
 * so its observer never fired and nothing asked the collapse to measure again.
 *
 * The scene is `fold` in `page-header.harness.html`, where a module script
 * runs `createCollapse` on the bar with the options the bindings pass. The
 * stage is resized rather than the window, because the stage is the width the
 * header is laid out in; the window is wider than the widest step.
 *
 * Run: node tools/harness/scenarios/page-header-fold.mjs
 * Exits non-zero when an assertion fails.
 */

const STEPS = [1400, 600, 1400];

/** Frames the visible count must hold before it is read. */
const STABLE_FRAMES = 3;

/** Frames after which a count that is still moving is read anyway. */
const FRAME_LIMIT = 120;

const build = fileURLToPath(new URL('../build.mjs', import.meta.url));
execFileSync(process.execPath, [build, 'page-header'], { stdio: 'ignore' });

const url = captureUrl({
  family: 'page-header',
  scheme: 'light',
  width: '1400',
  density: 'comfortable',
  dir: 'ltr',
  scene: 'fold',
});

/**
 * Sets the stage's width, waits until the collapse has settled, and reads the
 * bar. The collapse runs from resize observers, so the count is read once it
 * has stayed the same for a few frames rather than after a fixed delay.
 */
const RESIZE = `async (width) => {
  const stage = document.querySelector('.cell.shown .stage[data-scene="fold"]');
  const bar = stage.querySelector('[data-ui="toolbar"][data-overflow="menu"]');
  const units = [...bar.querySelectorAll(':scope > [data-part="item"]')];
  const visible = () => units.filter((unit) => !unit.hasAttribute('hidden')).length;
  stage.style.inlineSize = width + 'px';
  let last = -1;
  let held = 0;
  for (let frame = 0; frame < ${FRAME_LIMIT} && held < ${STABLE_FRAMES}; frame += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const count = visible();
    held = count === last ? held + 1 : 0;
    last = count;
  }
  return {
    width,
    visible: visible(),
    total: units.length,
    toolbar: Math.round(bar.getBoundingClientRect().width),
  };
}`;

const { devtools, close } = await launch();
const readings = [];

try {
  await devtools.send('Page.enable');
  await devtools.send('Runtime.enable');
  await devtools.send('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const loaded = devtools.once('Page.loadEventFired');
  await devtools.send('Page.navigate', { url: url.href });
  await loaded;

  for (const width of STEPS) {
    const { result, exceptionDetails } = await devtools.send('Runtime.evaluate', {
      expression: `(${RESIZE})(${width})`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) {
      throw new Error(exceptionDetails.exception?.description ?? 'the scene did not run');
    }
    readings.push(result.value);
    const { visible, total, toolbar } = result.value;
    console.log(`${width}px  ${visible}/${total} actions visible  toolbar ${toolbar}px`);
  }
} finally {
  devtools.close();
  await close();
}

const [wide, narrow, widened] = readings;
assert.equal(wide.visible, wide.total, `at ${wide.width}px every action fits`);
assert.ok(narrow.visible < wide.visible, `at ${narrow.width}px at least one action folds`);
assert.equal(widened.visible, wide.visible, `back at ${widened.width}px the folded actions return`);
console.log('ok — the folded actions return when the row widens');
