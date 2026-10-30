import { Directive, forwardRef, inject } from '@angular/core';

import { SlListItemBodyScope, SlListItemBox, warnNesting } from './list-item-nesting';

/** A text part outside the box, which the stylesheet does not lay out. */
function checkInsideBox(part: string): void {
  warnNesting(
    part,
    inject(SlListItemBox, { optional: true }) === null,
    `${part} must be inside slListItemContent`,
  );
}

/**
 * The leading column: an icon, an avatar, a `slCheckbox`. The column is the
 * control glyph's own width, so whatever stands in it lands on the same line as
 * every other row's.
 *
 * It is the slot and not the control. A row that drew its own check would be a
 * second answer to the question `checkbox` already owns, and a chooser here is
 * also what announces a selection the row only paints.
 */
@Directive({
  selector: '[slListItemStart]',
  standalone: true,
  exportAs: 'slListItemStart',
  host: { 'data-part': 'start', 'data-part-start': '' },
})
export class SlListItemStart {}

/** The text column, and the one box in the row that may shrink. */
@Directive({
  selector: '[slListItemBody]',
  standalone: true,
  exportAs: 'slListItemBody',
  providers: [{ provide: SlListItemBodyScope, useExisting: forwardRef(() => SlListItemBody) }],
  host: { 'data-part': 'body', 'data-part-body': '' },
})
export class SlListItemBody {
  constructor() {
    checkInsideBox('slListItemBody');
  }
}

/**
 * The title. It clips under `truncate`, isolates its own direction so a title
 * in another script leaves the row around it alone, and breaks a single
 * unbroken token — a URL, a commit hash — rather than pushing the metadata out.
 */
@Directive({
  selector: '[slListItemLabel]',
  standalone: true,
  exportAs: 'slListItemLabel',
  host: { 'data-part': 'label', 'data-part-label': '' },
})
export class SlListItemLabel {
  constructor() {
    checkInsideBox('slListItemLabel');
  }
}

/** The lines under the title. They clip with it, never instead of it. */
@Directive({
  selector: '[slListItemDescription]',
  standalone: true,
  exportAs: 'slListItemDescription',
  host: { 'data-part': 'description', 'data-part-description': '' },
})
export class SlListItemDescription {
  constructor() {
    checkInsideBox('slListItemDescription');
  }
}

/**
 * Trailing metadata that is part of what the row says — a timestamp, a count, a
 * `slBadge`. It is inside the box, so it is part of the row's own name for a
 * reader and part of its target for a pointer. Anything that acts is
 * `slListItemActions`.
 */
@Directive({
  selector: '[slListItemEnd]',
  standalone: true,
  exportAs: 'slListItemEnd',
  host: { 'data-part': 'end', 'data-part-end': '' },
})
export class SlListItemEnd {}

/**
 * Independent targets, and a **sibling** of the box rather than its child.
 * Interactive content may not nest inside `a` or `button`, so a row that
 * navigates and also deletes has to put its two controls side by side. Every
 * surveyed implementation lets a consumer nest them instead and produces HTML
 * no browser can make focusable.
 */
@Directive({
  selector: '[slListItemActions]',
  standalone: true,
  exportAs: 'slListItemActions',
  host: { 'data-part': 'actions', 'data-part-actions': '' },
})
export class SlListItemActions {}
