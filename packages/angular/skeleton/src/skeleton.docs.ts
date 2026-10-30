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

export const ANGULAR_SKELETON_TOKENS = skeletonTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Skeleton decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlSkeleton, SlSkeletonText, SlSkeletonRegion, provideSkeletonDefaults } from '@slotted/angular/skeleton';",
  selector: '[slSkeleton] · [slSkeletonText] · [slSkeletonRegion]',
  exportAs: 'slSkeleton · slSkeletonText · slSkeletonRegion',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'span',
    required: true,
    purpose:
      'One placeholder box, on whatever element you put slSkeleton on — the selector is a bare attribute, so a word’s placeholder lives in a span and a card’s lives in the card. Empty it draws the geometry shape and size describe; with projected content it takes that content’s geometry and covers it.',
  },
  {
    part: 'text',
    element: 'div',
    required: true,
    purpose:
      'The rows of a paragraph, on your own element, from slSkeletonText. A grid whose tracks are exactly one line box, so the rows occupy the lines the words will.',
  },
  {
    part: 'line',
    element: 'span',
    required: true,
    purpose:
      'One row inside text, repeated lines times by the component’s own template. The last of several is drawn short; a lone row is not.',
  },
  {
    part: 'region',
    element: 'div',
    required: true,
    purpose:
      'The loading fact for a subtree, on your own element — a section, a tbody, a list item — from slSkeletonRegion. Carries aria-busy, the timing, and the animation phase every placeholder inside it reads through DI.',
  },
  {
    part: 'announcement',
    element: 'span',
    required: true,
    purpose:
      'The one visually-hidden role="status" per region, projected before the consumer’s own content. Holds the label while waiting and is emptied afterwards, so a load announces once.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A member row, driven by the controls below the canvas. Turn loading off and nothing moves — the placeholders were the real content’s own boxes all along.',
    snippet: defineSnippet({
      id: 'skeleton-angular-playground',
      language: 'angular',
      label: 'One placeholder',
      source:
        '<span slSkeleton shape="circle" size="md" [loading]="pending()">\n  <span slAvatar name="Ada Lovelace" size="md"></span>\n</span>',
    }),
  },
  {
    id: 'shapes',
    title: 'What the placeholder stands for',
    note: 'Four relationships to the layout rather than four points on a scale: a line of type, a block of content, and the two boxes an avatar can be.',
    snippet: defineSnippet({
      id: 'skeleton-angular-shapes',
      language: 'angular',
      label: 'The four shapes',
      source:
        '<span slSkeleton shape="text" inlineSize="8rem"></span>\n<span slSkeleton shape="block" blockSize="6rem"></span>\n<span slSkeleton shape="circle" size="lg"></span>\n<span slSkeleton shape="square" size="lg"></span>',
    }),
  },
  {
    id: 'text',
    title: 'A paragraph that has not arrived',
    note: 'The rows are exactly one line box each, so three rows are the three lines the words will take — at any type size, at any density, with no height typed anywhere.',
    snippet: defineSnippet({
      id: 'skeleton-angular-text',
      language: 'angular',
      label: 'Reserving a paragraph',
      source:
        '<div slSkeletonText [lines]="3"></div>\n\n<!-- Ten rows of a list, and a shorter tail. -->\n<div slSkeletonText [lines]="10" lastLineSize="40%"></div>',
    }),
  },
  {
    id: 'sizes',
    title: 'The round placeholder and the avatar it replaces',
    note: 'size reads the avatar scale, so a placeholder and the picture that lands in its place are the same box at every step and at every density.',
    snippet: defineSnippet({
      id: 'skeleton-angular-sizes',
      language: 'angular',
      label: 'An avatar placeholder',
      source:
        '<span slSkeleton shape="circle" size="md"></span>\n\n<!-- Once the person has loaded. -->\n<span slAvatar name="Ada Lovelace" size="md"></span>',
    }),
  },
  {
    id: 'wrapping',
    title: 'Covering content instead of describing it',
    note: 'Project content into a placeholder and it takes that content’s box rather than one you typed, so the reserved space cannot disagree with what replaces it.',
    snippet: defineSnippet({
      id: 'skeleton-angular-wrapping',
      language: 'angular',
      label: 'The same markup, loading and loaded',
      source:
        '<span slSkeleton [loading]="pending()">\n  <span slBadge tone="success">Paid in full</span>\n</span>',
    }),
  },
  {
    id: 'region',
    title: 'One wait, one announcement',
    note: 'The region carries aria-busy and the single status message; every placeholder inside it is hidden, inert, and reads the region loading state through DI instead of its own input.',
    snippet: defineSnippet({
      id: 'skeleton-angular-region',
      language: 'angular',
      label: 'A list of members loading',
      source:
        '<section slSkeletonRegion [messages]="{ label: \'Loading members\' }" [loading]="pending()">\n  @for (member of members(); track member.id) {\n    <app-member-row [member]="member" />\n  }\n</section>',
    }),
  },
  {
    id: 'timing',
    title: 'The flash, and the flash in reverse',
    note: 'delay withholds the paint until the wait is worth reporting; minDuration holds a placeholder that did appear. Both are zero unless an application sets them.',
    snippet: defineSnippet({
      id: 'skeleton-angular-timing',
      language: 'ts',
      label: 'The recommended pair, set once',
      source:
        'bootstrapApplication(App, {\n  providers: [provideSkeletonDefaults({ delay: 200, minDuration: 400 })],\n});',
    }),
  },
  {
    id: 'animation',
    title: 'How the wait moves',
    note: 'shimmer sends a band across the placeholder and is the default; pulse dims the fill and back for a quieter surface; none is still. Under reduced motion all three stop.',
    snippet: defineSnippet({
      id: 'skeleton-angular-animation',
      language: 'angular',
      label: 'The three animations',
      source:
        '<div slSkeletonText animation="shimmer"></div>\n<div slSkeletonText animation="pulse"></div>\n<div slSkeletonText animation="none"></div>',
    }),
  },
  {
    id: 'composition',
    title: 'A loading surface a product would ship',
    note: 'An avatar, a name, a role and a status chip, each placeholder standing in the box its own family will occupy, all under one region that owns the wait.',
    snippet: defineSnippet({
      id: 'skeleton-angular-composition',
      language: 'angular',
      label: 'A member row',
      source:
        '<div slSkeletonRegion [messages]="{ label: \'Loading members\' }" [loading]="pending()">\n  <div slInline gap="5">\n    <span slSkeleton shape="circle" size="md"></span>\n    <div slStack gap="2">\n      <span slSkeleton shape="text" inlineSize="9rem"></span>\n      <span slSkeleton shape="text" inlineSize="5rem"></span>\n    </div>\n  </div>\n</div>',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A narrow column, a right-to-left paragraph where the short row and the sweep both change ends, and a heading whose placeholder is a heading tall without being told what a heading is.',
    snippet: defineSnippet({
      id: 'skeleton-angular-content',
      language: 'angular',
      label: 'The type decides the height',
      source:
        '<h2 slHeading [level]="2">\n  <span slSkeleton shape="text" inlineSize="60%"></span>\n</h2>\n\n<div dir="rtl">\n  <div slSkeletonText [lines]="3"></div>\n</div>',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'Every box is hidden and inert; the region says the label once and then falls silent. Tab through the loading half and focus skips it entirely.',
    snippet: defineSnippet({
      id: 'skeleton-angular-accessibility',
      language: 'angular',
      label: 'The announcement, and switching it off',
      source:
        '<div slSkeletonRegion [messages]="{ label: \'Loading invoices\' }" loadedLabel="Invoices loaded">\n  <div slSkeletonText></div>\n</div>\n\n<!-- A region the reader never waits on says nothing at all. -->\n<div slSkeletonRegion live="off">\n  <span slSkeleton shape="circle"></span>\n</div>',
    }),
  },
];

export const ANGULAR_SKELETON_DOCS = {
  skeleton: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'shape',
        "'text' | 'block' | 'circle' | 'square'",
        'text',
        'SlSkeleton',
        'What the placeholder stands for: a line of type, a block of content, or an avatar',
      ],
      [
        'size',
        "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
        'md',
        'SlSkeleton',
        'The avatar scale. Means nothing for text, which takes its height from the type, or for block',
      ],
      [
        'inlineSize, blockSize',
        'string',
        '—',
        'SlSkeleton, SlSkeletonText',
        'The reserved geometry, in logical axes, written straight onto the family’s own custom properties. Ignored where content is covered and measured instead',
      ],
      [
        'loading',
        'boolean',
        'true',
        'SlSkeleton, SlSkeletonText, SlSkeletonRegion',
        'Whether the content is still on its way. On a box, unset means the nearest region decides',
      ],
      ['lines', 'number', '3', 'SlSkeletonText', 'How many rows of the paragraph to reserve'],
      [
        'lastLineSize',
        'string',
        '62%',
        'SlSkeletonText',
        'How wide the last row is drawn, when there is more than one',
      ],
      [
        'animation',
        "'shimmer' | 'pulse' | 'none'",
        'shimmer',
        'SlSkeleton, SlSkeletonText, SlSkeletonRegion',
        'How the wait moves. A region hands its value to everything inside it',
      ],
      [
        'live',
        "'polite' | 'off'",
        'polite',
        'SlSkeletonRegion',
        'Whether the region announces the wait at all',
      ],
      [
        'messages',
        'Partial<SkeletonMessages>',
        '—',
        'SlSkeletonRegion',
        'Words laid over the language in force, key by key: what a screen reader hears once, while the region is waiting (label)',
      ],
      [
        'loadedLabel',
        'string',
        '—',
        'SlSkeletonRegion',
        'What it hears when the content arrives. Silent unless set, so one load says one thing',
      ],
      [
        'delay',
        'number',
        '0',
        'SlSkeletonRegion',
        'Milliseconds the wait must last before anything is painted',
      ],
      [
        'minDuration',
        'number',
        '0',
        'SlSkeletonRegion',
        'Milliseconds a placeholder that did appear is held before it is withdrawn',
      ],
    ]),
    events: [
      {
        name: '(reveal)',
        payload: 'void',
        when: 'The placeholders are actually withdrawn — later than loading turning false whenever minDuration is still holding them. It is the moment an application moves focus on.',
      },
    ] satisfies EventRow[],
    composition: apiRows([
      [
        '<ng-content>',
        '—',
        '—',
        'SlSkeleton, SlSkeletonRegion',
        'Content is covered rather than replaced: the box takes its geometry, hides it, and reveals it untouched when loading ends',
      ],
      [
        'the selector',
        '[slSkeleton], [slSkeletonText], [slSkeletonRegion]',
        '—',
        'all three',
        'Bare attributes, so the element stays yours — a span, a li, a tbody, a section — and your own attributes and listeners sit on it',
      ],
      [
        'exportAs',
        'slSkeleton | slSkeletonText | slSkeletonRegion',
        '—',
        'all three',
        'Reaches the instance from a template, including painted(), which is not the same signal as loading',
      ],
      [
        'provideSkeletonDefaults()',
        'SkeletonDefaults',
        '—',
        'Application',
        'Sets the animation, the measure and the timing once through SKELETON_DEFAULTS_TOKEN; an input on a region or a box still wins',
      ],
    ]),
    accessibility: [
      'Every placeholder carries aria-hidden="true" and inert while it is painted. Reading out the absence of something is noise, and focus must not fall into content that is not ready — a covered button is unreachable rather than reachable and useless.',
      'An aria-hidden you wrote on your own element is read once through HostAttributeToken and kept, so a placeholder that has to stay announced can be, and the host binding never writes over a static attribute.',
      'The region carries aria-busy="true" while it waits, which is the platform’s own answer: ARIA 1.2 asks an author to set it on the container before the first change and clear it when the last change is complete. There is no APG pattern for a skeleton — the index holds thirty patterns and none is this one.',
      'One region is one announcement. A visually-hidden role="status" holds the label while waiting and is emptied afterwards, and emptying a live region announces nothing, so twelve placeholders do not become twelve messages. loadedLabel opts into a second.',
      'Under prefers-reduced-motion the loop stops rather than shortening: an infinite animation that hurries is still moving. animation="none", set once through the provider, is the author-side mechanism WCAG 2.2 SC 2.2.2 asks for.',
      'The placeholder is visible in all three colour schemes. The fill is the unavailable surface carried a little toward the text colour, and a hairline rim takes over in high contrast, where that surface is the page’s own white.',
    ],
    snippets: [
      defineSnippet({
        id: 'skeleton-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div data-ui="skeleton" data-part="region" data-animation="pulse" data-loading="" aria-busy="true">\n  <span data-part="announcement" data-ui="visually-hidden" role="status">Loading members</span>\n  <span\n    data-ui="skeleton"\n    data-part="root"\n    data-shape="circle"\n    data-size="md"\n    data-loading=""\n    aria-hidden="true"\n    inert\n  ></span>\n  <div data-ui="skeleton" data-part="text" data-loading="" aria-hidden="true" inert>\n    <span data-part="line"></span>\n    <span data-part="line"></span>\n  </div>\n</div>',
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
