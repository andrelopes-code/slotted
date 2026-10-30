import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

import config from '../astro.config.mjs';

/**
 * Reads the built site: run after `astro build`. Every family page, in every
 * framework, carries the generated sections, lists them under "On this page",
 * documents every API row of its binding's `docs.ts`, places Installation
 * after its lead example, and draws every example as one frame with a Preview
 * and a Code tab.
 */
const root = fileURLToPath(new URL('..', import.meta.url));
const dist = new URL('../dist/', import.meta.url).pathname;
const content = new URL('../src/content/components/', import.meta.url).pathname;
const packages = new URL('../../../packages/', import.meta.url).pathname;
const FRAMEWORKS = ['react', 'angular'];
const SECTIONS = ['installation', 'accessibility', 'api', 'theming'];

const families = readdirSync(content)
  .filter((file) => file.endsWith('.mdx'))
  .map((file) => file.slice(0, -'.mdx'.length))
  .sort();

const docsSource = (framework, family) =>
  framework === 'react'
    ? `${packages}react/src/${family}/${family}.docs.ts`
    : `${packages}angular/${family}/src/${family}.docs.ts`;

let server;

before(async () => {
  /* The `docs.ts` modules are TypeScript with package imports: loaded through
     the site's own Vite configuration, in a mode of their own as
     `example-parity.test.mjs` explains. */
  server = await createServer({
    ...config.vite,
    configFile: false,
    root,
    mode: 'sections',
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: 'custom',
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  });
});

after(() => server?.close());

function page(framework, family) {
  const html = readFileSync(`${dist}${framework}/components/${family}/index.html`, 'utf8');
  return new JSDOM(html).window.document;
}

/** The elements after `h2#id` up to the next `h2`. */
function section(document, id) {
  const heading = document.getElementById(id);
  assert.ok(heading, `h2#${id}`);
  const elements = [];
  for (let node = heading.nextElementSibling; node && node.tagName !== 'H2';) {
    elements.push(node);
    node = node.nextElementSibling;
  }
  return elements;
}

/** The documentation object a `docs.ts` exports: the one `*_DOCS` that is not the tokens list. */
async function apiNames(framework, family) {
  const module = await server.ssrLoadModule(docsSource(framework, family));
  const docs = Object.entries(module).find(
    ([name, value]) => name.endsWith('_DOCS') && value && typeof value === 'object',
  )?.[1];
  assert.ok(docs, `${framework} ${family}: a *_DOCS export`);
  return Object.values(docs).flatMap((member) =>
    [...(member.api ?? []), ...(member.composition ?? [])].map((row) => row.name),
  );
}

test('documents at least one family', () => {
  assert.ok(families.length > 0);
});

for (const family of families) {
  for (const framework of FRAMEWORKS) {
    const label = `${framework} ${family}`;

    test(`${label}: the generated sections exist as h2 with ids, listed under "On this page"`, () => {
      const document = page(framework, family);
      const toc = document.querySelector('.docs-toc');
      assert.ok(toc, '.docs-toc');
      for (const id of SECTIONS) {
        assert.equal(document.getElementById(id)?.tagName, 'H2', `h2#${id}`);
        assert.ok(toc.querySelector(`a[href="#${id}"]`), `toc link #${id}`);
      }
    });

    test(`${label}: Installation follows the lead example`, () => {
      const document = page(framework, family);
      const installation = document.getElementById('installation');
      const lead = document.querySelector('.docs-example');
      assert.ok(lead, 'a lead example');
      assert.ok(
        lead.compareDocumentPosition(installation) & 4,
        'Installation comes after the first example',
      );
    });

    test(`${label}: the API section names every API row of the binding's docs.ts`, async () => {
      if (!existsSync(docsSource(framework, family))) return;
      const document = page(framework, family);
      const names = new Set(
        section(document, 'api').flatMap((element) =>
          [...element.querySelectorAll('.docs-prop-name, td:first-child code')].map(
            (code) => code.textContent,
          ),
        ),
      );
      const expected = await apiNames(framework, family);
      assert.ok(expected.length > 0, 'docs.ts has API rows');
      for (const name of expected) assert.ok(names.has(name), `API row ${name}`);
    });

    test(`${label}: every example frame has a Preview and a Code tab`, () => {
      const document = page(framework, family);
      const frames = [...document.querySelectorAll('.docs-example')];
      assert.ok(frames.length > 0, 'at least one example');
      for (const [index, frame] of frames.entries()) {
        // The frame's own tabs: an example of Tabs draws tabs of its own inside the stage.
        const tabs = [...frame.querySelectorAll('[role="tab"]')]
          .filter((tab) => !tab.closest('.docs-example-stage'))
          .map((tab) => tab.textContent.trim());
        assert.deepEqual(tabs, ['Preview', 'Code'], `example ${index + 1} tabs`);
      }
    });
  }
}
