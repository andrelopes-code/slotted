import { defineSnippet } from '@slotted/storybook-workbench';
import type { ApiRow } from '@slotted/storybook-workbench';

import { BUTTON_SIZES, BUTTON_TONES } from './button.constants';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));
const toneSuffixes = [
  'solid',
  'solid-hover',
  'solid-active',
  'on-solid',
  'border',
  'text',
  'subtle-hover',
  'subtle-active',
] as const;

export const REACT_BUTTON_TOKENS = [
  '--slotted-control-font-family',
  '--slotted-control-font-weight',
  '--slotted-control-line-height',
  '--slotted-control-letter-spacing',
  '--slotted-control-border-width',
  '--slotted-control-radius',
  '--slotted-control-shadow',
  '--slotted-control-transition-duration',
  '--slotted-control-transition-easing',
  '--slotted-focus-ring-width',
  '--slotted-focus-ring-offset',
  '--slotted-focus-ring-color',
  '--slotted-button-gap',
  '--slotted-button-icon-size',
  '--slotted-button-loading-opacity',
  '--slotted-button-loading-indicator-size',
  '--slotted-button-loading-indicator-stroke-width',
  '--slotted-button-loading-indicator-duration',
  '--slotted-button-group-gap',
  '--slotted-button-group-adjacent-offset',
  '--slotted-button-group-inner-radius',
  '--slotted-button-outline-background',
  '--slotted-button-ghost-background',
  '--slotted-button-ghost-text-decoration',
  '--slotted-disabled-background',
  '--slotted-disabled-foreground',
  '--slotted-disabled-border',
  ...BUTTON_SIZES.flatMap((size) => [
    `--slotted-button-height-${size}`,
    `--slotted-button-padding-inline-${size}`,
    `--slotted-button-font-size-${size}`,
    `--slotted-button-icon-size-${size}`,
  ]),
  ...BUTTON_TONES.flatMap((tone) =>
    toneSuffixes.map((suffix) => `--slotted-tone-${tone}-${suffix}`),
  ),
].map((name) => ({ name, purpose: 'Theme-owned Button family decision' }));

export const REACT_BUTTON_DOCS = {
  button: {
    api: apiRows([
      ['variant', 'solid | outline | ghost', 'solid', 'Button', 'Visual emphasis'],
      [
        'tone',
        'neutral | accent | success | warning | danger',
        'accent',
        'Button',
        'Semantic intent',
      ],
      ['size', 'sm | md | lg', 'md', 'Button', 'Control scale'],
      ['leading', 'ReactNode', '—', 'Button', 'Logical leading content'],
      ['trailing', 'ReactNode', '—', 'Button', 'Logical trailing content'],
      ['fullWidth', 'boolean', 'false', 'Button', 'Fill the inline container'],
      ['disabled', 'boolean', 'false', 'Button', 'Native disabled state'],
      ['loading', 'boolean', 'false', 'Button', 'Controlled busy state'],
      ['loadingText', 'ReactNode', '—', 'Button', 'Explicit busy label'],
      ['loadingIndicator', 'ReactNode', 'spinner', 'Button', 'Replacement indicator'],
      ['type', 'button | submit | reset', 'button', 'Button', 'Native button type'],
    ]),
    accessibility: [
      'Visible label supplies the accessible name.',
      'Loading preserves focus, sets aria-busy and aria-disabled, and blocks activation.',
      'Use submit only for an intentional form submission.',
    ],
    snippets: [
      defineSnippet({
        id: 'react-button-basic',
        label: 'Basic action',
        language: 'tsx',
        source:
          'import { Save } from \'lucide-react\';\n\n<Button tone="accent" leading={<Save aria-hidden="true" />}>\n  Save changes\n</Button>;',
      }),
      defineSnippet({
        id: 'react-button-loading',
        label: 'Controlled loading',
        language: 'tsx',
        source: '<Button loading={saving} loadingText="Saving">\n  Save\n</Button>;',
      }),
    ],
  },
  buttonLink: {
    api: apiRows([
      ['href', 'string', 'required in native mode', 'ButtonLink', 'Native navigation destination'],
      ['render', '(rootProps) => ReactElement', '—', 'ButtonLink', 'Router-owned link adapter'],
      ['disabled', 'boolean', 'false', 'ButtonLink', 'Suppress navigation and sequential focus'],
      ['variant', 'solid | outline | ghost', 'solid', 'ButtonLink', 'Visual emphasis'],
      [
        'tone',
        'neutral | accent | success | warning | danger',
        'accent',
        'ButtonLink',
        'Semantic intent',
      ],
      ['size', 'sm | md | lg', 'md', 'ButtonLink', 'Control scale'],
      ['leading', 'ReactNode', '—', 'ButtonLink', 'Logical leading content'],
      ['trailing', 'ReactNode', '—', 'ButtonLink', 'Logical trailing content'],
      ['fullWidth', 'boolean', 'false', 'ButtonLink', 'Fill the inline container'],
    ]),
    accessibility: [
      'Use ButtonLink only for navigation.',
      'Disabled navigation sets aria-disabled, suppresses activation, and defaults to tabIndex -1.',
      'The render adapter must preserve every supplied root prop and accessible name.',
    ],
    snippets: [
      defineSnippet({
        id: 'react-button-link-native',
        label: 'Native navigation',
        language: 'tsx',
        source: '<ButtonLink href="/settings">Settings</ButtonLink>;',
      }),
      defineSnippet({
        id: 'react-button-link-router',
        label: 'Router-owned navigation',
        language: 'tsx',
        source:
          '<ButtonLink render={(props) => <RouterLink to="/settings" {...props} />}>Settings</ButtonLink>;',
      }),
    ],
  },
  iconButton: {
    api: apiRows([
      [
        'aria-label | aria-labelledby',
        'string',
        'required',
        'IconButton',
        'Explicit accessible name',
      ],
      ['variant', 'solid | outline | ghost', 'ghost', 'IconButton', 'Visual emphasis'],
      [
        'tone',
        'neutral | accent | success | warning | danger',
        'neutral',
        'IconButton',
        'Semantic intent',
      ],
      ['size', 'sm | md | lg', 'md', 'IconButton', 'Square control scale'],
      ['fullWidth', 'boolean', 'false', 'IconButton', 'Fill the inline container'],
      ['disabled', 'boolean', 'false', 'IconButton', 'Native disabled state'],
      ['loading', 'boolean', 'false', 'IconButton', 'Controlled busy state'],
      ['loadingIndicator', 'ReactNode', 'spinner', 'IconButton', 'Replacement indicator'],
      ['type', 'button | submit | reset', 'button', 'IconButton', 'Native button type'],
    ]),
    accessibility: [
      'An explicit aria-label or aria-labelledby is mandatory.',
      'The visible icon is decorative relative to that accessible name.',
      'Loading preserves the explicit accessible name and focus.',
    ],
    snippets: [
      defineSnippet({
        id: 'react-icon-button',
        label: 'Named icon action',
        language: 'tsx',
        source:
          'import { X } from \'lucide-react\';\n\n<IconButton aria-label="Close" variant="ghost">\n  <X aria-hidden="true" />\n</IconButton>;',
      }),
    ],
  },
  toggleButton: {
    api: apiRows([
      ['pressed', 'boolean', 'false', 'ToggleButton', 'Controlled pressed state'],
      [
        'onPressedChange',
        '(next: boolean) => void',
        '—',
        'ToggleButton',
        'Requests the next state',
      ],
      ['variant', 'solid | outline | ghost', 'outline', 'ToggleButton', 'Visual emphasis'],
      [
        'tone',
        'neutral | accent | success | warning | danger',
        'neutral',
        'ToggleButton',
        'Semantic intent',
      ],
      ['size', 'sm | md | lg', 'md', 'ToggleButton', 'Control scale'],
      ['leading', 'ReactNode', '—', 'ToggleButton', 'Logical leading content'],
      ['trailing', 'ReactNode', '—', 'ToggleButton', 'Logical trailing content'],
      ['fullWidth', 'boolean', 'false', 'ToggleButton', 'Fill the inline container'],
      ['disabled', 'boolean', 'false', 'ToggleButton', 'Native disabled state'],
      ['type', 'button | submit | reset', 'button', 'ToggleButton', 'Native button type'],
    ]),
    accessibility: [
      'aria-pressed always reflects the controlled pressed prop.',
      'The label describes the toggled feature rather than its next action.',
      'Disabled toggles do not request state changes.',
    ],
    snippets: [
      defineSnippet({
        id: 'react-toggle-button',
        label: 'Controlled toggle',
        language: 'tsx',
        source:
          '<ToggleButton pressed={pinned} onPressedChange={setPinned}>\n  Pin\n</ToggleButton>;',
      }),
    ],
  },
  buttonGroup: {
    api: apiRows([
      [
        'orientation',
        'horizontal | vertical',
        'horizontal',
        'ButtonGroup',
        'Logical group direction',
      ],
      [
        'aria-label | aria-labelledby',
        'string',
        'contextual',
        'ButtonGroup',
        'Names the related action set',
      ],
    ]),
    accessibility: [
      'Name the group when surrounding context does not already identify it.',
      'Children retain their own button or link semantics and tab order.',
      'A split-action example does not imply menu keyboard behavior.',
    ],
    snippets: [
      defineSnippet({
        id: 'react-button-group',
        label: 'Grouped actions',
        language: 'tsx',
        source:
          'import { ChevronDown } from \'lucide-react\';\n\n<ButtonGroup aria-label="Editing actions">\n  <Button>Save</Button>\n  <IconButton aria-label="More save options">\n    <ChevronDown aria-hidden="true" />\n  </IconButton>\n</ButtonGroup>;',
      }),
    ],
  },
} as const;
