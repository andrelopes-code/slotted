import assert from 'node:assert/strict';
import test from 'node:test';

import { renderHarness } from './build.mjs';
import { attachScript, bundleScript, splitFragment } from './script.mjs';
import { READY_EXPRESSION } from './shoot.mjs';

const root = new URL('../../', import.meta.url);

test('takes a family fragment’s page stylesheet and script out of its scenes', () => {
  const { scenes, css, script } = splitFragment(
    '<style>.x{}</style><section data-scene="a"><figure data-ui="chart"></figure></section><script type="module">run()</script>',
  );
  assert.equal(css, '.x{}');
  assert.equal(script, 'run()');
  assert.doesNotMatch(scenes, /<style|<script/);
});

test('emits the page stylesheet after the family’s, so the family is judged first', () => {
  const html = renderHarness({
    family: 'chart',
    fragment: '<section data-scene="a"><figure data-ui="chart"></figure></section>',
    familyCss: '.family{}',
    pageCss: '.page{}',
    themeCss: '',
  });
  assert.ok(html.indexOf('.family{}') < html.indexOf('.page{}'));
});

/**
 * A bundle is text inside a `<script>` element, and the parser ends that
 * element at the first `</script` it meets, wherever it is. ECharts carries
 * the sequence in a string, and a page that closed its own script half-way
 * would run nothing and say nothing.
 */
test('keeps a closing script tag inside the bundle from closing the element', () => {
  const html = attachScript('<html><body></body></html>', 'const s = "</script>";');
  assert.match(html, /<script type="module">const s = "<\\\/script>";<\/script>\n<\/html>/);
});

/**
 * A family whose picture needs script — `chart` draws nothing until its
 * engine runs — ships the script inside the page, because a reviewer opens the
 * page from disk and a `file:` page cannot import a sibling file. Every
 * `@slotted/core/<module>` it imports is read from source, and every dynamic
 * import is folded into the one module.
 */
test('bundles a fragment script into one module read from source', async () => {
  const code = await bundleScript(
    `import { createChartModel } from '@slotted/core/chart';
     const later = await import('@slotted/core/state');
     globalThis.result = [typeof createChartModel, typeof later.createControllable];`,
    root,
  );
  assert.doesNotMatch(code, /from\s+['"]@slotted\//);
  assert.doesNotMatch(code, /import\(\s*['"]/);
  assert.match(code, /function createChartModel/);
});

test('photographs a scripted page once it says it is drawn, and a plain page at load', async () => {
  const evaluate = (window) => new Function('window', `return ${READY_EXPRESSION}`)(window);
  let drawn = false;
  await evaluate({
    slottedHarnessReady: new Promise((resolve) =>
      setTimeout(() => {
        drawn = true;
        resolve();
      }, 5),
    ),
  });
  assert.ok(drawn, 'the capture ran before the page drew');
  assert.equal(await evaluate({}), true);
});

/**
 * `chart` is a `figure` whose header is its `figcaption`, and the page styled
 * every `figcaption` as a cell caption: the chart's title rendered in the
 * page's small monospace at half opacity. The cell caption is the cell's own
 * child and the rule says so.
 */
test('keeps the cell caption style off a figcaption the family renders', () => {
  const html = renderHarness({
    family: 'chart',
    fragment:
      '<section data-scene="a"><figure data-ui="chart"><figcaption></figcaption></figure></section>',
    familyCss: '',
    themeCss: '',
  });
  assert.match(html, /\.cell > figcaption \{/);
  assert.doesNotMatch(html, /^\s*figcaption \{/m);
});
