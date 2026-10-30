import type { ReactNode } from 'react';

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story composes this
 * rather than laying itself out, so no two examples can end up against each
 * other and no story reaches for an inline style.
 */
export function Scene({
  children,
  label,
  layout = 'block',
  note,
}: {
  children: ReactNode;
  label: string;
  layout?: 'block' | 'row' | 'stack' | 'prose';
  note: ReactNode;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage" data-layout={layout}>
        {children}
      </div>
    </section>
  );
}

export function Grid({ children, columns }: { children: ReactNode; columns: 1 | 2 | 3 }) {
  return (
    <div className="slotted-demo-grid" data-columns={String(columns)}>
      {children}
    </div>
  );
}

/**
 * A narrow column: 360 pixels, or a drawer's 280 — the one under the 320
 * pixels of its own width below which a side label stacks.
 */
export function Measure({ children, width }: { children: ReactNode; width?: 'drawer' }) {
  return (
    <div className="slotted-demo-measure" data-width={width}>
      {children}
    </div>
  );
}
