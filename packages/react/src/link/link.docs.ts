import linkTokens from '@slotted/styles/link/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
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

export const REACT_LINK_TOKENS = linkTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Link decision',
}));

const imports: ReferenceImport = {
  source: "import { Link, LinkDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'a',
    required: true,
    purpose:
      'The link itself. Carries data-ui="link", the axes as data attributes, and every native anchor attribute the consumer passes.',
  },
  {
    part: 'external-icon',
    element: 'span',
    required: false,
    purpose:
      'The marker a new tab earns: the external Glyph inside a directional icon box, sized to the text and hidden from assistive technology. Rendered only when the resolved target is _blank.',
  },
  {
    part: 'external-hint',
    element: 'span',
    required: false,
    purpose:
      'The same warning in words, clipped from view and appended to the accessible name. Rendered with the visually-hidden family.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Every axis on one link inside a sentence, driven by the controls below the canvas. Change underline and watch what a reader has left to recognize the link by.',
    snippet: defineSnippet({
      id: 'link-react-playground',
      language: 'tsx',
      label: 'A link in a sentence',
      source:
        '<p>\n  Read the <Link href="/terms">terms of service</Link> before continuing.\n</p>;',
    }),
  },
  {
    id: 'underline',
    title: 'When the underline is drawn',
    note: 'always is the default and the only value safe inside a sentence: the accent text color clears 4.5:1 against the surface but not 3:1 against the body text beside it.',
    snippet: defineSnippet({
      id: 'link-react-underline',
      language: 'tsx',
      label: 'The three underline values',
      source:
        '<Link href="/invoices">Underlined always</Link>;\n<Link href="/invoices" underline="hover">\n  Underlined on hover\n</Link>;\n<Link href="/invoices" underline="none">\n  Never underlined\n</Link>;',
    }),
  },
  {
    id: 'variants',
    title: 'How the link is painted',
    note: 'accent invites, neutral takes the color of the text around it for a cell or a title, and inverse is the link on a solid surface. Hover moves each one toward the strongest text color its context has.',
    snippet: defineSnippet({
      id: 'link-react-variants',
      language: 'tsx',
      label: 'The three variants',
      source:
        '<Link href="/history">payment history</Link>;\n<Link href="/invoices/0041" underline="hover" variant="neutral">\n  INV-2026-08-0041\n</Link>;\n<Link href="/plans" variant="inverse">\n  Choose a plan\n</Link>;',
    }),
  },
  {
    id: 'external',
    title: 'Leaving the application',
    note: 'One fact told three ways: the safe rel, the marker for the eye, the warning in the accessible name. All three follow the resolved target, so a target written by hand is announced the same way.',
    snippet: defineSnippet({
      id: 'link-react-external',
      language: 'tsx',
      label: 'A link that opens a new tab',
      source:
        '<Link external href="https://example.com/docs">\n  Documentation\n</Link>;\n\n// The same warning, from the attribute instead of the prop.\n<Link href="https://example.com/docs" target="_blank">\n  Documentation\n</Link>;',
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Hover darkens the text and fills the underline, press goes one step further, and an unavailable link keeps its underline so it still reads as a link rather than as plain text.',
    snippet: defineSnippet({
      id: 'link-react-states',
      language: 'tsx',
      label: 'Available, followed and unavailable',
      source:
        '<Link href="/invoices">At rest</Link>;\n<Link href="/invoices" visited>\n  Followed before\n</Link>;\n<Link disabled href="/invoices/0042">\n  Unavailable until the invoice is issued\n</Link>;',
    }),
  },
  {
    id: 'current',
    title: 'The page you are on',
    note: 'aria-current is the input, because it is the attribute a router already writes. The link takes the body color and keeps its underline, and no width changes, so the column beside it does not shift.',
    snippet: defineSnippet({
      id: 'link-react-current',
      language: 'tsx',
      label: 'A navigation list',
      source:
        '<nav aria-label="Workspace">\n  <Link aria-current="page" href="/invoices" underline="hover">\n    Invoices\n  </Link>\n  <Link href="/members" underline="hover">\n    Members\n  </Link>\n</nav>;',
    }),
  },
  {
    id: 'content',
    title: 'Content the link did not choose',
    note: 'A pasted URL with no spaces, a long German compound, and an Arabic sentence. The first two break inside the column instead of widening it; the third mirrors the marker without mirroring the Latin island beside it.',
    snippet: defineSnippet({
      id: 'link-react-content',
      language: 'tsx',
      label: 'Extreme and translated content',
      source:
        '<Link href="/reconciliation">\n  https://billing.example.com/accounts/8412/invoices/2026-08/reconciliation-report\n</Link>;',
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'render substitutes the element for a router link and hands it the destination, and LinkDefaultsProvider decides for a whole application what a link looks like. An explicit prop still wins over both.',
    snippet: defineSnippet({
      id: 'link-react-composition',
      language: 'tsx',
      label: 'A router link, and defaults for the application',
      source:
        '<Link href="/invoices" render={(props) => <RouterLink {...props} to={props.href} />}>\n  Invoices\n</Link>;\n\n<LinkDefaultsProvider underline="hover">\n  <App />\n</LinkDefaultsProvider>;',
    }),
  },
  {
    id: 'accessibility',
    title: 'Keyboard and announcement',
    note: 'Tab reaches every link including the unavailable one, Enter follows the one that has a destination, and Space does nothing because Space does not activate a link.',
    snippet: defineSnippet({
      id: 'link-react-accessibility',
      language: 'tsx',
      label: 'What each link announces',
      source:
        '<Link href="/invoices">A link with a destination</Link>;\n<Link external href="https://example.com/status">\n  A link that leaves the application\n</Link>;\n<Link disabled href="/invoices/0042">\n  A link that is unavailable\n</Link>;',
    }),
  },
];

export const REACT_LINK_DOCS = {
  link: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      ['underline', "'always' | 'hover' | 'none'", 'always', 'Link', 'When the underline is drawn'],
      [
        'variant',
        "'accent' | 'neutral' | 'inverse'",
        'accent',
        'Link',
        'Accent, the color of the surrounding text, or a solid surface',
      ],
      [
        'size',
        "'xs' | 'sm' | 'md'",
        '—',
        'Link',
        'The text size: 12, 13 or 14 pixels on the type scale. Unset, the link takes the size its action slot states — a stat card’s action, a section’s or a chart’s actions state sm — or else its parent’s',
      ],
      ['external', 'boolean', 'false', 'Link', 'Opens a new tab and warns that it does'],
      [
        'messages',
        'Partial<LinkMessages>',
        '—',
        'Link',
        'Words laid over the language in force: the wording of that warning (externalHint)',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'Link',
        'Withholds the destination, keeps the role, the state and the tab stop',
      ],
      ['visited', 'boolean', 'false', 'Link', 'Paints a destination the reader already followed'],
      [
        'href',
        'string',
        '—',
        'Link',
        'The destination, and every other anchor attribute — target, rel, download, hreflang — reaches the element unchanged',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props: LinkRootProps) => ReactNode',
        '—',
        'Link',
        'Substitutes the rendered element. The destination and every data attribute are handed to it, so a router link keeps both.',
      ],
      ['ref', 'Ref<HTMLAnchorElement>', '—', 'Link', 'Reaches the anchor, and focus() with it'],
      [
        'onClick, onAuxClick, onKeyDown',
        'EventHandler',
        '—',
        'Link',
        'Composed rather than replaced. While disabled the family refuses first and the handler is not called.',
      ],
      [
        'LinkDefaultsProvider',
        'underline | variant | visited',
        '—',
        'Application',
        'Sets those three once for everything below it; a prop on the link still wins',
      ],
    ]),
    accessibility: [
      'The rendered element is a plain anchor with an href, so the link role, Enter, the context menu and every modified click come from the platform. Space does not activate a link, and nothing here makes it.',
      'underline="always" is the default because color alone does not distinguish a link: the accent text color clears 4.5:1 against the surface and not 3:1 against the body text beside it.',
      'variant="neutral" takes the color of the text around it, so it belongs where nothing on the line could be mistaken for it — a cell, a title, a row — and never inside a sentence.',
      'Whatever the underline axis says, the underline returns under forced-colors, where the palette flattens the color contrast a bare link relies on.',
      'A new browsing context is announced in the accessible name and marked with a glyph, and both follow the resolved target: a target="_blank" written by hand is warned about exactly like external.',
      'external also sets rel="noopener noreferrer"; a rel or target the consumer passed is kept instead of rewritten.',
      'A disabled link renders no href, which is what stops a middle click as well as a left one, and keeps role="link", aria-disabled and its place in the tab sequence so the state can be discovered.',
      'The current page is painted from aria-current, the attribute a router already writes; the family invents no prop for it.',
    ],
    snippets: [
      defineSnippet({
        id: 'link-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<a data-ui="link" data-part="root" data-underline="always" data-variant="accent" href="/docs">\n  Documentation\n  {/* Rendered only for a new browsing context. */}\n  <span aria-hidden="true" data-part="external-icon">\n    <Icon directional>\n      <Glyph name="external" />\n    </Icon>\n  </span>\n  <span data-part="external-hint" data-ui="visually-hidden">\n    {\' (opens in a new tab)\'}\n  </span>\n</a>;',
      }),
      defineSnippet({
        id: 'link-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='link'] {\n  --slotted-link-underline-offset: 0.2em;\n  --slotted-link-external-icon-gap: 0.2em;\n}",
      }),
    ],
  },
} as const;
