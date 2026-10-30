import { inject, InjectionToken } from '@angular/core';
import type { MessageScrollerPosition } from '@slotted/core/message-scroller';

export interface MessageScrollerDefaults {
  follow: boolean;
  defaultPosition: MessageScrollerPosition;
  peek: number;
  scrollMargin: number;
}

const FALLBACK: MessageScrollerDefaults = {
  follow: false,
  defaultPosition: 'last-anchor',
  peek: 64,
  scrollMargin: 0,
};

export const MESSAGE_SCROLLER_DEFAULTS = new InjectionToken<MessageScrollerDefaults>(
  'slotted message-scroller defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once whether its conversations follow a reply,
 * where a saved one opens, and how much of the previous turn stays in view.
 * A scroller that states any of them wins. Its words come from the language
 * in force (`provideSlotted`).
 */
export function provideMessageScrollerDefaults(defaults: Partial<MessageScrollerDefaults>) {
  return {
    provide: MESSAGE_SCROLLER_DEFAULTS,
    useFactory: (): MessageScrollerDefaults => ({
      follow: defaults.follow ?? FALLBACK.follow,
      defaultPosition: defaults.defaultPosition ?? FALLBACK.defaultPosition,
      peek: defaults.peek ?? FALLBACK.peek,
      scrollMargin: defaults.scrollMargin ?? FALLBACK.scrollMargin,
    }),
  };
}

export function injectMessageScrollerDefaults(): MessageScrollerDefaults {
  return inject(MESSAGE_SCROLLER_DEFAULTS);
}
