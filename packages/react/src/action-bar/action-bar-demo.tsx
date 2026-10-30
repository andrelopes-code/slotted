import { useState } from 'react';
import type { ReactNode } from 'react';

/**
 * A panel that scrolls, so a sticky bar has something to stick inside.
 *
 * `.slotted-demo-viewport` carries `contain: paint`, which makes it the
 * containing block a sticky element resolves against — so the bar sticks to the
 * bottom of this box rather than to the Storybook canvas.
 */
export function ScrollingPanel({ children }: { children: ReactNode }) {
  return (
    <div className="slotted-demo-viewport" data-size="tall" data-scroll data-layout="page">
      {children}
    </div>
  );
}

/**
 * A selection a reader can turn on and off, for the bar a selection brings.
 *
 * The count is the consumer's — `table` owns the selection and says so in its
 * own contract — and what the bar supplies is the place it goes and the entry it
 * makes.
 */
export function Selection({
  children,
}: {
  children: (state: { count: number; toggle: () => void }) => ReactNode;
}) {
  const [count, setCount] = useState(12);
  return <>{children({ count, toggle: () => setCount((held) => (held === 0 ? 12 : 0)) })}</>;
}
