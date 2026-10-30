import { keyedProps } from '@slotted/core/selector-key';
import type { ComponentPropsWithRef } from 'react';

/**
 * The parts of an option `renderOption` writes. The stylesheet places an
 * option's content by the part it is: the face in the first column, the name
 * and the identifier in the second, the short fact in the third. A `span`
 * written by hand with `data-part="label"` alone carried no selector key and
 * fell out of the row's grid; these write both.
 */
function optionPart(part: 'label' | 'description' | 'meta' | 'media') {
  return function OptionPart(props: ComponentPropsWithRef<'span'>) {
    return <span {...keyedProps({ ...props, 'data-part': part })} />;
  };
}

/** The name: the second column, two lines at most. */
export const EntityPickerOptionLabel = optionPart('label');
/** What tells two records of one name apart: under the name, one line. */
export const EntityPickerOptionDescription = optionPart('description');
/** A short fact at the end of the first line. */
export const EntityPickerOptionMeta = optionPart('meta');
/**
 * The face, spanning both lines. With `media="none"` the family draws none, and
 * an option that has its own — a flag, a glyph — writes it here.
 */
export const EntityPickerOptionMedia = optionPart('media');
