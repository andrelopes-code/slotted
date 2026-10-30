import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/divider/divider.css';

import type { DividerProps, DividerRootProps } from './divider.types';

/**
 * A rule between two regions. `hr` already means separation, so the plain rule
 * writes no role at all; every departure from the element's own semantics is
 * written and nothing else is.
 *
 * A label changes the element. `hr` takes no content, so a labelled rule is a
 * `div` carrying `role="separator"`, and the name comes from `aria-label`
 * rather than from the text inside it: the separator role makes its children
 * presentational, so the visible label never reaches the accessibility tree.
 */
export function Divider({
  align = 'center',
  decorative = false,
  inset = false,
  label,
  orientation = 'horizontal',
  render,
  role,
  ...nativeProps
}: DividerProps) {
  const labelled = label !== undefined;
  /** The one case where the element already says everything the family means. */
  const rendersOwnRule = render === undefined && !labelled;

  const rootProps: DividerRootProps = keyedProps({
    ...nativeProps,
    /* A rule that is decoration has no name to give: role="none" prohibits one. */
    ...(labelled && !decorative ? { 'aria-label': label } : {}),
    /* A separator is horizontal unless it says otherwise. */
    ...(orientation === 'vertical' && !decorative ? { 'aria-orientation': 'vertical' } : {}),
    ...(labelled ? { 'data-align': align, 'data-labelled': '' } : {}),
    ...(inset ? { 'data-inset': '' } : {}),
    'data-orientation': orientation,
    'data-part': 'root',
    'data-ui': 'divider',
    role: role ?? (decorative ? 'none' : rendersOwnRule ? undefined : 'separator'),
  });

  if (render !== undefined) {
    return render(labelled ? { ...rootProps, children: labelContent(label) } : rootProps);
  }

  return labelled ? <div {...rootProps}>{labelContent(label)}</div> : <hr {...rootProps} />;
}

function labelContent(label: string) {
  return (
    <span data-part="label" data-part-label="">
      {label}
    </span>
  );
}
