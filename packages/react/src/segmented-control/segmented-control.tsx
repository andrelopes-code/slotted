import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/segmented-control/segmented-control.css';

import { createControllable } from '@slotted/core/state';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useState,
} from 'react';
import type { ReactElement, ReactNode } from 'react';

import { useField, useFieldDefaults } from '../field';
import { useFieldGroup } from '../field-group';
import { Segment } from './segmented-control-parts';
import { useSegmentedControlDefaults } from './segmented-control-defaults';
import type {
  SegmentProps,
  SegmentedControlContextValue,
  SegmentedControlProps,
  SegmentedControlRootProps,
  SegmentedControlSelectionReason,
} from './segmented-control.types';

const SegmentedControlContext = createContext<SegmentedControlContextValue | undefined>(undefined);

/**
 * What the control around this segment says. A `Segment` outside one has no
 * exclusive set to belong to and no name to be grouped by, so this throws
 * rather than rendering a control that looks right and behaves like nothing.
 */
export function useSegmentedControl(): SegmentedControlContextValue {
  const context = useContext(SegmentedControlContext);
  if (context === undefined) {
    throw new Error('Segment must be rendered inside a SegmentedControl.');
  }
  return context;
}

/**
 * The segments, in the order the control holds them.
 *
 * The thumb's place is the checked index and its width is one of the equal
 * columns, so both numbers have to be known while the markup is being written
 * rather than after a layout — which is what makes the first server-rendered
 * paint correct where Mantine's and Ark's are not.
 *
 * Fragments and arrays are walked through, because a consumer mapping over
 * their options produces one of each. A segment inside a component of the
 * consumer's own is not found, and it could not have worked anyway: the
 * columns belong to the root's grid, so an element between the two breaks the
 * layout before it breaks the count.
 */
function segmentValues(children: ReactNode): string[] {
  const values: string[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Segment) {
      values.push((child.props as SegmentProps).value);
      return;
    }
    const nested = (child as ReactElement<{ children?: ReactNode }>).props.children;
    if (child.type === (<></>).type && nested !== undefined) values.push(...segmentValues(nested));
  });

  return values;
}

/**
 * One choice out of a few, applied at once, on a track.
 *
 * **The keyboard is the platform's, and that is why the segments share a
 * `name`.** Native radios in one form owner with one name already implement
 * the APG's Radio Group table: Tab lands on the checked segment or on the
 * first, `Space` checks, both arrow axes move focus and the selection
 * together, the set wraps, and disabled segments are skipped — in a
 * right-to-left document too.
 *
 * **The role is conditional, and the condition is the field group.** A
 * `field-group` is a `fieldset` with a `legend`, which is already a named
 * group; a `radiogroup` inside it is the same set announced twice. A
 * consumer's explicit `role` wins over both.
 *
 * **`readOnly` is enforced, because the platform has none.** A radio ignores
 * `readonly`, so the control refuses the change on the segment's own `click` —
 * the one event a pointer and `Space` share — and announces `aria-readonly`.
 */
export function SegmentedControl({
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  'aria-orientation': ariaOrientation,
  'aria-readonly': ariaReadOnly,
  'aria-required': ariaRequired,
  children,
  className,
  condense,
  defaultValue,
  disabled,
  fullWidth,
  invalid,
  name,
  onValueChange,
  orientation,
  readOnly,
  ref,
  render,
  required,
  role,
  size,
  style,
  value,
  variant,
  ...nativeProps
}: SegmentedControlProps) {
  const field = useField();
  const fieldGroup = useFieldGroup();
  const fieldDefaults = useFieldDefaults();
  const defaults = useSegmentedControlDefaults();
  const generatedName = useId();

  const [own, setOwn] = useState<string | undefined>(defaultValue);
  const current = value ?? own;

  const resolvedSize = size ?? field?.size ?? fieldGroup?.size ?? defaults.size;
  const resolvedOrientation = orientation ?? defaults.orientation;
  const resolvedCondense = condense ?? defaults.condense;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedFullWidth = fullWidth ?? defaults.fullWidth;
  const resolvedDisabled = disabled ?? field?.disabled ?? fieldDefaults.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly ?? fieldDefaults.readOnly;
  const resolvedInvalid = invalid ?? field?.invalid;
  const resolvedRequired = required ?? field?.required ?? fieldGroup?.required;
  const resolvedRole = role ?? (fieldGroup === undefined ? 'radiogroup' : undefined);

  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);

  const values = segmentValues(children);
  const index = current === undefined ? -1 : values.indexOf(current);

  const context: SegmentedControlContextValue = {
    disabled: resolvedDisabled,
    invalid: resolvedInvalid,
    name: name ?? `slotted-segmented-control-${generatedName}`,
    readOnly: resolvedReadOnly,
    required: resolvedRequired,
    select: (next, reason: SegmentedControlSelectionReason, source) => {
      if (resolvedReadOnly === true) return false;
      let cancelled = false;
      const state = createControllable<string | undefined>({
        controlled: value,
        initial: current,
        onRequest: (request) => {
          cancelled = request.cancelled;
          /* Never undefined here: a segment cannot be unchosen by choosing it. */
          if (request.value !== undefined) onValueChange?.(request.value, request);
        },
      });
      const moved = state.request(next, reason, source);
      if (cancelled) return false;
      if (moved) setOwn(next);
      return true;
    },
    size: resolvedSize,
    value: current,
  };

  const rootProps: SegmentedControlRootProps = keyedProps({
    ...nativeProps,
    'aria-describedby': [describedBy, field?.describedBy].filter(Boolean).join(' ') || undefined,
    'aria-invalid': ariaInvalid ?? (resolvedInvalid === true ? true : undefined),
    /* Named by the field's label where the root owns the group role and the
       consumer named it no other way; a `div` is not labelable, so the
       label's `for` reaches nothing. */
    'aria-labelledby':
      nativeProps['aria-labelledby'] ??
      (resolvedRole !== undefined && nativeProps['aria-label'] === undefined
        ? field?.ids.label
        : undefined),
    /**
     * Only where the root owns the role. On an element with no role the
     * attribute describes nothing, and `radiogroup` already implies
     * `vertical`, so it is written when the set flows the other way.
     */
    'aria-orientation':
      ariaOrientation ??
      (resolvedRole === 'radiogroup' && resolvedOrientation === 'horizontal'
        ? 'horizontal'
        : undefined),
    'aria-readonly': ariaReadOnly ?? (resolvedReadOnly === true ? true : undefined),
    'aria-required': ariaRequired ?? (resolvedRequired === true ? true : undefined),
    children: (
      <SegmentedControlContext.Provider value={context}>
        {/* Absent while nothing is checked, so the first selection fades the
            thumb in where it belongs rather than sliding it from an edge the
            reader has never seen. */}
        {index < 0 ? null : (
          <span aria-hidden="true" data-part="indicator" data-part-indicator="" />
        )}
        {children}
      </SegmentedControlContext.Provider>
    ),
    className,
    'data-condense': resolvedCondense,
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(resolvedFullWidth ? { 'data-full-width': '' } : {}),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    'data-orientation': resolvedOrientation,
    'data-part': 'root',
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    'data-size': resolvedSize,
    'data-ui': 'segmented-control',
    'data-variant': resolvedVariant,
    role: resolvedRole,
    /**
     * The two numbers the thumb's geometry is made of. They are runtime values
     * and not design tokens, which is why they are written here rather than
     * held by a theme.
     */
    style: {
      ...style,
      '--slotted-segmented-control-count': values.length,
      ...(index < 0 ? {} : { '--slotted-segmented-control-index': index }),
    } as SegmentedControlRootProps['style'],
  });

  return render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps);
}
