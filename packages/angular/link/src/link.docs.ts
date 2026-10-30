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

export const ANGULAR_LINK_TOKENS = linkTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Link decision',
}));

const imports: ReferenceImport = {
  source: "import { SlLink, provideLinkDefaults } from '@slotted/angular/link';",
  selector: 'a[slLink]',
  exportAs: 'slLink',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'a',
    required: true,
    purpose:
      'The consumer’s own anchor, which is why routerLink, href and every native attribute sit on the same element. Carries data-ui="link" and the axes as data attributes.',
  },
  {
    part: 'external-icon',
    element: 'span',
    required: false,
    purpose:
      'The marker a new tab earns: the external Glyph inside a directional icon box, sized to the text and hidden from assistive technology. Rendered only when the link opens a new browsing context.',
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
    note: 'Every input on one link inside a sentence, driven by the controls below the canvas. Change underline and watch what a reader has left to recognize the link by.',
    snippet: defineSnippet({
      id: 'link-angular-playground',
      language: 'angular',
      label: 'A link in a sentence',
      source: '<p>Read the <a slLink href="/terms">terms of service</a> before continuing.</p>',
    }),
  },
  {
    id: 'underline',
    title: 'When the underline is drawn',
    note: 'always is the default and the only value safe inside a sentence: the accent text color clears 4.5:1 against the surface but not 3:1 against the body text beside it.',
    snippet: defineSnippet({
      id: 'link-angular-underline',
      language: 'angular',
      label: 'The three underline values',
      source:
        '<a slLink href="/invoices">Underlined always</a>\n<a slLink href="/invoices" underline="hover">Underlined on hover</a>\n<a slLink href="/invoices" underline="none">Never underlined</a>',
    }),
  },
  {
    id: 'variants',
    title: 'How the link is painted',
    note: 'accent invites, neutral takes the color of the text around it for a cell or a title, and inverse is the link on a solid surface. Hover moves each one toward the strongest text color its context has.',
    snippet: defineSnippet({
      id: 'link-angular-variants',
      language: 'angular',
      label: 'The three variants',
      source:
        '<a slLink href="/history">payment history</a>\n<a slLink href="/invoices/0041" underline="hover" variant="neutral">INV-2026-08-0041</a>\n<a slLink href="/plans" variant="inverse">Choose a plan</a>',
    }),
  },
  {
    id: 'external',
    title: 'Leaving the application',
    note: 'One fact told three ways: the safe rel, the marker for the eye, the warning in the accessible name. A static target="_blank" the consumer wrote states the same fact and earns the same three.',
    snippet: defineSnippet({
      id: 'link-angular-external',
      language: 'angular',
      label: 'A link that opens a new tab',
      source:
        '<a slLink external href="https://example.com/docs">Documentation</a>\n<a slLink href="https://example.com/docs" target="_blank">Documentation</a>',
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Hover darkens the text and fills the underline, press goes one step further, and an unavailable link keeps its underline so it still reads as a link rather than as plain text.',
    snippet: defineSnippet({
      id: 'link-angular-states',
      language: 'angular',
      label: 'Available, followed and unavailable',
      source:
        '<a slLink href="/invoices">At rest</a>\n<a slLink href="/invoices" visited>Followed before</a>\n<a slLink disabled href="/invoices/0042">Unavailable until the invoice is issued</a>',
    }),
  },
  {
    id: 'current',
    title: 'The page you are on',
    note: 'routerLinkActive writes aria-current through ariaCurrentWhenActive, and the stylesheet paints that attribute. The family declares no input for it and nothing to keep in sync.',
    snippet: defineSnippet({
      id: 'link-angular-current',
      language: 'angular',
      label: 'A navigation list driven by the router',
      source:
        '<nav aria-label="Workspace">\n  <a slLink routerLink="/invoices" routerLinkActive ariaCurrentWhenActive="page" underline="hover"\n    >Invoices</a\n  >\n  <a slLink routerLink="/members" routerLinkActive ariaCurrentWhenActive="page" underline="hover"\n    >Members</a\n  >\n</nav>',
    }),
  },
  {
    id: 'content',
    title: 'Content the link did not choose',
    note: 'A pasted URL with no spaces, a long German compound, and an Arabic sentence. The first two break inside the column instead of widening it; the third mirrors the marker without mirroring the Latin island beside it.',
    snippet: defineSnippet({
      id: 'link-angular-content',
      language: 'angular',
      label: 'Extreme and translated content',
      source:
        '<a slLink href="/reconciliation"\n  >https://billing.example.com/accounts/8412/invoices/2026-08/reconciliation-report</a\n>',
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'The directive sits on the anchor the consumer wrote, so routerLink, a static href and a dense table cell all compose with it. provideLinkDefaults decides for a whole application what a link looks like.',
    snippet: defineSnippet({
      id: 'link-angular-composition',
      language: 'ts',
      label: 'Defaults for the application',
      source:
        "bootstrapApplication(App, {\n  providers: [provideLinkDefaults({ underline: 'hover' })],\n});",
    }),
  },
  {
    id: 'accessibility',
    title: 'Keyboard and announcement',
    note: 'Tab reaches every link including the unavailable one, Enter follows the one that has a destination, and Space does nothing because Space does not activate a link.',
    snippet: defineSnippet({
      id: 'link-angular-accessibility',
      language: 'angular',
      label: 'What each link announces',
      source:
        '<a slLink href="/invoices">A link with a destination</a>\n<a slLink external href="https://example.com/status">A link that leaves the application</a>\n<a slLink disabled href="/invoices/0042">A link that is unavailable</a>',
    }),
  },
];

export const ANGULAR_LINK_DOCS = {
  link: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'underline',
        "'always' | 'hover' | 'none'",
        'always',
        'slLink',
        'When the underline is drawn',
      ],
      [
        'variant',
        "'accent' | 'neutral' | 'inverse'",
        'accent',
        'slLink',
        'Accent, the color of the surrounding text, or a solid surface',
      ],
      [
        'size',
        "'xs' | 'sm' | 'md'",
        '—',
        'slLink',
        'The text size: 12, 13 or 14 pixels on the type scale. Unset, the link takes the size its action slot states — a stat card’s action, a section’s or a chart’s actions state sm — or else its parent’s',
      ],
      ['external', 'boolean', 'false', 'slLink', 'Opens a new tab and warns that it does'],
      [
        'messages',
        'Partial<LinkMessages>',
        '—',
        'slLink',
        'Words laid over the language in force: the wording of that warning (externalHint)',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slLink',
        'Withholds the destination, keeps the role, the state and the tab stop',
      ],
      ['visited', 'boolean', 'false', 'slLink', 'Paints a destination the reader already followed'],
    ]),
    composition: apiRows([
      [
        'href, target, rel, download',
        'attribute',
        '—',
        'The anchor',
        'The consumer’s own attributes. rel and target are added only when the anchor carries neither, and never rewritten.',
      ],
      [
        'routerLink, routerLinkActive',
        'directive',
        '—',
        'The same element',
        'The directive claims no destination of its own, so the router writes href and aria-current on the anchor it already owns',
      ],
      [
        'exportAs="slLink"',
        'template reference',
        '—',
        'Template',
        'Reaches the instance, for a template that needs to read the resolved axes',
      ],
      [
        'provideLinkDefaults',
        'underline | variant | visited',
        '—',
        'Application',
        'Sets those three once for the whole injector; an input on the link still wins',
      ],
    ]),
    accessibility: [
      'The directive sits on the consumer’s own anchor, so the link role, Enter, the context menu and every modified click come from the platform — and routerLink composes on the same element. Space does not activate a link, and nothing here makes it.',
      'underline="always" is the default because color alone does not distinguish a link: the accent text color clears 4.5:1 against the surface and not 3:1 against the body text beside it.',
      'variant="neutral" takes the color of the text around it, so it belongs where nothing on the line could be mistaken for it — a cell, a title, a row — and never inside a sentence.',
      'Whatever the underline axis says, the underline returns under forced-colors, where the palette flattens the color contrast a bare link relies on.',
      'A new browsing context is announced in the accessible name and marked with a glyph. external states it, and so does a static target="_blank" the consumer wrote.',
      'rel and target are added only when the anchor carries neither, so an attribute the consumer wrote is never rewritten or removed.',
      'A disabled link keeps no href, which is what stops a middle click as well as a left one, and keeps role="link", aria-disabled and its place in the tab sequence so the state can be discovered.',
      'The current page is painted from aria-current, which routerLinkActive writes through ariaCurrentWhenActive; the family invents no input for it.',
    ],
    snippets: [
      defineSnippet({
        id: 'link-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<a data-ui="link" data-part="root" data-underline="always" data-variant="accent" href="/docs">\n  Documentation\n  <span aria-hidden="true" data-part="external-icon">\n    <span slIcon directional><svg slGlyph name="external"></svg></span>\n  </span>\n  <span data-part="external-hint" data-ui="visually-hidden"> (opens in a new tab)</span>\n</a>',
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
