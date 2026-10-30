import { definedProps, keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/link/link.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import { linkMessages } from '@slotted/core/i18n';
import type { SyntheticEvent } from 'react';

import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { useLinkDefaults } from './link-defaults';
import type { LinkProps, LinkRootProps } from './link.types';

/**
 * The zero-width character whose only job is to forbid a line break. It keeps
 * the marker with the last word of the link, and unlike a no-break space it
 * carries no width of its own — the distance between word and glyph is the
 * stylesheet's decision, not this string's.
 *
 * One on each side of the marker. The second is for the sentence the link ends:
 * without it the full stop after the link wraps onto the next line by itself,
 * because an inline box offers a break opportunity on both of its edges.
 */
const WORD_JOINER = '\u2060';

/**
 * The same refusal `ButtonLink` writes, and deliberately not imported from it:
 * a link is not a button, the two families share no code, and three lines
 * duplicated across a boundary are cheaper than the boundary.
 */
function blockActivation(event: SyntheticEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation?.();
}

/**
 * Text that goes somewhere. The element is an `a` with an `href`, so the role,
 * `Enter`, the context menu, the middle click and every modified click are the
 * platform's; `button` owns the action that has no URL, and `ButtonLink` owns
 * the navigation that wants the action surface.
 *
 * `external` is sugar for a new browsing context, and the three things a new
 * tab owes the reader — the safe `rel`, the visible marker, the announced
 * warning — follow the target that is actually resolved. A consumer who writes
 * `target="_blank"` by hand is telling the family the same fact, and gets the
 * same answer; a consumer who writes `target="_self"` alongside `external` is
 * overruling it, and the explicit value wins as it does everywhere else.
 */
export function Link({
  children,
  disabled = false,
  external = false,
  href,
  messages,
  onAuxClick,
  onAuxClickCapture,
  onClick,
  onClickCapture,
  onKeyDown,
  onKeyDownCapture,
  rel,
  render,
  size,
  tabIndex,
  target,
  underline,
  variant,
  visited,
  ...nativeProps
}: LinkProps) {
  const defaults = useLinkDefaults();
  const t = useMessages(linkMessages, messages);
  const resolved = {
    underline: underline ?? defaults.underline ?? 'always',
    variant: variant ?? defaults.variant ?? 'accent',
    visited: visited ?? defaults.visited ?? false,
  };

  const resolvedTarget = target ?? (external ? '_blank' : undefined);
  const newTab = resolvedTarget === '_blank';

  const block = (event: SyntheticEvent) => {
    if (!disabled) return false;
    blockActivation(event);
    return true;
  };

  const rootProps: LinkRootProps = keyedProps({
    ...nativeProps,
    'aria-disabled': disabled || undefined,
    children: (
      <>
        {children}
        {newTab ? (
          <>
            {WORD_JOINER}
            <span aria-hidden="true" data-part="external-icon" data-part-external-icon="">
              {/* An arrow that means "away from here" points the other way in a
                  right-to-left document. */}
              <Icon directional>
                <Glyph name="external" />
              </Icon>
            </span>
            <span
              data-part="external-hint"
              data-part-external-hint=""
              data-ui="visually-hidden"
              data-ui-visually-hidden=""
            >
              {` ${t('externalHint')}`}
            </span>
            {WORD_JOINER}
          </>
        ) : null}
      </>
    ),
    'data-disabled': disabled || undefined,
    'data-part': 'root',
    'data-size': size,
    'data-ui': 'link',
    'data-underline': resolved.underline,
    'data-variant': resolved.variant,
    'data-visited': resolved.visited || undefined,
    /**
     * A link the consumer never gave a destination is not made into one here,
     * so `rel` and `target` answer the resolved target and nothing else.
     */
    rel: rel ?? (newTab ? 'noopener noreferrer' : undefined),
    /* Without an `href` an anchor has no role and drops out of the tab
       sequence, so a disabled link states both. */
    role: disabled ? 'link' : undefined,
    tabIndex: disabled ? (tabIndex ?? 0) : tabIndex,
    target: resolvedTarget,
    ...(disabled ? {} : { href }),
    onAuxClick: (event) => {
      if (block(event)) return;
      onAuxClick?.(event);
    },
    onAuxClickCapture: (event) => {
      if (block(event)) return;
      onAuxClickCapture?.(event);
    },
    onClick: (event) => {
      if (block(event)) return;
      onClick?.(event);
    },
    onClickCapture: (event) => {
      if (block(event)) return;
      onClickCapture?.(event);
    },
    onKeyDown: (event) => {
      if (event.key === 'Enter' && block(event)) return;
      onKeyDown?.(event);
    },
    onKeyDownCapture: (event) => {
      if (event.key === 'Enter' && block(event)) return;
      onKeyDownCapture?.(event);
    },
  });

  return render === undefined ? <a {...rootProps} /> : render(definedProps(rootProps));
}
