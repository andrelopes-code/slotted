import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

import config from '../astro.config.mjs';

/**
 * DOM parity: each example id present in both frameworks is rendered with both
 * runtimes' `render(id)`, through the Vite configuration the site builds with.
 * The compared tree is the elements carrying `data-ui`, nested as they nest in
 * the markup, each with its `data-ui`, `data-part`, `role` and `aria-*`.
 * Generated ids differ by framework, so every id a value references is
 * replaced by its order of appearance in the markup.
 */
const root = fileURLToPath(new URL('..', import.meta.url));

let server;

before(async () => {
  server = await createServer({
    ...config.vite,
    configFile: false,
    root,
    /* Its own mode, so its own cache (`slotted-docs:cache-per-mode`): a
       second optimizer writing to the cache of a running `astro dev`
       invalidates every dependency that server has served. Server rendering
       needs no browser dependency pass at all. */
    mode: 'parity',
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: 'custom',
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  });
});

after(() => server?.close());

const COMPARED = /^(data-ui|data-part|role|aria-.+)$/;

/**
 * The parts too, not only the roots: a part is the anatomy the contract
 * declares, and a binding that drops one (a table without its scroll part, a
 * group without its content part) renders a different component under the
 * same root. `PARITY_PARTS=0` restores the roots-only tree.
 */
const PARTS = process.env.PARITY_PARTS !== '0';

/** `PARITY_ONLY=table/` compares only the ids that start with it: one family while it is written. */
const ONLY = process.env.PARITY_ONLY ?? '';

/**
 * The one server-render difference the comparison admits. A toast region with
 * `attach="portal"` belongs at the end of the document (toast contract,
 * `attach.portal`), which neither runtime can reach on the server: React's
 * `ToastRegion` draws it through `createPortal` once the client has a
 * container, so its server markup holds none, and `SlToastRegion` draws it in
 * its host until the browser moves it. The region is left out of both trees;
 * every other element, the region's own siblings included, is compared.
 */
const SERVER_ONLY_DIFFERENCE = '[data-ui="toast"][data-attach="portal"]';

/** The `data-ui` tree of a fragment of markup, one line per element. */
export function dataUiTree(html) {
  const { document } = new JSDOM(`<body>${html}</body>`).window;
  const ids = new Map();
  for (const element of document.querySelectorAll('[id]')) {
    if (!ids.has(element.id)) ids.set(element.id, `#${ids.size + 1}`);
  }
  const lines = [];
  const walk = (element, depth) => {
    if (element.matches(SERVER_ONLY_DIFFERENCE)) return;
    let childDepth = depth;
    if (element.hasAttribute('data-ui') || (PARTS && element.hasAttribute('data-part'))) {
      const attributes = [...element.attributes]
        .filter((attribute) => COMPARED.test(attribute.name))
        .map((attribute) => {
          const value = attribute.value
            .split(/\s+/)
            .map((token) => ids.get(token) ?? token)
            .join(' ');
          return `${attribute.name}="${value}"`;
        })
        .sort();
      lines.push(`${'  '.repeat(depth)}${attributes.join(' ')}`);
      childDepth = depth + 1;
    }
    for (const child of element.children) walk(child, childDepth);
  };
  walk(document.body, 0);
  return lines.join('\n');
}

test('React and Angular render the same data-ui tree for every shared example', async (t) => {
  const { renderReact } = await server.ssrLoadModule('/src/runtime/react.server.ts');
  const { renderAngular } = await server.ssrLoadModule('/src/runtime/angular.server.ts');
  const { reactExampleIds, loadReactExample } = await server.ssrLoadModule('/src/runtime/react.ts');
  const { angularExampleIds, loadAngularExample } =
    await server.ssrLoadModule('/src/runtime/angular.ts');
  const react = { render: async (id) => renderReact(await loadReactExample(id), id) };
  const angular = { render: async (id) => renderAngular(await loadAngularExample(id), id) };

  const angularIds = new Set(angularExampleIds());
  const shared = reactExampleIds().filter((id) => angularIds.has(id) && id.startsWith(ONLY));
  assert.ok(shared.length > 0, 'no example id is present in both frameworks');

  for (const id of shared) {
    await t.test(id, async () => {
      const reactTree = dataUiTree(await react.render(id));
      const angularTree = dataUiTree(await angular.render(id));
      assert.ok(reactTree.length > 0, `${id}: React renders no data-ui element`);
      assert.equal(angularTree, reactTree, `${id}: Angular (actual) differs from React (expected)`);
    });
  }
});
