import { describe, expect, it } from 'vitest';

import { assertionPasses, familyComponents } from './assertions.ts';
import { parseStream, triggered } from './stream.ts';
import { renderReport, summarize, type RunResult } from './summary.ts';

const stream = [
  JSON.stringify({ type: 'system', subtype: 'init' }),
  JSON.stringify({
    type: 'assistant',
    message: {
      content: [
        {
          type: 'tool_use',
          name: 'Read',
          input: {
            file_path:
              '/tmp/x/node_modules/@slotted/react/dist/docs/skills/waiting-states/SKILL.md',
          },
        },
      ],
    },
  }),
  JSON.stringify({
    type: 'assistant',
    message: {
      content: [
        {
          type: 'tool_use',
          name: 'Bash',
          input: { command: 'cat node_modules/@slotted/react/dist/docs/skeleton.md' },
        },
      ],
    },
  }),
  JSON.stringify({
    type: 'result',
    is_error: false,
    total_cost_usd: 0.42,
    usage: { input_tokens: 1000, output_tokens: 200 },
  }),
  'not json',
];

describe('parseStream', () => {
  it('collects the paths each tool call read, the usage and the cost', () => {
    const trace = parseStream(stream);
    expect(trace.readPaths).toEqual([
      '/tmp/x/node_modules/@slotted/react/dist/docs/skills/waiting-states/SKILL.md',
      'cat node_modules/@slotted/react/dist/docs/skeleton.md',
    ]);
    expect(trace).toMatchObject({
      inputTokens: 1000,
      outputTokens: 200,
      costUsd: 0.42,
      isError: false,
    });
    expect(triggered(trace, 'waiting-states')).toBe(true);
    expect(triggered(trace, 'compose-screen')).toBe(false);
  });
});

describe('assertionPasses', () => {
  const react = new Map([
    [
      'src/Orders.tsx',
      "import { DataGrid } from '@slotted/react';\nexport const O = () => <DataGrid style={{ color: '#fff' }} />;",
    ],
  ]);
  const angular = new Map([
    ['src/orders.ts', "import { SlDataGrid } from '@slotted/angular/data-grid';"],
  ]);

  it('uses-family reads the JSX tag in React and the entry point in Angular', () => {
    expect(assertionPasses({ kind: 'uses-family', family: 'data-grid' }, 'react', react)).toBe(
      true,
    );
    expect(assertionPasses({ kind: 'uses-family', family: 'data-grid' }, 'angular', angular)).toBe(
      true,
    );
    expect(assertionPasses({ kind: 'uses-family', family: 'skeleton' }, 'react', react)).toBe(
      false,
    );
  });

  it('uses-family in React accepts any component of the family, or its subpath', () => {
    const components = new Map([['skeleton', ['Skeleton', 'SkeletonText']]]);
    const text = new Map([
      ['src/a.tsx', "import { SkeletonText } from '@slotted/react';\n<SkeletonText lines={2} />"],
    ]);
    expect(
      assertionPasses({ kind: 'uses-family', family: 'skeleton' }, 'react', text, components),
    ).toBe(true);
    const subpath = new Map([
      ['src/a.tsx', "import { ProgressBar } from '@slotted/react/progress-indicator';"],
    ]);
    expect(
      assertionPasses({ kind: 'uses-family', family: 'progress-indicator' }, 'react', subpath),
    ).toBe(true);
  });

  it('familyComponents lists the value exports of a family entry point', () => {
    expect(
      familyComponents(
        "export { Loader } from './loader';\nexport { ProgressBar, useProgress } from './progress-bar';\nexport type { LoaderProps } from './types';",
      ),
    ).toEqual(['Loader', 'ProgressBar']);
  });

  it('absent passes only when no file matches the pattern', () => {
    expect(assertionPasses({ kind: 'absent', pattern: 'DataGrid style' }, 'react', react)).toBe(
      false,
    );
    expect(assertionPasses({ kind: 'absent', pattern: '\\[data-part=' }, 'react', react)).toBe(
      true,
    );
  });

  it('no-literal fails on a hex colour, and passes on 0px and 1px', () => {
    expect(assertionPasses({ kind: 'no-literal' }, 'react', react)).toBe(false);
    expect(
      assertionPasses(
        { kind: 'no-literal' },
        'react',
        new Map([['a.css', 'a { border: 1px solid var(--slotted-border); margin: 0px; }']]),
      ),
    ).toBe(true);
    expect(
      assertionPasses({ kind: 'no-literal' }, 'react', new Map([['a.css', 'a { gap: 12px; }']])),
    ).toBe(false);
  });

  it('no-literal skips the step of a media or container query, and comments', () => {
    const css =
      '/* From 600px the grid fills. */\n@media (min-width: 600px) { a { flex-basis: 0; } }\n@container list (inline-size > 40rem) and (width < 900px) { b { gap: var(--slotted-space-2); } }';
    expect(assertionPasses({ kind: 'no-literal' }, 'react', new Map([['a.css', css]]))).toBe(true);
    expect(
      assertionPasses(
        { kind: 'no-literal' },
        'react',
        new Map([['a.css', '@media (min-width: 600px) { a { padding: 12px; } }']]),
      ),
    ).toBe(false);
  });

  it('any passes when one of its assertions passes', () => {
    const seats = new Map([
      ['src/seats.ts', "import { SlToggle } from '@slotted/angular/toggle';"],
    ]);
    const focus = {
      kind: 'any',
      of: [
        { kind: 'uses-family', family: 'toggle' },
        { kind: 'mentions', pattern: 'focus-visible' },
      ],
    } as const;
    expect(assertionPasses(focus, 'angular', seats)).toBe(true);
    expect(
      assertionPasses(focus, 'angular', new Map([['src/a.css', '.seat { color: red }']])),
    ).toBe(false);
  });

  it('mentions matches a pattern in any file', () => {
    expect(
      assertionPasses(
        { kind: 'mentions', pattern: 'aria-busy|data-loading' },
        'react',
        new Map([['a.tsx', '<div aria-busy="true" />']]),
      ),
    ).toBe(true);
  });
});

describe('summarize and renderReport', () => {
  it('rates trigger and conformance per skill and condition, and states the threshold verdict', () => {
    const base = {
      binding: 'react' as const,
      skill: 'waiting-states',
      trace: { readPaths: [], inputTokens: 0, outputTokens: 0, costUsd: 0.5, isError: false },
    };
    const results: RunResult[] = [
      { ...base, caseId: 'a', condition: 'with', triggered: true, passed: 3, total: 3 },
      { ...base, caseId: 'a', condition: 'with', triggered: false, passed: 1, total: 3 },
      { ...base, caseId: 'a', condition: 'without', triggered: false, passed: 1, total: 3 },
    ];
    const summaries = summarize(results);
    expect(summaries).toEqual([
      {
        skill: 'waiting-states',
        condition: 'with',
        runs: 2,
        triggerRate: 0.5,
        conformance: 4 / 6,
        costUsd: 1,
      },
      {
        skill: 'waiting-states',
        condition: 'without',
        runs: 1,
        triggerRate: 0,
        conformance: 1 / 3,
        costUsd: 0.5,
      },
    ]);
    const report = renderReport('2026-10-20', 'claude-sonnet-5-5', summaries);
    expect(report).toContain('| waiting-states | 2 | 0.50 | 0.67 | 0.00 | 0.33 | 1.50 | below |');
  });
});
