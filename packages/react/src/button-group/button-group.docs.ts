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

export const REACT_BUTTON_GROUP_TOKENS = buttonGroupTokens.map((name) => ({
  name,
  purpose: 'Foundation token the Button group reads',
}));

export const REACT_BUTTON_GROUP_DOCS = {
  buttonGroup: {
    api: apiRows([
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'ButtonGroup',
        'The axis the buttons run along',
      ],
      [
        'align',
        "'auto' | 'start' | 'center' | 'end' | 'stretch'",
        'auto',
        'ButtonGroup',
        'Positions the buttons across the flow; auto stretches them to one block size on either axis',
      ],
      [
        'justify',
        "'start' | 'center' | 'end' | 'between'",
        '—',
        'ButtonGroup',
        'Positions the buttons along the flow, which makes the group hold the line',
      ],
      [
        'fullWidth',
        'boolean',
        'false',
        'ButtonGroup',
        'The group holds the line and its buttons share it in equal segments',
      ],
      [
        'tone',
        'accent | secondary | success | warning | danger',
        '—',
        'ButtonGroup',
        'Painted onto every button under it, unless the button states its own',
      ],
      [
        'variant',
        'solid | outline | ghost',
        '—',
        'ButtonGroup',
        'Painted onto every button under it, unless the button states its own',
      ],
      [
        'size',
        'sm | md | lg',
        '—',
        'ButtonGroup',
        'Painted onto every button under it, unless the button states its own',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'ButtonGroup',
        'Renders a different root element; pass role={undefined} to keep that element’s own semantics',
      ],
      [
        'decorative',
        'boolean',
        'false',
        'ButtonGroupSeparator',
        'Drops the rule out of the accessibility tree',
      ],
    ]),
    accessibility: [
      'The root is role="group". A group of actions is several tab stops: Tab and Shift + Tab reach each button in the order it was written, and every key belongs to the button under focus. The arrow-key model of the APG Toolbar pattern — one tab stop, Left and Right between controls — is a different component and belongs to the toolbar family.',
      'Name the group with aria-label or aria-labelledby. There is no label prop, because the element already accepts both and a second way to name one thing is a second thing to get wrong.',
      'A consumer who genuinely wants the toolbar role can write role="toolbar", and it survives: the family writes its own role first so an explicit one wins. Writing role={undefined} removes it altogether, which is how a substituted nav or section keeps the semantics it was chosen for.',
      'A boundary that carries meaning is better said by a nested group with a name of its own than by a rule: an announced separator says a boundary exists, while a named group says what is on either side of it.',
      'The separator takes its axis from the group, mirrored: a rule across a row is vertical.',
      'Nothing here depends on hover, and nothing is decided by script. The buttons are joined by the stylesheet alone, so the bar is the same shape before hydration and with JavaScript disabled.',
      'The buttons keep the accessible names, disabled behavior and loading announcements the button family gives them. The group adds nothing to them and removes nothing from them.',
      'A toggle button belongs in a bar of actions, and the group keeps its frame whole around one — but an exclusive set of them is toggle-group, not this family. Built here by hand the set has no exclusivity, no shared keyboard and one tab stop per control where the pattern gives one for the set; toggle-group owns the value, the roving focus and the group semantics over it.',
    ],
    snippets: [
      defineSnippet({
        id: 'button-group-react-split',
        language: 'tsx',
        label: 'A split action: the main action and its menu share one edge',
        source:
          '<ButtonGroup aria-label="Publish">\n  <Button onClick={publish}>Publish</Button>\n  <IconButton aria-label="More publish options" onClick={openMenu}>\n    <ChevronDown aria-hidden="true" />\n  </IconButton>\n</ButtonGroup>;',
      }),
      defineSnippet({
        id: 'button-group-react-runs',
        language: 'tsx',
        label: 'Two named runs in one bar, and a rule between them',
        source:
          '<ButtonGroup aria-label="Record">\n  <ButtonGroup aria-label="Edit" tone="secondary" variant="outline">\n    <Button>Duplicate</Button>\n    <Button>Archive</Button>\n  </ButtonGroup>\n  <ButtonGroupSeparator />\n  <ButtonGroup aria-label="Destructive" tone="danger" variant="outline">\n    <Button>Delete</Button>\n  </ButtonGroup>\n</ButtonGroup>;',
      }),
    ],
  },
} as const;
