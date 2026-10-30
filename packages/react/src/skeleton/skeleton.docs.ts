import skeletonTokens from '@slotted/styles/skeleton/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_SKELETON_TOKENS = skeletonTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Skeleton decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Skeleton, SkeletonText, SkeletonRegion, SkeletonDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'span',
    required: true,
    purpose:
      'One placeholder box, rendered by Skeleton. Empty it draws the geometry shape and size describe; with children it takes their geometry and covers them.',
  },
  {
    part: 'text',
    element: 'div',
    required: true,
    purpose:
      'The rows of a paragraph, rendered by SkeletonText. A grid whose tracks are exactly one line box, so the rows occupy the lines the words will.',
  },
  {
    part: 'line',
    element: 'span',
    required: true,
    purpose:
      'One row inside text, repeated lines times. The last of several is drawn short; a lone row is not.',
  },
  {
    part: 'region',
    element: 'div',
    required: true,
    purpose:
      'The loading fact for a subtree, rendered by SkeletonRegion. Carries aria-busy, the timing, and the animation phase every placeholder inside it reads.',
  },
  {
    part: 'announcement',
    element: 'span',
    required: true,
    purpose:
      'The one visually-hidden role="status" per region. Holds the label while waiting and is emptied afterwards, so a load announces once.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A member row, driven by the controls below the canvas. Turn loading off and nothing moves — the placeholders were the real content’s own boxes all along.',
    snippet: defineSnippet({
      id: 'skeleton-react-playground',
      language: 'tsx',
      label: 'One placeholder',
      source:
        '<Skeleton loading={pending} shape="circle" size="md">\n  <Avatar name="Ada Lovelace" size="md" />\n</Skeleton>;',
    }),
  },
  {
    id: 'shapes',
    title: 'What the placeholder stands for',
    note: 'Four relationships to the layout rather than four points on a scale: a line of type, a block of content, and the two boxes an avatar can be.',
    snippet: defineSnippet({
      id: 'skeleton-react-shapes',
      language: 'tsx',
      label: 'The four shapes',
      source:
        '<Skeleton shape="text" inlineSize="8rem" />;\n<Skeleton shape="block" blockSize="6rem" />;\n<Skeleton shape="circle" size="lg" />;\n<Skeleton shape="square" size="lg" />;',
    }),
  },
  {
    id: 'text',
    title: 'A paragraph that has not arrived',
    note: 'The rows are exactly one line box each, so three rows are the three lines the words will take — at any type size, at any density, with no height typed anywhere.',
    snippet: defineSnippet({
      id: 'skeleton-react-text',
      language: 'tsx',
      label: 'Reserving a paragraph',
      source:
        '<SkeletonText lines={3} />;\n\n// Ten rows of a list, and a shorter tail.\n<SkeletonText lastLineSize="40%" lines={10} />;',
    }),
  },
  {
    id: 'sizes',
    title: 'The round placeholder and the avatar it replaces',
    note: 'size reads the avatar scale, so a placeholder and the picture that lands in its place are the same box at every step and at every density.',
    snippet: defineSnippet({
      id: 'skeleton-react-sizes',
      language: 'tsx',
      label: 'An avatar placeholder',
      source:
        '<Skeleton shape="circle" size="md" />;\n\n// Once the person has loaded.\n<Avatar name="Ada Lovelace" size="md" />;',
    }),
  },
  {
    id: 'wrapping',
    title: 'Covering content instead of describing it',
    note: 'Give a placeholder children and it takes their box rather than one you typed, so the reserved space cannot disagree with what replaces it.',
    snippet: defineSnippet({
      id: 'skeleton-react-wrapping',
      language: 'tsx',
      label: 'The same markup, loading and loaded',
      source:
        '<Skeleton loading={pending}>\n  <Badge tone="success">Paid in full</Badge>\n</Skeleton>;',
    }),
  },
  {
    id: 'region',
    title: 'One wait, one announcement',
    note: 'The region carries aria-busy and the single status message; every placeholder inside it is hidden, inert, and reads the region loading state instead of its own.',
    snippet: defineSnippet({
      id: 'skeleton-react-region',
      language: 'tsx',
      label: 'A list of members loading',
      source:
        "<SkeletonRegion messages={{ label: 'Loading members' }} loading={pending}>\n  {members.map((member) => (\n    <MemberRow key={member.id} member={member} />\n  ))}\n</SkeletonRegion>;",
    }),
  },
  {
    id: 'timing',
    title: 'The flash, and the flash in reverse',
    note: 'delay withholds the paint until the wait is worth reporting; minDuration holds a placeholder that did appear. Both are zero unless an application sets them.',
    snippet: defineSnippet({
      id: 'skeleton-react-timing',
      language: 'tsx',
      label: 'The recommended pair, set once',
      source:
        '<SkeletonDefaultsProvider delay={200} minDuration={400}>\n  <App />\n</SkeletonDefaultsProvider>;\n\n// onReveal fires when the placeholders actually go, not when loading does.\n<SkeletonRegion loading={pending} onReveal={() => table.focus()}>\n  <Rows />\n</SkeletonRegion>;',
    }),
  },
  {
    id: 'animation',
    title: 'How the wait moves',
    note: 'shimmer sends a band across the placeholder and is the default; pulse dims the fill and back for a quieter surface; none is still. Under reduced motion all three stop.',
    snippet: defineSnippet({
      id: 'skeleton-react-animation',
      language: 'tsx',
      label: 'The three animations',
      source:
        '<SkeletonText animation="shimmer" />;\n<SkeletonText animation="pulse" />;\n<SkeletonText animation="none" />;',
    }),
  },
  {
    id: 'composition',
    title: 'A loading surface a product would ship',
    note: 'An avatar, a name, a role and a status chip, each placeholder standing in the box its own family will occupy, all under one region that owns the wait.',
    snippet: defineSnippet({
      id: 'skeleton-react-composition',
      language: 'tsx',
      label: 'A member row',
      source:
        '<SkeletonRegion messages={{ label: \'Loading members\' }} loading={pending}>\n  <Inline gap="5">\n    <Skeleton shape="circle" size="md" />\n    <Stack gap="2">\n      <Skeleton inlineSize="9rem" shape="text" />\n      <Skeleton inlineSize="5rem" shape="text" />\n    </Stack>\n  </Inline>\n</SkeletonRegion>;',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A narrow column, a right-to-left paragraph where the short row and the sweep both change ends, and a heading whose placeholder is a heading tall without being told what a heading is.',
    snippet: defineSnippet({
      id: 'skeleton-react-content',
      language: 'tsx',
      label: 'The type decides the height',
      source:
        '<Heading level={2}>\n  <Skeleton inlineSize="60%" shape="text" />\n</Heading>;\n\n<div dir="rtl">\n  <SkeletonText lines={3} />\n</div>;',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'Every box is hidden and inert; the region says the label once and then falls silent. Tab through the loading half and focus skips it entirely.',
    snippet: defineSnippet({
      id: 'skeleton-react-accessibility',
      language: 'tsx',
      label: 'The announcement, and switching it off',
      source:
        '<SkeletonRegion messages={{ label: \'Loading invoices\' }} loadedLabel="Invoices loaded">\n  <SkeletonText />\n</SkeletonRegion>;\n\n// A region the reader never waits on says nothing at all.\n<SkeletonRegion live="off">\n  <Skeleton shape="circle" />\n</SkeletonRegion>;',
    }),
  },
];

export const REACT_SKELETON_DOCS = {
  skeleton: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'shape',
        "'text' | 'block' | 'circle' | 'square'",
        'text',
        'Skeleton',
        'What the placeholder stands for: a line of type, a block of content, or an avatar',
      ],
      [
        'size',
        "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
        'md',
        'Skeleton',
        'The avatar scale. Means nothing for text, which takes its height from the type, or for block',
      ],
      [
        'inlineSize, blockSize',
        'number | string',
        '—',
        'Skeleton, SkeletonText',
        'The reserved geometry, in logical axes. A bare number is pixels. Ignored where content is covered and measured instead',
      ],
      [
        'loading',
        'boolean',
        'true',
        'Skeleton, SkeletonText, SkeletonRegion',
        'Whether the content is still on its way. On a box, unset means the nearest region decides',
      ],
      ['lines', 'number', '3', 'SkeletonText', 'How many rows of the paragraph to reserve'],
      [
        'lastLineSize',
        'string',
        '62%',
        'SkeletonText',
        'How wide the last row is drawn, when there is more than one',
      ],
      [
        'animation',
        "'shimmer' | 'pulse' | 'none'",
        'shimmer',
        'Skeleton, SkeletonText, SkeletonRegion',
        'How the wait moves. A region hands its value to everything inside it',
      ],
      [
        'live',
        "'polite' | 'off'",
        'polite',
        'SkeletonRegion',
        'Whether the region announces the wait at all',
      ],
      [
        'messages',
        'Partial<SkeletonMessages>',
        '—',
        'SkeletonRegion',
        'Words laid over the language in force, key by key: what a screen reader hears once, while the region is waiting (label)',
      ],
      [
        'loadedLabel',
        'string',
        '—',
        'SkeletonRegion',
        'What it hears when the content arrives. Silent unless set, so one load says one thing',
      ],
      [
        'delay',
        'number',
        '0',
        'SkeletonRegion',
        'Milliseconds the wait must last before anything is painted',
      ],
      [
        'minDuration',
        'number',
        '0',
        'SkeletonRegion',
        'Milliseconds a placeholder that did appear is held before it is withdrawn',
      ],
    ]),
    events: [
      {
        name: 'onReveal',
        payload: 'void',
        when: 'The placeholders are actually withdrawn — later than loading turning false whenever minDuration is still holding them. It is the moment an application moves focus on.',
      },
    ] satisfies EventRow[],
    composition: apiRows([
      [
        'children',
        'ReactNode',
        '—',
        'Skeleton',
        'Covered rather than replaced: the box takes the content’s own geometry, hides it, and reveals it untouched when loading ends',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Skeleton, SkeletonText, SkeletonRegion',
        'Substitutes the rendered element. Every data attribute and the geometry style are handed to it',
      ],
      [
        'ref',
        'Ref<HTMLSpanElement | HTMLDivElement>',
        '—',
        'all three',
        'Reaches the native element; each part’s props are that element’s, extended',
      ],
      [
        'SkeletonDefaultsProvider',
        'SkeletonDefaults',
        '—',
        'Application',
        'Sets animation, delay, minDuration, loadedLabel, lastLineSize and live once for everything below it; a prop on a region or a box still wins',
      ],
    ]),
    accessibility: [
      'Every placeholder carries aria-hidden="true" and inert while it is painted. Reading out the absence of something is noise, and focus must not fall into content that is not ready — a covered button is unreachable rather than reachable and useless.',
      'aria-hidden="false" written by hand is the escape hatch and survives, because React reads an undefined-valued prop as absent and the only way to remove a defaulted attribute is an explicit value.',
      'The region carries aria-busy="true" while it waits, which is the platform’s own answer: ARIA 1.2 asks an author to set it on the container before the first change and clear it when the last change is complete. There is no APG pattern for a skeleton — the index holds thirty patterns and none is this one.',
      'One region is one announcement. A visually-hidden role="status" holds the label while waiting and is emptied afterwards, and emptying a live region announces nothing, so twelve placeholders do not become twelve messages. loadedLabel opts into a second.',
      'Under prefers-reduced-motion the loop stops rather than shortening: an infinite animation that hurries is still moving. animation="none", set once through the provider, is the author-side mechanism WCAG 2.2 SC 2.2.2 asks for.',
      'The placeholder is visible in all three color schemes. The fill is the unavailable surface carried a little toward the text color, and a hairline rim takes over in high contrast, where that surface is the page’s own white.',
    ],
    snippets: [
      defineSnippet({
        id: 'skeleton-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div aria-busy="true" data-ui="skeleton" data-part="region" data-loading="" data-animation="pulse">\n  <span data-part="announcement" data-ui="visually-hidden" role="status">\n    Loading members\n  </span>\n  <span\n    aria-hidden="true"\n    data-ui="skeleton"\n    data-part="root"\n    data-shape="circle"\n    data-size="md"\n    data-loading=""\n    inert\n  />\n  <div aria-hidden="true" data-ui="skeleton" data-part="text" data-loading="" inert>\n    <span data-part="line" />\n    <span data-part="line" />\n  </div>\n</div>;',
      }),
      defineSnippet({
        id: 'skeleton-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='skeleton'] {\n  --slotted-skeleton-fill: var(--slotted-surface-sunken);\n  --slotted-skeleton-pulse-depth: 0.2;\n  --slotted-skeleton-last-line-size: 45%;\n}",
      }),
    ],
  },
} as const;
