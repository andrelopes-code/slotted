import { inject, InjectionToken } from '@angular/core';
import type { MarkdownNode, MarkdownUrlKind } from '@slotted/core/markdown';

/** Where a link that leaves the application opens. */
export type MarkdownExternal = 'new-tab' | 'same-tab';

/** What an application sets once for every document under it. */
export interface MarkdownDefaults {
  alerts?: boolean | undefined;
  allow?: readonly string[] | undefined;
  external?: MarkdownExternal | undefined;
  headingAnchors?: boolean | undefined;
  isExternal?: ((href: string) => boolean) | undefined;
  transformUrl?:
    ((url: string, kind: MarkdownUrlKind, node: MarkdownNode) => string | null) | undefined;
}

export const MARKDOWN_DEFAULTS = new InjectionToken<MarkdownDefaults>('slotted markdown defaults', {
  providedIn: 'root',
  factory: (): MarkdownDefaults => ({}),
});

/**
 * An application decides once how its documents treat links, alerts, anchors
 * and URLs. A document that states any of them itself still wins. Its words
 * come from the language in force (`provideSlotted`).
 */
export function provideMarkdownDefaults(defaults: MarkdownDefaults) {
  return { provide: MARKDOWN_DEFAULTS, useValue: defaults };
}

export function injectMarkdownDefaults(): MarkdownDefaults {
  return inject(MARKDOWN_DEFAULTS);
}
