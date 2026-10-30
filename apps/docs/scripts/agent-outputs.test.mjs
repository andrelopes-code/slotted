import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

/**
 * Reads the built site: run after `astro build`. Each family has, per binding,
 * the Markdown and the JSON the package build wrote, served beside its page;
 * `llms.txt` lists them; a component page names both.
 */
const dist = new URL('../dist/', import.meta.url).pathname;
const packageDocs = {
  react: new URL('../../../packages/react/dist/docs/', import.meta.url).pathname,
  angular: new URL('../../../packages/angular/dist/docs/', import.meta.url).pathname,
};
const families = readdirSync(new URL('../../../specs/components/', import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

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
  assert.equal(served[0], '<!-- index: /llms.txt -->');
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
  for (const href of hrefs) assert.ok(existsSync(`${dist}${href.slice(1)}`), href);
  const expected = ['react', 'angular'].reduce(
    (sum, binding) =>
      sum + families.length + guidelinePages(binding).length + skillNames(binding).length + 2,
    0,
  );
  assert.equal(hrefs.length, expected);
  for (const binding of ['react', 'angular'])
    assert.ok(hrefs.includes(`/${binding}/skills/index.md`), `${binding}/skills/index.md`);
});

test('a component page declares its Markdown and the index', () => {
  const html = readFileSync(`${dist}react/components/field/index.html`, 'utf8');
  assert.match(
    html,
    /<link rel="alternate" type="text\/markdown" href="\/react\/components\/field\.md">/,
  );
  assert.match(html, /<link rel="describedby" href="\/llms\.txt">/);
});
