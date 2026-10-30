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

export const ANGULAR_HOVER_CARD_TOKENS = hoverCardTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Hover card decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlHoverCard, SlHoverCardTrigger, provideHoverCardDefaults } from '@slotted/angular/hover-card';\nimport { SlPopoverLayer, SlPopoverContent, SlPopoverBody } from '@slotted/angular/popover';",
  selector: '[slHoverCard], [slHoverCardTrigger]',
  exportAs: 'slHoverCard',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'a[slHoverCardTrigger], the consumer\u2019s own anchor',
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
      id: 'hover-card-angular-playground',
      language: 'angular',
      label: 'A mention and its card',
      source: `<ng-container slHoverCard>
  <a slHoverCardTrigger href="/people/ana">&#64;ana.souza</a>
  <ng-template slPopoverLayer>
    <div slPopoverContent>
      <div slPopoverBody>…</div>
      <div slPopoverArrow></div>
    </div>
  </ng-template>
</ng-container>`,
    }),
  },
  {
    id: 'mention',
    title: 'A person',
    note: 'The card a review thread shows for a handle: avatar, name, team and what they own, under the word it is about. While it shows, the word carries a tint and a halo that grow the inline box without moving the line — the sentence under it has not shifted.',
    snippet: defineSnippet({
      id: 'hover-card-angular-mention',
      language: 'angular',
      label: 'The card is the popover’s parts, unchanged',
      source: `<ng-container slHoverCard [open]="true">
  <a slHoverCardTrigger href="/people/ana">&#64;ana.souza</a>
  <ng-template slPopoverLayer>
    <div slPopoverContent>
      <div slPopoverBody>
        <span slAvatar name="Ana Souza"></span>
        …
      </div>
    </div>
  </ng-template>
</ng-container>`,
    }),
  },
  {
    id: 'link-preview',
    title: 'A document',
    note: 'The card a link to a spec shows: its title, who touched it last and its first lines. The trigger stays a link — Enter follows it, a middle click opens it in a tab — and the card adds nothing the destination does not have.',
    snippet: defineSnippet({
      id: 'hover-card-angular-link-preview',
      language: 'angular',
      label: 'A preview of where the link goes',
      source: `<ng-container slHoverCard>
  <a slHoverCardTrigger href="/specs/checkout-pricing">Checkout redesign — pricing table</a>
  <ng-template slPopoverLayer>
    <div slPopoverContent>
      <div slPopoverHeader>
        <div slPopoverTitle>Checkout redesign — pricing table</div>
        <p slPopoverDescription>Product spec · updated 2 hours ago</p>
      </div>
      <div slPopoverBody>…</div>
    </div>
  </ng-template>
</ng-container>`,
    }),
  },
  {
    id: 'navigable',
    title: 'Navigable',
    note: 'The card holds a control, so the page says so with navigable: the panel becomes a dialog named by its title, the link announces the popup, and Tab from the open link enters the card. Past its last control a focus guard closes it and puts focus back on the link, which does not reopen.',
    snippet: defineSnippet({
      id: 'hover-card-angular-navigable',
      language: 'angular',
      label: 'A card the keyboard can enter',
      source: `<ng-container slHoverCard navigable>
  <a slHoverCardTrigger href="/people/ana">&#64;ana.souza</a>
  <ng-template slPopoverLayer>
    <div slPopoverContent>
      <div slPopoverHeader><div slPopoverTitle>Ana Souza</div></div>
      <div slPopoverBody>…</div>
      <div slPopoverFooter><button slButton size="sm">Follow</button></div>
    </div>
  </ng-template>
</ng-container>`,
    }),
  },
  {
    id: 'delay',
    title: 'The delays',
    note: 'Two of the same card: the left opens after the default 600 ms and closes 300 ms after the pointer has left; the right answers at once and holds for a second, for a page where the preview is the point. Focus never waits on either.',
    snippet: defineSnippet({
      id: 'hover-card-angular-delay',
      language: 'angular',
      label: 'Per card; provideHoverCardDefaults() sets it once',
      source: `<ng-container slHoverCard [openDelay]="0" [closeDelay]="1000">…</ng-container>`,
    }),
  },
  {
    id: 'shared',
    title: 'One card, many mentions',
    note: 'A thread with four handles and one slHoverCard around all of them. The mention the pointer rests on registers itself as the anchor, and the request carries the event whose currentTarget names the person, so the card fills from one state instead of mounting four.',
    snippet: defineSnippet({
      id: 'hover-card-angular-shared',
      language: 'angular',
      label: 'The request carries the event, and the event names the trigger',
      source: `<ng-container slHoverCard (openChangeRequest)="remember($event)">
  <p>
    <a slHoverCardTrigger data-handle="ana.souza" href="/people/ana">&#64;ana.souza</a>
    and
    <a slHoverCardTrigger data-handle="marcus.lee" href="/people/marcus">&#64;marcus.lee</a>
  </p>
  <ng-template slPopoverLayer>
    <div slPopoverContent>{{ people[handle()] }}</div>
  </ng-template>
</ng-container>`,
    }),
  },
  {
    id: 'touch',
    title: 'On touch',
    note: 'There is no hover on a touch screen: the first tap on the mention opens the card instead of following the link, and a tap on the open mention follows it. The cost is one extra tap to navigate; the alternative is a preview no touch reader ever sees.',
    snippet: defineSnippet({
      id: 'hover-card-angular-touch',
      language: 'angular',
      label: 'Nothing to write: the first tap opens, the second follows',
      source: `<ng-container slHoverCard>
  <a slHoverCardTrigger href="/people/ana">&#64;ana.souza</a>
  <ng-template slPopoverLayer><div slPopoverContent>…</div></ng-template>
</ng-container>`,
    }),
  },
  {
    id: 'composition',
    title: 'On the consumer’s own link',
    note: 'The trigger is a component on the consumer’s anchor, and two components do not share one element: a[slLink] cannot also carry it, so the family paints the link itself and a data-part the consumer wrote is kept. The Close part inside the card is the popover’s, and it is what a touch reader has in place of Escape.',
    snippet: defineSnippet({
      id: 'hover-card-angular-composition',
      language: 'angular',
      label: 'The family’s own paint on the consumer’s anchor',
      source: `<ng-container slHoverCard>
  <a slHoverCardTrigger href="/people/ana" data-part="mention">Ana Souza</a>
  <ng-template slPopoverLayer>
    <div slPopoverContent>
      <div slPopoverHeader>
        <div slPopoverTitle>Ana Souza</div>
        <button slPopoverClose></button>
      </div>
    </div>
  </ng-template>
</ng-container>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'From the keyboard',
    note: "Tab onto the mention: the card opens in the same task, without the pointer's delay. Escape closes it and leaves focus where it is, and the mention does not reopen until focus has left it once. Tab on moves focus down the page and closes the card with the reason blur.",
    snippet: defineSnippet({
      id: 'hover-card-angular-keyboard',
      language: 'angular',
      label: 'Focus opens; blur, Escape and the guards close',
      source: `<ng-container slHoverCard (openChangeRequest)="log($event.reason)">
  <a slHoverCardTrigger href="/people/ana">&#64;ana.souza</a>
  <ng-template slPopoverLayer><div slPopoverContent>…</div></ng-template>
</ng-container>`,
    }),
  },
];

const api = apiRows([
  [
    'open',
    'model<boolean>',
    'false',
    'slHoverCard',
    'Whether the card shows. Two-way: [(open)] on the container; a bound [open] alone makes the card controlled.',
  ],
  [
    'openDelay',
    'number',
    '600',
    'slHoverCard',
    'Milliseconds the pointer rests on the trigger before the card opens. Focus never waits.',
  ],
  [
    'closeDelay',
    'number',
    '300',
    'slHoverCard',
    'Milliseconds after the pointer has left trigger and card before it closes; a pointer on its way to the card is not counted as gone.',
  ],
  [
    'navigable',
    'boolean',
    'false',
    'slHoverCard',
    'Whether the card holds controls a keyboard reader can reach. On, the panel is a dialog, the link announces it and Tab enters it; off, the panel is presentation.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'slHoverCard',
    'The card never opens. The link keeps working, and carries no disabled state.',
  ],
  [
    'sideOffset',
    'number',
    '4',
    'slHoverCard',
    'The popover\u2019s own input, with the family\u2019s default: the halo the open mark draws plus the same again of air, so the arrow\u2019s tip stands off the word.',
  ],
  [
    'side, align, size, width, arrow, mount, …',
    'SlPopover inputs',
    '—',
    'slHoverCard',
    'Every input of slPopover except autoFocus, which the family forces off: slHoverCard extends SlPopover and provides itself as one.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'openChangeRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the card opens or closes. The request carries pointer (hover in, hover out, a tap), keyboard (focus arriving, a focus guard), escape, outsidePress, blur (focus leaving the trigger), dismiss (the Close part) or programmatic, the originating event, and cancel().',
  },
];

const composition = apiRows([
  [
    'provideHoverCardDefaults()',
    'provider',
    '—',
    'Application',
    'Sets openDelay, closeDelay and navigable once for an injector. A card that states one itself still wins; the panel reads providePopoverDefaults().',
  ],
  [
    'slPopoverLayer, slPopoverContent, slPopoverBody, slPopoverClose, …',
    'directives',
    '—',
    'Inside slHoverCard',
    'The card is the popover family unchanged, and nothing is re-exported: slHoverCard provides itself as SlPopover, so every popover part inside it reaches the card. The panel\u2019s role follows navigable.',
  ],
  [
    'exportAs',
    'template reference',
    '—',
    'slHoverCard',
    'A template reaches the card — #card="slHoverCard" — for show(), hide() and the resolved delays; the trigger as #mention="slHoverCardTrigger".',
  ],
  [
    'many triggers',
    'composition',
    '—',
    'slHoverCard',
    'Several a[slHoverCardTrigger] inside one container share one card; the one that starts an opening registers itself as the anchor.',
  ],
  [
    'host attributes',
    'attributes',
    '—',
    'slHoverCardTrigger',
    'The trigger is the consumer\u2019s own anchor: href, rel and target are theirs, and a data-part they wrote is kept beside the identity.',
  ],
]);

const accessibility = [
  'The platform supplies the link: it is a native anchor, so Enter follows it, a middle click opens it in a tab and a screen reader hears a link. The card never takes focus when it opens — autoFocus is forced off on the popover it holds — so the reader’s focus stays on the word under the pointer.',
  'The family answers WCAG 2.2 SC 1.4.13 item by item: the card is dismissible with Escape and no pointer movement, hoverable because the pointer may move onto it and the grace area keeps it open on the way, and persistent because it stays until hover and focus have left both link and card.',
  'A card the keyboard cannot enter is role="presentation" and the link says nothing about it, because a popup the announced means cannot reach would be a lie a screen reader repeats. A navigable card is the APG’s non-modal dialog, named by its title, with aria-haspopup="dialog", aria-expanded and aria-controls on the link, and Tab from the link enters it.',
  'Focus the family itself puts back on the link — after Escape inside the card, after a focus guard — does not reopen the card; the link holds the reopening back until focus has left it once. Without that rule a guard would close the card, focus the link, and open the card again.',
];

const code = defineSnippet({
  id: 'hover-card-angular-code',
  language: 'angular',
  label: 'The anatomy as it reaches the DOM',
  source: `<a data-ui="hover-card" data-part="root" href="/people/ana" data-open>&#64;ana.souza</a>
<div data-ui="popover" data-part="root" data-side="bottom" data-align="start" data-open>
  <span data-part="focus-guard" tabindex="0" aria-hidden="true"></span>
  <div data-part="arrow"></div>
  <div data-part="content" role="presentation" tabindex="-1">
    <div data-part="body">…</div>
  </div>
  <span data-part="focus-guard" tabindex="0" aria-hidden="true"></span>
</div>`,
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

export const ANGULAR_HOVER_CARD_DOCS = {
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
