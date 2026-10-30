import { definedProps, keyedProps } from '@slotted/core/selector-key';

import { ICON_BUTTON_DEFAULTS } from './button.constants';
import { linkInertness, rootData, useAppearance } from './button-root';
import type { ButtonLinkRootProps, IconButtonLinkProps } from './button.types';

/**
 * IconButton drawn on an anchor: the surface, the shape and the mandatory name
 * of IconButton, and the navigation of ButtonLink — the element is an `a`,
 * and a disabled one keeps no `href`, stays in the tab sequence and says
 * `aria-disabled`.
 */
export function IconButtonLink({
  children,
  disabled = false,
  href,
  onAuxClick,
  onAuxClickCapture,
  onClick,
  onClickCapture,
  onKeyDown,
  onKeyDownCapture,
  render,
  shape = ICON_BUTTON_DEFAULTS.shape,
  size,
  tone,
  variant,
  ...anchorProps
}: IconButtonLinkProps) {
  const appearance = useAppearance({ size, tone, variant }, ICON_BUTTON_DEFAULTS);

  const rootProps: ButtonLinkRootProps = keyedProps({
    ...anchorProps,
    ...rootData({ disabled, shape, ...appearance }),
    children: (
      <span data-part="icon" data-part-icon="">
        {children}
      </span>
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
