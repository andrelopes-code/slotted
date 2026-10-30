import hoverCardTokens from '@slotted/styles/hover-card/tokens.json';
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

export const REACT_HOVER_CARD_TOKENS = hoverCardTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Hover card decision',
}));

const imports: ReferenceImport = {
  source:
    "import { HoverCard, HoverCardTrigger, HoverCardContent, HoverCardDefaultsProvider } from '@slotted/react';\nimport { PopoverBody, PopoverTitle, PopoverFooter } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'a, or the element render returns',
    required: true,
    purpose:
      'The trigger: the link the card is about. It carries data-ui="hover-card", data-open while its card shows, and — only when the card is navigable — aria-haspopup="dialog", aria-expanded and aria-controls. The card itself is the popover family unchanged, data-ui="popover", so this family declares no other part.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Rest the pointer on the mention, or Tab to it: the card opens after the delay under the pointer and at once under focus. The controls under the canvas move both delays and make the card navigable.',
    snippet: defineSnippet({
      id: 'hover-card-react-playground',
      language: 'tsx',
      label: 'A mention and its card',
      source: `<HoverCard>
  <HoverCardTrigger href="/people/ana">@ana.souza</HoverCardTrigger>
  <HoverCardContent>
    <PopoverBody>…</PopoverBody>
  </HoverCardContent>
</HoverCard>;`,
    }),
  },
  {
    id: 'mention',
    title: 'A person',
    note: 'The card a review thread shows for a handle: avatar, name, team and what they own, under the word it is about. While it shows, the word carries a tint and a halo that grow the inline box without moving the line — the sentence under it has not shifted.',
    snippet: defineSnippet({
      id: 'hover-card-react-mention',
      language: 'tsx',
      label: 'The card is the popover’s parts, unchanged',
      source: `<HoverCard defaultOpen>
  <HoverCardTrigger href="/people/ana">@ana.souza</HoverCardTrigger>
  <HoverCardContent>
    <PopoverBody>
      <Avatar name="Ana Souza" />…
    </PopoverBody>
  </HoverCardContent>
</HoverCard>;`,
    }),
  },
  {
    id: 'link-preview',
    title: 'A document',
    note: 'The card a link to a spec shows: its title, who touched it last and its first lines. The trigger stays a link — Enter follows it, a middle click opens it in a tab — and the card adds nothing the destination does not have.',
    snippet: defineSnippet({
      id: 'hover-card-react-link-preview',
      language: 'tsx',
      label: 'A preview of where the link goes',
      source: `<HoverCard>
  <HoverCardTrigger href="/specs/checkout-pricing">
    Checkout redesign — pricing table
  </HoverCardTrigger>
  <HoverCardContent>
    <PopoverHeader>
      <PopoverTitle>Checkout redesign — pricing table</PopoverTitle>
      <PopoverDescription>Product spec · updated 2 hours ago</PopoverDescription>
    </PopoverHeader>
    <PopoverBody>…</PopoverBody>
  </HoverCardContent>
</HoverCard>;`,
    }),
  },
  {
    id: 'navigable',
    title: 'Navigable',
    note: 'The card holds a control, so the page says so with navigable: the panel becomes a dialog named by its title, the link announces the popup, and Tab from the open link enters the card. Past its last control a focus guard closes it and puts focus back on the link, which does not reopen.',
    snippet: defineSnippet({
      id: 'hover-card-react-navigable',
      language: 'tsx',
      label: 'A card the keyboard can enter',
      source: `<HoverCard navigable>
  <HoverCardTrigger href="/people/ana">@ana.souza</HoverCardTrigger>
  <HoverCardContent>
    <PopoverHeader>
      <PopoverTitle>Ana Souza</PopoverTitle>
    </PopoverHeader>
    <PopoverBody>…</PopoverBody>
    <PopoverFooter>
      <Button size="sm">Follow</Button>
    </PopoverFooter>
  </HoverCardContent>
</HoverCard>;`,
    }),
  },
  {
    id: 'delay',
    title: 'The delays',
    note: 'Two of the same card: the left opens after the default 600 ms and closes 300 ms after the pointer has left; the right answers at once and holds for a second, for a page where the preview is the point. Focus never waits on either.',
    snippet: defineSnippet({
      id: 'hover-card-react-delay',
      language: 'tsx',
      label: 'Per card, or once for an application',
      source: `<HoverCard openDelay={0} closeDelay={1000}>
  …
</HoverCard>;

<HoverCardDefaultsProvider openDelay={400}>
  <App />
</HoverCardDefaultsProvider>;`,
    }),
  },
  {
    id: 'shared',
    title: 'One card, many mentions',
    note: 'A thread with four handles and one HoverCard around all of them. The mention the pointer rests on registers itself as the anchor, and the request carries the event whose currentTarget names the person, so the card fills from one state instead of mounting four.',
    snippet: defineSnippet({
      id: 'hover-card-react-shared',
      language: 'tsx',
      label: 'The request carries the event, and the event names the trigger',
      source: `const [handle, setHandle] = useState<string | null>(null);

<HoverCard
  onOpenChange={(open, request) => {
    const target = (request.source as Event | undefined)?.currentTarget;
    if (open && target instanceof HTMLElement) setHandle(target.dataset['handle'] ?? null);
  }}
>
  <p>
    <HoverCardTrigger data-handle="ana.souza" href="/people/ana">
      @ana.souza
    </HoverCardTrigger>{' '}
    and{' '}
    <HoverCardTrigger data-handle="marcus.lee" href="/people/marcus">
      @marcus.lee
    </HoverCardTrigger>
  </p>
  <HoverCardContent>{people[handle]}</HoverCardContent>
</HoverCard>;`,
    }),
  },
  {
    id: 'touch',
    title: 'On touch',
    note: 'There is no hover on a touch screen: the first tap on the mention opens the card instead of following the link, and a tap on the open mention follows it. The cost is one extra tap to navigate; the alternative is a preview no touch reader ever sees.',
    snippet: defineSnippet({
      id: 'hover-card-react-touch',
      language: 'tsx',
      label: 'Nothing to write: the first tap opens, the second follows',
      source: `<HoverCard>
  <HoverCardTrigger href="/people/ana">@ana.souza</HoverCardTrigger>
  <HoverCardContent>…</HoverCardContent>
</HoverCard>;`,
    }),
  },
  {
    id: 'composition',
    title: 'On another family’s link',
    note: 'The trigger rendered onto Link: the link keeps its own paint and its identity, and takes only the state and the listeners from this family. The Close part inside the card is the popover’s, and it is what a touch reader has in place of Escape.',
    snippet: defineSnippet({
      id: 'hover-card-react-composition',
      language: 'tsx',
      label: 'render hands the wiring to the consumer’s element',
      source: `<HoverCard>
  <HoverCardTrigger href="/people/ana" render={(props) => <Link {...props} variant="neutral" />}>
    Ana Souza
  </HoverCardTrigger>
  <HoverCardContent>
    <PopoverHeader>
      <PopoverTitle>Ana Souza</PopoverTitle>
      <PopoverClose />
    </PopoverHeader>
  </HoverCardContent>
</HoverCard>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'From the keyboard',
    note: "Tab onto the mention: the card opens in the same task, without the pointer's delay. Escape closes it and leaves focus where it is, and the mention does not reopen until focus has left it once. Tab on moves focus down the page and closes the card with the reason blur.",
    snippet: defineSnippet({
      id: 'hover-card-react-keyboard',
      language: 'tsx',
      label: 'Focus opens; blur, Escape and the guards close',
      source: `<HoverCard onOpenChange={(open, request) => log(request.reason)}>
  <HoverCardTrigger href="/people/ana">@ana.souza</HoverCardTrigger>
  <HoverCardContent>…</HoverCardContent>
</HoverCard>;`,
    }),
  },
];

const api = apiRows([
  [
    'open',
    'boolean | undefined',
    '—',
    'HoverCard',
    'Whether the card shows. Present at all puts the card in controlled mode: it asks and waits.',
  ],
  [
    'defaultOpen',
    'boolean',
    '—',
    'HoverCard',
    'The value an uncontrolled card starts from, read once.',
  ],
  [
    'onOpenChange',
    '(open, request) => void',
    '—',
    'HoverCard',
    'Asked before the card opens or closes, with the reason and the originating event, and refusable.',
  ],
  [
    'openDelay',
    'number',
    '600',
    'HoverCard',
    'Milliseconds the pointer rests on the trigger before the card opens. Focus never waits.',
  ],
  [
    'closeDelay',
    'number',
    '300',
    'HoverCard',
    'Milliseconds after the pointer has left trigger and card before it closes; a pointer on its way to the card is not counted as gone.',
  ],
  [
    'navigable',
    'boolean',
    'false',
    'HoverCard',
    'Whether the card holds controls a keyboard reader can reach. On, the panel is a dialog, the link announces it and Tab enters it; off, the panel is presentation.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'HoverCard',
    'The card never opens. The link keeps working, and carries no disabled state.',
  ],
  [
    'sideOffset',
    'number',
    '4',
    'HoverCard',
    'The popover’s own axis, with the family’s default: the halo the open mark draws plus the same again of air, so the arrow’s tip stands off the word.',
  ],
  [
    'side, align, size, width, arrow, mount, …',
    'PopoverProps',
    '—',
    'HoverCard',
    'Every prop of Popover except autoFocus, which the family forces off, reaches the popover it renders.',
  ],
  [
    'render',
    '(props) => ReactNode',
    '—',
    'HoverCardTrigger',
    "Renders the consumer's own element as the trigger — a Link, an avatar button — with the identity, the state and the listeners on it.",
  ],
]);

const events: EventRow[] = [
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: HoverCardChangeRequest)',
    when: 'Before the card opens or closes. The request carries pointer (hover in, hover out, a tap), keyboard (focus arriving, a focus guard), escape, outsidePress, blur (focus leaving the trigger), dismiss (the Close part) or programmatic, the originating event, and cancel().',
  },
];

const composition = apiRows([
  [
    'HoverCardDefaultsProvider',
    'component',
    '—',
    'Application',
    'Sets openDelay, closeDelay, navigable and disabled once for a subtree. A card that states one itself still wins. The panel reads PopoverDefaultsProvider.',
  ],
  [
    'PopoverHeader, PopoverTitle, PopoverBody, PopoverFooter, PopoverClose, …',
    'components',
    '—',
    'Inside HoverCardContent',
    'The card is the popover family unchanged, and nothing is re-exported: its title names a navigable card, its Close is the touch reader’s Escape.',
  ],
  [
    'HoverCardContent',
    'component',
    '—',
    'Inside a HoverCard',
    'The popover’s layer and panel in one, with the family’s pointer handlers on the layer and the panel’s role decided by navigable. Its props reach the panel; the arrow is rendered under the popover’s arrow axis.',
  ],
  ['ref', 'prop', '—', 'HoverCard', 'A PopoverHandle carrying open(), close() and reposition().'],
  [
    'native props',
    'attributes',
    '—',
    'HoverCardTrigger',
    "Anything an anchor takes — href, rel, target — reaches the link, and a consumer's own onPointerEnter or onFocus runs before the family's; preventDefault from it stops the family.",
  ],
]);

const accessibility = [
  'The platform supplies the link: it is a native anchor, so Enter follows it, a middle click opens it in a tab and a screen reader hears a link. The card never takes focus when it opens — autoFocus is forced off on the popover it holds — so the reader’s focus stays on the word under the pointer.',
  'The family answers WCAG 2.2 SC 1.4.13 item by item: the card is dismissible with Escape and no pointer movement, hoverable because the pointer may move onto it and the grace area keeps it open on the way, and persistent because it stays until hover and focus have left both link and card.',
  'A card the keyboard cannot enter is role="presentation" and the link says nothing about it, because a popup the announced means cannot reach would be a lie a screen reader repeats. A navigable card is the APG’s non-modal dialog, named by its title, with aria-haspopup="dialog", aria-expanded and aria-controls on the link, and Tab from the link enters it.',
  'Focus the family itself puts back on the link — after Escape inside the card, after a focus guard — does not reopen the card; the link holds the reopening back until focus has left it once. Without that rule a guard would close the card, focus the link, and open the card again.',
];

const code = defineSnippet({
  id: 'hover-card-react-code',
  language: 'tsx',
  label: 'The anatomy as it reaches the DOM',
  source: `<>
  <a data-ui="hover-card" data-part="root" href="/people/ana" data-open>
    @ana.souza
  </a>
  <div data-ui="popover" data-part="root" data-side="bottom" data-align="start" data-open>
    <span data-part="focus-guard" tabindex="0" aria-hidden="true"></span>
    <div data-part="arrow"></div>
    <div data-part="content" role="presentation" tabindex="-1">
      <div data-part="body">…</div>
    </div>
    <span data-part="focus-guard" tabindex="0" aria-hidden="true"></span>
  </div>
</>;`,
});

const theming = defineSnippet({
  id: 'hover-card-theming',
  language: 'css',
  label: 'What an application retunes',
  source: `[data-ui='hover-card'] {
  --slotted-hover-card-color: var(--slotted-text);
  --slotted-hover-card-underline-color: transparent;
  --slotted-hover-card-tint: var(--slotted-tone-secondary-subtle-hover);
}`,
});

export const REACT_HOVER_CARD_DOCS = {
  hoverCard: {
    accessibility,
    anatomy,
    api,
    composition,
    events,
    imports,
    scenes,
    snippets: [code, theming],
  },
};
