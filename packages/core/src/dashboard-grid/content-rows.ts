/**
 * The sub-rows a widget's content needs, read from the card the widget holds:
 * the card's height less its body's, plus the extent of what the body holds,
 * and the gap the widget's cell draws under the card, in the grid's tracks.
 * The extent is read from the body's last child rather than from the body,
 * which a cell taller than the content stretches; so the measure follows the
 * content both up and down.
 */
export function contentSpanOf(card: HTMLElement, list: HTMLElement): number | null {
  const body = card.querySelector<HTMLElement>(':scope > [data-part="body"]');
  if (body === null) return null;
  const styles = getComputedStyle(list);
  const row = parseFloat(styles.gridAutoRows);
  /* The tracks have no gap between them: the widget's cell draws it below the card. */
  const gap = parseFloat(styles.columnGap) || 0;
  if (!(row > 0)) return null;
  const own = getComputedStyle(body);
  const top = body.getBoundingClientRect().top - body.scrollTop;
  const last = body.lastElementChild;
  const extent =
    (last === null
      ? parseFloat(own.paddingBlockStart) || 0
      : last.getBoundingClientRect().bottom - top) + (parseFloat(own.paddingBlockEnd) || 0);
  const needed = card.offsetHeight - body.offsetHeight + extent;
  /* A float's last digit is not a track. */
  return Math.max(1, Math.ceil((needed + gap) / row - 1e-6));
}

/**
 * Calls `onSpan` with the sub-rows the card's content needs, now and whenever the
 * card or what its body holds changes size. Returns the teardown.
 */
export function observeContentSpan(
  card: HTMLElement,
  list: HTMLElement,
  onSpan: (span: number) => void,
): () => void {
  if (typeof ResizeObserver === 'undefined') return () => {};
  let last: number | null = null;
  const measure = () => {
    const span = contentSpanOf(card, list);
    if (span !== null && span !== last) {
      last = span;
      onSpan(span);
    }
  };
  const sizes = new ResizeObserver(measure);
  const watch = () => {
    sizes.disconnect();
    sizes.observe(card);
    const body = card.querySelector(':scope > [data-part="body"]');
    for (const child of body?.children ?? []) sizes.observe(child);
  };
  const children = new MutationObserver(() => {
    watch();
    measure();
  });
  const body = card.querySelector(':scope > [data-part="body"]');
  if (body !== null) children.observe(body, { childList: true });
  watch();
  measure();
  return () => {
    sizes.disconnect();
    children.disconnect();
  };
}
