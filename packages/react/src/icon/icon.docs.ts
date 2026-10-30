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

export const REACT_ICON_TOKENS = iconTokens.map((name) => ({
  name,
  purpose: name.startsWith('--slotted-icon-')
    ? 'A decision the foundation does not hold, and the hook a container sets'
    : 'The foundation scale this family reads',
}));

const TONE =
  "'inherit' | 'default' | 'muted' | 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'inverse'";

export const REACT_ICON_DOCS = {
  icon: {
    api: apiRows([
      [
        'size',
        "'text' | 'sm' | 'md' | 'lg'",
        'md',
        'Icon',
        'Box size; sm, md and lg read the control icon scale, text follows the type',
      ],
      ['tone', TONE, 'inherit', 'Icon', 'Color; inherit takes the color of the text beside it'],
      [
        'directional',
        'boolean',
        'false',
        'Icon',
        'The artwork points somewhere, so it mirrors in a right-to-left document',
      ],
      [
        'label',
        'string',
        '—',
        'Icon',
        'The name the icon carries; absent, the icon leaves the accessibility tree',
      ],
      ['children', 'ReactNode', '—', 'Icon', 'The glyph — a Lucide component, an svg, any artwork'],
      [
        'name',
        'GlyphName',
        '—',
        'Glyph',
        'One of the library’s own icons, drawn as an svg inside the box; families draw theirs with it',
      ],
    ]),
    accessibility: [
      'A glyph is drawn aria-hidden and focusable=false: it is artwork, and the Icon around it is what carries a name. A family’s close button is named by its own aria-label, never by the cross it draws.',
      'There is no decorative prop. An icon with no name is hidden with aria-hidden, and an icon with one takes role="img" and carries it, so named and hidden cannot both be true.',
      'WAI-ARIA requires a label on role="img" (§5.2.8 lists img among the roles for which a name is required), which is why the role appears only once a name exists.',
      'A name written as aria-label or aria-labelledby counts as much as the label prop, so the icon a consumer labelled directly is not hidden from the tree.',
      'The name says what the icon means, not what it draws: “Payment failed”, not “red circle”. An icon that repeats adjacent text is decorative and stays out of the tree.',
      'Color is inherited, so an icon works in forced colors without a rule of its own. Color alone never carries the state: the icon accompanies text, or it carries a name.',
      'size="text" is 1em, so it follows the type it sits in under page zoom and under a text-only resize alike. The sm, md and lg steps read the theme’s control geometry, which page zoom scales and a text-only resize does not; an application that needs the icon to follow text alone uses text, or retunes the density scale in rem.',
      'The optical shift is computed from the cap height of the surrounding font and the size of the box, so an icon stays on the text’s optical line at every combination of the two rather than at the one ratio a constant would fit.',
    ],
    snippets: [
      defineSnippet({
        id: 'icon-react-library-glyph',
        language: 'tsx',
        label: 'The library’s own icons are real svg elements',
        source:
          '<Button aria-label="Close">\n  <Icon size="sm">\n    <Glyph name="x" />\n  </Icon>\n</Button>;',
      }),
      defineSnippet({
        id: 'icon-react-decorative',
        language: 'tsx',
        label: 'Beside a label, the icon is decorative',
        source: '<Icon>\n  <Download />\n</Icon>;',
      }),
      defineSnippet({
        id: 'icon-react-named',
        language: 'tsx',
        label: 'Alone, the icon carries the name',
        source: '<Icon label="Payment failed" tone="danger">\n  <TriangleAlert />\n</Icon>;',
      }),
      defineSnippet({
        id: 'icon-react-directional',
        language: 'tsx',
        label: 'Artwork that points somewhere mirrors',
        source: '<Icon directional>\n  <ArrowRight />\n</Icon>;',
      }),
      defineSnippet({
        id: 'icon-react-container-size',
        language: 'tsx',
        label: 'A container sizes every icon inside it, once',
        source:
          "<div style={{ ['--slotted-icon-size']: 'var(--slotted-control-icon-size-sm)' }}>{rows}</div>;",
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
