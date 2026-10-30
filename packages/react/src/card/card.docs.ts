import cardTokens from '@slotted/styles/card/tokens.json';
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

export const REACT_CARD_TOKENS = cardTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Card decision',
}));

export const REACT_CARD_DOCS = {
  card: {
    api: apiRows([
      [
        'orientation',
        "'vertical' | 'horizontal'",
        'vertical',
        'Card',
        'Puts the media beside the regions, and returns it to the top in a narrow container',
      ],
      [
        'fill',
        "'outline' | 'elevated' | 'subtle'",
        'outline',
        'Card',
        'How the surface is bounded: a hairline edge, the edge plus a lift, or a filled ground',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'Card',
        "The card's own inset. Density is the application's choice; this is this card's",
      ],
      [
        'selected',
        'boolean',
        'false',
        'Card',
        'Mirrors a selection the page owns; the control inside is what announces it',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'Card',
        'Mirrors a control the page has disabled; the card disables nothing itself',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Card, CardMedia, CardHeader, CardActions, CardSelection, CardBody, CardFooter, CardLink',
        'Renders the wiring into another element',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'every part',
        'Reaches the native element; each part extends its own element’s props',
      ],
      [
        'href',
        'string',
        '—',
        'CardLink',
        'Destination of the card, on the anchor whose hit area covers the surface',
      ],
      [
        'CardDefaultsProvider',
        '{ fill, orientation, size }',
        '—',
        'a subtree',
        'Sets the defaults once for every card under it; an explicit prop still wins',
      ],
    ]),
    accessibility: [
      'There is no card pattern in the WAI-ARIA Authoring Practices, and a card is structure rather than a widget. The applicable guidance is Structural Roles: use the HTML element that already carries the meaning.',
      'The root is a div with no role. Use render to make it an article with its own heading, a section, the li of a list of results, or the label of a chooser — whichever the page actually means.',
      'The card contributes no keyboard behavior. CardLink is an anchor, so Enter, the context menu and middle-click are the platform’s.',
      'CardLink is named by its own text. A card whose root were the link would take every string inside it into that name, which is the reason the hit area is stretched from the link instead.',
      'A card carries at most one CardLink, and it navigates. A whole surface that fires a command on any click, with no visible control boundary, is a misclick nobody can undo; put a button in CardActions or the footer instead.',
      'CardActions and CardFooter both sit above the stretched hit area, so a control in either stays operable. An interactive element anywhere else needs position: relative of its own.',
      'Text over the stretched area cannot be selected with the pointer. That is the cost of the whole-card target, and the reason a card with no CardLink stretches nothing.',
      'selected and disabled are painted, never announced. The radio, checkbox or button inside the card is what carries the state for assistive technology.',
      'selected is the accent surface under a hairline accent edge, the pair a selected row paints. In high contrast and forced colors both flatten, and the checked control inside is what carries the state. elevated keeps its hairline because a shadow is removed there outright.',
      'The focus ring is drawn on the card while the link has focus. In a browser without :has() the link keeps its own native outline instead.',
      'A rule between two regions is a Divider written between them. It is announced as a separator unless it is marked decorative, which is usually what a rule inside one card is.',
    ],
    snippets: [
      defineSnippet({
        id: 'card-react-regions',
        language: 'tsx',
        label: 'The regions, and the corner of the header',
        source:
          '<Card>\n  <CardHeader>\n    <Heading level={3}>Northwind billing</Heading>\n    <Text size="sm" tone="muted">\n      Invoices and payment methods\n    </Text>\n    <CardActions>\n      <Badge tone="warning">Overdue</Badge>\n    </CardActions>\n  </CardHeader>\n  <CardBody>The next invoice settles on 1 October.</CardBody>\n  <CardFooter>\n    <button type="button">Pay now</button>\n  </CardFooter>\n</Card>;',
      }),
      defineSnippet({
        id: 'card-react-sections',
        language: 'tsx',
        label: 'A rule between two regions',
        source:
          '<Card>\n  <CardHeader>\n    <Heading level={3}>Review pictures</Heading>\n  </CardHeader>\n  <Divider decorative />\n  <CardBody>Two hundred images since the last visit.</CardBody>\n  <Divider decorative inset />\n  <CardFooter>\n    <Text size="xs" tone="muted">\n      The inset rule lines up with the text\n    </Text>\n  </CardFooter>\n</Card>;',
      }),
      defineSnippet({
        id: 'card-react-link',
        language: 'tsx',
        label: 'One destination, named by the title',
        source:
          '<Card>\n  <CardHeader>\n    <CardLink href="/accounts/northwind">\n      <Heading level={3}>Northwind Traders</Heading>\n    </CardLink>\n  </CardHeader>\n  <CardBody>Twelve open invoices</CardBody>\n  <CardFooter>\n    <a href="/accounts/northwind/settings">Billing settings</a>\n  </CardFooter>\n</Card>;',
      }),
      defineSnippet({
        id: 'card-react-chooser',
        language: 'tsx',
        label: 'A chooser, where the radio owns the state',
        source:
          '<Card render={(props) => <label {...props} />} selected={plan === \'team\'}>\n  <CardHeader>\n    <CardSelection>\n      <input\n        checked={plan === \'team\'}\n        name="plan"\n        onChange={() => setPlan(\'team\')}\n        type="radio"\n        value="team"\n      />\n    </CardSelection>\n    <Heading level={3}>Team</Heading>\n    <Text size="sm" tone="muted">\n      Twenty seats and shared billing\n    </Text>\n  </CardHeader>\n</Card>;',
      }),
      defineSnippet({
        id: 'card-react-horizontal',
        language: 'tsx',
        label: 'Media beside the content, until the card is narrow',
        source:
          '<Card orientation="horizontal">\n  <CardMedia>\n    <img alt="" src={report.cover} />\n  </CardMedia>\n  <CardHeader>\n    <Heading level={3}>Quarterly report</Heading>\n  </CardHeader>\n  <CardBody>Revenue, retention and the accounts that moved them.</CardBody>\n</Card>;',
      }),
      defineSnippet({
        id: 'card-react-defaults',
        language: 'tsx',
        label: 'One decision for every card in the application',
        source:
          '<CardDefaultsProvider fill="elevated" size="lg">\n  <Dashboard />\n</CardDefaultsProvider>;',
      }),
    ],
  },
} as const;
