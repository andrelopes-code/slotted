import { inject, InjectionToken } from '@angular/core';
import type { ChangeReason } from '@slotted/core/state';

export type MessageAlign = 'start' | 'end';
export type MessageLayout = 'bubble' | 'thread';
export type MessageActionsVisibility = 'always' | 'hover';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'streaming';
export type BubbleVariant = 'solid' | 'soft' | 'outline' | 'plain';
export type BubbleTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
export type MessageActivityStepStatus = 'complete' | 'current' | 'pending';

/** Why a version, a reaction or a clamp moved. */
export type MessageChangeReason = Extract<ChangeReason, 'pointer' | 'keyboard'>;

/** A request to send a message again. It carries no value. */
export interface MessageRetryRequest {
  readonly reason: MessageChangeReason;
  readonly source: Event;
}

export interface MessageDefaults {
  layout: MessageLayout;
  actionsVisibility: MessageActionsVisibility;
  variant: BubbleVariant;
  tone: BubbleTone;
}

const FALLBACK: MessageDefaults = {
  layout: 'bubble',
  actionsVisibility: 'hover',
  variant: 'soft',
  tone: 'secondary',
};

export const MESSAGE_DEFAULTS = new InjectionToken<MessageDefaults>('slotted message defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its messages are laid out, when their
 * actions show, and what a bubble paints when nothing infers it. A group, a
 * row or a bubble that states any of them still wins. Its words come from the
 * language in force (`provideSlotted`).
 */
export function provideMessageDefaults(defaults: Partial<MessageDefaults>) {
  return {
    provide: MESSAGE_DEFAULTS,
    useFactory: (): MessageDefaults => ({
      layout: defaults.layout ?? FALLBACK.layout,
      actionsVisibility: defaults.actionsVisibility ?? FALLBACK.actionsVisibility,
      variant: defaults.variant ?? FALLBACK.variant,
      tone: defaults.tone ?? FALLBACK.tone,
    }),
  };
}

export function injectMessageDefaults(): MessageDefaults {
  return inject(MESSAGE_DEFAULTS);
}

/** A click from Enter or Space has no detail. */
export function reasonOf(event: Event): MessageChangeReason {
  return (event as MouseEvent).detail === 0 ? 'keyboard' : 'pointer';
}
