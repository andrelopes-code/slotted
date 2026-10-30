import { ChevronDown, Tag } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * One band of the overview page: the heading and its sentence in the sidebar
 * column, the demonstration in the wide one.
 *
 * The section is what carries the page's inset and the gap between its two
 * columns; the intro is only the column. An overview that put its headings and
 * its demonstrations straight into the intro — which is what this page did
 * before a reviewer read it — inherits neither, so every chip sits against the
 * panel's own edge and the bands run into each other.
 */
export function LabSection({
  children,
  columns,
  description,
  title,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  description: string;
  title: string;
}) {
  return (
    <section className="slotted-component-lab__section">
      <header className="slotted-component-lab__intro">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div
        className={
          columns === undefined
            ? 'slotted-component-lab__body'
            : 'slotted-component-lab__body slotted-demo-grid'
        }
        data-columns={columns}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * What the four reference pages share: a scene frame, and a demonstration list
 * that behaves like a real one. Written once here rather than four times,
 * because a removal that does not actually remove anything demonstrates
 * nothing — the pages exercise the family instead of posing it.
 */
export function DemoScene({
  children,
  label,
  note,
}: {
  children: ReactNode;
  label: string;
  note: string;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage">{children}</div>
    </section>
  );
}

/** The artwork belongs to the consumer, and it is Lucide's; a character is never an icon. */
export const GLYPH_TAG = <Tag aria-hidden="true" focusable="false" />;
export const GLYPH_CHEVRON = <ChevronDown aria-hidden="true" focusable="false" />;
