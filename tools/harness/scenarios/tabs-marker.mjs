import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { captureUrl, launch } from '../shoot.mjs';

/**
 * The tabs marker, read in Chrome: one bar per list, the thickness and the
 * rounding its tokens set, spanning the selected tab's content box — the icon
 * and the label, never the padding or the closing control — and standing
 * `--slotted-tabs-marker-offset` (1px) above the list's edge, over the track. A second selection moves the same bar,
 * which stands with no transform once the slide has ended.
 *
 * The request came from an application that found the marker thin and
 * unfinished: two pixels tied to the thick border width, the item's full width
 * including the closing control, top corners rounded on a bar too thin to
 * show them, and a pixel below the track.
 *
 * Scene `marker` of `tabs.harness.html`: line tabs, horizontal and vertical,
 * with and without a closing control, each with `--slotted-tabs-marker-size:
 * 4px` and `--slotted-tabs-marker-radius: 2px`. The page's module script draws
 * each marker with `createIndicator`, as the bindings do.
 *
 * Run: node tools/harness/scenarios/tabs-marker.mjs
 * Exits non-zero when an assertion fails.
 */

const build = fileURLToPath(new URL('../build.mjs', import.meta.url));
execFileSync(process.execPath, [build, 'tabs'], { stdio: 'ignore' });

const url = captureUrl({
  family: 'tabs',
  scheme: 'light',
  width: '720',
  density: 'comfortable',
  dir: 'ltr',
  scene: 'marker',
});

const READ = `(async () => {
  const frames = (count) =>
    new Promise((resolve) => {
      const step = (left) => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
      step(count);
    });
  await frames(3);
  const stage = document.querySelector('.cell.shown .stage[data-scene="marker"]');
  const read = (root) => {
    const vertical = root.getAttribute('data-orientation') === 'vertical';
    const list = root.querySelector(':scope > [data-part="list"]');
    const markers = list.querySelectorAll(':scope > [data-part="marker"]');
    const marker = markers[0];
    const tab = list.querySelector('[data-part="item"][data-selected] > [data-part="tab"]');
    const style = getComputedStyle(marker);
    const tabStyle = getComputedStyle(tab);
    const box = tab.getBoundingClientRect();
    const mark = marker.getBoundingClientRect();
    const edge = list.getBoundingClientRect();
    const content = vertical
      ? {
          start: box.top + parseFloat(tabStyle.paddingTop),
          end: box.bottom - parseFloat(tabStyle.paddingBottom),
        }
      : {
          start: box.left + parseFloat(tabStyle.paddingLeft),
          end: box.right - parseFloat(tabStyle.paddingRight),
        };
    return {
      probe: root.getAttribute('data-probe'),
      markers: markers.length,
      thickness: vertical ? style.width : style.height,
      radius: style.borderTopLeftRadius,
      size: getComputedStyle(root).getPropertyValue('--slotted-tabs-marker-size').trim(),
      rounding: getComputedStyle(root).getPropertyValue('--slotted-tabs-marker-radius').trim(),
      content,
      mark: vertical ? { start: mark.top, end: mark.bottom } : { start: mark.left, end: mark.right },
      edge: vertical ? { mark: mark.right, list: edge.right } : { mark: mark.bottom, list: edge.bottom },
      offset: parseFloat(getComputedStyle(root).getPropertyValue('--slotted-tabs-marker-offset')) || 1,
      transform: style.transform,
      translate: style.translate,
    };
  };
  const roots = [...stage.querySelectorAll('[data-ui="tabs"]')];
  const before = roots.map(read);

  /* A second selection, written as a binding writes it. */
  for (const root of roots) {
    const items = root.querySelectorAll('[data-part="item"]');
    items[0].removeAttribute('data-selected');
    items[0].querySelector('[data-part="tab"]').setAttribute('aria-selected', 'false');
    items[2].setAttribute('data-selected', '');
    items[2].querySelector('[data-part="tab"]').setAttribute('aria-selected', 'true');
  }
  await frames(30);
  const after = roots.map(read);
  return { before, after };
})()`;

const { devtools, close } = await launch();
let reading;

try {
  await devtools.send('Page.enable');
  await devtools.send('Runtime.enable');
  await devtools.send('Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 1600,
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
} finally {
  devtools.close();
  await close();
}

const near = (a, b) => Math.abs(a - b) < 0.75;

assert.equal(reading.before.length, 4, 'four lists in the scene');
for (const [index, first] of reading.before.entries()) {
  const second = reading.after[index];
  for (const state of [first, second]) {
    console.log(
      `${state.probe}: ${state.markers} marker  ${state.thickness} / ${state.radius}  content ${state.content.start.toFixed(1)}–${state.content.end.toFixed(1)}  mark ${state.mark.start.toFixed(1)}–${state.mark.end.toFixed(1)}  edge ${state.edge.mark.toFixed(1)}/${state.edge.list.toFixed(1)}  translate ${state.translate}  transform ${state.transform}`,
    );
    assert.equal(state.markers, 1, `${state.probe}: one marker in the list`);
    assert.equal(state.thickness, state.size, `${state.probe}: the marker is the token thick`);
    assert.equal(state.radius, state.rounding, `${state.probe}: the marker takes the token radius`);
    assert.ok(
      near(state.mark.start, state.content.start) && near(state.mark.end, state.content.end),
      `${state.probe}: the marker spans the tab's content box`,
    );
    assert.ok(
      near(state.edge.list - state.edge.mark, state.offset),
      `${state.probe}: the marker stands its offset above the list's edge`,
    );
    assert.equal(state.transform, 'none', `${state.probe}: no scale`);
  }
  assert.notEqual(
    first.mark.start,
    second.mark.start,
    `${first.probe}: the selection moves the marker`,
  );
}
console.log(
  'ok — one marker on the content box, its offset above the list edge, at rest with no transform',
);
