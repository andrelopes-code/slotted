import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { captureUrl, launch } from '../shoot.mjs';

/**
 * A stuck page header with a translucent ground: the ground is composited
 * once, and the backdrop filter the theme names is applied while stuck.
 *
 * The request came from an application that set the ground to a color with
 * alpha and saw it denser than it set: the root and the title area both
 * painted it, so 0.5 composited to 0.75, and no backdrop filter existed.
 *
 * Scene `glass` of `page-header.harness.html`: a header with no header area
 * inside its own scroller, `--slotted-page-header-background` at alpha 0.5 and
 * `--slotted-page-header-backdrop-filter: blur(8px)`. The scroller is scrolled
 * until the engine writes `data-stuck`; the alpha is read off every box that
 * paints between the content and the title, which is the root and the boxes
 * inside it up to the title area.
 *
 * Run: node tools/harness/scenarios/page-header-glass.mjs
 * Exits non-zero when an assertion fails.
 */

const build = fileURLToPath(new URL('../build.mjs', import.meta.url));
execFileSync(process.execPath, [build, 'page-header'], { stdio: 'ignore' });

const url = captureUrl({
  family: 'page-header',
  scheme: 'light',
  width: '1400',
  density: 'comfortable',
  dir: 'ltr',
  scene: 'glass',
});

const READ = `(async () => {
  const stage = document.querySelector('.cell.shown .stage[data-scene="glass"]');
  const scroller = stage.querySelector('[data-glass-scroller]');
  const root = stage.querySelector('[data-ui="page-header"]');
  const title = root.querySelector('[data-part="title-area"]');
  scroller.scrollTop = 400;
  for (let frame = 0; frame < 60 && !root.hasAttribute('data-stuck'); frame += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  const alpha = (element) => {
    const probe = document.createElement('canvas').getContext('2d');
    probe.fillStyle = getComputedStyle(element).backgroundColor;
    const value = probe.fillStyle;
    const match = /rgba?\\(([^)]+)\\)/.exec(value);
    if (match === null) return 1;
    const channels = match[1].split(',').map(Number);
    return channels.length === 4 ? channels[3] : 1;
  };
  const layers = [];
  for (let element = title; element !== null; element = element.parentElement) {
    layers.push(alpha(element));
    if (element === root) break;
  }
  const style = getComputedStyle(root);
  return {
    stuck: root.hasAttribute('data-stuck'),
    layers,
    effective: 1 - layers.reduce((clear, a) => clear * (1 - a), 1),
    backdrop: style.backdropFilter,
  };
})()`;

const { devtools, close } = await launch();
let reading;

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

  const { result, exceptionDetails } = await devtools.send('Runtime.evaluate', {
    expression: READ,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(exceptionDetails.exception?.description ?? 'the scene did not run');
  }
  reading = result.value;
  console.log(
    `stuck ${reading.stuck}  layers ${reading.layers.join(' ')}  effective ${reading.effective.toFixed(3)}  backdrop ${reading.backdrop}`,
  );
} finally {
  devtools.close();
  await close();
}

assert.equal(reading.stuck, true, 'the scroll sticks the header');
assert.ok(
  Math.abs(reading.effective - 0.5) < 0.01,
  `the ground is composited once: ${reading.effective}`,
);
assert.equal(reading.backdrop, 'blur(8px)', 'the backdrop filter applies while stuck');
console.log('ok — one ground at the alpha the theme set, and the backdrop filter while stuck');
