import cardTokens from '@slotted/styles/card/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';

export const ANGULAR_CARD_TOKENS = cardTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Card decision',
}));

export const ANGULAR_CARD_DOCS = {
  card: {
    api: [],
    accessibility: [
      'The card sets no role. A card is an article in one page, a list item in another and a plain grouping in a third, and only the page knows which.',
      'The selector is a bare attribute, so put slCard on the element that carries the semantics, and give that element an accessible name — usually aria-labelledby pointing at the heading in the header.',
      'A card that is entirely a link should contain one link around its title, not be wrapped in one. Wrapping swallows every control inside it into a single tab stop.',
      'The three regions are optional and carry no semantics of their own. They are spacing, and a card of only a body reads exactly like one with all three.',
    ],
    snippets: [
      defineSnippet({
        id: 'card-angular-article',
        language: 'angular',
        label: 'A card that is an article',
        source:
          '<article slCard aria-labelledby="invoice-title">\n  <div slCardHeader><h3 id="invoice-title">INV-0042</h3></div>\n  <div slCardBody>Due in thirty days.</div>\n</article>',
      }),
    ],
  },
  cardHeader: { api: [], accessibility: [], snippets: [] },
  cardBody: { api: [], accessibility: [], snippets: [] },
  cardFooter: { api: [], accessibility: [], snippets: [] },
} as const;
