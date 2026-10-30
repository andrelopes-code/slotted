import { readFileSync } from 'node:fs';

import type { ReferenceDocs } from '@slotted/storybook-workbench';

import type { Content } from './content.ts';
import { cell, code, fence, table } from './markdown.ts';
import { renderContent, type Skill } from './skills.ts';
import {
  BUDGETS,
  DOCS_DIR,
  GROUPS,
  type Binding,
  type BlockVerdict,
  type FamilyInput,
  type RenderedFamily,
} from './types.ts';

export class BudgetError extends Error {}

/** The text the renderer may write of its own; every other line copies an input. */
export const FIXED_TEXT = {
  label: { example: 'Example', excerpt: 'Excerpt — not a complete module' },
  sections: [
    'Import',
    'Minimal example',
    'Anatomy',
    'Props',
    'Events',
    'Axes and defaults',
    'Rules',
    'Tokens',
    'Examples',
  ],
  headers: {
    anatomy: ['Part', 'Element', 'Required'],
    anatomyWithParent: ['Part', 'Parent', 'Element', 'Required'],
    props: ['Name', 'Type', 'Default', 'Applies to', 'Description'],
    events: ['Name', 'Payload', 'When'],
    axes: ['Axis', 'Values', 'Default'],
  },
  required: { true: 'yes', false: 'no' },
  none: '—',
  indexLink: '<!-- index: ./index.md -->',
  bindingTitle: { react: 'React', angular: 'Angular' },
} as const;

const BINDING_LANGUAGE: Readonly<Record<Binding, string>> = { react: 'tsx', angular: 'ts' };
const FENCE_LANGUAGE: Readonly<Record<string, string>> = { angular: 'html' };

interface Block {
  id: string;
  key: string;
  title: string;
  note: string | null;
  language: string;
  source: string;
  verdict: BlockVerdict;
}

/**
 * The reference modules are untyped object literals, so an array the type
 * declares can be absent (`snippets` on drawer, popover and tooltip); every
 * read below defaults it.
 */
function members(input: FamilyInput): [string, ReferenceDocs][] {
  return Object.entries(input.docs);
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function blocks(input: FamilyInput): Block[] {
  const verdict = (key: string): BlockVerdict => input.verdicts.get(key) ?? 'excerpt';
  const site = new Map(input.examples.map((example) => [example.id, example]));
  const used = new Set<string>();
  const seen = new Set<string>();
  const result: Block[] = [];

  for (const [, docs] of members(input)) {
    const fromScenes = (docs.scenes ?? []).map((scene) => ({
      id: scene.id,
      title: scene.title,
      note: scene.note as string | null,
      snippet: scene.snippet,
    }));
    const fromSnippets =
      fromScenes.length > 0
        ? []
        : (docs.snippets ?? []).map((snippet) => ({
            id: snippet.id,
            title: snippet.label,
            note: null,
            snippet,
          }));

    for (const entry of [...fromScenes, ...fromSnippets]) {
      if (seen.has(entry.snippet.id)) continue;
      seen.add(entry.snippet.id);
      const replacement = site.get(entry.id);
      if (replacement !== undefined) {
        used.add(replacement.id);
        result.push({
          id: entry.id,
          key: `site:${replacement.id}`,
          title: entry.title,
          note: entry.note,
          language: replacement.language,
          source: replacement.source,
          verdict: verdict(`site:${replacement.id}`),
        });
      } else {
        result.push({
          id: entry.id,
          key: entry.snippet.id,
          title: entry.title,
          note: entry.note,
          language: FENCE_LANGUAGE[entry.snippet.language] ?? entry.snippet.language,
          source: entry.snippet.source,
          verdict: verdict(entry.snippet.id),
        });
      }
    }
  }

  for (const example of input.examples) {
    if (used.has(example.id)) continue;
    result.push({
      id: example.id,
      key: `site:${example.id}`,
      title: example.fileName,
      note: null,
      language: example.language,
      source: example.source,
      verdict: verdict(`site:${example.id}`),
    });
  }
  return result;
}

function minimal(all: readonly Block[]): Block | undefined {
  return (
    all.find((block) => block.key === 'site:basic' && block.verdict === 'example') ??
    all.find((block) => block.verdict === 'example') ??
    all[0]
  );
}

function blockLines(block: Block): string[] {
  return ['', FIXED_TEXT.label[block.verdict], '', ...fence(block.language, block.source)];
}

/** A section under a fixed heading, with one subsection per member when a family has several. */
function perMember(
  input: FamilyInput,
  title: string,
  body: (docs: ReferenceDocs) => string[],
): string[] {
  const parts = members(input)
    .map(([name, docs]) => [name, body(docs)] as const)
    .filter(([, lines]) => lines.length > 0);
  if (parts.length === 0) return [];
  if (parts.length === 1) return [`## ${title}`, '', ...parts[0]![1], ''];
  return [
    `## ${title}`,
    '',
    ...parts.flatMap(([name, lines]) => [`### ${name}`, '', ...lines, '']),
  ];
}

function codeList(values: readonly string[]): string {
  return values.map((value) => code(value)).join(', ');
}

function axesSection(input: FamilyInput): string[] {
  const axes = Object.entries(input.contract.axes ?? {});
  if (axes.length === 0) return [];
  const rows = axes.map(([axis, values]) => {
    const defaults = unique(
      Object.values(input.contract.members)
        .map((member) => member.defaults?.[axis])
        .filter((value) => value !== undefined)
        .map((value) => String(value)),
    );
    const named = values.map((value) => String(value));
    return [
      code(axis),
      codeList(named),
      /* A default that depends on another axis is a sentence, not a value. */
      defaults.length === 0
        ? FIXED_TEXT.none
        : defaults.map((value) => (named.includes(value) ? code(value) : value)).join(', '),
    ];
  });
  return ['## Axes and defaults', '', ...table(FIXED_TEXT.headers.axes, rows), ''];
}

function importSection(input: FamilyInput): string[] {
  const lines: string[] = [];
  const sources = new Set<string>();
  for (const [, docs] of members(input)) {
    if (docs.imports === undefined) continue;
    if (!sources.has(docs.imports.source)) {
      sources.add(docs.imports.source);
      lines.push(...fence(BINDING_LANGUAGE[input.binding], docs.imports.source), '');
    }
    const { selector, exportAs } = docs.imports;
    const facts = [
      selector === undefined ? null : `Selector: ${code(selector)}`,
      exportAs === undefined ? null : `exportAs: ${code(exportAs)}`,
    ].filter((fact) => fact !== null);
    if (facts.length > 0) lines.push(facts.join(' · '), '');
  }
  return lines.length === 0 ? [] : ['## Import', '', ...lines];
}

function header(input: FamilyInput): string[] {
  const { family, ui, catalog } = input.contract;
  return [
    FIXED_TEXT.indexLink,
    `# ${family}`,
    '',
    `${code(`data-ui="${ui}"`)} · ${catalog.summary}`,
    '',
  ];
}

function examplesBody(examples: readonly Block[]): string[] {
  return examples.flatMap((block) => [
    `### ${block.title}`,
    ...(block.note === null ? [] : ['', block.note]),
    ...blockLines(block),
    '',
  ]);
}

interface Section {
  title: string;
  lines: string[];
}

function sectionOf(title: string, lines: string[]): Section {
  return { title, lines };
}

/**
 * The sections that move to a linked file, in this order, until the page fits
 * its budget: the examples first, then the reference tables, largest kind first.
 * Nothing is truncated.
 */
const SPILL_ORDER = ['Examples', 'Props', 'Events', 'Anatomy'] as const;

function finish(lines: readonly string[]): string {
  return `${lines.join('\n').trimEnd()}\n`;
}

function size(lines: readonly string[]): number {
  return Buffer.byteLength(lines.join('\n'));
}

export function renderFamily(input: FamilyInput): RenderedFamily {
  const { family } = input.contract;
  const all = blocks(input);
  const first = minimal(all);
  const examples = all.filter((block) => block !== first);

  const rules = unique(members(input).flatMap(([, docs]) => docs.accessibility ?? []));
  const body: Section[] = [
    { title: 'Import', lines: importSection(input) },
    {
      title: 'Minimal example',
      lines: first === undefined ? [] : ['## Minimal example', ...blockLines(first), ''],
    },
    sectionOf(
      'Anatomy',
      perMember(input, 'Anatomy', (docs) =>
        (docs.anatomy ?? []).length === 0
          ? []
          : docs.anatomy!.some((row) => row.parent !== undefined)
            ? table(
                FIXED_TEXT.headers.anatomyWithParent,
                docs.anatomy!.map((row) => [
                  code(row.part),
                  row.parent === undefined ? FIXED_TEXT.none : code(row.parent),
                  row.element,
                  FIXED_TEXT.required[`${row.required}`],
                ]),
              )
            : table(
                FIXED_TEXT.headers.anatomy,
                docs.anatomy!.map((row) => [
                  code(row.part),
                  row.element,
                  FIXED_TEXT.required[`${row.required}`],
                ]),
              ),
      ),
    ),
    sectionOf(
      'Props',
      perMember(input, 'Props', (docs) => {
        const rows = [...(docs.api ?? []), ...(docs.composition ?? [])];
        return rows.length === 0
          ? []
          : table(
              FIXED_TEXT.headers.props,
              rows.map((row) => [
                code(row.name),
                code(row.type),
                row.defaultValue,
                row.appliesTo,
                row.description,
              ]),
            );
      }),
    ),
    sectionOf(
      'Events',
      perMember(input, 'Events', (docs) =>
        (docs.events ?? []).length === 0
          ? []
          : table(
              FIXED_TEXT.headers.events,
              docs.events!.map((row) => [code(row.name), code(row.payload), row.when]),
            ),
      ),
    ),
    { title: 'Axes and defaults', lines: axesSection(input) },
    {
      title: 'Rules',
      lines:
        rules.length === 0 ? [] : ['## Rules', '', ...rules.map((rule) => `- ${cell(rule)}`), ''],
    },
    {
      title: 'Tokens',
      lines: input.tokens.length === 0 ? [] : ['## Tokens', '', codeList(input.tokens), ''],
    },
  ];

  const sections: Section[] = [
    ...body,
    {
      title: 'Examples',
      lines: examples.length === 0 ? [] : ['## Examples', '', ...examplesBody(examples)],
    },
  ].filter((section) => section.lines.length > 0);

  const files: { path: string; content: string }[] = [];
  const page = () => [...header(input), ...sections.flatMap((section) => section.lines)];
  for (const title of SPILL_ORDER) {
    if (size(page()) <= BUDGETS.family) break;
    const section = sections.find((candidate) => candidate.title === title);
    if (section === undefined) continue;
    const linked = `${family}.${title.toLowerCase()}.md`;
    files.push({ path: linked, content: finish([...header(input), ...section.lines]) });
    section.lines = [`## ${title}`, '', `See [${linked}](./${linked}).`, ''];
  }
  if (size(page()) > BUDGETS.family) {
    throw new BudgetError(
      `${family}.md is ${size(page())} bytes with every movable section linked; the budget is ${BUDGETS.family}`,
    );
  }
  return { files: [{ path: `${family}.md`, content: finish(page()) }, ...files] };
}

/** The blocks a family shows, keyed as `verdicts` expects, for the compile gate to judge. */
export function compileBlocks(
  input: Omit<FamilyInput, 'verdicts'>,
): { key: string; language: string; source: string }[] {
  return blocks({ ...input, verdicts: new Map() }).map(({ key, language, source }) => ({
    key,
    language,
    source,
  }));
}

/**
 * A site example is written as a complete module to be copied whole, so one
 * that does not compile is a defect, not an excerpt. Named per family and binding.
 */
export function siteExampleErrors(families: readonly FamilyInput[]): string[] {
  return families.flatMap((family) =>
    family.examples
      .filter((example) => family.verdicts.get(`site:${example.id}`) !== 'example')
      .map(
        (example) =>
          `${family.binding} ${family.contract.family}: site example ${example.id} does not compile`,
      ),
  );
}

export function renderIndex(
  inputs: readonly FamilyInput[],
  binding: Binding,
  content: Content,
): string {
  const lines = [
    `# Slotted for ${FIXED_TEXT.bindingTitle[binding]}`,
    '',
    'Each family is documented in `./<family>.md`.',
    '',
  ];
  for (const group of GROUPS) {
    const shelf = inputs
      .filter((input) => input.contract.catalog.group === group)
      .sort((a, b) => a.contract.family.localeCompare(b.contract.family));
    if (shelf.length === 0) continue;
    lines.push(
      `## ${group}`,
      ...shelf.map((input) => `- ${input.contract.family}: ${input.contract.catalog.summary}`),
      '',
    );
  }
  lines.push(
    '## Tokens',
    '',
    'What each theme token is for, with its default value: `./tokens.md`.',
    '',
  );
  if (content.topics.length > 0)
    lines.push(
      '## Guidelines',
      '',
      'Rules for composing screens from these families: `./guidelines/index.md`. Read it before writing a screen.',
      '',
    );
  if (content.skills.size > 0)
    lines.push(
      '## Skills',
      '',
      'Procedures for whole tasks, each with when it applies: `./skills/index.md`.',
      '',
    );
  const text = lines.join('\n');
  if (Buffer.byteLength(text) > BUDGETS.index) {
    throw new BudgetError(
      `index.md is ${Buffer.byteLength(text)} bytes; the budget is ${BUDGETS.index}`,
    );
  }
  return text;
}

/** `skills/index.md`: every skill, with the description that says when it applies. */
export function renderSkillsIndex(skills: ReadonlyMap<string, Skill>, binding: Binding): string {
  return [
    '# Skills index',
    '',
    'Each skill, with when it applies. Read a skill before its task.',
    '',
    ...[...skills.values()].map(
      (skill) =>
        `- ${skill.name}: \`./${skill.name}/SKILL.md\` — ${renderContent(skill.description, binding, '..')}`,
    ),
    '',
  ].join('\n');
}

export function renderAgentsSnippet(binding: Binding): string {
  const template = readFileSync(new URL(`./agents-snippet.${binding}.md`, import.meta.url), 'utf8');
  const content = template.replaceAll('{{docsDir}}', DOCS_DIR[binding]);
  if (Buffer.byteLength(content) > BUDGETS.snippet) {
    throw new BudgetError(
      `AGENTS.snippet.md is ${Buffer.byteLength(content)} bytes; the budget is ${BUDGETS.snippet}`,
    );
  }
  return content;
}

export function renderFamilyJson(input: FamilyInput): Record<string, unknown> {
  return {
    family: input.contract.family,
    ui: input.contract.ui,
    binding: input.binding,
    catalog: input.contract.catalog,
    axes: input.contract.axes ?? {},
    members: input.contract.members,
    docs: Object.fromEntries(
      members(input).map(([name, docs]) => [
        name,
        {
          imports: docs.imports ?? null,
          anatomy: docs.anatomy ?? [],
          api: docs.api ?? [],
          composition: docs.composition ?? [],
          events: docs.events ?? [],
          accessibility: docs.accessibility ?? [],
        },
      ]),
    ),
    tokens: input.tokens,
    examples: blocks(input).map(({ id, title, note, language, source, verdict }) => ({
      id,
      title,
      note,
      language,
      source,
      verdict,
    })),
  };
}
