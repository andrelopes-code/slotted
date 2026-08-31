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

export const ANGULAR_AVATAR_TOKENS = avatarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Avatar decision',
}));

export const ANGULAR_AVATAR_DOCS = {
  avatar: {
    api: apiRows([['size', "'sm' | 'md' | 'lg'", 'md', 'slAvatar', 'Diameter of the avatar']]),
    accessibility: [
      'The picture and the fallback are never both in the document: the stylesheet removes one of them, so a screen reader reads one name for one person.',
      'slAvatarImage sits on a plain img and needs an alt, like any other picture. Give the person’s name, not "avatar".',
      'A fallback showing initials is not a name. Either put the full name in the fallback and hide it visually, or give the avatar an accessible name of its own.',
      'An avatar that is purely decorative — beside a name already written out — takes alt="" and an empty fallback, and disappears from the accessibility tree entirely.',
    ],
    snippets: [
      defineSnippet({
        id: 'avatar-angular-basic',
        language: 'angular',
        label: 'A picture with initials behind it',
        source:
          '<span slAvatar>\n  <img slAvatarImage alt="Ada Lovelace" [src]="user.photo" />\n  <span slAvatarFallback>AL</span>\n</span>',
      }),
    ],
  },
  avatarImage: { api: [], accessibility: [], snippets: [] },
  avatarFallback: { api: [], accessibility: [], snippets: [] },
} as const;
