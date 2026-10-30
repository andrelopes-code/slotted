import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadContent } from './content.ts';
import { PUBLISHED_FORBIDDEN, renderTopic, topicErrors } from './guidelines.ts';
import { loadCatalog, unresolvedNames } from './references.ts';
import { previousRegistry, registryErrors, registryOf, rewriteErrors } from './registry.ts';
import { renderAgentsSnippet } from './render.ts';
import { skillErrors } from './skills.ts';
import { loadTokenSource, renderTokens } from './tokens.ts';

/**
 * The published guidelines and skills, read from `tools/agent-docs/content`:
 * every rule well formed, every name resolved, every id registered, nothing
 * that names the repository's demo.
 */
const root = resolve(import.meta.dirname, '../../..');
const content = loadContent(root);
const catalog = loadCatalog(root);
const active = new Set(
  content.topics.flatMap((topic) =>
    topic.rules.filter((rule) => rule.status === 'active').map((rule) => rule.id),
  ),
);
const published = [
  ...content.topics.map((topic) => [topic.file, renderTopic(topic)] as const),
  ['README.md', content.readme] as const,
  ['tokens.md', renderTokens(loadTokenSource(root))] as const,
  [
    'design-system/README.md',
    readFileSync(join(root, 'tools/agent-docs/content/design-system/README.md'), 'utf8'),
  ] as const,
  ...[...content.skills].map(([name, skill]) => [`skills/${name}`, skill.source] as const),
];
/** What the source may name besides the library: placeholders, docs paths that exist, topic files. */
const families = [...catalog.names].filter(([, kind]) => kind === 'family').map(([name]) => name);
const guidelineFiles = ['index.md', 'README.md', ...content.topics.map((topic) => topic.file)];
const local = new Set([
  '{{docsDir}}',
  '{{package}}',
  '{{docsDir}}/<family>.md',
  '{{docsDir}}/index.md',
  '{{docsDir}}/skills/index.md',
  'tokens.md',
  '{{docsDir}}/tokens.md',
  ...families.map((family) => `{{docsDir}}/${family}.md`),
  ...guidelineFiles,
  ...guidelineFiles.map((file) => `{{docsDir}}/guidelines/${file}`),
  ...[...content.skills.keys()].map((name) => `{{docsDir}}/skills/${name}/SKILL.md`),
]);

describe('guidelines', () => {
  it('every topic is well formed', () => {
    expect(
      content.topics.flatMap((topic) => topicErrors(topic, content.topicSources.get(topic.file)!)),
    ).toEqual([]);
  });

  it('every prefix belongs to one topic, and to no demo', () => {
    const prefixes = content.topics.map((topic) => topic.prefix);
    expect(prefixes.filter((prefix, index) => prefixes.indexOf(prefix) !== index)).toEqual([]);
    const demos = join(root, 'demos');
    const demoPrefixes = readdirSync(demos)
      .map((demo) => join(demos, demo, 'guidelines'))
      .filter(existsSync)
      .flatMap((dir) =>
        readdirSync(dir).map(
          (file) => /^prefix:\s*([A-Z]{2})$/m.exec(readFileSync(join(dir, file), 'utf8'))?.[1],
        ),
      )
      .filter((prefix): prefix is string => prefix !== undefined);
    expect(demoPrefixes.filter((prefix) => prefixes.includes(prefix))).toEqual([]);
  });

  it('every id the last release carried is still in a topic, at its level or retired', () => {
    expect(registryErrors(registryOf(content.topics), previousRegistry(root))).toEqual([]);
  });

  it('every rewrite names an active rule in words the release notes read', () => {
    expect(rewriteErrors(content.topics)).toEqual([]);
  });
});

const schema = readFileSync(join(root, 'specs/contract.schema.mjs'), 'utf8');
/** The states that paint over weaker ones, in the order the contracts declare. */
const precedence = [.../STATE_PRECEDENCE = \[([^\]]*)\]/.exec(schema)![1]!.matchAll(/'([a-z-]+)'/g)]
  .map(([, state]) => state)
  .filter((state) => state !== 'focus-visible' && state !== 'default');

describe('own elements', () => {
  it('OE-02 lists the states that paint over weaker ones, in the order the contracts declare', () => {
    const order = precedence;
    const rule = content.topics
      .flatMap((topic) => topic.rules)
      .find((entry) => entry.id === 'OE-02')!
      .fields.find(([key]) => key === 'Rule')![1];
    expect([...rule.matchAll(/`([a-z-]+)`/g)].map(([, state]) => state)).toEqual(order);
  });

  it('the design system book lists the states in the same order', () => {
    const book = readFileSync(
      join(root, 'tools/agent-docs/content/design-system/README.md'),
      'utf8',
    );
    const line = book.split('\n').find((entry) => entry.includes('(OE-02)'))!;
    expect([...line.matchAll(/`([a-z-]+)`/g)].map(([, state]) => state)).toEqual(precedence);
  });
});

describe('published text', () => {
  it.each(published)('%s names only what the library publishes', (_file, text) => {
    expect(unresolvedNames(text, catalog, active, local)).toEqual([]);
  });

  it.each(published)('%s names neither the demo nor its tests', (_file, text) => {
    expect(PUBLISHED_FORBIDDEN.filter((pattern) => pattern.test(text)).map(String)).toEqual([]);
  });
});

describe('skills', () => {
  it('the Nexora instructions carry the Angular snippet as published', () => {
    const agents = readFileSync(join(root, 'demos/nexora/angular/AGENTS.md'), 'utf8');
    expect(agents).toContain(renderAgentsSnippet('angular'));
  });

  it('every skill is well formed and cites active rules', () => {
    expect(
      [...content.skills].flatMap(([name, skill]) => skillErrors(name, skill, active)),
    ).toEqual([]);
  });

  it('every skill has an evaluation case, and every case names a skill', () => {
    const cases = (
      JSON.parse(readFileSync(join(root, 'tools/agent-docs/eval/cases.json'), 'utf8')) as {
        cases: { skill: string }[];
      }
    ).cases;
    expect(
      [...content.skills.keys()].filter((name) => !cases.some((entry) => entry.skill === name)),
    ).toEqual([]);
    expect(cases.map((entry) => entry.skill).filter((skill) => !content.skills.has(skill))).toEqual(
      [],
    );
  });

  it('every seed a case names exists for each binding the evaluation runs', () => {
    const config = JSON.parse(
      readFileSync(join(root, 'tools/agent-docs/eval/cases.json'), 'utf8'),
    ) as { bindings: string[]; cases: { id: string; seed?: string }[] };
    const missing = config.cases.flatMap((entry) =>
      entry.seed === undefined
        ? []
        : config.bindings
            .filter(
              (binding) =>
                !existsSync(join(root, 'tools/agent-docs/eval/seeds', entry.seed!, binding)),
            )
            .map((binding) => `${entry.id}: ${entry.seed}/${binding}`),
    );
    expect(missing).toEqual([]);
  });

  it('the snippet of each binding names every skill', () => {
    for (const binding of ['react', 'angular'] as const) {
      const snippet = renderAgentsSnippet(binding);
      for (const name of content.skills.keys())
        expect(snippet, `${binding} ${name}`).toContain(`/skills/${name}/SKILL.md`);
    }
  });
});

/**
 * The time a switch takes: a control that switches a region paints its own
 * state first and renders the region from a deferred value. The rule and the
 * skill that composes screens both say so, and the skill checks it in a
 * throttled browser before it calls a screen done.
 */
describe('interaction cost', () => {
  const ruleText = (id: string) =>
    content.topics
      .flatMap((topic) => topic.rules)
      .find((rule) => rule.id === id && rule.status === 'active')
      ?.fields.map(([, value]) => value)
      .join('\n') ?? '';

  it('composition has a rule that renders a switched region from a deferred value', () => {
    const composition = content.topics.find((topic) => topic.prefix === 'CP');
    const named = composition?.rules.filter(
      (rule) =>
        rule.status === 'active' &&
        /useDeferredValue|startTransition/.test(rule.fields.map(([, value]) => value).join('\n')),
    );
    expect(named?.map((rule) => rule.id)).toEqual(['CP-09']);
    expect(ruleText('CP-09')).toMatch(/aria-busy/);
  });

  it('compose-screen names the switch in Compose and the throttled check in Done', () => {
    const source = content.skills.get('compose-screen')?.source ?? '';
    const section = (heading: string) =>
      source.split(/^## /m).find((part) => part.startsWith(heading)) ?? '';

    expect(section('5. Compose')).toMatch(/CP-09/);
    expect(section('5. Compose')).toMatch(/useDeferredValue|startTransition/);
    expect(section('7. Done')).toMatch(/throttled 4×/);
    expect(section('7. Done')).toMatch(/Event Timing/);
    expect(section('7. Done')).toMatch(/production build/);
  });
});

describe('the choice between a table and a data-grid', () => {
  it('list pages say when a list is a data-grid rather than a table', () => {
    const lists = content.topics.find((topic) => topic.prefix === 'LP');
    const choice = lists?.rules.find(
      (rule) =>
        rule.status === 'active' &&
        /data-grid/.test(rule.title) &&
        /hundred rows/.test(rule.fields.map(([, value]) => value).join('\n')) &&
        /`table` is for/.test(rule.fields.map(([, value]) => value).join('\n')),
    );
    expect(choice?.id).toBe('LP-14');
    expect(content.skills.get('compose-screen')?.source).toMatch(/LP-14/);
  });
});
