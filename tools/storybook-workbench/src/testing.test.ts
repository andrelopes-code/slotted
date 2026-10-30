import { describe, expect, it } from 'vitest';

import { defineSnippet } from './snippets';
import { snippetFormatErrors } from './testing';

describe('snippetFormatErrors', () => {
  it('measures a stylesheet snippet against CSS rather than against TypeScript', async () => {
    const formatted = defineSnippet({
      id: 'css-formatted',
      label: 'Every icon in the application',
      language: 'css',
      source: ':root {\n  --slotted-icon-size: var(--slotted-control-icon-size-sm);\n}',
    });

    expect(await snippetFormatErrors([formatted])).toEqual([]);
  });

  it('reports a stylesheet snippet that is valid CSS but formatted differently', async () => {
    const unformatted = defineSnippet({
      id: 'css-unformatted',
      label: 'Every icon in the application',
      language: 'css',
      source: ':root { --slotted-icon-size: 20px; }',
    });

    expect(await snippetFormatErrors([unformatted])).toEqual(['unformatted css-unformatted']);
  });

  it('still formats React and Angular snippets with their own grammars', async () => {
    const snippets = [
      defineSnippet({
        id: 'tsx-formatted',
        label: 'React example',
        language: 'tsx',
        source: '<Icon>\n  <Search />\n</Icon>;',
      }),
      defineSnippet({
        id: 'angular-formatted',
        label: 'Angular example',
        language: 'angular',
        source: '<span slIcon><ng-icon name="lucideSearch" /></span>',
      }),
    ];

    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
