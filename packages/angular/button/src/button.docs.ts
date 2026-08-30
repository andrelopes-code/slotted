import buttonTokens from '@slotted/styles/button/tokens.json';
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
export const ANGULAR_BUTTON_TOKENS = buttonTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Button family decision',
}));

export const ANGULAR_BUTTON_DOCS = {
  button: {
    api: apiRows([
      [
        'variant',
        'accent | secondary | success | warning | danger',
        'accent',
        'Button',
        'Semantic intent via [variant]',
      ],
      ['fill', 'solid | outline | ghost', 'solid', 'Button', 'Surface treatment via [fill]'],
      ['size', 'sm | md | lg', 'md', 'Button', 'Control scale via [size]'],
      ['fullWidth', 'boolean', 'false', 'Button', 'Fill the inline container with [fullWidth]'],
      ['disabled', 'boolean', 'false', 'Button', 'Native disabled state'],
      ['loading', 'boolean', 'false', 'Button', 'Controlled busy state'],
      ['loadingText', 'string', '—', 'Button', 'Explicit busy label via [loadingText]'],
      ['type', 'button | submit | reset', 'button', 'Button', 'Native button type'],
      ['leading', '[slButtonLeading]', '—', 'Button', 'Logical leading projected content'],
      ['trailing', '[slButtonTrailing]', '—', 'Button', 'Logical trailing projected content'],
      [
        '[slButtonLoadingIndicator]',
        'projected content',
        'spinner',
        'Button',
        'Replacement loading indicator',
      ],
    ]),
    accessibility: [
      'Visible label supplies the accessible name.',
      'Loading preserves focus, sets aria-busy and aria-disabled, and blocks activation.',
      'Use type="submit" only for an intentional form submission.',
    ],
    snippets: [
      defineSnippet({
        id: 'angular-button-basic',
        label: 'Basic action',
        language: 'angular',
        source:
          '<button slButton variant="accent">\n  <ng-icon slButtonLeading name="lucideSave" aria-hidden="true" />\n  Save changes\n</button>',
      }),
      defineSnippet({
        id: 'angular-button-loading',
        label: 'Controlled loading',
        language: 'angular',
        source: '<button slButton [loading]="saving" loadingText="Saving">Save</button>',
      }),
    ],
  },
  buttonLink: {
    api: apiRows([
      [
        'variant',
        'accent | secondary | success | warning | danger',
        'accent',
        'ButtonLink',
        'Semantic intent via [variant]',
      ],
      ['fill', 'solid | outline | ghost', 'solid', 'ButtonLink', 'Surface treatment via [fill]'],
      ['size', 'sm | md | lg', 'md', 'ButtonLink', 'Control scale via [size]'],
      ['fullWidth', 'boolean', 'false', 'ButtonLink', 'Fill the inline container with [fullWidth]'],
      ['disabled', 'boolean', 'false', 'ButtonLink', 'Suppress navigation and sequential focus'],
      ['tabIndex', 'number', 'automatic', 'ButtonLink', 'Native tabindex; disabled defaults to -1'],
      [
        'href/routerLink',
        'string',
        '—',
        'ButtonLink',
        'Native href or Angular RouterLink destination; RouterLink is Angular-owned',
      ],
      ['leading', '[slButtonLeading]', '—', 'ButtonLink', 'Logical leading projected content'],
      ['trailing', '[slButtonTrailing]', '—', 'ButtonLink', 'Logical trailing projected content'],
    ]),
    accessibility: [
      'Use ButtonLink only for navigation.',
      'Disabled navigation sets aria-disabled, suppresses activation, and defaults to tabIndex -1.',
      'RouterLink retains Angular Router semantics.',
    ],
    snippets: [
      defineSnippet({
        id: 'angular-button-link-router',
        label: 'Router navigation',
        language: 'angular',
        source: '<a slButtonLink routerLink="/settings">Settings</a>',
      }),
    ],
  },
  iconButton: {
    api: apiRows([
      [
        'aria-label/aria-labelledby',
        'string',
        'required',
        'IconButton',
        'Explicit accessible name',
      ],
      [
        'variant',
        'accent | secondary | success | warning | danger',
        'secondary',
        'IconButton',
        'Semantic intent via [variant]',
      ],
      ['fill', 'solid | outline | ghost', 'ghost', 'IconButton', 'Surface treatment via [fill]'],
      ['size', 'sm | md | lg', 'md', 'IconButton', 'Square control scale via [size]'],
      ['fullWidth', 'boolean', 'false', 'IconButton', 'Fill the inline container with [fullWidth]'],
      ['disabled', 'boolean', 'false', 'IconButton', 'Native disabled state'],
      ['loading', 'boolean', 'false', 'IconButton', 'Controlled busy state'],
      ['type', 'button | submit | reset', 'button', 'IconButton', 'Native button type'],
      [
        '[slButtonLoadingIndicator]',
        'projected content',
        'spinner',
        'IconButton',
        'Replacement loading indicator',
      ],
    ]),
    accessibility: [
      'An explicit aria-label or aria-labelledby is mandatory.',
      'The visible icon is decorative relative to that accessible name.',
      'Loading preserves the explicit accessible name and focus.',
    ],
    snippets: [
      defineSnippet({
        id: 'angular-icon-button',
        label: 'Named icon action',
        language: 'angular',
        source:
          '<button slIconButton aria-label="Close">\n  <ng-icon name="lucideX" aria-hidden="true" />\n</button>',
      }),
    ],
  },
  toggleButton: {
    api: apiRows([
      ['pressed', 'boolean', 'false', 'ToggleButton', 'Controlled pressed state via [(pressed)]'],
      ['pressedChange', 'boolean event', '—', 'ToggleButton', 'Requests the next controlled state'],
      [
        'variant',
        'accent | secondary | success | warning | danger',
        'secondary',
        'ToggleButton',
        'Semantic intent via [variant]',
      ],
      [
        'fill',
        'solid | outline | ghost',
        'outline',
        'ToggleButton',
        'Surface treatment via [fill]',
      ],
      ['size', 'sm | md | lg', 'md', 'ToggleButton', 'Control scale via [size]'],
      [
        'fullWidth',
        'boolean',
        'false',
        'ToggleButton',
        'Fill the inline container with [fullWidth]',
      ],
      ['disabled', 'boolean', 'false', 'ToggleButton', 'Native disabled state'],
      ['type', 'button | submit | reset', 'button', 'ToggleButton', 'Native button type'],
      ['leading', '[slButtonLeading]', '—', 'ToggleButton', 'Logical leading projected content'],
      ['trailing', '[slButtonTrailing]', '—', 'ToggleButton', 'Logical trailing projected content'],
    ]),
    accessibility: [
      'aria-pressed always reflects the controlled pressed input.',
      'The label describes the toggled feature rather than its next action.',
      'Disabled toggles do not request state changes.',
    ],
    snippets: [
      defineSnippet({
        id: 'angular-toggle-button',
        label: 'Controlled toggle',
        language: 'angular',
        source: '<button slToggleButton [(pressed)]="pinned">Pin</button>',
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
        'Logical group direction via [orientation]',
      ],
      [
        'aria-label/aria-labelledby',
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
        id: 'angular-button-group',
        label: 'Grouped actions',
        language: 'angular',
        source:
          '<div slButtonGroup aria-label="Editing actions">\n  <button slButton>Save</button>\n  <button slIconButton aria-label="More save options">\n    <ng-icon name="lucideChevronDown" aria-hidden="true" />\n  </button>\n</div>',
      }),
    ],
  },
} as const;
