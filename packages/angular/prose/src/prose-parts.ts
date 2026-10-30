import { afterNextRender, Directive, ElementRef, inject, Renderer2 } from '@angular/core';

/**
 * The opening paragraph, one step up and in the muted tone. Tailwind's
 * equivalent is a class the author writes into the Markdown; this is a part,
 * so it is contract and it is selectable.
 */
@Directive({
  selector: '[slProseLead]',
  standalone: true,
  exportAs: 'slProseLead',
  host: { 'data-part': 'lead', 'data-part-lead': '' },
})
export class SlProseLead {}

/**
 * A heading's permalink. The destination is the consumer's —
 * `rehype-autolink-headings` writes it — and the family owns where it sits,
 * how large its target is, and the rule that it appears on hover **and** on
 * focus. It is hidden with opacity, never with `display: none`, so a keyboard
 * reader can reach it and a screen reader can announce it.
 */
@Directive({
  selector: '[slProseAnchor]',
  standalone: true,
  exportAs: 'slProseAnchor',
  host: { 'data-part': 'anchor', 'data-part-anchor': '' },
})
export class SlProseAnchor {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  constructor() {
    /**
     * A word joiner — U+2060, the zero-width character whose whole purpose is
     * to forbid a break without occupying anything — goes before the anchor,
     * so the last word of a title and its permalink wrap together. Without it
     * the whitespace a template leaves between the two is a break opportunity,
     * and an anchor that is invisible at rest wraps to a line of its own and
     * opens an empty line under every heading.
     *
     * It is written after the first render rather than in the template,
     * because the directive attaches to the consumer's own element and has no
     * template of its own to put a character in front of. Hydration has
     * finished by then, so the insertion is an ordinary DOM mutation. `Link`
     * uses the same device for its external marker.
     */
    afterNextRender(() => {
      const element: HTMLElement = this.host.nativeElement;
      const parent = element.parentNode;
      if (parent === null) return;

      const previous = element.previousSibling;
      if (previous?.nodeType === Node.TEXT_NODE && previous.textContent?.endsWith('\u2060')) return;

      this.renderer.insertBefore(parent, this.renderer.createText('\u2060'), element);
    });
  }
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
@Directive({
  selector: '[slProseExclude]',
  standalone: true,
  exportAs: 'slProseExclude',
  host: { 'data-part': 'exclude', 'data-part-exclude': '' },
})
export class SlProseExclude {}

/** What GitHub Flavored Markdown emits at the end of a document. */
@Directive({
  selector: '[slProseFootnotes]',
  standalone: true,
  exportAs: 'slProseFootnotes',
  host: { 'data-part': 'footnotes', 'data-part-footnotes': '' },
})
export class SlProseFootnotes {}
