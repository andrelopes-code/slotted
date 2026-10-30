import { Directive, inject, input, TemplateRef } from '@angular/core';

import type {
  EventCalendarContextMenuContext,
  EventCalendarContextTarget,
  EventCalendarDayContentContext,
  EventCalendarDetailContext,
  EventCalendarEventContext,
} from './event-calendar-defaults';

/**
 * The content of every event, in all four places it is drawn. The family keeps
 * the element — a link or a button — its name, its focus and its geometry;
 * the template writes what is inside it.
 */
@Directive({ selector: 'ng-template[slEventCalendarEvent]', standalone: true })
export class SlEventCalendarEvent {
  readonly template = inject<TemplateRef<EventCalendarEventContext>>(TemplateRef);
}

/** Given, the family opens its own popover with this content, anchored to the event. */
@Directive({ selector: 'ng-template[slEventCalendarDetail]', standalone: true })
export class SlEventCalendarDetail {
  readonly template = inject<TemplateRef<EventCalendarDetailContext>>(TemplateRef);
}

/** The consumer's content for a day: a price, a count of free slots, a holiday. */
/**
 * The items of the menu a secondary click, a long press or `Shift+F10` opens on
 * the grid — `slMenuItem`, `sl-menu-separator`, a nested menu — for the
 * target. `slEventCalendarContextMenuFor` narrows the targets that have a
 * menu; the others keep the browser's own.
 */
@Directive({ selector: 'ng-template[slEventCalendarContextMenu]', standalone: true })
export class SlEventCalendarContextMenu {
  readonly template = inject<TemplateRef<EventCalendarContextMenuContext>>(TemplateRef);
  readonly for = input<(target: EventCalendarContextTarget) => boolean>(() => true, {
    alias: 'slEventCalendarContextMenuFor',
  });
}

@Directive({ selector: 'ng-template[slEventCalendarDayContent]', standalone: true })
export class SlEventCalendarDayContent {
  readonly template = inject<TemplateRef<EventCalendarDayContentContext>>(TemplateRef);
}

/** The consumer's controls, at the end of the header. */
@Directive({ selector: '[slEventCalendarActions]', standalone: true })
export class SlEventCalendarActions {}

/** The action under the list's empty sentence — the one that creates an event. */
@Directive({ selector: '[slEventCalendarEmpty]', standalone: true })
export class SlEventCalendarEmpty {}

/** A message and a retry, above the grid. The grid stays usable. */
@Directive({ selector: '[slEventCalendarError]', standalone: true })
export class SlEventCalendarError {}
