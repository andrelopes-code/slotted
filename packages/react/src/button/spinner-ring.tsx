/**
 * What the shared `spinner` sheet strokes inside every ring a family writes:
 * the track and the arc, on the icon set's grid. Inline, so no image is
 * fetched and a policy that allows images from the page's own origin alone
 * still shows the ring.
 */
export const SPINNER_RING = (
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="8.875" />
    <circle cx="12" cy="12" pathLength={100} r="8.875" />
  </svg>
);
