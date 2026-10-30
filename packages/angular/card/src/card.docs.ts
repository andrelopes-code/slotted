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

export const ANGULAR_CARD_TOKENS = cardTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Card decision',
}));

export const ANGULAR_CARD_DOCS = {
  card: {
    api: apiRows([
      [
        'orientation',
        "'vertical' | 'horizontal'",
        'vertical',
        'slCard',
        'Puts the media beside the regions, and returns it to the top in a narrow container',
      ],
      [
        'fill',
        "'outline' | 'elevated' | 'subtle'",
        'outline',
        'slCard',
        'How the surface is bounded: a hairline edge, the edge plus a lift, or a filled ground',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slCard',
        "The card's own inset. Density is the application's choice; this is this card's",
      ],
      [
        'selected',
        'boolean',
        'false',
        'slCard',
        'Mirrors a selection the page owns; the control inside is what announces it',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slCard',
        'Mirrors a control the page has disabled; the card disables nothing itself',
      ],
      [
        'slCardMedia',
        'directive',
        '—',
        'any element',
        'Media that bleeds to the edge and rounds the corners it touches',
      ],
      ['slCardHeader', 'directive', '—', 'any element', 'A title and the line that supports it'],
      [
        'slCardActions',
        'directive',
        '—',
        'inside slCardHeader',
        'The corner of the header: a badge, a status, a menu button',
      ],
      [
        'slCardSelection',
        'directive',
        '—',
        'inside slCardHeader',
        'The column a choice card keeps for its checkbox or radio',
      ],
      ['slCardBody', 'directive', '—', 'any element', 'The content of the card'],
      [
        'slCardFooter',
        'directive',
        '—',
        'any element',
        'Actions and metadata, above the hit area a link stretches',
      ],
      [
        'slCardLink',
        'directive',
        '—',
        'a[href]',
        'The one destination the card resolves to; its hit area covers the surface',
      ],
      [
        'provideCardDefaults',
        '{ fill, orientation, size }',
        '—',
        'any injector',
        'Sets the defaults once for every card under it, as a provider on the application or a route; an explicit input still wins',
      ],
    ]),
    accessibility: [
      'There is no card pattern in the WAI-ARIA Authoring Practices, and a card is structure rather than a widget. The applicable guidance is Structural Roles: use the HTML element that already carries the meaning.',
      'Every part is a directive written on the element the page chose, so an article with its own heading, the li of a list of results and the label of a chooser are all the same card. The family writes no role.',
      'The card contributes no keyboard behavior. slCardLink only matches an anchor, so Enter, the context menu and middle-click are the platform’s.',
      'The link is named by its own text. A card whose root were the link would take every string inside it into that name, which is the reason the hit area is stretched from the link instead.',
      'A card carries at most one slCardLink, and it navigates. A whole surface that fires a command on any click, with no visible control boundary, is a misclick nobody can undo; put a button in slCardActions or the footer instead.',
      'slCardActions and slCardFooter both sit above the stretched hit area, so a control in either stays operable. An interactive element anywhere else needs position: relative of its own.',
      'Text over the stretched area cannot be selected with the pointer. That is the cost of the whole-card target, and the reason a card with no link stretches nothing.',
      'selected and disabled are painted, never announced. The radio, checkbox or button inside the card is what carries the state for assistive technology.',
      'selected is the accent surface under a hairline accent edge, the pair a selected row paints. In high contrast and forced colors both flatten, and the checked control inside is what carries the state. elevated keeps its hairline because a shadow is removed there outright.',
      'The focus ring is drawn on the card while the link has focus. In a browser without :has() the link keeps its own native outline instead.',
      'A rule between two regions is an slDivider written between them. It is announced as a separator unless it is marked decorative, which is usually what a rule inside one card is.',
    ],
    snippets: [
      defineSnippet({
        id: 'card-angular-regions',
        language: 'angular',
        label: 'The regions, and the corner of the header',
        source:
          '<div slCard>\n  <div slCardHeader>\n    <h3 slHeading [level]="3">Northwind billing</h3>\n    <span slText size="sm" tone="muted">Invoices and payment methods</span>\n    <span slCardActions><span slBadge tone="warning">Overdue</span></span>\n  </div>\n  <div slCardBody>The next invoice settles on 1 October.</div>\n  <div slCardFooter>\n    <button type="button">Pay now</button>\n  </div>\n</div>\n',
      }),
      defineSnippet({
        id: 'card-angular-sections',
        language: 'angular',
        label: 'A rule between two regions',
        source:
          '<div slCard>\n  <div slCardHeader><h3 slHeading [level]="3">Review pictures</h3></div>\n  <hr slDivider decorative />\n  <div slCardBody>Two hundred images since the last visit.</div>\n  <hr slDivider decorative inset />\n  <div slCardFooter>\n    <span slText size="xs" tone="muted">The inset rule lines up with the text</span>\n  </div>\n</div>\n',
      }),
      defineSnippet({
        id: 'card-angular-link',
        language: 'angular',
        label: 'One destination, named by the title',
        source:
          '<div slCard>\n  <div slCardHeader>\n    <a slCardLink href="/accounts/northwind">Northwind Traders</a>\n  </div>\n  <div slCardBody>Twelve open invoices</div>\n  <div slCardFooter>\n    <a href="/accounts/northwind/settings">Billing settings</a>\n  </div>\n</div>\n',
      }),
      defineSnippet({
        id: 'card-angular-chooser',
        language: 'angular',
        label: 'A chooser, where the radio owns the state',
        source:
          '<label slCard [selected]="plan() === \'team\'">\n  <div slCardHeader>\n    <span slCardSelection>\n      <input type="radio" name="plan" value="team" [(ngModel)]="plan" />\n    </span>\n    <h3 slHeading [level]="3">Team</h3>\n    <span slText size="sm" tone="muted">Twenty seats and shared billing</span>\n  </div>\n</label>\n',
      }),
      defineSnippet({
        id: 'card-angular-horizontal',
        language: 'angular',
        label: 'Media beside the content, until the card is narrow',
        source:
          '<div slCard orientation="horizontal">\n  <figure slCardMedia><img alt="" [src]="report.cover" /></figure>\n  <div slCardHeader>\n    <h3 slHeading [level]="3">Quarterly report</h3>\n  </div>\n  <div slCardBody>Revenue, retention and the accounts that moved them.</div>\n</div>\n',
      }),
    ],
  },
} as const;
