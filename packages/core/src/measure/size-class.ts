/**
 * The size classes a page surface composes by, read against the width of its
 * container: compact under `COMPACT_BELOW`, medium from there to under
 * `EXPANDED_FROM`, expanded from `EXPANDED_FROM` up. SAP Fiori's S/M/L and
 * Material 3's compact window class draw the same lines.
 *
 * `app-shell`, `detail-panel`, `page` and `page-header` use these two widths
 * and no others; a component whose own content reflows keeps its own.
 */

/** Below this width, in pixels, a container is compact — a phone. */
export const COMPACT_BELOW = 600;
/** From this width, in pixels, a container is expanded. */
export const EXPANDED_FROM = 1024;
