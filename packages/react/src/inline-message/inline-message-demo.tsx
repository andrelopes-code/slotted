import { Shield } from 'lucide-react';
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
 * A control with a label and a message wired to it, which is where this family
 * lives. `field` builds this in wave 3; until then the page shows the three
 * attributes a consumer writes themselves, because a message nothing points at
 * is the commonest way the family is used wrong.
 */
export function LabelledInput({
  children,
  defaultValue,
  invalid = false,
  label,
  messageId,
}: {
  children: ReactNode;
  defaultValue?: string;
  invalid?: boolean;
  label: string;
  messageId: string;
}) {
  return (
    <div className="slotted-demo-stack">
      <label className="slotted-demo-scene__label" htmlFor={`${messageId}-control`}>
        {label}
      </label>
      <input
        aria-errormessage={invalid ? messageId : undefined}
        aria-invalid={invalid || undefined}
        defaultValue={defaultValue}
        id={`${messageId}-control`}
      />
      {children}
    </div>
  );
}

/** A shield, for the one demonstration where the page supplies its own mark. */
export function ShieldGlyph() {
  return <Shield aria-hidden="true" focusable="false" size="1em" />;
}
