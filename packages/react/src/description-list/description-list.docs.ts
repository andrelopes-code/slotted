import descriptionListTokens from '@slotted/styles/description-list/tokens.json';
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

export const REACT_DESCRIPTION_LIST_TOKENS = descriptionListTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Description List decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  DescriptionList,\n  DescriptionListAction,\n  DescriptionListDefaultsProvider,\n  DescriptionListDescription,\n  DescriptionListHint,\n  DescriptionListItem,\n  DescriptionListTerm,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The query container, and the element every axis is written on. It answers its own inline size, which is why it is not the dl: an element with container-type is a container for its descendants and not for itself.',
  },
  {
    part: 'list',
    element: 'dl',
    required: true,
    purpose:
      'The grid, drawn by the family. It declares the term track, the value track and the action track, and every pair borrows them with subgrid.',
  },
  {
    part: 'item',
    element: 'div',
    required: true,
    purpose:
      'One name-value pair, in the wrapper the HTML Standard permits inside a dl. It is the box a rule, a tint and a span apply to.',
  },
  {
    part: 'term',
    element: 'dt',
    required: true,
    purpose:
      'The name. It carries the identifier the row action is described by, and a consumer id wins over it.',
  },
  {
    part: 'hint',
    element: 'span',
    required: false,
    purpose:
      'One line explaining the term, inside the dt that names it. A list that has hints gives up the row arrangement eight rem earlier than one that does not.',
  },
  {
    part: 'description',
    element: 'dd',
    required: true,
    purpose:
      'The value cell: the value and the controls that reach it. It carries data-clamp and data-revealed.',
  },
  {
    part: 'value',
    element: 'span',
    required: true,
    purpose:
      'The value itself, and the one part a clamp applies to. It is always present so the clamp, the copy target and the controls have one stable place.',
  },
  {
    part: 'placeholder',
    element: 'span',
    required: false,
    purpose:
      'A value that is missing, in one of two forms: words a consumer stated, shown as they were written, or an em dash with the reason beside it in text a screen reader reads.',
  },
  {
    part: 'copy',
    element: 'button',
    required: false,
    purpose:
      'Puts the value on the clipboard and says it finished, by its mark as well as by its color. Where the platform refuses the write it selects the value instead, so the reader can take it with the keyboard.',
  },
  {
    part: 'toggle',
    element: 'button',
    required: false,
    purpose:
      'Reveals a clamped value and clamps it again, and appears only where the value wants more room than the clamp gives it. It carries aria-expanded, which is the APG Disclosure pattern.',
  },
  {
    part: 'action',
    element: 'dd',
    required: false,
    purpose:
      'The row action, in a second dd of the same group. Named by its own term through aria-describedby.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Every axis on one details panel, driven by the controls below the canvas. Change columns and variant, then narrow the window and watch the arrangement answer the panel rather than the viewport.',
    snippet: defineSnippet({
      id: 'description-list-react-playground',
      language: 'tsx',
      label: 'A details panel',
      source:
        '<DescriptionList>\n  <DescriptionListItem>\n    <DescriptionListTerm>Environment</DescriptionListTerm>\n    <DescriptionListDescription>Production</DescriptionListDescription>\n  </DescriptionListItem>\n</DescriptionList>;',
    }),
  },
  {
    id: 'layout',
    title: 'Beside the term, or under it',
    note: 'Row puts the value in a column of its own, and every term in the list shares one track sized to the widest of them. Stack puts the value under its term, which is what a narrow container gets whether or not you ask.',
    snippet: defineSnippet({
      id: 'description-list-react-layout',
      language: 'tsx',
      label: 'The two arrangements',
      source: '<DescriptionList layout="row" />;\n<DescriptionList layout="stack" />;',
    }),
  },
  {
    id: 'columns',
    title: 'More than one pair to a row',
    note: 'Three columns become two below 48rem of the panel, two become one below 34rem. Compare the term columns: each column group sizes its own, so two groups of unlike terms do not pretend to be a table.',
    snippet: defineSnippet({
      id: 'description-list-react-columns',
      language: 'tsx',
      label: 'Two columns of pairs',
      source: '<DescriptionList columns={2}>{pairs}</DescriptionList>;',
    }),
  },
  {
    id: 'variant',
    title: 'Nothing, a rule, or a frame',
    note: 'Plain is the form that belongs inside a card, where the card already draws the box. Ruled puts a hairline under every pair, including the last. Framed is the specification table: an outer frame and a tinted term cell.',
    snippet: defineSnippet({
      id: 'description-list-react-variant',
      language: 'tsx',
      label: 'The three presentations',
      source:
        '<DescriptionList variant="plain" />;\n<DescriptionList variant="ruled" />;\n<DescriptionList variant="framed" />;',
    }),
  },
  {
    id: 'span',
    title: 'A pair that needs the whole row',
    note: 'An address or an endpoint takes more than a third of a row, so it takes the row. A span wider than the list has columns is clamped to the count rather than growing the grid a column nobody declared.',
    snippet: defineSnippet({
      id: 'description-list-react-span',
      language: 'tsx',
      label: 'Spanning two columns',
      source:
        '<DescriptionList columns={2}>\n  <DescriptionListItem span={2}>\n    <DescriptionListTerm>Endpoint</DescriptionListTerm>\n    <DescriptionListDescription>db.eu-west-2.example.com:5432</DescriptionListDescription>\n  </DescriptionListItem>\n</DescriptionList>;',
    }),
  },
  {
    id: 'actions',
    title: 'A row you can go back and change',
    note: 'The action is a second dd of the same group, which is what the platform is for. Tab to one and a screen reader reads the term with it, because the action is described by the dt rather than by hidden text repeated in every row.',
    snippet: defineSnippet({
      id: 'description-list-react-actions',
      language: 'tsx',
      label: 'A summary row with its own action',
      source:
        '<DescriptionListItem>\n  <DescriptionListTerm>Name</DescriptionListTerm>\n  <DescriptionListDescription>Sarah Phillips</DescriptionListDescription>\n  <DescriptionListAction>\n    <Link href="/name">Change</Link>\n  </DescriptionListAction>\n</DescriptionListItem>;',
    }),
  },
  {
    id: 'empty',
    title: 'A value that is not there',
    note: 'An empty cell is a row a reader cannot tell from a defect. Nullish children draw the mark — a rule, not an em dash — and a screen reader hears the reason; words you state are shown as you wrote them.',
    snippet: defineSnippet({
      id: 'description-list-react-empty',
      language: 'tsx',
      label: 'A field the server did not send',
      source:
        '<DescriptionListDescription>{account.owner}</DescriptionListDescription>;\n\n// Or say so, and say what is read in its place.\n<DescriptionListDescription empty placeholder="Not set yet" />;',
    }),
  },
  {
    id: 'hint',
    title: 'A term that explains itself',
    note: 'One line under the name, inside the dt, so a reader who reaches the term hears the explanation with it. It costs the list eight rem of the row arrangement, which is why it is a sentence and not a paragraph.',
    snippet: defineSnippet({
      id: 'description-list-react-hint',
      language: 'tsx',
      label: 'Explaining a field',
      source:
        '<DescriptionListTerm>\n  Retention\n  <DescriptionListHint>How long a deleted object stays recoverable.</DescriptionListHint>\n</DescriptionListTerm>;',
    }),
  },
  {
    id: 'copy',
    title: 'A value worth taking away',
    note: 'An identifier, a key, an ARN. The control writes the rendered text unless you state another, says it finished by its mark as well as its color for two seconds, and announces the result politely. Pressing it on this page selects the value instead: a browser refuses the clipboard inside an iframe that carries no clipboard-write permission, and the family does the part it still can.',
    snippet: defineSnippet({
      id: 'description-list-react-copy',
      language: 'tsx',
      label: 'Copying a value',
      source:
        '<DescriptionListDescription copy onCopy={(request) => log(request.copied)}>\n  arn:aws:iam::421900075512:role/billing-reconciler\n</DescriptionListDescription>;\n\n// Where the rendered value is a formatting of the real one.\n<DescriptionListDescription copy copyValue={account.iban}>\n  {formatIban(account.iban)}\n</DescriptionListDescription>;',
    }),
  },
  {
    id: 'reveal',
    title: 'A value longer than its row',
    note: 'Clamping is visual: every character stays in the DOM, selectable and readable by a screen reader, and the control brings the rest into view — and appears only where there is a rest to bring. Hold revealed yourself when the choice should survive a navigation.',
    snippet: defineSnippet({
      id: 'description-list-react-reveal',
      language: 'tsx',
      label: 'Clamping to two lines',
      source:
        '<DescriptionListDescription clamp={2}>{note}</DescriptionListDescription>;\n\n// Or own the choice.\n<DescriptionListDescription\n  clamp={2}\n  revealed={revealed}\n  onRevealedChange={(next) => setRevealed(next)}\n>\n  {note}\n</DescriptionListDescription>;',
    }),
  },
  {
    id: 'composition',
    title: 'Inside a card, and beside the families it sits with',
    note: 'Card owns the title and the header actions, so this family ships neither. The value slot takes a tag, a status indicator or a skeleton, and the defaults provider decides the arrangement for a whole application; the words come from the language in force.',
    snippet: defineSnippet({
      id: 'description-list-react-composition',
      language: 'tsx',
      label: 'A titled panel, and defaults for the application',
      source:
        '<Card>\n  <CardHeader>Billing</CardHeader>\n  <CardBody>\n    <DescriptionList>{pairs}</DescriptionList>\n  </CardBody>\n</Card>;\n\n<DescriptionListDefaultsProvider variant="ruled">\n  <App />\n</DescriptionListDefaultsProvider>;',
    }),
  },
  {
    id: 'content',
    title: 'Content the list did not choose',
    note: 'A sixty-four character hash with nowhere to break, a German compound term, and a right-to-left pair. The value breaks rather than leaving the box, and the term track stops at the width you set for it.',
    snippet: defineSnippet({
      id: 'description-list-react-content',
      language: 'tsx',
      label: 'Long, translated and unbroken',
      source:
        '<DescriptionList termWidth="10rem">\n  <DescriptionListItem>\n    <DescriptionListTerm>Rechnungsempfängeradresse</DescriptionListTerm>\n    <DescriptionListDescription>Friedrichstraße 12, 10117 Berlin</DescriptionListDescription>\n  </DescriptionListItem>\n</DescriptionList>;',
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard and announcement',
    note: 'The family owns no key of its own: every control is a native button or your own link, so Tab, Enter and Space are the platform. Enter and Space are told apart from a press in the reason the request carries.',
    snippet: defineSnippet({
      id: 'description-list-react-keyboard',
      language: 'tsx',
      label: 'What each control announces',
      source:
        '// Copy announces politely; the toggle carries aria-expanded;\n// the action is described by its own term.\n<DescriptionListDescription\n  clamp={2}\n  copy\n  onRevealedChange={(next, request) => log(request.reason)}\n>\n  {note}\n</DescriptionListDescription>;',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onRevealedChange',
    payload: '(revealed: boolean, request: ChangeRequest<boolean>)',
    when: 'Before a clamped value is revealed or clamped again. The request carries the value it replaces, the reason — pointer, keyboard or programmatic — and the originating event, and cancelling it commits nothing.',
  },
  {
    name: 'onCopy',
    payload: '(request: DescriptionListCopyRequest)',
    when: 'After the clipboard write, whether or not the platform accepted it. It carries the exact text, the reason, copied — false where there is no clipboard or the write was refused — and selected, true where the family put the value under the reader’s own selection instead. It is not a ChangeRequest: there is nothing to cancel and no state the family holds.',
  },
];

export const REACT_DESCRIPTION_LIST_DOCS = {
  descriptionList: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'layout',
        "'row' | 'stack'",
        'row',
        'DescriptionList',
        'The term beside its value, or above it',
      ],
      ['columns', '1 | 2 | 3', '1', 'DescriptionList', 'How many pairs stand side by side'],
      [
        'variant',
        "'plain' | 'ruled' | 'framed'",
        'plain',
        'DescriptionList',
        'Nothing between pairs, a rule between them, or a framed table',
      ],
      [
        'minColumnWidth',
        "'sm' | 'md'",
        'md',
        'DescriptionList',
        'The narrowest column before the count folds: md holds two columns to 34rem of the list and three to 48rem; sm holds two to 25rem and three to 37.5rem',
      ],
      [
        'termWidth',
        'string',
        '14rem',
        'DescriptionList',
        'The maximum width of the term column, as a length (not a percentage); the terms share one track sized to the widest of them, up to this. A row list narrower than this width plus --slotted-description-list-value-min (12rem) stacks each term over its value',
      ],
      [
        'messages',
        'PartialMessages<DescriptionListMessages>',
        '—',
        'DescriptionList',
        'Words laid over the language in force, key by key: copy, copied, copyBlocked, reveal, collapse, placeholder',
      ],
      [
        'span',
        '1 | 2 | 3',
        '1',
        'DescriptionListItem',
        'How many columns the pair takes, clamped to the count the list has',
      ],
      [
        'clamp',
        'number',
        '0',
        'DescriptionListDescription',
        'Lines the value is held to before it is revealed; 0 never clamps',
      ],
      [
        'copy',
        'boolean',
        'false',
        'DescriptionListDescription',
        'Draws the control that puts the value on the clipboard',
      ],
      [
        'copyValue',
        'string',
        '—',
        'DescriptionListDescription',
        'The text that control copies. Absent, the rendered text is read at the moment of the press',
      ],
      [
        'empty',
        'boolean',
        'false',
        'DescriptionListDescription',
        'Draws the placeholder. Nullish children are empty without stating it',
      ],
      [
        'placeholder',
        'ReactNode',
        '—',
        'DescriptionListDescription',
        'Words shown in place of a value that is missing. Unset, the mark is drawn and the placeholder message is read instead',
      ],
      [
        'revealed',
        'boolean',
        '—',
        'DescriptionListDescription',
        'Present means controlled, for the life of the component',
      ],
      [
        'defaultRevealed',
        'boolean',
        'false',
        'DescriptionListDescription',
        'What an uncontrolled description starts from, read once',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part but the list',
        'Substitutes the rendered element. Every data attribute is handed to it, so another component keeps them. The dl is fixed: it has no option of its own, and substituting it would take away the element every semantic here rests on.',
      ],
      ['ref', 'Ref<HTMLElement>', '—', 'every part', 'Reaches the element, and focus() with it'],
      [
        'useDescriptionList()',
        '() => DescriptionListContextValue',
        '—',
        'inside a DescriptionList',
        'The arrangement and the translator t, for a part of your own',
      ],
      [
        'DescriptionListDefaultsProvider',
        'layout | columns | variant | termWidth | minColumnWidth',
        '—',
        'Application',
        'Sets those five once for everything below it; a prop on the list still wins',
      ],
      [
        'children',
        'ReactNode',
        '—',
        'DescriptionListDescription',
        'A tag, a status indicator, a link or a skeleton — the value slot takes what the row needs',
      ],
    ]),
    accessibility: [
      'The rendered elements are a dl, a dt and a dd, and the family writes no role at all. HTML-AAM maps them to list, term and definition already, and MDN records that authoring the ARIA term and definition roles by hand changes how VoiceOver announces the construct. The APG has no pattern for a description list — twenty-nine patterns, and none of them is this — so the platform is the specification the family follows.',
      'The div around each pair is the second form the HTML Standard permits inside a dl, and it is what makes a pair one grid area. The row action is a second dd of the same group, because a dt may be followed by more than one dd.',
      'A row action is named by its own term through aria-describedby pointing at the dt, so a reader who tabs to "Change" hears which row it changes. GOV.UK repeats the term as visually hidden text inside every action, which a template system has to do; a reference says it once and cannot drift. A consumer aria-describedby is composed with rather than replaced.',
      'A value that is missing is drawn and said: the mark is geometry in CSS and the reason is real text in a visually hidden sibling, because color and shape alone never carry meaning.',
      'The reveal toggle is the APG Disclosure pattern — role button, aria-expanded true while the content is visible, Enter and Space toggling — and the copy control is a plain button, so both take their keyboard behavior from the platform. The family adds no key of its own: a read-only list of pairs is not a composite widget, and inventing arrow navigation would take Tab away from controls that need it.',
      'Clamping is visual only. Every character stays in the DOM, selectable, copyable and readable by a screen reader, which is what the repository means by never truncating without access.',
      'A finished copy is announced politely through the shared live announcer rather than a region this family owns, so two copies in one update are both heard; and the control changes its mark as well as its color, so a reader who cannot see the green still sees it finish.',
      'A browser refuses the clipboard where the document is not focused, and inside an iframe carrying no clipboard-write permission — a Storybook page is both. A control that failed silently there would be indistinguishable from a broken one, so the family selects the value instead and announces that it did: the reader sees the selection and copies it with the keyboard.',
      'A clamp is a maximum rather than a promise, so the reveal control appears only for a value that has more text than the clamp allows. A control that reveals nothing is one a reader presses once and learns to distrust.',
    ],
    snippets: [
      defineSnippet({
        id: 'description-list-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div\n  data-columns="1"\n  data-layout="row"\n  data-part="root"\n  data-ui="description-list"\n  data-variant="plain"\n>\n  <dl data-part="list">\n    <div data-part="item">\n      <dt data-part="term" id="slotted-description-list-1">\n        Retention\n        <span data-part="hint">How long a deleted object stays recoverable.</span>\n      </dt>\n      <dd data-part="description">\n        <span data-part="value">30 days</span>\n        <button aria-label="Copy" data-part="copy" type="button">\n          <span aria-hidden="true" data-part="root" data-ui="icon">\n            <svg\n              aria-hidden="true"\n              data-glyph="copy"\n              data-part="glyph"\n              focusable="false"\n              viewBox="0 0 24 24"\n            >\n              …\n            </svg>\n          </span>\n        </button>\n      </dd>\n      <dd aria-describedby="slotted-description-list-1" data-part="action">\n        <a href="/retention">Change</a>\n      </dd>\n    </div>\n  </dl>\n</div>;',
      }),
      defineSnippet({
        id: 'description-list-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='description-list'] {\n  --slotted-description-list-term-width: 10rem;\n  --slotted-description-list-term-color: var(--slotted-text);\n  --slotted-description-list-row-gap: 0.5rem;\n  --slotted-description-list-rule-color: var(--slotted-border-strong);\n}",
      }),
    ],
  },
} as const;
