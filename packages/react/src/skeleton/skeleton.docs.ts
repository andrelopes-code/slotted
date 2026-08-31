import skeletonTokens from '@slotted/styles/skeleton/tokens.json';
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

export const REACT_SKELETON_TOKENS = skeletonTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Skeleton decision',
}));

export const REACT_SKELETON_DOCS = {
  skeleton: {
    api: apiRows([
      [
        'shape',
        "'text' | 'rectangle' | 'circle'",
        'text',
        'Skeleton',
        'How the placeholder relates to the layout around it',
      ],
      ['render', '(props) => ReactNode', '—', 'Skeleton', 'Renders a different root element'],
      ['className', 'string', '—', 'Skeleton', 'Additional class names'],
    ]),
    accessibility: [
      'The placeholder carries aria-hidden="true". Reading out the absence of content is noise, and there is nothing yet to describe.',
      'Announcing the wait belongs to the region the placeholders fill: put aria-busy="true" on it, or render a status message beside it.',
      'aria-hidden={false} puts a placeholder back in the tree, for the rare case where it is the whole message.',
      'The animation stops under prefers-reduced-motion. The shape still says content goes here, so nothing is lost by stopping it.',
    ],
    snippets: [
      defineSnippet({
        id: 'skeleton-react-paragraph',
        language: 'tsx',
        label: 'Standing in for a paragraph',
        source:
          '<div aria-busy="true">\n  <Skeleton />\n  <Skeleton />\n  <Skeleton style={{ inlineSize: \'60%\' }} />\n</div>;',
      }),
    ],
  },
} as const;
