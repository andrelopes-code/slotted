import { describe, expect, it } from 'vitest';

import { referencePageErrors } from './reference-audit';
import type { ReferenceDocs } from './reference-audit';

const member = { parts: ['root'], states: ['default'] };

function docs(overrides: Partial<ReferenceDocs> = {}): ReferenceDocs {
  return {
    accessibility: ['one', 'two', 'three'],
    anatomy: [{ part: 'root', element: 'div', required: true, purpose: 'The root' }],
    api: [],
    imports: { source: "import { Thing } from '@slotted/react';" },
    scenes: [
      {
        id: 'playground',
        title: 'Playground',
        note: 'A caption long enough to say what a reader should be looking at here.',
        snippet: { id: 'x', label: 'x', language: 'tsx', source: '<Thing />;' },
      },
    ],
    snippets: [],
    ...overrides,
  };
}

const audit = (framework: 'Angular' | 'React', overrides: Partial<ReferenceDocs> = {}) =>
  referencePageErrors({
    docs: docs(overrides),
    framework,
    member,
    scenarioIds: ['playground'],
  });

describe('referencePageErrors', () => {
  it('passes a page that answers the contract', () => {
    expect(audit('React')).toEqual([]);
  });

  /**
   * An Angular story writes its scene into a template, and a template reads `@`
   * as the start of a control-flow block. `table`'s expansion caption said "Your
   * own @if keeps a closed detail out of the DOM entirely" and the scene
   * rendered as `Incomplete block "if keeps a closed detail out of the DOM
   * entirely"` — a defect that compiles, type-checks and lints, and that only
   * the rendered page shows.
   */
  it('refuses a bare @ in an Angular caption, which a template reads as a block', () => {
    const scenes = [
      {
        id: 'playground',
        title: 'Playground',
        note: 'Your own @if keeps a closed detail out of the DOM, which is the Angular idiom.',
        snippet: {
          id: 'x',
          label: 'x',
          language: 'angular' as const,
          source: '<div slThing></div>',
        },
      },
    ];

    expect(
      audit('Angular', {
        scenes,
        imports: {
          source: "import { SlThing } from '@slotted/angular/thing';",
          selector: 'div[slThing]',
        },
      }),
    ).toEqual([
      'scene playground writes a bare @ in prose, which an Angular template reads as a block',
    ]);
  });

  it('accepts the escape the compiler itself suggests', () => {
    const scenes = [
      {
        id: 'playground',
        title: 'Playground',
        note: 'Your own &#64;if keeps a closed detail out of the DOM, which is the Angular idiom.',
        snippet: {
          id: 'x',
          label: 'x',
          language: 'angular' as const,
          source: '<div slThing></div>',
        },
      },
    ];

    expect(
      audit('Angular', {
        scenes,
        imports: {
          source: "import { SlThing } from '@slotted/angular/thing';",
          selector: 'div[slThing]',
        },
      }),
    ).toEqual([]);
  });

  /** A React caption is prose in JSX, and an `@` there is a character. */
  it('leaves a React caption alone', () => {
    const scenes = [
      {
        id: 'playground',
        title: 'Playground',
        note: 'Reach it at @slotted/react, which is where every part of this family lives.',
        snippet: { id: 'x', label: 'x', language: 'tsx' as const, source: '<Thing />;' },
      },
    ];

    expect(audit('React', { scenes })).toEqual([]);
  });
});
