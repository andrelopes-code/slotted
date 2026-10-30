import buttonGroupTokens from '@slotted/styles/button-group/tokens.json';
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

export const ANGULAR_BUTTON_GROUP_TOKENS = buttonGroupTokens.map((name) => ({
  name,
  purpose: 'Foundation token the Button group reads',
}));

export const ANGULAR_BUTTON_GROUP_DOCS = {
  buttonGroup: {
    api: apiRows([
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'SlButtonGroup',
        'The axis the buttons run along',
      ],
      [
        'align',
        "'auto' | 'start' | 'center' | 'end' | 'stretch'",
        'auto',
        'SlButtonGroup',
        'Positions the buttons across the flow; auto stretches them to one block size on either axis',
      ],
      [
        'justify',
        "'start' | 'center' | 'end' | 'between'",
        '—',
        'SlButtonGroup',
        'Positions the buttons along the flow, which makes the group hold the line',
      ],
      [
        'fullWidth',
        'boolean',
        'false',
        'SlButtonGroup',
        'The group holds the line and its buttons share it in equal segments',
      ],
      [
        'tone',
        'accent | secondary | success | warning | danger',
        '—',
        'SlButtonGroup',
        'Provided to every button under it, unless the button states its own',
      ],
      [
        'variant',
        'solid | outline | ghost',
        '—',
        'SlButtonGroup',
        'Provided to every button under it, unless the button states its own',
      ],
      [
        'size',
        'sm | md | lg',
        '—',
        'SlButtonGroup',
        'Provided to every button under it, unless the button states its own',
      ],
      [
        'decorative',
        'boolean',
        'false',
        'SlButtonGroupSeparator',
        'Drops the rule out of the accessibility tree',
      ],
    ]),
    accessibility: [
      'The host is role="group". A group of actions is several tab stops: Tab and Shift + Tab reach each button in the order it was written, and every key belongs to the button under focus. The arrow-key model of the APG Toolbar pattern — one tab stop, Left and Right between controls — is a different component and belongs to the toolbar family.',
      'Name the group with aria-label or aria-labelledby on the element the directive sits on. There is no label input, because the element already accepts both and a second way to name one thing is a second thing to get wrong.',
      'A static role the consumer wrote survives the host binding, read with HostAttributeToken before the family writes its own — so role="toolbar" stays possible. role="" removes it altogether, which ARIA reads as "use the element\'s implicit role": that is how a nav or a section carrying this directive keeps the semantics it was chosen for.',
      'A boundary that carries meaning is better said by a nested group with a name of its own than by a rule: an announced separator says a boundary exists, while a named group says what is on either side of it.',
      'The separator takes its axis from the group, mirrored: a rule across a row is vertical.',
      'Nothing here depends on hover, and nothing is decided by script. The buttons are joined by the stylesheet alone, so the bar is the same shape in a server render and with JavaScript disabled.',
      'The buttons keep the accessible names, disabled behaviour and loading announcements the button family gives them. The group adds nothing to them and removes nothing from them.',
      'A toggle button belongs in a bar of actions, and the group keeps its frame whole around one — but an exclusive set of them is toggle-group, not this family. Built here by hand the set has no exclusivity, no shared keyboard and one tab stop per control where the pattern gives one for the set; toggle-group owns the value, the roving focus and the group semantics over it.',
    ],
    snippets: [
      defineSnippet({
        id: 'button-group-angular-split',
        language: 'angular',
        label: 'A split action: the main action and its menu share one edge',
        source:
          '<div slButtonGroup aria-label="Publish">\n  <button slButton (click)="publish()">Publish</button>\n  <button slIconButton aria-label="More publish options" (click)="openMenu()">\n    <ng-icon aria-hidden="true" name="lucideChevronDown"></ng-icon>\n  </button>\n</div>',
      }),
      defineSnippet({
        id: 'button-group-angular-runs',
        language: 'angular',
        label: 'Two named runs in one bar, and a rule between them',
        source:
          '<div slButtonGroup aria-label="Record">\n  <div slButtonGroup aria-label="Edit" tone="secondary" variant="outline">\n    <button slButton>Duplicate</button>\n    <button slButton>Archive</button>\n  </div>\n  <div slButtonGroupSeparator></div>\n  <div slButtonGroup aria-label="Destructive" tone="danger" variant="outline">\n    <button slButton>Delete</button>\n  </div>\n</div>',
      }),
    ],
  },
} as const;
