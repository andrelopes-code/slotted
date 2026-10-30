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

export const ANGULAR_DESCRIPTION_LIST_TOKENS = descriptionListTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Description List decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  SlDescriptionList,\n  SlDescriptionListAction,\n  SlDescriptionListDescription,\n  SlDescriptionListHint,\n  SlDescriptionListItem,\n  SlDescriptionListTerm,\n  provideDescriptionListDefaults,\n} from '@slotted/angular/description-list';",
  selector: 'div[slDescriptionList]',
  exportAs: 'slDescriptionList',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div[slDescriptionList], exportAs="slDescriptionList"',
    required: true,
    purpose:
      'The consumer’s own div, which is the query container and the element every axis is written on. It answers its own inline size, which is why it is not the dl: an element with container-type is a container for its descendants and not for itself.',
  },
  {
    part: 'list',
    element: 'dl, drawn by the component',
    required: true,
    purpose:
      'The grid. It declares the term track, the value track and the action track, and every pair borrows them with subgrid. Pairs are projected into it.',
  },
  {
    part: 'item',
    element: 'div[slDescriptionListItem], exportAs="slDescriptionListItem"',
    required: true,
    purpose:
      'One name-value pair, in the wrapper the HTML Standard permits inside a dl. It is the box a rule, a tint and a span apply to.',
  },
  {
    part: 'term',
    element: 'dt[slDescriptionListTerm], exportAs="slDescriptionListTerm"',
    required: true,
    purpose:
      'The name. It carries the identifier the row action is described by, and a static id the consumer wrote wins over it.',
  },
  {
    part: 'hint',
    element: '[slDescriptionListHint], exportAs="slDescriptionListHint"',
    required: false,
    purpose:
      'One line explaining the term, inside the dt that names it. A list that has hints gives up the row arrangement eight rem earlier than one that does not.',
  },
  {
    part: 'description',
    element: 'dd[slDescriptionListDescription], exportAs="slDescriptionListDescription"',
    required: true,
    purpose:
      'The value cell: the value and the controls that reach it. It carries data-clamp and data-revealed.',
  },
  {
    part: 'value',
    element: 'span, drawn by the component',
    required: true,
    purpose:
      'The value itself, and the one part a clamp applies to. Projected content lands inside it, so the clamp, the copy target and the controls have one stable place.',
  },
  {
    part: 'placeholder',
    element: 'span, drawn by the component',
    required: false,
    purpose:
      'A value that is missing, in one of two forms: words a consumer stated, shown as they were written, or an em dash with the reason beside it in text a screen reader reads.',
  },
  {
    part: 'copy',
    element: 'button, drawn by the component',
    required: false,
    purpose:
      'Puts the value on the clipboard and says it finished, by its mark as well as by its color. Where the platform refuses the write it selects the value instead, so the reader can take it with the keyboard.',
  },
  {
    part: 'toggle',
    element: 'button, drawn by the component',
    required: false,
    purpose:
      'Reveals a clamped value and clamps it again, and appears only where the value wants more room than the clamp gives it. It carries aria-expanded, which is the APG Disclosure pattern.',
  },
  {
    part: 'action',
    element: 'dd[slDescriptionListAction], exportAs="slDescriptionListAction"',
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
      id: 'description-list-angular-playground',
      language: 'angular',
      label: 'A details panel',
      source:
        '<div slDescriptionList>\n  <div slDescriptionListItem>\n    <dt slDescriptionListTerm>Environment</dt>\n    <dd slDescriptionListDescription>Production</dd>\n  </div>\n</div>',
    }),
  },
  {
    id: 'layout',
    title: 'Beside the term, or under it',
    note: 'Row puts the value in a column of its own, and every term in the list shares one track sized to the widest of them. Stack puts the value under its term, which is what a narrow container gets whether or not you ask.',
    snippet: defineSnippet({
      id: 'description-list-angular-layout',
      language: 'angular',
      label: 'The two arrangements',
      source:
        '<div slDescriptionList layout="row"></div>\n<div slDescriptionList layout="stack"></div>',
    }),
  },
  {
    id: 'columns',
    title: 'More than one pair to a row',
    note: 'Three columns become two below 48rem of the panel, two become one below 34rem. Compare the term columns: each column group sizes its own, so two groups of unlike terms do not pretend to be a table.',
    snippet: defineSnippet({
      id: 'description-list-angular-columns',
      language: 'angular',
      label: 'Two columns of pairs',
      source: '<div slDescriptionList [columns]="2">\n  <!-- pairs -->\n</div>',
    }),
  },
  {
    id: 'variant',
    title: 'Nothing, a rule, or a frame',
    note: 'Plain is the form that belongs inside a card, where the card already draws the box. Ruled puts a hairline under every pair, including the last. Framed is the specification table: an outer frame and a tinted term cell.',
    snippet: defineSnippet({
      id: 'description-list-angular-variant',
      language: 'angular',
      label: 'The three presentations',
      source:
        '<div slDescriptionList variant="plain"></div>\n<div slDescriptionList variant="ruled"></div>\n<div slDescriptionList variant="framed"></div>',
    }),
  },
  {
    id: 'span',
    title: 'A pair that needs the whole row',
    note: 'An address or an endpoint takes more than a third of a row, so it takes the row. A span wider than the list has columns is clamped to the count rather than growing the grid a column nobody declared.',
    snippet: defineSnippet({
      id: 'description-list-angular-span',
      language: 'angular',
      label: 'Spanning two columns',
      source:
        '<div slDescriptionList [columns]="2">\n  <div slDescriptionListItem [span]="2">\n    <dt slDescriptionListTerm>Endpoint</dt>\n    <dd slDescriptionListDescription>db.eu-west-2.example.com:5432</dd>\n  </div>\n</div>',
    }),
  },
  {
    id: 'actions',
    title: 'A row you can go back and change',
    note: 'The action is a second dd of the same group, which is what the platform is for. Tab to one and a screen reader reads the term with it, because the action is described by the dt rather than by hidden text repeated in every row.',
    snippet: defineSnippet({
      id: 'description-list-angular-actions',
      language: 'angular',
      label: 'A summary row with its own action',
      source:
        '<div slDescriptionListItem>\n  <dt slDescriptionListTerm>Name</dt>\n  <dd slDescriptionListDescription>Sarah Phillips</dd>\n  <dd slDescriptionListAction><a slLink href="/name">Change</a></dd>\n</div>',
    }),
  },
  {
    id: 'empty',
    title: 'A value that is not there',
    note: 'An empty cell is a row a reader cannot tell from a defect. The empty input draws the mark — a rule, not an em dash — and a screen reader hears the reason; words you state are shown as you wrote them.',
    snippet: defineSnippet({
      id: 'description-list-angular-empty',
      language: 'angular',
      label: 'A field the server did not send',
      source:
        '<dd slDescriptionListDescription [empty]="!account.owner">{{ account.owner }}</dd>\n\n<dd slDescriptionListDescription empty placeholder="Not set yet"></dd>',
    }),
  },
  {
    id: 'hint',
    title: 'A term that explains itself',
    note: 'One line under the name, inside the dt, so a reader who reaches the term hears the explanation with it. It costs the list eight rem of the row arrangement, which is why it is a sentence and not a paragraph.',
    snippet: defineSnippet({
      id: 'description-list-angular-hint',
      language: 'angular',
      label: 'Explaining a field',
      source:
        '<dt slDescriptionListTerm>\n  Retention\n  <span slDescriptionListHint>How long a deleted object stays recoverable.</span>\n</dt>',
    }),
  },
  {
    id: 'copy',
    title: 'A value worth taking away',
    note: 'An identifier, a key, an ARN. The control writes the rendered text unless you state another, says it finished by its mark as well as its color for two seconds, and announces the result politely. Pressing it on this page selects the value instead: a browser refuses the clipboard inside an iframe that carries no clipboard-write permission, and the family does the part it still can.',
    snippet: defineSnippet({
      id: 'description-list-angular-copy',
      language: 'angular',
      label: 'Copying a value',
      source:
        '<dd slDescriptionListDescription copy (copied)="log($event.copied)">\n  arn:aws:iam::421900075512:role/billing-reconciler\n</dd>\n\n<dd slDescriptionListDescription copy [copyValue]="account.iban">\n  {{ account.iban | iban }}\n</dd>',
    }),
  },
  {
    id: 'reveal',
    title: 'A value longer than its row',
    note: 'Clamping is visual: every character stays in the DOM, selectable and readable by a screen reader, and the control brings the rest into view — and appears only where there is a rest to bring. Hold revealed yourself when the choice should survive a navigation.',
    snippet: defineSnippet({
      id: 'description-list-angular-reveal',
      language: 'angular',
      label: 'Clamping to two lines',
      source:
        '<dd slDescriptionListDescription [clamp]="2">{{ note }}</dd>\n\n<dd\n  slDescriptionListDescription\n  [clamp]="2"\n  [revealed]="revealed()"\n  (revealedChange)="revealed.set($event.value)"\n>\n  {{ note }}\n</dd>',
    }),
  },
  {
    id: 'composition',
    title: 'Inside a card, and beside the families it sits with',
    note: 'Card owns the title and the header actions, so this family ships neither. The value slot takes a tag, a status indicator or a skeleton, and provideDescriptionListDefaults decides the arrangement for a whole application; the words come from the language in force.',
    snippet: defineSnippet({
      id: 'description-list-angular-composition',
      language: 'ts',
      label: 'A titled panel, and defaults for the application',
      source:
        "bootstrapApplication(App, {\n  providers: [provideDescriptionListDefaults({ variant: 'ruled' })],\n});",
    }),
  },
  {
    id: 'content',
    title: 'Content the list did not choose',
    note: 'A sixty-four character hash with nowhere to break, a German compound term, and a right-to-left pair. The value breaks rather than leaving the box, and the term track stops at the width you set for it.',
    snippet: defineSnippet({
      id: 'description-list-angular-content',
      language: 'angular',
      label: 'Long, translated and unbroken',
      source:
        '<div slDescriptionList termWidth="10rem">\n  <div slDescriptionListItem>\n    <dt slDescriptionListTerm>Rechnungsempfängeradresse</dt>\n    <dd slDescriptionListDescription>Friedrichstraße 12, 10117 Berlin</dd>\n  </div>\n</div>',
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard and announcement',
    note: 'The family owns no key of its own: every control is a native button or your own link, so Tab, Enter and Space are the platform. Enter and Space are told apart from a press in the reason the request carries.',
    snippet: defineSnippet({
      id: 'description-list-angular-keyboard',
      language: 'angular',
      label: 'What each control announces',
      source:
        '<dd slDescriptionListDescription copy [clamp]="2" (revealedChange)="log($event.reason)">\n  {{ note }}\n</dd>',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'revealedChange',
    payload: 'ChangeRequest<boolean>',
    when: 'Before a clamped value is revealed or clamped again. The request carries the value, the value it replaces, the reason — pointer, keyboard or programmatic — and the originating event, and cancelling it commits nothing. It is not the second half of a two-way binding: one slot could carry none of those.',
  },
  {
    name: 'copied',
    payload: 'DescriptionListCopyRequest',
    when: 'After the clipboard write, whether or not the platform accepted it. It carries the exact text, the reason, copied — false where there is no clipboard or the write was refused — and selected, true where the family put the value under the reader’s own selection instead. It is not a ChangeRequest: there is nothing to cancel and no state the family holds.',
  },
];

export const ANGULAR_DESCRIPTION_LIST_DOCS = {
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
        'slDescriptionList',
        'The term beside its value, or above it',
      ],
      ['columns', '1 | 2 | 3', '1', 'slDescriptionList', 'How many pairs stand side by side'],
      [
        'variant',
        "'plain' | 'ruled' | 'framed'",
        'plain',
        'slDescriptionList',
        'Nothing between pairs, a rule between them, or a framed table',
      ],
      [
        'minColumnWidth',
        "'sm' | 'md'",
        'md',
        'slDescriptionList',
        'The narrowest column before the count folds: md holds two columns to 34rem of the list and three to 48rem; sm holds two to 25rem and three to 37.5rem',
      ],
      [
        'termWidth',
        'string',
        '14rem',
        'slDescriptionList',
        'The maximum width of the term column, as a length (not a percentage); the terms share one track sized to the widest of them, up to this. A row list narrower than this width plus --slotted-description-list-value-min (12rem) stacks each term over its value',
      ],
      [
        'messages',
        'PartialMessages<DescriptionListMessages>',
        '—',
        'slDescriptionList',
        'Words laid over the language in force, key by key: copy, copied, copyBlocked, reveal, collapse, placeholder',
      ],
      [
        'span',
        '1 | 2 | 3',
        '1',
        'slDescriptionListItem',
        'How many columns the pair takes, clamped to the count the list has',
      ],
      [
        'clamp',
        'number',
        '0',
        'slDescriptionListDescription',
        'Lines the value is held to before it is revealed; 0 never clamps',
      ],
      [
        'copy',
        'boolean',
        'false',
        'slDescriptionListDescription',
        'Draws the control that puts the value on the clipboard',
      ],
      [
        'copyValue',
        'string',
        '—',
        'slDescriptionListDescription',
        'The text that control copies. Absent, the rendered text is read at the moment of the press',
      ],
      [
        'empty',
        'boolean',
        'false',
        'slDescriptionListDescription',
        'Draws the placeholder. Angular cannot read projected content without reading the DOM, so the absence is stated here where React reads nullish children',
      ],
      [
        'placeholder',
        'string',
        '—',
        'slDescriptionListDescription',
        'Words shown in place of a value that is missing. Unset, the mark is drawn and the placeholder message is read instead',
      ],
      [
        'revealed',
        'boolean',
        '—',
        'slDescriptionListDescription',
        'Present means controlled, for the life of the component',
      ],
      [
        'defaultRevealed',
        'boolean',
        'false',
        'slDescriptionListDescription',
        'What an uncontrolled description starts from, read once',
      ],
    ]),
    composition: apiRows([
      [
        'ng-content',
        'projection',
        '—',
        'slDescriptionList, slDescriptionListDescription',
        'Pairs are projected into the dl the component draws, and a value into the span that holds it',
      ],
      [
        'exportAs',
        'string',
        '—',
        'every directive',
        'Reaches the instance from the template: slDescriptionList, slDescriptionListItem, slDescriptionListTerm, slDescriptionListHint, slDescriptionListDescription, slDescriptionListAction',
      ],
      [
        'provideDescriptionListDefaults()',
        'DescriptionListDefaults',
        '—',
        'Application',
        'Sets layout, columns, variant, termWidth and minColumnWidth once for everything below it; an input on the list still wins',
      ],
      [
        'id / aria-describedby',
        'string',
        '—',
        'slDescriptionListTerm, slDescriptionListAction',
        'A static attribute you wrote survives the host binding: the term keeps your id, and the action composes your description with the term’s',
      ],
      [
        'content',
        'projection',
        '—',
        'slDescriptionListDescription',
        'A tag, a status indicator, a link or a skeleton — the value slot takes what the row needs',
      ],
    ]),
    accessibility: [
      'The rendered elements are a dl, a dt and a dd, and the family writes no role at all. HTML-AAM maps them to list, term and definition already, and MDN records that authoring the ARIA term and definition roles by hand changes how VoiceOver announces the construct. The APG has no pattern for a description list — twenty-nine patterns, and none of them is this — so the platform is the specification the family follows.',
      'The div around each pair is the second form the HTML Standard permits inside a dl, and it is what makes a pair one grid area. The row action is a second dd of the same group, because a dt may be followed by more than one dd.',
      'A row action is named by its own term through aria-describedby pointing at the dt, so a reader who tabs to “Change” hears which row it changes. GOV.UK repeats the term as visually hidden text inside every action, which a template system has to do; a reference says it once and cannot drift. A static aria-describedby you wrote is read with HostAttributeToken and composed with rather than replaced.',
      'A value that is missing is drawn and said: the mark is geometry in CSS and the reason is real text in a visually hidden sibling, because color and shape alone never carry meaning.',
      'The reveal toggle is the APG Disclosure pattern — role button, aria-expanded true while the content is visible, Enter and Space toggling — and the copy control is a plain button, so both take their keyboard behavior from the platform. The family adds no key of its own: a read-only list of pairs is not a composite widget, and inventing arrow navigation would take Tab away from controls that need it.',
      'Clamping is visual only. Every character stays in the DOM, selectable, copyable and readable by a screen reader, which is what the repository means by never truncating without access.',
      'A finished copy is announced politely through the shared live announcer rather than a region this family owns, so two copies in one update are both heard; and the control changes its mark as well as its color, so a reader who cannot see the green still sees it finish.',
      'A browser refuses the clipboard where the document is not focused, and inside an iframe carrying no clipboard-write permission — a Storybook page is both. A control that failed silently there would be indistinguishable from a broken one, so the family selects the value instead and announces that it did: the reader sees the selection and copies it with the keyboard.',
      'A clamp is a maximum rather than a promise, so the reveal control appears only for a value that has more text than the clamp allows. A control that reveals nothing is one a reader presses once and learns to distrust.',
    ],
    snippets: [
      defineSnippet({
        id: 'description-list-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div\n  data-columns="1"\n  data-layout="row"\n  data-part="root"\n  data-ui="description-list"\n  data-variant="plain"\n>\n  <dl data-part="list">\n    <div data-part="item">\n      <dt data-part="term" id="slotted-description-list-1">\n        Retention\n        <span data-part="hint">How long a deleted object stays recoverable.</span>\n      </dt>\n      <dd data-part="description">\n        <span data-part="value">30 days</span>\n        <button aria-label="Copy" data-part="copy" type="button">\n          <span aria-hidden="true" data-part="root" data-ui="icon">\n            <svg\n              aria-hidden="true"\n              data-glyph="copy"\n              data-part="glyph"\n              focusable="false"\n              viewBox="0 0 24 24"\n            >\n              …\n            </svg>\n          </span>\n        </button>\n      </dd>\n      <dd aria-describedby="slotted-description-list-1" data-part="action">\n        <a href="/retention">Change</a>\n      </dd>\n    </div>\n  </dl>\n</div>',
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
