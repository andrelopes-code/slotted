import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/description-list/description-list.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import { descriptionListMessages } from '@slotted/core/i18n';
import { createContext, useContext, type CSSProperties } from 'react';

import { useMessages } from '../i18n';
import { useDescriptionListDefaults } from './description-list-defaults';
import type {
  DescriptionListContextValue,
  DescriptionListItemContextValue,
  DescriptionListProps,
  DescriptionListRootProps,
} from './description-list.types';

const DescriptionListContext = createContext<DescriptionListContextValue | undefined>(undefined);
const DescriptionListItemContext = createContext<DescriptionListItemContextValue | undefined>(
  undefined,
);

/**
 * What the list around this part decided. A part outside a list has no
 * arrangement to answer and no words to read, so this throws rather than
 * rendering markup that looks right and behaves like nothing.
 */
export function useDescriptionList(): DescriptionListContextValue {
  const context = useContext(DescriptionListContext);
  if (context === undefined) {
    throw new Error('Description list parts must be rendered inside a DescriptionList.');
  }
  return context;
}

/** The pair around this part, when there is one. */
export function useDescriptionListItem(): DescriptionListItemContextValue | undefined {
  return useContext(DescriptionListItemContext);
}

export const DescriptionListItemProvider = DescriptionListItemContext.Provider;

/**
 * Pairs of a term and its description, read rather than edited.
 *
 * **The semantics are the platform's.** `dl`, `dt` and `dd` already carry
 * `list`, `term` and `definition`, so the family writes no role: MDN records
 * that authoring the ARIA `term` and `definition` roles by hand changes how
 * VoiceOver announces the construct. The `div` around each pair is the form the
 * HTML Standard permits, and it is what makes a pair one grid area.
 *
 * **The `dl` is fixed, and the wrapper around it is why.** An element with
 * `container-type: inline-size` is a query container for its descendants and
 * not for itself, and what the container query changes here is the grid. So the
 * root is the container and the `dl` is the grid; substituting the `dl` would
 * take away the element every semantic in this family rests on, and it has no
 * option of its own to be worth the risk. Native props, the ref and `render`
 * reach the root.
 *
 * **It answers its own width, not the viewport's.** The same list sits in a
 * three-hundred-pixel drawer and in a page, on one screen.
 */
export function DescriptionList({
  children,
  columns,
  layout,
  messages,
  minColumnWidth,
  render,
  style,
  termWidth,
  variant,
  ...nativeProps
}: DescriptionListProps) {
  const defaults = useDescriptionListDefaults();
  const t = useMessages(descriptionListMessages, messages);

  const context: DescriptionListContextValue = {
    columns: columns ?? defaults.columns ?? 1,
    layout: layout ?? defaults.layout ?? 'row',
    t,
    variant: variant ?? defaults.variant ?? 'plain',
  };

  const width = termWidth ?? defaults.termWidth;

  const rootProps: DescriptionListRootProps = keyedProps({
    ...nativeProps,
    children: (
      <dl data-part="list" data-part-list="">
        {children}
      </dl>
    ),
    'data-columns': String(context.columns),
    'data-layout': context.layout,
    'data-min-column-width': minColumnWidth ?? defaults.minColumnWidth ?? 'md',
    'data-part': 'root',
    'data-ui': 'description-list',
    'data-variant': context.variant,
    /* A length only the consumer knows, handed to the stylesheet under the
       name that says so. It is a runtime value rather than a design token,
       which is the same route `skeleton` takes for its geometry. */
    style:
      width === undefined
        ? style
        : ({ ...style, '--slotted-description-list-term-width': width } as CSSProperties),
  });

  return (
    <DescriptionListContext.Provider value={context}>
      {render === undefined ? <div {...rootProps} /> : render(rootProps)}
    </DescriptionListContext.Provider>
  );
}
