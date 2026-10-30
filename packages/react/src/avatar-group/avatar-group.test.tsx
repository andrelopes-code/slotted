import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Avatar, AvatarDefaultsProvider } from '../avatar';
import { AvatarGroup } from './index';

const NAMES = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Katherine Johnson',
  'Barbara Liskov',
  'Donald Knuth',
  'Margaret Hamilton',
];

const members = (count: number) =>
  NAMES.slice(0, count).map((name) => <Avatar key={name} name={name} />);

const group = () => screen.getByTestId('group');
const items = () => group().querySelectorAll('[data-part="item"]');
const overflow = () => group().querySelector('[data-part="overflow"]');

describe('AvatarGroup', () => {
  it('is a list, and names the family and its parts', () => {
    render(
      <AvatarGroup aria-label="Reviewers" data-testid="group">
        {members(3)}
      </AvatarGroup>,
    );

    expect(group().tagName).toBe('UL');
    expect(group()).toHaveAttribute('data-ui', 'avatar-group');
    expect(group()).toHaveAttribute('data-part', 'root');
    expect(items()).toHaveLength(3);
    expect(items()[0]?.tagName).toBe('LI');
    expect(screen.getByRole('list', { name: 'Reviewers' })).toBe(group());
  });

  it('states its layout and the size it lays out at', () => {
    render(
      <AvatarGroup data-testid="group" layout="spread" size="lg">
        {members(2)}
      </AvatarGroup>,
    );

    expect(group()).toHaveAttribute('data-layout', 'spread');
    expect(group()).toHaveAttribute('data-size', 'lg');
    expect(group()).toHaveAttribute('data-shape', 'circle');
  });

  it('overlaps by default', () => {
    render(<AvatarGroup data-testid="group">{members(2)}</AvatarGroup>);

    expect(group()).toHaveAttribute('data-layout', 'stack');
  });
});

describe('the limit and the summary', () => {
  it('draws every member while the group is within the limit', () => {
    render(<AvatarGroup data-testid="group">{members(5)}</AvatarGroup>);

    expect(items()).toHaveLength(5);
    expect(overflow()).toBeNull();
  });

  /** `max` counts the discs, the summary included, so a limit of five never draws six. */
  it('summarises the rest without ever exceeding the limit', () => {
    render(<AvatarGroup data-testid="group">{members(7)}</AvatarGroup>);

    expect(items()).toHaveLength(4);
    expect(overflow()).not.toBeNull();
    expect(overflow()).toHaveTextContent('+3');
    expect(group().querySelectorAll('[data-ui="avatar"]')).toHaveLength(5);
  });

  it('takes a limit of its own', () => {
    render(
      <AvatarGroup data-testid="group" max={3}>
        {members(7)}
      </AvatarGroup>,
    );

    expect(items()).toHaveLength(2);
    expect(overflow()).toHaveTextContent('+5');
  });

  it('draws every member when the limit is removed', () => {
    render(
      <AvatarGroup data-testid="group" max={false}>
        {members(7)}
      </AvatarGroup>,
    );

    expect(items()).toHaveLength(7);
    expect(overflow()).toBeNull();
  });

  it('counts the members the page did not render', () => {
    render(
      <AvatarGroup data-testid="group" overflowLabel="Thirty-seven other people" total={40}>
        {members(3)}
      </AvatarGroup>,
    );

    expect(items()).toHaveLength(3);
    expect(overflow()).toHaveTextContent('+37');
  });

  it('writes the summary in the digits the locale writes', () => {
    render(
      <AvatarGroup data-testid="group" locale="ar-EG" max={2} total={1200}>
        {members(2)}
      </AvatarGroup>,
    );

    /* Arabic-Indic digits, grouped with U+066C rather than with a comma. */
    expect(overflow()?.textContent).toMatch(/^\+[٠-٩٬]+$/u);
  });
});

describe('the members the summary stands for', () => {
  /**
   * The differentiator: Atlassian's default here is the English string “N more
   * people”, and MUI, Ant, Fluent, Chakra and HeroUI leave `+3` as the whole
   * announcement.
   */
  it('is named by the hidden members, joined for the locale', () => {
    render(
      <AvatarGroup data-testid="group" locale="en-GB" max={3}>
        {members(5)}
      </AvatarGroup>,
    );

    expect(within(overflow() as HTMLElement).getByRole('img')).toHaveAccessibleName(
      'Alan Turing, Katherine Johnson and Barbara Liskov',
    );
  });

  it('joins them the way another locale joins them', () => {
    render(
      <AvatarGroup data-testid="group" locale="pt-BR" max={3}>
        {members(5)}
      </AvatarGroup>,
    );

    expect(within(overflow() as HTMLElement).getByRole('img')).toHaveAccessibleName(
      'Alan Turing, Katherine Johnson e Barbara Liskov',
    );
  });

  it('takes the label the consumer supplies', () => {
    render(
      <AvatarGroup data-testid="group" max={3} overflowLabel="three more reviewers">
        {members(5)}
      </AvatarGroup>,
    );

    expect(within(overflow() as HTMLElement).getByRole('img')).toHaveAccessibleName(
      'three more reviewers',
    );
  });

  /**
   * A group told it stands for forty and given three children knows three names
   * and no more, so it names none rather than a third of them.
   */
  it('says nothing when the hidden members are not in the document', () => {
    render(
      <AvatarGroup data-testid="group" total={40}>
        {members(3)}
      </AvatarGroup>,
    );

    expect(within(overflow() as HTMLElement).queryByRole('img')).toBeNull();
    expect(overflow()).toHaveTextContent('+37');
  });
});

describe('what the group decides for its members', () => {
  it('sizes, shapes and paints every member once', () => {
    render(
      <AvatarGroup data-testid="group" shape="square" size="xl" variant="solid">
        {members(2)}
      </AvatarGroup>,
    );

    for (const member of group().querySelectorAll('[data-ui="avatar"]')) {
      expect(member).toHaveAttribute('data-size', 'xl');
      expect(member).toHaveAttribute('data-shape', 'square');
      expect(member).toHaveAttribute('data-variant', 'solid');
    }
  });

  it('loses to a member that states its own', () => {
    render(
      <AvatarGroup data-testid="group" size="xl">
        <Avatar name="Ada Lovelace" size="xs" />
      </AvatarGroup>,
    );

    expect(group().querySelector('[data-ui="avatar"]')).toHaveAttribute('data-size', 'xs');
  });

  /** A tone derived from a name is the member's identity; a group that set it would erase it. */
  it('never decides the identity colour of its members', () => {
    render(
      <AvatarGroup data-testid="group">
        <Avatar name="Ada Lovelace" />
        <Avatar name="Katherine Johnson" />
      </AvatarGroup>,
    );

    const [first, second] = [...group().querySelectorAll('[data-ui="avatar"]')];
    expect(first?.getAttribute('data-tone')).not.toBe(second?.getAttribute('data-tone'));
  });

  it('inherits what an application set for the whole page', () => {
    render(
      <AvatarDefaultsProvider size="sm">
        <AvatarGroup data-testid="group">{members(2)}</AvatarGroup>
      </AvatarDefaultsProvider>,
    );

    expect(group()).toHaveAttribute('data-size', 'sm');
  });

  /** The summary is not a person, so it never takes an identity colour. */
  it('paints the summary neutral', () => {
    render(<AvatarGroup data-testid="group">{members(7)}</AvatarGroup>);

    expect(overflow()?.querySelector('[data-ui="avatar"]')).toHaveAttribute(
      'data-tone',
      'secondary',
    );
  });
});

describe('native wiring', () => {
  it('renders the list into another element', () => {
    render(
      <AvatarGroup render={(props) => <ol {...props} data-testid="group" />}>
        {members(2)}
      </AvatarGroup>,
    );

    expect(group().tagName).toBe('OL');
  });

  it('passes native attributes through', () => {
    render(
      <AvatarGroup className="app-group" data-testid="group" id="reviewers">
        {members(2)}
      </AvatarGroup>,
    );

    expect(group()).toHaveClass('app-group');
    expect(group()).toHaveAttribute('id', 'reviewers');
  });

  it('holds nothing when it is given nothing', () => {
    render(<AvatarGroup data-testid="group" />);

    expect(group()).toBeEmptyDOMElement();
  });
});
