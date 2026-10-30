import { definedProps, keyedProps } from '@slotted/core/selector-key';

import { ButtonContent } from './button-content';
import { BUTTON_LINK_DEFAULTS } from './button.constants';
import { linkInertness, rootData, useAppearance } from './button-root';
import type { ButtonLinkProps, ButtonLinkRootProps } from './button.types';

/**
 * Navigation wearing the action surface. It is the button surface applied to
 * an anchor, never a button emulating a link: the element is an `a`, the
 * activation is the platform's, and Space does not activate it because Space
 * does not activate a link.
 *
 * A disabled ButtonLink renders no `href` at all. An anchor that keeps its
 * destination and only blocks `click` still navigates on a middle click and on
 * a modified click; taking the destination away is what actually disables it.
 * It stays in the tab sequence with `role="link"` and `aria-disabled`, because
 * a control a keyboard user cannot reach is one they cannot discover is
 * unavailable.
 */
export function ButtonLink({
  children,
  disabled = false,
  end,
  fullWidth = false,
  href,
  justify = 'center',
  onAuxClick,
  onAuxClickCapture,
  onClick,
  onClickCapture,
  onKeyDown,
  onKeyDownCapture,
  render,
  size,
  start,
  tone,
  variant,
  ...anchorProps
}: ButtonLinkProps) {
  const appearance = useAppearance({ size, tone, variant }, BUTTON_LINK_DEFAULTS);

  const rootProps: ButtonLinkRootProps = keyedProps({
    ...anchorProps,
    ...rootData({ disabled, fullWidth, justify, ...appearance }),
    children: (
      <ButtonContent end={end} start={start}>
        {children}
      </ButtonContent>
    ),
    ...linkInertness(disabled, href, render !== undefined, {
      onAuxClick,
      onAuxClickCapture,
      onClick,
      onClickCapture,
      onKeyDown,
      onKeyDownCapture,
      tabIndex: anchorProps.tabIndex,
    }),
  });

  return render === undefined ? <a {...rootProps} /> : render(definedProps(rootProps));
}
