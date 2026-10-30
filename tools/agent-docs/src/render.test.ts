import type { ReferenceDocs } from '@slotted/storybook-workbench';
import { describe, expect, it } from 'vitest';

// @ts-expect-error -- a JavaScript module without declarations; only GROUPS is read.
import { GROUPS as SCHEMA_GROUPS } from '../../../specs/contract.schema.mjs';
import { fieldInput, legacyInput, longExamplesInput, markdownFamilyInput } from './fixtures.ts';
import {
  BudgetError,
  siteExampleErrors,
  renderAgentsSnippet,
  renderFamily,
  renderFamilyJson,
  renderIndex,
  renderSkillsIndex,
} from './render.ts';
import { collectStrings, untraceableLines } from './trace.ts';
import { parseSkill } from './skills.ts';
import { BUDGETS, GROUPS } from './types.ts';

const main = (input = fieldInput) => renderFamily(input).files[0]!.content;
const NO_CONTENT = { readme: '', topics: [], topicSources: new Map(), skills: new Map() };

describe('renderFamily', () => {
  it('writes the fixed sections in order and omits those without data', () => {
    expect(main(legacyInput).match(/^## .+$/gm)).toEqual(['## Props', '## Rules']);
    expect(main().match(/^## .+$/gm)).toEqual([
      '## Import',
      '## Minimal example',
      '## Anatomy',
      '## Props',
      '## Events',
      '## Axes and defaults',
      '## Rules',
      '## Tokens',
      '## Examples',
    ]);
  });

  it('labels a block by its compile verdict, never by its text', () => {
    const content = main();
    // The playground compiled although its text holds an ellipsis.
    expect(content).toMatch(/Example\n\n```tsx\n<Button>Loading…<\/Button>/);
    expect(content).toMatch(/Excerpt — not a complete module\n\n```tsx\n<Field labelPlacement/);
  });

  it('a site example replaces the scene with the same id', () => {
    const content = main();
    expect(content).toContain(fieldInput.examples[0]!.source);
    expect(content).not.toContain('<Field required>…</Field>;');
    expect(content).toContain('### Saying which answers are required');
  });

  it('does not repeat the minimal example among the examples', () => {
    expect(main().split('<Button>Loading…</Button>').length).toBe(2);
  });

  it('keeps the column count when a cell holds a pipe or a line break', () => {
    const props = main().split('## Props')[1]!.split('\n## ')[0]!;
    const rows = props.split('\n').filter((line) => line.startsWith('|'));
    expect(rows.length).toBe(3);
    for (const row of rows) expect(row.split(/(?<!\\)\|/).length).toBe(7);
  });

  it('fences a snippet that holds a three-backtick fence with a longer one', () => {
    expect(main(markdownFamilyInput)).toContain('````markdown\n```md\n# Title\n```\n````');
  });

  it('moves Examples to a linked file over budget, and fails when that is not enough', () => {
    const files = renderFamily(longExamplesInput).files;
    expect(files.map((file) => file.path)).toEqual(['field.md', 'field.examples.md']);
    expect(Buffer.byteLength(files[0]!.content)).toBeLessThanOrEqual(BUDGETS.family);
    expect(files[0]!.content).toContain('[field.examples.md](./field.examples.md)');
    expect(() =>
      renderFamily({
        ...longExamplesInput,
        tokens: Array.from({ length: 5000 }, (_, i) => `--slotted-x-${i}`),
      }),
    ).toThrow(BudgetError);
  });

  it('moves Props to a linked file when the examples alone are not enough', () => {
    const api = Array.from({ length: 300 }, (_, i) => ({
      name: `prop${i}`,
      type: 'string',
      defaultValue: '—',
      appliesTo: 'Legacy',
      description: `Prop ${i} sets one thing on the legacy family.`,
    }));
    const wide = { ...legacyInput, docs: { legacy: { ...legacyInput.docs['legacy']!, api } } };
    const files = renderFamily(wide).files;
    expect(files.map((file) => file.path)).toEqual(['legacy.md', 'legacy.props.md']);
    expect(files[0]!.content).toContain('## Props\n\nSee [legacy.props.md](./legacy.props.md).');
    expect(files[1]!.content).toContain('| `prop299` |');
    for (const file of files)
      expect(untraceableLines(file.content, collectStrings(wide))).toEqual([]);
  });

  it('every line is fixed text or a copy of an input value', () => {
    for (const input of [fieldInput, legacyInput, markdownFamilyInput, longExamplesInput]) {
      for (const file of renderFamily(input).files) {
        expect(untraceableLines(file.content, collectStrings(input))).toEqual([]);
      }
    }
  });

  it('renders a page whose module omits arrays the type declares', () => {
    // Real reference modules are untyped literals: drawer, popover and tooltip carry no `snippets`.
    const sparse = {
      ...legacyInput,
      docs: { legacy: { api: legacyInput.docs['legacy']!.api } as unknown as ReferenceDocs },
    };
    expect(main(sparse).match(/^## .+$/gm)).toEqual(['## Props']);
  });

  it('writes a boolean axis as its values', () => {
    const modal = {
      ...fieldInput,
      contract: {
        ...fieldInput.contract,
        axes: { modal: [true, false] },
        members: { field: { nativeElement: 'div', defaults: { modal: false } } },
      },
    };
    expect(main(modal)).toContain('| `modal` | `true`, `false` | `false` |');
    expect(untraceableLines(main(modal), collectStrings(modal))).toEqual([]);
  });

  it('is deterministic', () => {
    expect(renderFamily(fieldInput)).toEqual(renderFamily(fieldInput));
  });

  it('writes the selector and the export name of an Angular member', () => {
    const angular = {
      ...fieldInput,
      binding: 'angular' as const,
      docs: {
        field: {
          ...fieldInput.docs['field']!,
          imports: {
            source: "import { SlField } from '@slotted/angular/field';",
            selector: '[slField]',
            exportAs: 'slField',
          },
        },
      },
    };
    expect(main(angular)).toContain('Selector: `[slField]` · exportAs: `slField`');
    expect(main(angular)).toContain('```ts\nimport { SlField }');
  });
});

describe('renderIndex', () => {
  it('groups families in the shelf order and lists one line each', () => {
    const index = renderIndex([fieldInput, legacyInput], 'react', NO_CONTENT);
    expect(index).toBe(
      [
        '# Slotted for React',
        '',
        'Each family is documented in `./<family>.md`.',
        '',
        '## Forms',
        '- field: Label, control, help and error for one input.',
        '',
        '## Layout',
        '- legacy: A family with an old page.',
        '',
        '## Tokens',
        '',
        'What each theme token is for, with its default value: `./tokens.md`.',
        '',
      ].join('\n'),
    );
  });

  it('fails when the index exceeds its budget', () => {
    const many = Array.from({ length: 400 }, (_, i) => ({
      ...fieldInput,
      contract: { ...fieldInput.contract, family: `family-${i}` },
    }));
    expect(() => renderIndex(many, 'react', NO_CONTENT)).toThrow(BudgetError);
  });

  it('points at the guidelines index and lists each skill when the content has them', () => {
    const skill = parseSkill(
      '---\nname: waiting-states\ndescription: Use when a screen waits.\n---\n',
    );
    const topic = {
      file: 'x.md',
      topic: 'x',
      prefix: 'AF',
      triggers: [],
      families: [],
      frontmatter: '',
      title: 'X',
      intro: '',
      rules: [],
    };
    const index = renderIndex([fieldInput], 'react', {
      ...NO_CONTENT,
      topics: [topic],
      skills: new Map([['waiting-states', skill]]),
    });
    expect(index).toContain(
      '## Guidelines\n\nRules for composing screens from these families: `./guidelines/index.md`.',
    );
    expect(index).toContain(
      '## Skills\n\nProcedures for whole tasks, each with when it applies: `./skills/index.md`.',
    );
    expect(index).not.toContain('Use when a screen waits.');
  });

  it('uses the shelves the contract schema declares', () => {
    expect([...GROUPS]).toEqual(SCHEMA_GROUPS);
  });
});

describe('renderSkillsIndex', () => {
  it('lists each skill with its path and its description, for the binding', () => {
    const skill = parseSkill(
      '---\nname: waiting-states\ndescription: Use when a screen of {{package}} waits.\n---\n',
    );
    expect(renderSkillsIndex(new Map([['waiting-states', skill]]), 'angular')).toBe(
      [
        '# Skills index',
        '',
        'Each skill, with when it applies. Read a skill before its task.',
        '',
        '- waiting-states: `./waiting-states/SKILL.md` — Use when a screen of @slotted/angular waits.',
        '',
      ].join('\n'),
    );
  });
});

describe('renderAgentsSnippet', () => {
  it('points each binding at its installed path and fits its budget', () => {
    expect(renderAgentsSnippet('react')).toContain(
      'node_modules/@slotted/react/dist/docs/index.md',
    );
    expect(renderAgentsSnippet('angular')).toContain('node_modules/@slotted/angular/docs/index.md');
    for (const binding of ['react', 'angular'] as const) {
      expect(Buffer.byteLength(renderAgentsSnippet(binding))).toBeLessThanOrEqual(BUDGETS.snippet);
      expect(renderAgentsSnippet(binding)).not.toContain('{{');
    }
  });
});

describe('renderFamilyJson', () => {
  it('carries the contract, the reference rows and each block with its verdict', () => {
    const json = renderFamilyJson(fieldInput) as {
      family: string;
      ui: string;
      binding: string;
      examples: { id: string; verdict: string }[];
    };
    expect(json.family).toBe('field');
    expect(json.binding).toBe('react');
    expect(json.examples.map((example) => [example.id, example.verdict])).toEqual([
      ['playground', 'example'],
      ['necessity', 'example'],
      ['placement', 'excerpt'],
    ]);
  });
});

describe('siteExampleErrors', () => {
  it('names every site example that did not compile', () => {
    const broken = { ...fieldInput, verdicts: new Map([['site:necessity', 'excerpt' as const]]) };
    expect(siteExampleErrors([fieldInput, broken])).toEqual([
      'react field: site example necessity does not compile',
    ]);
  });
});

describe('the axes table', () => {
  it('writes a default that is an axis value as code, and one that depends on another axis as words', () => {
    const table = (size: string) =>
      main({
        ...fieldInput,
        contract: {
          ...fieldInput.contract,
          members: {
            ...fieldInput.contract.members,
            field: { ...fieldInput.contract.members['field']!, defaults: { size } },
          },
        },
      })
        .split('## Axes and defaults')[1]!
        .split('\n## ')[0]!;
    expect(table('md')).toContain('| `size` | `sm`, `md`, `lg` | `md` |');
    expect(table('sm on top, md elsewhere')).toContain(
      '| `size` | `sm`, `md`, `lg` | sm on top, md elsewhere |',
    );
  });
});
