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

/** A narrow column, for showing what a form does below 360 pixels. */
export function Measure({ children }: { children: ReactNode }) {
  return <div className="slotted-demo-measure">{children}</div>;
}
