import type { ReactNode } from 'react';

interface SceneProps {
  children: ReactNode;
  label: string;
  note: ReactNode;
}

interface GridProps {
  children: ReactNode;
  columns: 1 | 2 | 3;
}

/** One demonstration: what it is called, what to look at, and the stage it stands on. */
export function Scene({ children, label, note }: SceneProps) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>

      <div className="slotted-demo-stage" data-layout="block">
        {children}
      </div>
    </section>
  );
}

export function Grid({ children, columns }: GridProps) {
  return (
    <div className="slotted-demo-grid" data-columns={String(columns)}>
      {children}
    </div>
  );
}
