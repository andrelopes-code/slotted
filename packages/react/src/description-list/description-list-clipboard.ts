import { writeToClipboard } from '@slotted/core/clipboard';

/**
 * Putting a value on the clipboard, and saying whether it got there.
 *
 * The two ways and the order they are tried in belong to `@slotted/core`, which
 * is where behavior the two bindings would otherwise get differently wrong
 * lives: a temporary selection that is not taken back destroys the reader's
 * own, and that is a bug a family would rediscover once per framework (DL1).
 *
 * What is left here is the family's own reading of the answer: the control says
 * it copied whichever way the text went, and says it could not only when both
 * ways were refused. `description-list.spec.ts` asserts the same three outcomes
 * for Angular.
 */
export async function copyToClipboard(value: string): Promise<boolean> {
  return (await writeToClipboard(value)) !== 'refused';
}
