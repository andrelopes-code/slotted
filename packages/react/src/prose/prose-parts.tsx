import { keyedProps } from '@slotted/core/selector-key';
import type {
  ProseAnchorProps,
  ProseExcludeProps,
  ProseFootnotesProps,
  ProseLeadProps,
  ProsePartProps,
} from './prose.types';

/**
 * The opening paragraph, one step up and in the muted tone. Tailwind's
 * equivalent is a class the author writes into the Markdown; this is a part,
 * so it is contract, it is selectable, and a renderer's component map can
 * produce it.
 */
export function ProseLead({ render, ...nativeProps }: ProseLeadProps) {
  const rootProps: ProsePartProps = keyedProps({ ...nativeProps, 'data-part': 'lead' });

  return render === undefined ? <p {...rootProps} /> : render(rootProps);
}

/**
 * A heading's permalink. The link itself is the consumer's —
 * `rehype-autolink-headings` writes it — and the family owns where it sits,
 * how large its target is, and the rule that it appears on hover **and** on
 * focus. It is hidden with opacity, never with `display: none`, so a keyboard
 * reader can reach it and a screen reader can announce it.
 *
 * A word joiner is written before it so the last word of a title and its
 * permalink wrap together. It is the device `Link` uses for its external
 * marker, and for the same reason: a no-break space would carry a full word
 * space with it.
 */
export function ProseAnchor({ children, render, ...nativeProps }: ProseAnchorProps) {
  const rootProps: ProsePartProps = keyedProps({ ...nativeProps, children, 'data-part': 'anchor' });

  return (
    <>
      {'\u2060'}
      {render === undefined ? <a {...rootProps} /> : render(rootProps)}
    </>
  );
}

/**
 * A subtree the family does not style. Every content rule carries a guard
 * against this part and everything under it, and the four properties
 * inheritance still carried in — family, size, leading and wrapping — are
 * returned to control type here.
 *
 * Tailwind's `not-prose` and Typeset's `not-typeset` both leave the inherited
 * type in place, so a card inside a large region is set in the region's text.
 */
export function ProseExclude({ render, ...nativeProps }: ProseExcludeProps) {
  const rootProps: ProsePartProps = keyedProps({ ...nativeProps, 'data-part': 'exclude' });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/** What GitHub Flavored Markdown emits at the end of a document. */
export function ProseFootnotes({ render, ...nativeProps }: ProseFootnotesProps) {
  const rootProps: ProsePartProps = keyedProps({ ...nativeProps, 'data-part': 'footnotes' });

  return render === undefined ? <section {...rootProps} /> : render(rootProps);
}
