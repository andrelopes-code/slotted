/**
 * The controls a toolbar takes charge of. They are the consumer's elements,
 * not the library's, so the toolbar recognises them by being focusable rather
 * than by a marker it would have to ask every consumer to apply.
 *
 * A disabled control still matches: the roving tab stop skips it when moving,
 * but leaving it out of the list entirely would renumber the others every time
 * one was disabled.
 */
export const TOOLBAR_ITEM_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
