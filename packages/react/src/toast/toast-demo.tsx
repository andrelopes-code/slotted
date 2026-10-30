import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { createToaster, ToasterProvider, useToaster } from './toast-defaults';
import { ToastRegion } from './toast';
import type { Toaster, ToastInput, ToastRegionProps } from './toast.types';

/**
 * A region of its own per demonstration, inside a box that stands in for the
 * screen.
 *
 * Two things a reference page has to solve that an application does not. A
 * toast is transient, so a page whose messages have all expired shows an empty
 * canvas — the seeded messages are given no duration, and the caption of every
 * scene says the timer is what an application would use. And a page holds
 * thirteen demonstrations at once, so each takes a toaster of its own rather
 * than thirteen scenes writing into one corner of the screen.
 *
 * `.slotted-demo-viewport` is the workbench's own box: positioned, so
 * `attach="inline"` has something to resolve against, and clipping, so the
 * region is inside the scene rather than over the page.
 */
export function DemoRegion({
  children,
  seed = [],
  size = 'layer',
  trigger,
  ...region
}: Omit<ToastRegionProps, 'children' | 'toaster'> & {
  seed?: readonly ToastInput[];
  size?: 'layer' | 'tall';
  trigger?: (toaster: Toaster) => ReactNode;
  children?: ToastRegionProps['children'];
}) {
  const [toaster] = useState(() => createToaster());

  useEffect(() => {
    for (const message of seed) toaster.show({ duration: 0, ...message });
    return () => toaster.clear();
    /* The seed is read once, deliberately: a demonstration is a still, not a
       feed, and a page that re-seeded on every render would grow one message
       per keystroke of the controls. */
  }, [seed, toaster]);

  return (
    <ToasterProvider value={toaster}>
      <div className="slotted-demo-viewport" data-size={size}>
        <ToastRegion attach="inline" {...region}>
          {children}
        </ToastRegion>
      </div>
      {trigger === undefined ? null : <div className="slotted-demo-row">{trigger(toaster)}</div>}
    </ToasterProvider>
  );
}

/** The toaster of the demonstration around it, for a trigger inside one. */
export function useDemoToaster(): Toaster {
  return useToaster();
}
