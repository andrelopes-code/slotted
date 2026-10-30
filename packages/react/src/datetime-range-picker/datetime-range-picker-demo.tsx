import type { ReactNode } from 'react';

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story composes this
 * rather than laying itself out, so no two examples can end up against each
 * other and no story reaches for an inline style.
 */
export function Scene({
  children,
  collapseFloor,
  label,
  layout = 'block',
  note,
}: {
  children: ReactNode;
  /**
   * How small this scene's subject may legitimately be, in pixels.
   *
   * `tools/harness/audit.mjs` reports an element standing under 96 pixels in a
   * wide stage as collapsed, which is right for a demonstration and wrong for a
   * row of small buttons: a scene that shows something small by design says so
   * here rather than letting the audit guess.
   */
  collapseFloor?: number;
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
      <div
        className="slotted-demo-stage"
        data-layout={layout}
        {...(collapseFloor === undefined ? {} : { 'data-collapse-floor': String(collapseFloor) })}
      >
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

/** A narrow column, for showing what a control does below 320 pixels. */
export function Measure({ children }: { children: ReactNode }) {
  return <div className="slotted-demo-measure">{children}</div>;
}
