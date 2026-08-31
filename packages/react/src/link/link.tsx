import '@slotted/styles/link/link.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import type { LinkProps, LinkRootProps } from './link.types';

/**
 * `external` sets the two attributes a new-tab link needs and appends the
 * warning it owes the reader. Every one of them yields to a value the consumer
 * passed: a link that opens in a named frame is still external, and the hint is
 * still the honest thing to say.
 *
 * The hint carries a leading space of its own. Name computation concatenates
 * adjacent text without inserting one, and "Documentation(opens in a new tab)"
 * is what a screen reader would then read out.
 */
export function Link({
  children,
  className,
  external = false,
  externalHint = '(opens in a new tab)',
  render,
  rel,
  target,
  underline = 'always',
  ...nativeProps
}: LinkProps) {
  const rootProps: LinkRootProps = {
    ...nativeProps,
    children: (
      <>
        {children}
        {external ? (
          <span className="slotted-visually-hidden" data-part="external-hint">
            {` ${externalHint}`}
          </span>
        ) : null}
      </>
    ),
    className: ['slotted-link', className].filter(Boolean).join(' '),
    'data-part': 'root',
    'data-slotted-component': 'link',
    'data-underline': underline,
    rel: rel ?? (external ? 'noopener noreferrer' : undefined),
    target: target ?? (external ? '_blank' : undefined),
  };

  return render === undefined ? <a {...rootProps} /> : render(rootProps);
}
