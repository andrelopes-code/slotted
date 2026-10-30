import type { ReactNode } from 'react';

interface ButtonContentProps {
  children: ReactNode;
  end?: ReactNode;
  /** Drawn while the control is waiting, if the wait has lasted long enough to show. */
  indicator?: ReactNode;
  start?: ReactNode;
}

/**
 * The label always renders, even when it is the only child: it is the part a
 * consumer styles and the element the accessible name is computed from, and a
 * part that appears only sometimes is a part nobody can rely on.
 *
 * `start` and `end` are omitted entirely when absent rather than rendered
 * empty, because an empty icon box still takes its own width and the gap
 * beside it.
 *
 * The indicator takes the first visual slot the control has, and the glyph
 * that lives there steps aside for the length of the wait: the box is already
 * the size of the ring, so nothing moves, and the label stays readable. The
 * glyph stays in the DOM under the ring rather than being swapped out, which
 * is the one shape both bindings can render identically — Angular projects the
 * consumer's own element into that slot and cannot take it back out.
 *
 * A control with no visual slot has nowhere to put the ring but over its own
 * label, so the ring is rendered beside the label and the stylesheet fades
 * everything that is not the ring.
 */
export function ButtonContent({ children, end, indicator, start }: ButtonContentProps) {
  const waiting = indicator !== undefined && indicator !== null;
  const inStart = waiting && start !== undefined;
  const inEnd = waiting && !inStart && end !== undefined;

  return (
    <>
      {start === undefined ? null : (
        <span data-part="start" data-part-start="">
          {start}
          {inStart ? indicator : null}
        </span>
      )}
      <span data-part="label" data-part-label="">
        {children}
      </span>
      {end === undefined ? null : (
        <span data-part="end" data-part-end="">
          {end}
          {inEnd ? indicator : null}
        </span>
      )}
      {waiting && !inStart && !inEnd ? indicator : null}
    </>
  );
}
