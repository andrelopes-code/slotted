import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { compileAngular, readNgcResult } from './compile-angular.ts';
import { compileReact } from './compile-react.ts';

const root = resolve(import.meta.dirname, '../../..');

describe('compileReact', () => {
  it('judges by the compiler alone', async () => {
    const verdicts = await compileReact(
      [
        {
          key: 'complete',
          language: 'tsx',
          source:
            "import { Button } from '@slotted/react';\n\nexport const A = () => <Button>Loading…</Button>;\n",
        },
        { key: 'fragment', language: 'tsx', source: '<Field required>…</Field>;\n' },
        {
          key: 'invented-prop',
          language: 'tsx',
          source:
            'import { Button } from \'@slotted/react\';\n\nexport const A = () => <Button shade="red">Save</Button>;\n',
        },
      ],
      root,
    );
    expect(Object.fromEntries(verdicts)).toEqual({
      complete: 'example',
      fragment: 'excerpt',
      'invented-prop': 'excerpt',
    });
  });
});

describe('compileAngular', () => {
  it('compiles a complete component with strict templates and leaves templates as excerpts', async () => {
    const component = (template: string) =>
      [
        "import { Component } from '@angular/core';",
        "import { SlButton } from '@slotted/angular/button';",
        '',
        "@Component({ selector: 'app-a', imports: [SlButton], template: `" + template + '` })',
        'export class A {}',
        '',
      ].join('\n');
    const verdicts = await compileAngular(
      [
        {
          key: 'complete',
          language: 'ts',
          source: component('<button slButton>Loading…</button>'),
        },
        {
          key: 'unknown-input',
          language: 'ts',
          source: component('<button slButton [color]="1">Save</button>'),
        },
        { key: 'template', language: 'html', source: '<button slButton>Save</button>\n' },
      ],
      root,
    );
    expect(Object.fromEntries(verdicts)).toEqual({
      complete: 'example',
      'unknown-input': 'excerpt',
      template: 'excerpt',
    });
  });
});

describe('compileReact candidates', () => {
  it('excerpts a block that compiles without importing the library or exporting anything', async () => {
    const verdicts = await compileReact(
      [
        { key: 'comments', language: 'tsx', source: '// ArrowLeft / ArrowRight move a day.\n' },
        { key: 'intrinsic', language: 'tsx', source: '<a href="#history">Go to history</a>;\n' },
        { key: 'data', language: 'ts', source: "const items = [{ id: 'a' }];\n" },
      ],
      root,
    );
    expect(Object.fromEntries(verdicts)).toEqual({
      comments: 'excerpt',
      intrinsic: 'excerpt',
      data: 'excerpt',
    });
  });

  it('excerpts an import from a subpath the package does not export', async () => {
    /*
     * Declarations that exist on disk under a name `exports` does not carry:
     * the import has to fail on the map, not on a missing file. The package
     * exports every family it builds (`packages/react/src/entry-points.test.ts`),
     * so the test writes its own unexported folder.
     */
    const name = 'agent-docs-unexported';
    const exported = Object.keys(
      (
        JSON.parse(readFileSync(resolve(root, 'packages/react/package.json'), 'utf8')) as {
          exports: Record<string, unknown>;
        }
      ).exports,
    );
    expect(exported).not.toContain(`./${name}`);
    const folder = resolve(root, 'packages/react/dist/types', name);
    mkdirSync(folder, { recursive: true });
    writeFileSync(resolve(folder, 'index.d.ts'), 'export declare const value: number;\n');
    try {
      const verdicts = await compileReact(
        [
          {
            key: 'unexported',
            language: 'tsx',
            source: `import * as Family from '@slotted/react/${name}';\n\nexport const used = Family;\n`,
          },
        ],
        root,
      );
      expect(verdicts.get('unexported')).toBe('excerpt');
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });
});

describe('compileAngular isolation', () => {
  it('judges a template even when another candidate has a TypeScript error', async () => {
    const component = (template: string, body = '') =>
      [
        "import { Component } from '@angular/core';",
        "import { SlButton } from '@slotted/angular/button';",
        '',
        "@Component({ selector: 'app-a', imports: [SlButton], template: `" + template + '` })',
        `export class A { ${body} }`,
        '',
      ].join('\n');
    const verdicts = await compileAngular(
      [
        {
          key: 'ts-error',
          language: 'ts',
          source: component('<button slButton>Save</button>', "n: number = 'a';"),
        },
        {
          key: 'unknown-input',
          language: 'ts',
          source: component('<button slButton [color]="1">Save</button>'),
        },
        { key: 'complete', language: 'ts', source: component('<button slButton>Save</button>') },
      ],
      root,
    );
    expect(Object.fromEntries(verdicts)).toEqual({
      'ts-error': 'excerpt',
      'unknown-input': 'excerpt',
      complete: 'example',
    });
  });
});

describe('readNgcResult', () => {
  it('refuses an output the process truncated, which would name too few failures', () => {
    expect(() =>
      readNgcResult({ output: '', exitCode: 1, errorCode: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' }),
    ).toThrow(/truncated/);
  });

  it('names the reason ngc never ran, which leaves no output to read', () => {
    expect(() => readNgcResult({ output: '\n', exitCode: 1, errorCode: 'ENOENT' })).toThrow(
      /ngc could not run: ENOENT/,
    );
  });

  it('names the blocks with an error and throws on an error outside them', () => {
    const ok = readNgcResult({
      output: 'block-1.ts:4:82 - error NG8002: Can’t bind to “color”.',
      exitCode: 1,
      errorCode: undefined,
    });
    expect([...ok]).toEqual(['block-1.ts']);
    expect(() =>
      readNgcResult({
        output: 'tsconfig.json:1:1 - error TS5023: Unknown option.',
        exitCode: 1,
        errorCode: undefined,
      }),
    ).toThrow(/outside the examples/);
  });
});
