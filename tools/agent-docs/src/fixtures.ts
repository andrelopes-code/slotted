import type { ReferenceDocs } from '@slotted/storybook-workbench';

import type { FamilyInput } from './types.ts';

const fieldDocs: ReferenceDocs = {
  accessibility: ['The label names the control through for and id.'],
  imports: { source: "import { Field, FieldControl, FieldLabel } from '@slotted/react';" },
  anatomy: [
    {
      part: 'root',
      element: 'div, or the element render returns',
      required: true,
      purpose: 'The field.',
    },
    { part: 'label', element: 'label', required: false, purpose: 'Names the control.' },
  ],
  api: [
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      defaultValue: 'md',
      appliesTo: 'Field',
      description: 'The control height.\nThe label follows it.',
    },
  ],
  events: [
    {
      name: 'onOpenChange',
      payload: '(open: boolean, request: TooltipChangeRequest)',
      when: 'Before the hint opens.',
    },
  ],
  scenes: [
    {
      id: 'playground',
      title: 'Playground',
      note: 'One field with every axis on it.',
      snippet: {
        id: 'field-react-playground',
        label: 'A field',
        language: 'tsx',
        source: '<Button>Loading…</Button>\n',
      },
    },
    {
      id: 'necessity',
      title: 'Saying which answers are required',
      note: 'The asterisk is the convention.',
      snippet: {
        id: 'field-react-necessity',
        label: 'A mark',
        language: 'tsx',
        source: '<Field required>…</Field>;\n',
      },
    },
    {
      id: 'placement',
      title: 'The label beside the control',
      note: 'The side label stacks below 320 pixels.',
      snippet: {
        id: 'field-react-placement',
        label: 'Side',
        language: 'tsx',
        source: '<Field labelPlacement="side" />;\n',
      },
    },
  ],
  snippets: [],
};

export const fieldInput: FamilyInput = {
  binding: 'react',
  contract: {
    family: 'field',
    ui: 'field',
    catalog: { group: 'Forms', summary: 'Label, control, help and error for one input.' },
    axes: { size: ['sm', 'md', 'lg'] },
    members: {
      field: { nativeElement: 'div', defaults: { size: 'md' }, parts: ['root', 'label'] },
    },
  },
  docs: { field: fieldDocs },
  tokens: ['--slotted-field-gap', '--slotted-field-label-inline-size'],
  examples: [
    {
      id: 'necessity',
      fileName: 'necessity.tsx',
      language: 'tsx',
      source:
        "import { Field } from '@slotted/react';\n\nexport default function Necessity() {\n  return <Field required />;\n}\n",
    },
  ],
  verdicts: new Map([
    ['field-react-playground', 'example'],
    ['site:necessity', 'example'],
  ]),
};

/** A page written before the reference-page contract: no imports, anatomy or scenes. */
export const legacyInput: FamilyInput = {
  binding: 'react',
  contract: {
    family: 'legacy',
    ui: 'legacy',
    catalog: { group: 'Layout', summary: 'A family with an old page.' },
    members: { legacy: { nativeElement: 'div' } },
  },
  docs: {
    legacy: {
      accessibility: ['It renders a div.'],
      api: [
        {
          name: 'gap',
          type: 'string',
          defaultValue: '—',
          appliesTo: 'Legacy',
          description: 'The gap.',
        },
      ],
      snippets: [],
    },
  },
  tokens: [],
  examples: [],
  verdicts: new Map(),
};

/** The `markdown` family's input is Markdown, fences included. */
export const markdownFamilyInput: FamilyInput = {
  ...legacyInput,
  contract: { ...legacyInput.contract, family: 'markdown', ui: 'markdown' },
  docs: {
    markdown: {
      accessibility: [],
      api: [],
      snippets: [],
      scenes: [
        {
          id: 'code',
          title: 'Code',
          note: 'A fenced block becomes a code block.',
          snippet: {
            id: 'markdown-code',
            label: 'Fence',
            language: 'markdown',
            source: '```md\n# Title\n```\n',
          },
        },
      ],
    },
  },
};

const longSource = `${'<Field />;\n'.repeat(260)}`;

export const longExamplesInput: FamilyInput = {
  ...fieldInput,
  docs: {
    field: {
      ...fieldDocs,
      scenes: Array.from({ length: 12 }, (_, index) => ({
        id: `scene-${index}`,
        title: `Scene ${index}`,
        note: `Scene ${index} shows the field.`,
        snippet: {
          id: `field-react-scene-${index}`,
          label: 'Long',
          language: 'tsx' as const,
          source: longSource,
        },
      })),
    },
  },
  examples: [],
  verdicts: new Map(),
};
