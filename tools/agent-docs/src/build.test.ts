import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildDocs } from './build.ts';
import { loadContent } from './content.ts';
import { nonEnglishProse, nonEnglishSnippets } from './language-report.ts';
import { loadFamilies } from './load.ts';
import { THEME_SCOPE } from './skills.ts';

const root = resolve(import.meta.dirname, '../../..');
const contracts = readdirSync(join(root, 'specs/components'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

describe('loadFamilies', () => {
  it('loads one input per contract, with the reference docs of the binding', async () => {
    const families = await loadFamilies('react', root);
    expect(families.map((family) => family.contract.family).sort()).toEqual([...contracts].sort());
    const field = families.find((family) => family.contract.family === 'field')!;
    expect(Object.keys(field.docs)).toContain('field');
    expect(field.tokens).toContain('--slotted-field-label-inline-size');
    expect(field.examples.map((example) => example.id)).toContain('basic');
  });

  it('a family without a tokens file loads with no tokens', async () => {
    const families = await loadFamilies('angular', root);
    const withoutFile = families.filter(
      (family) =>
        !existsSync(
          join(
            root,
            `packages/styles/src/${family.contract.family}/${family.contract.family}.tokens.json`,
          ),
        ),
    );
    for (const family of withoutFile) expect(family.tokens).toEqual([]);
  });
});

describe('nonEnglishSnippets', () => {
  it('reports characters outside printable ASCII and typographic punctuation, and nothing else', () => {
    const family = {
      binding: 'react' as const,
      contract: {
        family: 'x',
        ui: 'x',
        catalog: { group: 'Forms', summary: 'X.' },
        members: { x: { nativeElement: 'div' } },
      },
      docs: {
        x: {
          accessibility: [],
          api: [],
          snippets: [
            {
              id: 'a',
              label: 'a',
              language: 'tsx' as const,
              source: '<Button>Loading…</Button> — “ok”\n',
            },
            { id: 'b', label: 'b', language: 'tsx' as const, source: '<Field>Größe</Field>\n' },
          ],
        },
      },
      tokens: [],
      examples: [],
    };
    expect(nonEnglishSnippets([family]).map((entry) => entry.key)).toEqual(['b']);
  });
});

describe('nonEnglishProse', () => {
  const family = (description: string) => ({
    binding: 'react' as const,
    contract: {
      family: 'x',
      ui: 'x',
      catalog: { group: 'Forms', summary: 'X.' },
      members: { x: { nativeElement: 'div' } },
    },
    docs: {
      x: {
        accessibility: [],
        api: [{ name: 'fields', type: 'string', defaultValue: '—', appliesTo: 'x', description }],
        snippets: [],
      },
    },
    tokens: [],
    examples: [],
  });

  it('reports prose written in Portuguese, with its location', () => {
    expect(
      // language: pt-BR
      nonEnglishProse([family('Os campos filtráveis, um por chave do registo')]).map(
        // language: en-US
        (entry) => entry.location,
      ),
    ).toEqual(['x prop fields']);
  });

  it('accepts English prose that quotes one Portuguese word or a pt-BR value', () => {
    expect(
      nonEnglishProse([
        // language: pt-BR
        family('Formats `R$ 1.234,56` under pt-BR; the label "Endereço" is the consumer’s'),
        // language: en-US
      ]),
    ).toEqual([]);
  });

  it.each(['react', 'angular'] as const)(
    'finds every %s family page in English',
    async (binding) => {
      expect(nonEnglishProse(await loadFamilies(binding, root))).toEqual([]);
    },
  );
});

describe('buildDocs', () => {
  it('writes one Markdown and one JSON file per contract, the index and the snippet, identically twice', async () => {
    const a = mkdtempSync(join(tmpdir(), 'docs-'));
    const b = mkdtempSync(join(tmpdir(), 'docs-'));
    const result = await buildDocs({ binding: 'react', root, out: a });
    await buildDocs({ binding: 'react', root, out: b });

    // The directories (guidelines/, skills/) have their own test below.
    const files = readdirSync(a, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
    expect(result.families).toBe(contracts.length);
    expect(files).toContain('index.md');
    expect(files).toContain('AGENTS.snippet.md');
    expect(files).toContain('tokens.md');
    expect(readFileSync(join(a, 'tokens.md'), 'utf8')).toContain('`--slotted-space-6`');
    for (const family of contracts) {
      expect(files).toContain(`${family}.md`);
      expect(files).toContain(`${family}.json`);
    }
    expect(
      readdirSync(b, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .sort(),
    ).toEqual(files.sort());
    for (const file of files) {
      expect(readFileSync(join(b, file), 'utf8'), file).toBe(readFileSync(join(a, file), 'utf8'));
    }
  });
  it('tells a React agent that a router link is drawn only through a family render prop', async () => {
    const out = mkdtempSync(join(tmpdir(), 'docs-'));
    await buildDocs({ binding: 'react', root, out });

    expect(readFileSync(join(out, 'AGENTS.snippet.md'), 'utf8')).toContain(
      "A router's link is never drawn on its own, only as what a family's `render` returns: `Link` for a link.",
    );
  });
  it('writes the guidelines and the skills, identically twice, the same text in both bindings but the package', async () => {
    const react = mkdtempSync(join(tmpdir(), 'docs-'));
    const again = mkdtempSync(join(tmpdir(), 'docs-'));
    const angular = mkdtempSync(join(tmpdir(), 'docs-'));
    await buildDocs({ binding: 'react', root, out: react });
    await buildDocs({ binding: 'react', root, out: again });
    await buildDocs({ binding: 'angular', root, out: angular });

    const content = loadContent(root);
    const guidelines = ['README.md', 'index.md', ...content.topics.map((topic) => topic.file)];
    expect(readdirSync(join(react, 'guidelines')).sort()).toEqual([...guidelines].sort());
    const skills = [
      'skills/index.md',
      ...[...content.skills.keys()].map((name) => `skills/${name}/SKILL.md`),
    ];
    const files = [...guidelines.map((file) => `guidelines/${file}`), ...skills];
    for (const file of files) {
      const a = readFileSync(join(react, file), 'utf8');
      expect(readFileSync(join(again, file), 'utf8'), file).toBe(a);
      const b = readFileSync(join(angular, file), 'utf8');
      expect(
        b
          .replaceAll(THEME_SCOPE.angular, THEME_SCOPE.react)
          .replaceAll('@slotted/angular', '@slotted/react'),
        file,
      ).toBe(a);
    }
    const index = readFileSync(join(react, 'index.md'), 'utf8');
    expect(index).toContain('## Guidelines');
    for (const [name, text] of [
      ['index.md', index],
      ...files.map((file) => [file, readFileSync(join(react, file), 'utf8')]),
    ])
      expect(text, name).not.toMatch(/\{\{\w+\}\}/);
    expect(index).toContain('`./skills/index.md`');
    const skillsIndex = readFileSync(join(react, 'skills/index.md'), 'utf8');
    for (const name of content.skills.keys()) expect(skillsIndex).toContain(`./${name}/SKILL.md`);
  });
});

/**
 * The reference modules are untyped object literals, so a module that writes
 * its docs flat instead of under the member's key loads without error and
 * renders an empty `api`. Each docs key is a member of the family's contract.
 */
describe('the reference docs of every family', () => {
  it.each(['react', 'angular'] as const)(
    '%s: keyed by the members of the contract',
    async (binding) => {
      const families = await loadFamilies(binding, root);
      const mismatched = families
        .map((family) => ({
          family: family.contract.family,
          unknown: Object.keys(family.docs).filter((key) => !(key in family.contract.members)),
        }))
        .filter((entry) => entry.unknown.length > 0);
      expect(mismatched).toEqual([]);
    },
  );
});
