import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/avatar-group/avatar-group.css';

import { Children, isValidElement } from 'react';
import type { ReactElement } from 'react';

import { formatCount } from '@slotted/core/count';
import { formatNameList } from '@slotted/core/identity';

import { Avatar, AvatarDefaultsProvider, useAvatarDefaults } from '../avatar';
import type { AvatarGroupProps, AvatarGroupRootProps, AvatarProps } from '../avatar/avatar.types';

/**
 * A list of faces, overlapped or apart, ending in a summary of the ones it does
 * not show.
 *
 * It is a real `<ul>` and its members are real `<li>`s, so assistive technology
 * announces a list of N without the family inventing a role. The label is the
 * consumer's `aria-label`: the element already accepts one, and a second way to
 * name one thing is a second thing to get wrong — the decision `button-group`
 * took for the same question.
 *
 * The summary is an avatar rather than a fourth part painted to look like one,
 * so it takes the group's size, shape, edge and ring from the same rules as
 * every member beside it. Its accessible name is the hidden members' names,
 * joined for the locale: Atlassian's default there is the English string “N
 * more people”, and MUI, Ant, Fluent, Chakra and HeroUI leave `+3` as the whole
 * announcement.
 */
export function AvatarGroup({
  children,
  layout = 'stack',
  locale,
  max = 5,
  overflowLabel,
  render,
  shape,
  size,
  total,
  variant,
  ...nativeProps
}: AvatarGroupProps) {
  const defaults = useAvatarDefaults();
  const resolvedSize = size ?? defaults.size;
  const resolvedShape = shape ?? defaults.shape;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedLocale = locale ?? defaults.locale;

  const members = Children.toArray(children).filter(isValidElement);
  const count = total ?? members.length;
  const limit = max === false ? Number.POSITIVE_INFINITY : max;

  /**
   * `max` counts the discs the group draws, the summary included, so a limit of
   * five never puts six circles in a row. Below the limit nothing is
   * summarized: a `+1` beside four faces is one more circle than showing the
   * fifth, and says less.
   */
  const shownCount = count > limit ? Math.min(limit - 1, members.length) : members.length;
  const surplus = Math.max(count - shownCount, 0);

  /**
   * The names of the members that were not drawn. They are only complete while
   * every hidden member is in the DOM: a group told it stands for forty and
   * given three children knows three names and no more, so it says nothing
   * rather than naming a third of them, and `overflowLabel` is how that page
   * supplies the rest.
   */
  const hiddenNames =
    total === undefined || total === members.length
      ? members.slice(shownCount).map((member) => nameOf(member))
      : [];

  const summary = formatCount({ count: surplus, max: false, locale: resolvedLocale });

  const rootProps: AvatarGroupRootProps = keyedProps({
    ...nativeProps,
    children: (
      <AvatarDefaultsProvider shape={resolvedShape} size={resolvedSize} variant={resolvedVariant}>
        {members.slice(0, shownCount).map((member, index) => (
          <li data-part="item" data-part-item="" key={member.key ?? index}>
            {member}
          </li>
        ))}
        {surplus > 0 && summary !== undefined ? (
          <li data-part="overflow" data-part-overflow="">
            <Avatar
              initials={`+${summary}`}
              locale={resolvedLocale}
              name={overflowLabel ?? formatNameList({ names: hiddenNames, locale: resolvedLocale })}
              tone="secondary"
            />
          </li>
        ) : null}
      </AvatarDefaultsProvider>
    ),
    'data-layout': layout,
    'data-part': 'root',
    'data-shape': resolvedShape,
    'data-size': resolvedSize,
    'data-ui': 'avatar-group',
  });

  return render === undefined ? <ul {...rootProps} /> : render(rootProps);
}

/**
 * The member's own name, read from the element the page wrote. It works for an
 * `Avatar` and for anything else that takes a `name`, and it answers nothing
 * for a member wrapped in something that does not — which the caller treats as
 * a name it does not know rather than as a member that has none.
 */
function nameOf(member: ReactElement<unknown>): string | undefined {
  const props = member.props as Partial<AvatarProps> | undefined;
  return typeof props?.name === 'string' ? props.name : undefined;
}
