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

export const ANGULAR_SKELETON_TOKENS = skeletonTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Skeleton decision',
}));

export const ANGULAR_SKELETON_DOCS = {
  skeleton: {
    api: apiRows([
      [
        'shape',
        "'text' | 'rectangle' | 'circle'",
        'text',
        'slSkeleton',
        'How the placeholder relates to the layout around it',
      ],
    ]),
    accessibility: [
      'The placeholder carries aria-hidden="true". Reading out the absence of content is noise, and there is nothing yet to describe.',
      'Announcing the wait belongs to the region the placeholders fill: put aria-busy="true" on it, or render a status message beside it.',
      'aria-hidden="false" on the element puts a placeholder back in the tree, for the rare case where it is the whole message.',
      'The animation stops under prefers-reduced-motion. The shape still says content goes here, so nothing is lost by stopping it.',
    ],
    snippets: [
      defineSnippet({
        id: 'skeleton-angular-paragraph',
        language: 'angular',
        label: 'Standing in for a paragraph',
        source:
          '<div aria-busy="true">\n  <span slSkeleton></span>\n  <span slSkeleton></span>\n</div>',
      }),
    ],
  },
} as const;
