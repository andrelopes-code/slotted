import '@slotted/styles/spinner/spinner.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import type { SpinnerProps, SpinnerRootProps } from './spinner.types';

/**
 * The label is rendered as hidden text rather than set as an aria-label,
 * because the root is a live region: a region announces the content it gains,
 * and an attribute is not content. It also keeps the string in the template,
 * where a translation pass will find it.
 */
export function Spinner({
  className,
  decorative = false,
  label = 'Loading',
  render,
  role,
  size = 'md',
  ...nativeProps
}: SpinnerProps) {
  const rootProps: SpinnerRootProps = {
    ...nativeProps,
    'aria-hidden': decorative ? 'true' : undefined,
    children: (
      <>
        <span aria-hidden="true" data-part="indicator" />
        {decorative ? null : (
          <span className="slotted-visually-hidden" data-part="label">
            {label}
          </span>
        )}
      </>
    ),
    className: ['slotted-spinner', className].filter(Boolean).join(' '),
    'data-part': 'root',
    'data-size': size,
    'data-slotted-component': 'spinner',
    role: role ?? (decorative ? undefined : 'status'),
  };

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
