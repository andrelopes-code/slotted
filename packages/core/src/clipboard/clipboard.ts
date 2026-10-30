/**
 * Putting text on the clipboard, and saying how it got there.
 *
 * Two ways, in this order, because the first one is refused often enough that a
 * control built on it alone is a control that stops working for reasons the
 * reader cannot see:
 *
 * 1. `navigator.clipboard.writeText`. The API, asynchronous, permissioned, and
 *    the only one that works without a selection.
 * 2. `document.execCommand('copy')` over a selection this module makes and
 *    takes back. Deprecated, synchronous, and still the answer where the first
 *    is refused.
 *
 * The measurements that put the ladder in this shape were taken against the
 * running Storybook (DL1), and they are the reason the second step is here
 * rather than declined as it was before:
 *
 * - The preview iframe already carries `allow="clipboard-write;"` and the page
 *   is a secure context, so neither of the two causes the review guessed at is
 *   what refuses the write.
 * - What refuses it is the state of the document. Without user activation the
 *   write fails with `NotAllowedError: Write permission denied`; with the
 *   document unfocused it fails with `NotAllowedError: Document is not
 *   focused`. Both are ordinary — a control reached from a menu that closed, a
 *   window the reader clicked away from — and `execCommand` answered `true` in
 *   both, in the top document and inside the preview iframe.
 *
 * It lives in `@slotted/core` rather than in each binding because it is now
 * behaviour the two would get differently wrong: a temporary selection that is
 * not taken back leaves the reader's own selection destroyed, and that is a bug
 * a family would rediscover once per framework.
 */

/** Where the text ended up, and by which of the two ways. */
export type ClipboardOutcome = 'api' | 'command' | 'refused';

/**
 * The ranges a document holds, so a selection this module makes can be undone.
 * A reader who had selected a paragraph before pressing a copy control keeps
 * that paragraph selected afterwards.
 */
function heldRanges(selection: Selection | null): Range[] {
  if (selection === null) return [];
  const ranges: Range[] = [];
  for (let index = 0; index < selection.rangeCount; index += 1) {
    ranges.push(selection.getRangeAt(index).cloneRange());
  }
  return ranges;
}

function restore(selection: Selection | null, ranges: Range[]): void {
  if (selection === null) return;
  selection.removeAllRanges();
  for (const range of ranges) selection.addRange(range);
}

/**
 * The second step. The text is put in a node of its own, off the page but not
 * hidden from the engine — `display: none` and `visibility: hidden` are not
 * selectable, and an unselectable node is not copyable — the selection is moved
 * onto it, the command is run, and everything is put back.
 */
function copyByCommand(value: string, document: Document): boolean {
  const host = document.body ?? document.documentElement;
  if (host === null) return false;

  const carrier = document.createElement('span');
  carrier.textContent = value;
  /* Out of the flow and out of sight, and still laid out: the copy command
     reads the selection, and a selection needs boxes. `white-space` keeps the
     line breaks of a multi-line value. */
  carrier.style.cssText =
    'position:fixed;inset-block-start:0;inset-inline-start:0;opacity:0;pointer-events:none;white-space:pre;user-select:text';
  host.append(carrier);

  const selection = document.defaultView?.getSelection() ?? null;
  const held = heldRanges(selection);
  let done: boolean;
  try {
    const range = document.createRange();
    range.selectNodeContents(carrier);
    selection?.removeAllRanges();
    selection?.addRange(range);
    done = document.execCommand('copy');
  } catch {
    done = false;
  } finally {
    carrier.remove();
    restore(selection, held);
  }
  return done;
}

/**
 * Puts `value` on the clipboard and says which way it got there. `refused`
 * means both ways were, and it is the only answer a caller should treat as a
 * failure — the two successes differ in mechanism and in nothing a reader can
 * see.
 */
export async function writeToClipboard(
  value: string,
  document: Document | undefined = globalThis.document,
): Promise<ClipboardOutcome> {
  const clipboard = globalThis.navigator?.clipboard;
  if (clipboard !== undefined && typeof clipboard.writeText === 'function') {
    try {
      await clipboard.writeText(value);
      return 'api';
    } catch {
      /* The ladder's whole point: a refusal here is ordinary, and the next step
         answers most of them. */
    }
  }

  if (document === undefined) return 'refused';
  return copyByCommand(value, document) ? 'command' : 'refused';
}
