import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/badge/badge.css';

import { formatCount } from '@slotted/core/count';

import { useBadgeDefaults } from './badge-defaults';
import type { BadgeProps, BadgeRootProps } from './badge.types';

const ROLE = { off: undefined, polite: 'status', assertive: 'alert' } as const;

/**
 * A short, non-editable piece of metadata: a count, a status, a label. It is
 * never a command — it answers no hover and gives no press feedback — and it
 * carries no role of its own, because what a badge means comes from where it
 * sits.
 *
 * `count` is the one place the family does work rather than paint. The ceiling
 * above which a count becomes `99+`, whether nought is a value or an absence,
 * and which locale writes the digits are three decisions every consumer would
 * otherwise take again, and `@slotted/core/count` is where both bindings take
 * them once.
 */
export function Badge({
  children,
  count,
  end,
  live = 'off',
  locale,
  max,
  render,
  role,
  shape,
  showZero = false,
  size,
  start,
  tone,
  variant,
  ...nativeProps
}: BadgeProps) {
  const defaults = useBadgeDefaults();
  const resolvedShape = shape ?? defaults.shape;

  const counted =
    count === undefined
      ? undefined
      : formatCount({
          count,
          max: max ?? defaults.max,
          showZero,
          locale: locale ?? defaults.locale,
        });

  /**
   * A count that has fallen to nought leaves the corner rather than sitting
   * there as a blank circle — and nothing rendered is also nothing announced,
   * which is what a live badge needs when its subject goes away. A badge given
   * no count at all is untouched by the rule: an empty `dot` is the whole point
   * of that shape.
   */
  if (count !== undefined && counted === undefined) return null;

  /**
   * The count and the children are not alternatives. The usual pairing is a
   * number and the words that number does not say — `<Badge count={4}>` with a
   * `VisuallyHidden` "unread messages" inside it — so the value is written
   * first and the children follow it. A dot draws no value at any size, so
   * there its children are the only content.
   *
   * The text gets a box of its own. It is what `text-box` needs to trim the
   * line to the cap and the baseline, and a flex container's own text lives in
   * an anonymous item no stylesheet can reach.
   */
  const content = (
    <>
      {start === undefined ? null : (
        <span data-part="start" data-part-start="">
          {start}
        </span>
      )}
      <span data-part="label" data-part-label="">
        {resolvedShape === 'dot' ? null : counted}
        {children}
      </span>
      {end === undefined ? null : (
        <span data-part="end" data-part-end="">
          {end}
        </span>
      )}
    </>
  );

  const rootProps: BadgeRootProps = keyedProps({
    ...nativeProps,
    children: content,
    'data-part': 'root',
    'data-shape': resolvedShape,
    'data-size': size ?? defaults.size,
    'data-tone': tone ?? defaults.tone,
    'data-ui': 'badge',
    'data-variant': variant ?? defaults.variant,
    /* An explicit role the consumer wrote is never replaced by an inferred one. */
    ...(role === undefined ? {} : { role }),
    ...(role === undefined && ROLE[live] !== undefined ? { role: ROLE[live] } : {}),
  });

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
