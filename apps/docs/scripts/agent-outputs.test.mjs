import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

import { JSDOM } from 'jsdom';

import config from '../astro.config.mjs';

/**
 * Reads the built site: run after `astro build`. Each family has, per binding,
 * the Markdown and the JSON the package build wrote, served beside its page;
 * `llms.txt` lists them; a component page names both.
 */
const { base } = config;
const dist = new URL('../dist/', import.meta.url).pathname;
const packageDocs = {
  react: new URL('../../../packages/react/dist/docs/', import.meta.url).pathname,
  angular: new URL('../../../packages/angular/dist/docs/', import.meta.url).pathname,
};
const specs = new URL('../../../specs/components/', import.meta.url);
const families = readdirSync(specs, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter(
    (family) =>
      JSON.parse(readFileSync(new URL(`${family}/contract.json`, specs), 'utf8')).public !== false,
  );

test('every family has a Markdown and a JSON route per binding', () => {
  for (const binding of ['react', 'angular']) {
    for (const family of families) {
      assert.ok(existsSync(`${dist}${binding}/components/${family}.md`), `${binding}/${family}.md`);
      assert.ok(
        existsSync(`${dist}${binding}/components/${family}.json`),
        `${binding}/${family}.json`,
      );
    }
  }
});

test('a section moved out of a family page is served beside it', () => {
  for (const binding of ['react', 'angular']) {
    for (const file of readdirSync(packageDocs[binding]).filter((name) =>
      /^[a-z0-9-]+\.(examples|props|events|anatomy)\.md$/.test(name),
    )) {
      assert.ok(existsSync(`${dist}${binding}/components/${file}`), `${binding}/${file}`);
    }
  }
});

test('the served Markdown is the package file, pointing at llms.txt instead of the package index', () => {
  const served = readFileSync(`${dist}react/components/field.md`, 'utf8').split('\n');
  const shipped = readFileSync(`${packageDocs.react}field.md`, 'utf8').split('\n');
  assert.equal(served[0], `<!-- index: ${base}/llms.txt -->`);
  assert.deepEqual(served.slice(1), shipped.slice(1));
});

const guidelinePages = (binding) =>
  readdirSync(`${packageDocs[binding]}guidelines`).filter((file) => file.endsWith('.md'));
const skillNames = (binding) =>
  readdirSync(`${packageDocs[binding]}skills`, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

test('every guideline page and skill is served per binding, as the package ships it', () => {
  for (const binding of ['react', 'angular']) {
    for (const file of guidelinePages(binding))
      assert.equal(
        readFileSync(`${dist}${binding}/guidelines/${file}`, 'utf8'),
        readFileSync(`${packageDocs[binding]}guidelines/${file}`, 'utf8'),
        `${binding}/guidelines/${file}`,
      );
    for (const skill of skillNames(binding))
      assert.equal(
        readFileSync(`${dist}${binding}/skills/${skill}/SKILL.md`, 'utf8'),
        readFileSync(`${packageDocs[binding]}skills/${skill}/SKILL.md`, 'utf8'),
        `${binding}/skills/${skill}`,
      );
  }
});

test('skills/index.md is served per binding, as the package ships it', () => {
  for (const binding of ['react', 'angular'])
    assert.equal(
      readFileSync(`${dist}${binding}/skills/index.md`, 'utf8'),
      readFileSync(`${packageDocs[binding]}skills/index.md`, 'utf8'),
      `${binding}/skills/index.md`,
    );
});

test('tokens.md is served per binding, as the package ships it', () => {
  for (const binding of ['react', 'angular'])
    assert.equal(
      readFileSync(`${dist}${binding}/tokens.md`, 'utf8'),
      readFileSync(`${packageDocs[binding]}tokens.md`, 'utf8'),
      `${binding}/tokens.md`,
    );
});

test('llms.txt links only routes that exist, every family, guideline page, skill and the skills index once per binding', () => {
  const llms = readFileSync(`${dist}llms.txt`, 'utf8');
  assert.match(llms, /^# Slotted\n\n> /);
  const hrefs = [...llms.matchAll(/\]\((\/[^)]+)\)/g)].map((match) => match[1]);
  for (const href of hrefs) assert.ok(existsSync(builtFile(href)), href);
  const expected = ['react', 'angular'].reduce(
    (sum, binding) =>
      sum + families.length + guidelinePages(binding).length + skillNames(binding).length + 2,
    0,
  );
  assert.equal(hrefs.length, expected);
  for (const binding of ['react', 'angular'])
    assert.ok(hrefs.includes(`${base}/${binding}/skills/index.md`), `${binding}/skills/index.md`);
});

test('a component page declares its Markdown and the index', () => {
  const html = readFileSync(`${dist}react/components/field/index.html`, 'utf8');
  assert.ok(
    html.includes(
      `<link rel="alternate" type="text/markdown" href="${base}/react/components/field.md">`,
    ),
  );
  assert.ok(html.includes(`<link rel="describedby" href="${base}/llms.txt">`));
});

/* The links inside an example are sample content and name no page of the site. */
const SITE_LINKS = [
  'head link[href^="/"]',
  '.docs-header a',
  '.docs-nav a',
  '.docs-crumbs a',
  '.hero-actions a',
  '.catalog-list a',
].join(', ');

for (const page of [
  '',
  'foundations/introduction/',
  'react/components/field/',
  'angular/components/field/',
]) {
  test(`every link of /${page} is a built file below the base`, () => {
    const { document } = new JSDOM(readFileSync(`${dist}${page}index.html`, 'utf8')).window;
    const hrefs = [
      ...[...document.querySelectorAll(SITE_LINKS)].map((link) => link.getAttribute('href')),
      ...islandHrefs(document),
    ];

    for (const href of hrefs) assert.ok(existsSync(builtFile(href)), href);
  });

  if (page !== '') {
    test(`the navigation of /${page} marks the page`, () => {
      const { document } = new JSDOM(readFileSync(`${dist}${page}index.html`, 'utf8')).window;
      const current = document.querySelector('.docs-nav a[aria-current="page"]');

      assert.equal(current?.getAttribute('href'), `${base}/${page}`);
    });
  }
}

/** The addresses the header's island receives: its search, its drawer and the framework switch. */
function islandHrefs(document) {
  const props = [...document.querySelectorAll('.docs-header astro-island')].map((island) =>
    island.getAttribute('props'),
  );
  const hrefs = [...props.join().matchAll(/"(?:href|react|angular)":\[0,"([^"]+)"/g)];

  assert.ok(hrefs.length > 0, 'the header island carries no address');

  return hrefs.map((match) => match[1]);
}

/** The file of the build a site address names; the host serves `dist` at the base. */
function builtFile(href) {
  assert.ok(href.startsWith(`${base}/`), `${href} is outside ${base}/`);

  return `${dist}${href.slice(base.length + 1)}`.replace(/\/$/, '/index.html');
}
