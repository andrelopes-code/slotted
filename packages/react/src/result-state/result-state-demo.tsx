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
  /**
   * `block` by default: this family declares `container-type: inline-size`, so
   * it has no intrinsic width and a stage that shrink-wraps its children would
   * resolve it to nothing. `specs/story-layout.test.mjs` refuses the pairing.
   */
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
 * A frame standing in for the table, card or panel a result state usually
 * replaces the contents of. It is the workbench's own sunken surface rather
 * than a border this file invents, so it answers the scheme switch.
 */
export function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="slotted-demo-surface" data-surface="sunken">
      {children}
    </div>
  );
}

/**
 * Artwork a page might supply instead of the status's own mark, for the one
 * demonstration about that. Every color in it is a foundation token, so it
 * follows the scheme the way the family does.
 */
export function BoardIllustration() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 96 64">
      <rect
        fill="var(--slotted-tone-accent-surface)"
        height="44"
        rx="6"
        stroke="var(--slotted-tone-accent-border)"
        strokeWidth="2"
        width="60"
        x="2"
        y="10"
      />
      <rect
        fill="var(--slotted-surface)"
        height="44"
        rx="6"
        stroke="var(--slotted-border-strong)"
        strokeWidth="2"
        width="60"
        x="34"
        y="2"
      />
      <path
        d="M46 24h36M46 32h24"
        stroke="var(--slotted-border-strong)"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}
