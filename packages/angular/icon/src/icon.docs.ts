import iconTokens from '@slotted/styles/icon/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type { ApiRow } from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_ICON_TOKENS = iconTokens.map((name) => ({
  name,
  purpose: name.startsWith('--slotted-icon-')
    ? 'A decision the foundation does not hold, and the hook a container sets'
    : 'The foundation scale this family reads',
}));

const TONE =
  "'inherit' | 'default' | 'muted' | 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'inverse'";

export const ANGULAR_ICON_DOCS = {
  icon: {
    api: apiRows([
      [
        'size',
        "'text' | 'sm' | 'md' | 'lg'",
        'md',
        'slIcon',
        'Box size; sm, md and lg read the control icon scale, text follows the type',
      ],
      ['tone', TONE, 'inherit', 'slIcon', 'Color; inherit takes the color of the text beside it'],
      [
        'directional',
        'boolean',
        'false',
        'slIcon',
        'The artwork points somewhere, so it mirrors in a right-to-left document',
      ],
      [
        'label',
        'string',
        '—',
        'slIcon',
        'The name the icon carries; absent, the icon leaves the accessibility tree',
      ],
      [
        'content',
        'projected',
        '—',
        'slIcon',
        'The glyph — an ng-icon, an svg, any artwork the consumer projects',
      ],
      [
        'name',
        'GlyphName',
        '—',
        'slGlyph',
        'One of the library’s own icons, drawn as an svg inside the box; families draw theirs with it',
      ],
    ]),
    accessibility: [
      'A glyph is drawn aria-hidden and focusable=false: it is artwork, and the Icon around it is what carries a name. A family’s close button is named by its own aria-label, never by the cross it draws.',
      'There is no decorative input. An icon with no name is hidden with aria-hidden, and an icon with one takes role="img" and carries it, so named and hidden cannot both be true.',
      'WAI-ARIA requires a label on role="img" (§5.2.8 lists img among the roles for which a name is required), which is why the role appears only once a name exists.',
      'An aria-label or aria-labelledby written on the element is read as a name, so the icon a consumer labelled directly keeps its label and stays in the tree.',
      'The name says what the icon means, not what it draws: “Payment failed”, not “red triangle”. An icon that repeats adjacent text is decorative and stays out of the tree.',
      'Color is inherited, so an icon works in forced colors without a rule of its own. Color alone never carries the state: the icon accompanies text, or it carries a name.',
      'size="text" is 1em, so it follows the type it sits in under page zoom and under a text-only resize alike. The sm, md and lg steps read the theme’s control geometry, which page zoom scales and a text-only resize does not; an application that needs the icon to follow text alone uses text, or retunes the density scale in rem.',
      'The optical shift is computed from the cap height of the surrounding font and the size of the box, so an icon stays on the text’s optical line at every combination of the two rather than at the one ratio a constant would fit.',
    ],
    snippets: [
      defineSnippet({
        id: 'icon-angular-library-glyph',
        language: 'angular',
        label: 'The library’s own icons are real svg elements',
        source:
          '<button slButton aria-label="Close">\n  <span slIcon size="sm"><svg slGlyph name="x"></svg></span>\n</button>',
      }),
      defineSnippet({
        id: 'icon-angular-decorative',
        language: 'angular',
        label: 'Beside a label, the icon is decorative',
        source: '<span slIcon><ng-icon name="lucideDownload" /></span>',
      }),
      defineSnippet({
        id: 'icon-angular-named',
        language: 'angular',
        label: 'Alone, the icon carries the name',
        source:
          '<span slIcon label="Payment failed" tone="danger"><ng-icon name="lucideTriangleAlert" /></span>',
      }),
      defineSnippet({
        id: 'icon-angular-directional',
        language: 'angular',
        label: 'Artwork that points somewhere mirrors',
        source: '<span slIcon directional><ng-icon name="lucideArrowRight" /></span>',
      }),
      defineSnippet({
        id: 'icon-angular-container-size',
        language: 'angular',
        label: 'A container sizes every icon inside it, once',
        source:
          '<div style="--slotted-icon-size: var(--slotted-control-icon-size-sm)">\n  <ng-content />\n</div>',
      }),
      defineSnippet({
        id: 'icon-application-defaults',
        language: 'css',
        label: 'Defaults for the whole application, set once',
        source: [
          '/* The family has no provider and no injection token: data-ui is public',
          '   contract, so the cascade sets the defaults and any subtree overrides',
          '   them. An instance that states its own size or tone still wins. */',
          ':root {',
          '  --slotted-icon-size: var(--slotted-control-icon-size-sm);',
          '}',
          '',
          "[data-ui='icon'] svg {",
          '  /* The stroke weight belongs to the icon set, not to the icon. */',
          '  stroke-width: 2.25;',
          '}',
        ].join('\n'),
      }),
    ],
  },
} as const;
