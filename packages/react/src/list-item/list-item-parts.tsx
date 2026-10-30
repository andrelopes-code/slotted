import { withSelectorKey } from '@slotted/core/selector-key';
import { ListItemBodyContext, useInsideBox } from './list-item-nesting';
import type { ListItemRegionProps, ListItemRegionRootProps } from './list-item.types';

function region(part: string) {
  return function Region({ render, ...nativeProps }: ListItemRegionProps) {
    const rootProps: ListItemRegionRootProps = withSelectorKey(
      { ...nativeProps, 'data-part': part },
      'part',
      part,
    );

    return render === undefined ? <div {...rootProps} /> : render(rootProps);
  };
}

/** A text part, which the stylesheet lays out only inside the box. */
function textRegion(part: string, name: string) {
  const Region = region(part);
  return function TextRegion(props: ListItemRegionProps) {
    useInsideBox(name);
    return part === 'body' ? (
      <ListItemBodyContext.Provider value>
        <Region {...props} />
      </ListItemBodyContext.Provider>
    ) : (
      <Region {...props} />
    );
  };
}

/**
 * The leading column: an icon, an avatar, a `Checkbox`. The column is the
 * control glyph's own width, so whatever stands in it lands on the same line as
 * every other row's.
 *
 * It is the slot and not the control. A row that drew its own check would be a
 * second answer to the question `checkbox` already owns, and a chooser here is
 * also what announces a selection the row only paints.
 */
export const ListItemStart = region('start');

/** The text column, and the one box in the row that may shrink. */
export const ListItemBody = textRegion('body', 'ListItemBody');

/**
 * The title. It clips under `truncate`, isolates its own direction so a title
 * in another script leaves the row around it alone, and breaks a single
 * unbroken token — a URL, a commit hash — rather than pushing the metadata out.
 */
export const ListItemLabel = textRegion('label', 'ListItemLabel');

/** The lines under the title. They clip with it, never instead of it. */
export const ListItemDescription = textRegion('description', 'ListItemDescription');

/**
 * Trailing metadata that is part of what the row says — a timestamp, a count, a
 * `Badge`. It is inside the box, so it is part of the row's own name for a
 * reader and part of its target for a pointer. Anything that acts is
 * `ListItemActions`.
 */
export const ListItemEnd = region('end');

/**
 * Independent targets, and a **sibling** of the box rather than its child.
 * Interactive content may not nest inside `a` or `button`, so a row that
 * navigates and also deletes has to put its two controls side by side. Every
 * surveyed implementation lets a consumer nest them instead and produces HTML
 * no browser can make focusable.
 */
export const ListItemActions = region('actions');
