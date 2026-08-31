import stepperTokens from '@slotted/styles/stepper/tokens.json';
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

export const REACT_STEPPER_TOKENS = stepperTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Stepper decision',
}));

const wiringApi: ApiTuple[] = [
  ['children', 'ReactNode', '—', 'Part', 'Rendered content'],
  ['className', 'string', '—', 'Part', 'Additional class names'],
];

export const REACT_STEPPER_DOCS = {
  stepper: {
    api: apiRows([
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'Stepper',
        'Axis the steps are arranged on',
      ],
      ['render', '(props) => ReactNode', '—', 'Stepper', 'Renders a different root element'],
      ...wiringApi,
    ]),
    accessibility: [
      'The root is an ol and the steps are li elements. The sequence is the information, and no role is added on top of a list that already says so.',
      'Give the list an accessible name — aria-label, or aria-labelledby pointing at the heading above it — so a screen reader can say which sequence it is.',
      'Only the step in progress carries aria-current="step". Marking every visited step would leave a listener unable to tell where they actually are.',
      'The marker is hidden from assistive technology: the number or tick inside it repeats what the label and aria-current already say.',
      'The current step is distinguished by a thicker ring as well as by a tone, so it is not colour alone that says where the reader is.',
      'The connector between steps is drawn by the stylesheet and is never announced.',
    ],
    snippets: [
      defineSnippet({
        id: 'stepper-react-basic',
        language: 'tsx',
        label: 'A three-step flow',
        source:
          '<Stepper aria-label="Set up your workspace">\n  <StepperStep status="complete">\n    <StepperMarker>1</StepperMarker>\n    <StepperLabel>Account</StepperLabel>\n  </StepperStep>\n  <StepperStep status="current">\n    <StepperMarker>2</StepperMarker>\n    <StepperLabel>Members</StepperLabel>\n  </StepperStep>\n</Stepper>;',
      }),
    ],
  },
  stepperStep: {
    api: apiRows([
      [
        'status',
        "'upcoming' | 'current' | 'complete'",
        'upcoming',
        'StepperStep',
        'Where this step sits in the flow',
      ],
      ...wiringApi,
    ]),
    accessibility: [],
    snippets: [],
  },
  stepperMarker: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  stepperLabel: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
} as const;
