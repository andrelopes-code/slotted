import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { captureUrl, launch } from '../shoot.mjs';

/**
 * The outer inset of a table, read as computed padding: `edges="flush"` takes
 * the first and the last column's outer inset to nought on `plain` and `ruled`,
 * and `framed` keeps the cell's inset whatever `edges` says.
 *
 * The request came from an application that stripped the inset with a theme
 * rule on `[data-part=cell]:first-child`, which also stripped it from framed
 * tables — the case the axis refuses by construction.
 *
 * Scene `edges` of `table.harness.html`.
 * Run: node tools/harness/scenarios/table-edges.mjs
 * Exits non-zero when an assertion fails.
 */

const build = fileURLToPath(new URL('../build.mjs', import.meta.url));
execFileSync(process.execPath, [build, 'table'], { stdio: 'ignore' });

const READ = `(() => {
  const stage = document.querySelector('.cell.shown .stage[data-scene="edges"]');
  const read = (probe) => {
    const root = stage.querySelector('[data-probe="' + probe + '"]');
    const style = (selector, side) => parseFloat(getComputedStyle(root.querySelector(selector))['padding-inline-' + side]);
    return {
      header: style('[data-part="column-header"]', 'start'),
      rowHeader: style('[data-part="row-header"]', 'start'),
      last: style('[data-part="body"] [data-part="cell"]', 'end'),
      inner: style('[data-part="body"] [data-part="cell"]', 'start'),
      caption: style('[data-part="caption"]', 'start'),
    };
  };
  return {
    plain: read('plain-flush'),
    ruled: read('ruled-flush'),
    framed: read('framed-flush'),
    inset: read('ruled-inset'),
  };
})()`;

const { devtools, close } = await launch();
try {
  await devtools.send('Page.enable');
  await devtools.send('Runtime.enable');
  const url = captureUrl({
    family: 'table',
    scheme: 'light',
    width: '720',
    density: 'comfortable',
    dir: 'ltr',
    scene: 'edges',
  });
  const loaded = devtools.once('Page.loadEventFired');
  await devtools.send('Page.navigate', { url: url.href });
  await loaded;
  const { result, exceptionDetails } = await devtools.send('Runtime.evaluate', {
    expression: READ,
    returnByValue: true,
  });
  if (exceptionDetails)
    throw new Error(exceptionDetails.exception?.description ?? 'the scene did not run');
  const { plain, ruled, framed, inset } = result.value;
  const cellInset = inset.inner;

  assert.ok(cellInset > 0, `the cell inset is ${cellInset}px`);
  for (const [name, edges] of [
    ['plain', plain],
    ['ruled', ruled],
  ]) {
    assert.equal(
      edges.header,
      0,
      `${name} flush: the first column header starts at ${edges.header}px`,
    );
    assert.equal(
      edges.rowHeader,
      0,
      `${name} flush: the row header starts at ${edges.rowHeader}px`,
    );
    assert.equal(edges.last, 0, `${name} flush: the last cell ends at ${edges.last}px`);
    assert.equal(edges.caption, 0, `${name} flush: the caption starts at ${edges.caption}px`);
    assert.equal(edges.inner, cellInset, `${name} flush: an inner side keeps ${cellInset}px`);
  }
  assert.equal(framed.rowHeader, cellInset, `framed flush: the row header keeps ${cellInset}px`);
  assert.equal(framed.last, cellInset, `framed flush: the last cell keeps ${cellInset}px`);
  assert.equal(inset.rowHeader, cellInset, `inset: the row header keeps ${cellInset}px`);
  console.log(`ok — edges: flush is 0px on plain and ruled, framed and inset keep ${cellInset}px`);
} finally {
  await close();
}
