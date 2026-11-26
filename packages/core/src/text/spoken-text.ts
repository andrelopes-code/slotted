/**
 * The text of an element as a reader hears it: its text content without what
 * it hides from the accessibility tree (`aria-hidden="true"`, such as the
 * asterisk of a required field), its white space collapsed. An empty string
 * when nothing is left.
 */
export function spokenText(element: Element): string {
  const copy = element.cloneNode(true) as Element;
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove();

  return (copy.textContent ?? '').replace(/\s+/g, ' ').trim();
}
