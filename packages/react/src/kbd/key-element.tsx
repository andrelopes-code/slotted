import { keyedProps } from '@slotted/core/selector-key';
import type { ReactNode } from 'react';

import type { KbdPlatform, ResolvedKey } from '@slotted/core/keys';

import type { KbdRootProps, KbdSize, KbdVariant } from './kbd.types';

export interface KeyElementProps {
  /**
   * Not named `key`: React reads that attribute off the element itself, so a
   * prop by that name would never reach this component at all.
   */
  resolved: ResolvedKey | undefined;
  /** A legend the page wrote itself, which wins over the resolved one. */
  legend: ReactNode | undefined;
  platform: KbdPlatform | undefined;
  size: KbdSize;
  variant: KbdVariant;
  disabled: boolean;
  nativeProps: Record<string, unknown>;
  render: ((props: KbdRootProps) => ReactNode) | undefined;
}

/**
 * The one place the key's DOM is written on the React side.
 *
 * `Kbd` and `Shortcut` both produce key caps — one from a token a consumer
 * named, the other from a token the shortcut parsed — and two copies of this
 * markup would be two things to keep in step with the contract, the stylesheet
 * and the harness fragment. There is one.
 */
export function KeyElement({
  resolved,
  legend,
  platform,
  size,
  variant,
  disabled,
  nativeProps,
  render,
}: KeyElementProps) {
  /**
   * A named key wins over content, because it is the more specific of two
   * explicit instructions: `keyName` says which key this is, and content says
   * only what to draw. It also keeps the two bindings provably identical —
   * Angular projects content and cannot ask whether any was written, so a rule
   * that depended on the answer would be a rule only React could keep.
   *
   * Content written on its own is never given a name it did not ask for: only
   * the page knows what its own word says. An application that wants a different
   * mark for a named key replaces it once, and translatably, through `legends`.
   */
  const shown = resolved?.legend ?? legend;
  const name = resolved?.name;
  const symbolic = resolved?.symbolic === true;

  const rootProps: KbdRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        <span
          data-part="legend"
          data-part-legend=""
          {...(symbolic ? { 'data-legend': 'symbol' } : {})}
          /* The mark is not read; the word beside it is. */
          {...(name === undefined ? {} : { 'aria-hidden': true })}
        >
          {shown}
        </span>
        {name === undefined ? null : (
          <span data-part="name" data-part-name="">
            {name}
          </span>
        )}
      </>
    ),
    'data-part': 'root',
    'data-size': size,
    'data-ui': 'kbd',
    'data-variant': variant,
    ...(resolved?.token === undefined ? {} : { 'data-key': resolved.token }),
    ...(platform === undefined ? {} : { 'data-platform': platform }),
    ...(disabled ? { 'data-disabled': '' as const } : {}),
  });

  return render === undefined ? <kbd {...rootProps} /> : render(rootProps);
}
