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

export const REACT_AVATAR_GROUP_TOKENS = avatarGroupTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Avatar Group decision',
}));

export const REACT_AVATAR_GROUP_DOCS = {
  avatarGroup: {
    api: apiRows([
      [
        'layout',
        "'stack' | 'spread'",
        'stack',
        'AvatarGroup',
        'stack overlaps the members; spread lays them apart and wraps',
      ],
      [
        'max',
        'number | false',
        '5',
        'AvatarGroup',
        'The largest number of discs the group draws, the summary included. false shows every member',
      ],
      [
        'total',
        'number',
        '—',
        'AvatarGroup',
        'How many members there really are, when the page renders fewer than it has',
      ],
      [
        'overflowLabel',
        'string',
        '—',
        'AvatarGroup',
        'What the summary is called. Defaults to the hidden members’ names, joined for the locale',
      ],
      [
        'size',
        "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
        'md',
        'AvatarGroup',
        'Provided to every member, and the length the overlap is measured against',
      ],
      [
        'shape',
        "'circle' | 'square'",
        'circle',
        'AvatarGroup',
        'Provided to every member. An avatar that states its own still wins',
      ],
      [
        'variant',
        "'soft' | 'solid'",
        '—',
        'AvatarGroup',
        'Provided to every member. tone is never provided: it is the member’s own identity',
      ],
      [
        'locale',
        'string',
        '—',
        'AvatarGroup',
        'BCP 47, for the digits of the summary and for joining the hidden names',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'AvatarGroup',
        'Renders the list into another element — an ordered list for a ranked row',
      ],
      [
        'ref',
        'Ref<HTMLUListElement>',
        '—',
        'AvatarGroup',
        'Reaches the native element; the props type is the element’s own, extended',
      ],
      [
        'aria-label',
        'string',
        '—',
        'AvatarGroup',
        'What the list is called. Native, because the element already accepts it',
      ],
    ]),
    accessibility: [
      'There is no avatar-group pattern in the WAI-ARIA Authoring Practices. The group is a real ul whose members are real li, so assistive technology announces a list of N without the family inventing a role.',
      'There is no label prop. The element already accepts aria-label and aria-labelledby, and a second way to name one thing is a second thing to get wrong — the decision button-group took for the same question. Name the list for what it holds: “reviewers”, “attendees”.',
      'The summary’s accessible name is the hidden members’ names, joined with Intl.ListFormat for the locale. Atlassian’s default there is the English string “N more people”; MUI, Ant, Fluent, Chakra and HeroUI leave “+3” as the whole announcement.',
      'A group told it stands for more members than it renders knows only the names it holds, so it names none of them rather than a third of them. Supply overflowLabel in that case.',
      'The group has no keyboard model of its own, because it is a list rather than a composite widget. Members that are links or buttons are ordinary tab stops in document order.',
      'In a stack each member covers the trailing edge of the one before it, so the member under the pointer or the caret is raised: without it a focus ring would be half-hidden under the next avatar. The raise is instant, and a disabled member does not rise.',
      'The summary is not interactive here. Making it open the hidden members is a disclosure, which belongs to the popover and menu families; render on the member avatar is what turns it into your own trigger in the meantime.',
      'An empty group takes no room at all, so a row built from a permission filter does not leave a gap nobody can see in the markup.',
    ],
    snippets: [
      defineSnippet({
        id: 'avatar-group-react-basic',
        language: 'tsx',
        label: 'A list of faces, and a summary of the rest',
        source:
          '<AvatarGroup aria-label="Reviewers">\n  {reviewers.map((person) => (\n    <Avatar key={person.id} name={person.name} src={person.photograph} />\n  ))}\n</AvatarGroup>;',
      }),
      defineSnippet({
        id: 'avatar-group-react-total',
        language: 'tsx',
        label: 'Three of forty, from a paged endpoint',
        source:
          '<AvatarGroup\n  aria-label="Attendees"\n  overflowLabel={`${event.attendeeCount - 3} more attendees`}\n  total={event.attendeeCount}\n>\n  {event.firstAttendees.map((person) => (\n    <Avatar key={person.id} name={person.name} src={person.photograph} />\n  ))}\n</AvatarGroup>;',
      }),
      defineSnippet({
        id: 'avatar-group-react-spread',
        language: 'tsx',
        label: 'Laid apart rather than stacked',
        source:
          '<AvatarGroup aria-label="Team" layout="spread" max={false} size="lg">\n  {team.map((person) => (\n    <Avatar key={person.id} name={person.name} src={person.photograph} />\n  ))}\n</AvatarGroup>;',
      }),
      defineSnippet({
        id: 'avatar-group-react-links',
        language: 'tsx',
        label: 'Members that open a profile',
        source:
          '<AvatarGroup aria-label="Assignees" size="sm">\n  {assignees.map((person) => (\n    <Avatar\n      key={person.id}\n      name={person.name}\n      render={(props) => <a {...props} href={`/people/${person.id}`} />}\n      src={person.photograph}\n    />\n  ))}\n</AvatarGroup>;',
      }),
      defineSnippet({
        id: 'avatar-group-react-ring',
        language: 'tsx',
        label: 'A group on a coloured row',
        source:
          "<div style={{ background: 'var(--slotted-surface-sunken)' }}>\n  <AvatarGroup\n    aria-label=\"Reviewers\"\n    style={{ '--slotted-avatar-ring-color': 'var(--slotted-surface-sunken)' }}\n  >\n    {reviewers.map((person) => (\n      <Avatar key={person.id} name={person.name} src={person.photograph} />\n    ))}\n  </AvatarGroup>\n</div>;",
      }),
    ],
  },
} as const;
