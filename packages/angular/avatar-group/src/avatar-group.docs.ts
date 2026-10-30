import avatarGroupTokens from '@slotted/styles/avatar-group/tokens.json';
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

export const ANGULAR_AVATAR_GROUP_TOKENS = avatarGroupTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Avatar Group decision',
}));

export const ANGULAR_AVATAR_GROUP_DOCS = {
  avatarGroup: {
    api: apiRows([
      [
        'layout',
        "'stack' | 'spread'",
        'stack',
        'slAvatarGroup',
        'stack overlaps the members; spread lays them apart and wraps',
      ],
      [
        'max',
        'number | false',
        '5',
        'slAvatarGroup',
        'The largest number of discs the group draws, the summary included. false shows every member',
      ],
      [
        'total',
        'number',
        '—',
        'slAvatarGroup',
        'How many members there really are, when the page renders fewer than it has',
      ],
      [
        'overflowLabel',
        'string',
        '—',
        'slAvatarGroup',
        'What the summary is called. Defaults to the hidden members’ names, joined for the locale',
      ],
      [
        'size',
        "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
        'md',
        'slAvatarGroup',
        'Provided to every member, and the length the overlap is measured against',
      ],
      [
        'shape',
        "'circle' | 'square'",
        'circle',
        'slAvatarGroup',
        'Provided to every member. An avatar that states its own still wins',
      ],
      [
        'variant',
        "'soft' | 'solid'",
        '—',
        'slAvatarGroup',
        'Provided to every member. tone is never provided: it is the member’s own identity',
      ],
      [
        'locale',
        'string',
        '—',
        'slAvatarGroup',
        'BCP 47, for the digits of the summary and for joining the hidden names',
      ],
      [
        'slAvatarGroupItem',
        'directive',
        '—',
        'li',
        'One member. Hidden when it falls past the limit, and its name is what the summary is called',
      ],
      [
        'aria-label',
        'string',
        '—',
        'slAvatarGroup',
        'What the list is called. Native, because the element already accepts it',
      ],
      [
        'exportAs',
        "'slAvatarGroup'",
        '—',
        'slAvatarGroup',
        'Reaches the component instance from the template',
      ],
    ]),
    accessibility: [
      'There is no avatar-group pattern in the WAI-ARIA Authoring Practices. The component is written on a real ul whose members are real li, so assistive technology announces a list of N without the family inventing a role.',
      'There is no label input. The element already accepts aria-label and aria-labelledby, and a second way to name one thing is a second thing to get wrong — the decision button-group took for the same question.',
      'The summary’s accessible name is the hidden members’ names, read from the avatar inside each item and joined with Intl.ListFormat for the locale. Atlassian’s default there is the English string “N more people”; MUI, Ant, Fluent, Chakra and HeroUI leave “+3” as the whole announcement.',
      'A member past the limit carries hidden, which takes it out of the layout and out of the accessibility tree in one attribute. Its name is not lost: the group reads it and puts it on the summary.',
      'A group told it stands for more members than it renders knows only the names it holds, so it names none of them rather than a third of them. Supply overflowLabel in that case.',
      'The group has no keyboard model of its own, because it is a list rather than a composite widget. Members that are links or buttons are ordinary tab stops in document order.',
      'In a stack each member covers the trailing edge of the one before it, so the member under the pointer or the caret is raised. The raise is instant, and a disabled member does not rise.',
      'The summary is not interactive here. Making it open the hidden members is a disclosure, which belongs to the popover and menu families.',
      'An empty group takes no room at all, so a row built from a permission filter does not leave a gap nobody can see in the markup.',
    ],
    snippets: [
      defineSnippet({
        id: 'avatar-group-angular-basic',
        language: 'angular',
        label: 'A list of faces, and a summary of the rest',
        source:
          '<ul slAvatarGroup aria-label="Reviewers">\n  @for (person of reviewers(); track person.id) {\n    <li slAvatarGroupItem>\n      <span slAvatar [name]="person.name" [src]="person.photograph"></span>\n    </li>\n  }\n</ul>',
      }),
      defineSnippet({
        id: 'avatar-group-angular-total',
        language: 'angular',
        label: 'Three of forty, from a paged endpoint',
        source:
          '<ul\n  slAvatarGroup\n  aria-label="Attendees"\n  [total]="event().attendeeCount"\n  [overflowLabel]="event().attendeeCount - 3 + \' more attendees\'"\n>\n  @for (person of firstAttendees(); track person.id) {\n    <li slAvatarGroupItem>\n      <span slAvatar [name]="person.name" [src]="person.photograph"></span>\n    </li>\n  }\n</ul>',
      }),
      defineSnippet({
        id: 'avatar-group-angular-spread',
        language: 'angular',
        label: 'Laid apart rather than stacked',
        source:
          '<ul slAvatarGroup aria-label="Team" layout="spread" size="lg" [max]="false">\n  @for (person of team(); track person.id) {\n    <li slAvatarGroupItem>\n      <span slAvatar [name]="person.name" [src]="person.photograph"></span>\n    </li>\n  }\n</ul>',
      }),
      defineSnippet({
        id: 'avatar-group-angular-links',
        language: 'angular',
        label: 'Members that open a profile',
        source:
          '<ul slAvatarGroup aria-label="Assignees" size="sm">\n  @for (person of assignees(); track person.id) {\n    <li slAvatarGroupItem>\n      <a\n        slAvatar\n        [name]="person.name"\n        [src]="person.photograph"\n        [routerLink]="[\'/people\', person.id]"\n      ></a>\n    </li>\n  }\n</ul>',
      }),
      defineSnippet({
        id: 'avatar-group-angular-ring',
        language: 'angular',
        label: 'A group on a colored row',
        source:
          '<ul\n  slAvatarGroup\n  aria-label="Reviewers"\n  style="--slotted-avatar-ring-color: var(--slotted-surface-sunken)"\n>\n  @for (person of reviewers(); track person.id) {\n    <li slAvatarGroupItem>\n      <span slAvatar [name]="person.name" [src]="person.photograph"></span>\n    </li>\n  }\n</ul>',
      }),
    ],
  },
} as const;
