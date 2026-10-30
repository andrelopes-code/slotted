import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

/** The type step the control and every segment inside it sit at. */
export type SegmentedControlSize = 'sm' | 'md' | 'lg';

/** How the segments flow. The thumb travels along the same axis. */
export type SegmentedControlOrientation = 'horizontal' | 'vertical';

/**
 * What the control does when it is narrower than its labels need. `icons`
 * keeps the marks and hides the words — hidden, never removed, so the
 * accessible name of every segment is the same at every width.
 */
export type SegmentedControlCondense = 'none' | 'icons';

/**
 * How the choice is drawn. `track` is a box with a thumb behind the chosen
 * segment; `underline` is the words alone, the chosen one in the text colour
 * and underlined. The semantics are the same radio group in both.
 */
export type SegmentedControlVariant = 'track' | 'underline';

/** Why the value moved. A segmented control can produce exactly these two. */
export type SegmentedControlSelectionReason = Extract<
  ChangeRequest<string>['reason'],
  'pointer' | 'keyboard'
>;

/**
 * The request the control emits. Its `previous` is `undefined` while nothing
 * has been chosen, which is the state a radio group is allowed to start in and
 * which a request typed over `string` alone could not say.
 */
export type SegmentedControlChangeRequest = ChangeRequest<string | undefined>;

/** What an application sets once for every segmented control under it. */
export interface SegmentedControlDefaults {
  condense: SegmentedControlCondense;
  fullWidth: boolean;
  orientation: SegmentedControlOrientation;
  size: SegmentedControlSize;
  variant: SegmentedControlVariant;
}

export interface SegmentedControlDefaultsProviderProps extends Partial<SegmentedControlDefaults> {
  children?: ReactNode | undefined;
}

/** What the control hands every segment inside it. */
export interface SegmentedControlContextValue {
  disabled: boolean | undefined;
  invalid: boolean | undefined;
  /**
   * The submission name every segment shares, and the reason the platform
   * treats the set as one radio group. It is generated when none is written.
   */
  name: string;
  readOnly: boolean | undefined;
  required: boolean | undefined;
  select: (value: string, reason: SegmentedControlSelectionReason, source: unknown) => boolean;
  size: SegmentedControlSize;
  value: string | undefined;
}

/** What `render` receives for the control's root. */
export interface SegmentedControlRootProps extends HTMLAttributes<HTMLElement> {
  'data-condense': SegmentedControlCondense;
  'data-disabled'?: '' | undefined;
  'data-full-width'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-orientation': SegmentedControlOrientation;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-size': SegmentedControlSize;
  'data-ui': string;
  'data-variant': SegmentedControlVariant;
}

/** What `render` receives for one segment. */
export interface SegmentRootProps extends HTMLAttributes<HTMLElement> {
  'data-checked'?: '' | undefined;
  'data-disabled'?: '' | undefined;
  'data-part': string;
}

export interface SegmentedControlProps extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue'> {
  /** Defaults to the provider, then to `none`. */
  condense?: SegmentedControlCondense | undefined;
  /** The value an uncontrolled control starts from, read once. */
  defaultValue?: string | undefined;
  /**
   * Unstated rather than `false`, so the control defers to the field around
   * it. Stated, it wins, and it reaches every segment's radio as the native
   * attribute.
   */
  disabled?: boolean | undefined;
  /** Defaults to the provider, then to `false`. */
  fullWidth?: boolean | undefined;
  /** Unstated rather than `false`. Writes `aria-invalid` and `data-invalid`. */
  invalid?: boolean | undefined;
  /**
   * The submission name the set shares. Generated when it is not written,
   * because grouping is by name within the form owner and an unnamed set is
   * not a set — the price is that an unnamed control inside a form submits
   * under a generated key.
   */
  name?: string | undefined;
  /** Called before the value moves, with the request that carries the reason. */
  onValueChange?: ((value: string, request: SegmentedControlChangeRequest) => void) | undefined;
  /** Defaults to the provider, then to `horizontal`. */
  orientation?: SegmentedControlOrientation | undefined;
  /**
   * Unstated rather than `false`. Every segment keeps its tab stop and its
   * contrast, the control announces `aria-readonly`, and every change is
   * refused — a radio ignores `readonly`, so the family enforces it.
   */
  readOnly?: boolean | undefined;
  /** Renders the control's root into another element. */
  render?: ((props: SegmentedControlRootProps) => ReactNode) | undefined;
  /** Unstated rather than `false`. Writes `aria-required` on the control. */
  required?: boolean | undefined;
  /** Defaults to the field, then to the provider, then to `md`. */
  size?: SegmentedControlSize | undefined;
  /** Present means controlled, for the life of the component. */
  value?: string | undefined;
  /** Defaults to the provider, then to `track`. */
  variant?: SegmentedControlVariant | undefined;
}

export interface SegmentProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'children' | 'size' | 'type' | 'value'
> {
  children?: ReactNode | undefined;
  /** Unstated rather than `false`, so the segment defers to the control. */
  disabled?: boolean | undefined;
  /** The mark, drawn before the words. Absent on a segment that is only words. */
  icon?: ReactNode | undefined;
  /** Renders the segment's own box into another element. The radio is fixed. */
  render?: ((props: SegmentRootProps) => ReactNode) | undefined;
  /** What this segment selects. It is what the control's value holds. */
  value: string;
}
