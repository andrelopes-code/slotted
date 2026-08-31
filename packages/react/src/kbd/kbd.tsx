import '@slotted/styles/kbd/kbd.css';

import type { KbdProps, KbdRootProps } from './kbd.types';

/**
 * One key, not a combination. `Ctrl + K` is two elements and a separator the
 * consumer writes, because the separator is text in their language and the
 * order of modifiers differs between platforms.
 */
export function Kbd({ className, render, size = 'md', ...nativeProps }: KbdProps) {
  const rootProps: KbdRootProps = {
    ...nativeProps,
    className: ['slotted-kbd', className].filter(Boolean).join(' '),
    'data-part': 'root',
    'data-size': size,
    'data-slotted-component': 'kbd',
  };

  return render === undefined ? <kbd {...rootProps} /> : render(rootProps);
}
