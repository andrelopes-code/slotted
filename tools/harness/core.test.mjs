import assert from 'node:assert/strict';
import test from 'node:test';

import { renderCoreHarness, splitFragment } from './core.mjs';

const fragment = `
<style>.x { color: red }</style>
<section data-scene="one"><b class="x" data-key="a">one</b></section>
<script type="module">
  import { thing } from '@slotted/core/demo';
  thing(document);
</script>
`;

test('takes the stylesheet and the script out of the scenes', () => {
  const { scenes, css, script } = splitFragment(fragment);
  assert.equal(css.trim(), '.x { color: red }');
  assert.match(script, /import \{ thing \} from '@slotted\/core\/demo'/);
  assert.doesNotMatch(scenes, /<style|<script/);
  assert.match(scenes, /data-scene="one"/);
});

test('maps the module specifier to the bundle inside the page, before the script', () => {
  const html = renderCoreHarness({
    module: 'demo',
    fragment,
    composedCss: '',
    themeCss: '[data-slotted-theme="default"] { --t: 1px }',
    bundle: 'export const thing = () => {};',
    theme: 'default',
  });
  const map = html.indexOf('<script type="importmap">');
  const script = html.indexOf("import { thing } from '@slotted/core/demo'");
  assert.ok(map > 0 && script > map, 'the import map has to precede the module script');
  const encoded = Buffer.from('export const thing = () => {};', 'utf8').toString('base64');
  assert.ok(html.includes(`"@slotted/core/demo":"data:text/javascript;base64,${encoded}"`));
  assert.ok(html.includes('.x { color: red }'), 'the page stylesheet is missing');
  assert.ok(html.includes('id="one-light-420"'), 'the scenes were not rendered');
  assert.ok(
    !html.includes('<style>.x { color: red }</style>\n<section'),
    'the style tag leaked into a cell',
  );
});
