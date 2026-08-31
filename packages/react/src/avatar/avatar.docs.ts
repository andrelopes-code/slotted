import avatarTokens from '@slotted/styles/avatar/tokens.json';
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

export const REACT_AVATAR_TOKENS = avatarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Avatar decision',
}));

const wiringApi: ApiTuple[] = [
  ['children', 'ReactNode', '—', 'Part', 'Rendered content'],
  ['className', 'string', '—', 'Part', 'Additional class names'],
];

export const REACT_AVATAR_DOCS = {
  avatar: {
    api: apiRows([
      ['size', "'sm' | 'md' | 'lg'", 'md', 'Avatar', 'Diameter of the avatar'],
      ['render', '(props) => ReactNode', '—', 'Avatar', 'Renders a different root element'],
      ...wiringApi,
    ]),
    accessibility: [
      'The picture and the fallback are never both in the document: the stylesheet removes one of them, so a screen reader reads one name for one person.',
      'AvatarImage is a plain img and needs an alt, like any other picture. Give the person’s name, not "avatar".',
      'A fallback showing initials is not a name. Either put the full name in the fallback and hide it visually, or give the avatar an accessible name of its own.',
      'An avatar that is purely decorative — beside a name already written out — takes alt="" and an empty fallback, and disappears from the accessibility tree entirely.',
    ],
    snippets: [
      defineSnippet({
        id: 'avatar-react-basic',
        language: 'tsx',
        label: 'A picture with initials behind it',
        source:
          '<Avatar>\n  <AvatarImage alt="Ada Lovelace" src={user.photo} />\n  <AvatarFallback>AL</AvatarFallback>\n</Avatar>;',
      }),
    ],
  },
  avatarImage: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  avatarFallback: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
} as const;
