import '@slotted/styles/spinner/spinner.css';
import { SPINNER_RING } from './spinner-ring';

/**
 * The ring, and the only thing that announces the wait. It carries the
 * `spinner` identifier: the ring itself is drawn by that shared sheet, once,
 * for every family that waits, and this family only names it and places it.
 *
 * `role="progressbar"` with a name rather than `aria-busy` on the control:
 * `aria-busy` is not reliably announced on a button, and React Aria's pending
 * button and Primer's loading button both put a named progress element in the
 * accessibility tree instead. With the label kept at `opacity: 0` rather than
 * removed, the two names combine — "Save changes, Loading" — so the person
 * hears which action they are waiting for.
 *
 * It carries no value: the family knows that work is happening and never how
 * much of it is done. A progress bar with no `aria-valuenow` is indeterminate,
 * which is exactly the claim being made.
 */
export function ButtonIndicator({ label }: { label: string }) {
  return (
    <span
      aria-label={label}
      data-part="indicator"
      data-part-indicator=""
      data-ui="spinner"
      data-ui-spinner=""
      role="progressbar"
    >
      {SPINNER_RING}
    </span>
  );
}
