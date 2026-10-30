import type { FamilyTranslator, FieldMessages, PartialMessages } from '@slotted/core/i18n';
import type {
  AllHTMLAttributes,
  AriaAttributes,
  ComponentPropsWithRef,
  HTMLAttributes,
  ReactNode,
} from 'react';

import type { InlineMessageProps } from '../inline-message';
import type { TooltipChangeRequest, TooltipSide } from '../tooltip';

/** The type step the field sits at, matching the control it wraps. */
export type FieldSize = 'sm' | 'md' | 'lg';

/**
 * Where the label sits relative to the control. `side` reflows to `top` when
 * the field's own inline size falls below 320 pixels, so a field in a drawer
 * stacks while the same field in a page grid stays beside its control.
 */
export type FieldLabelPlacement = 'top' | 'side';

/**
 * The longest the control stands, as a cue to the length of its answer:
 * `short` for an integer of up to four digits, `medium` for an amount, a code
 * or a short word, `full` for free text, a name or a picker of records. The
 * control still shrinks below the bound in a narrower container.
 */
export type FieldWidth = 'short' | 'medium' | 'full';

/**
 * How necessity is said. `mark` draws the asterisk every surveyed
 * implementation draws on a required field; `optional` writes `(optional)` on
 * the fields a reader may skip and nothing on the others, which is what GOV.UK
 * and Carbon recommend for a form where most fields are required; `words`
 * writes `(required)` on a required field and `(optional)` on one that is not;
 * `none` says nothing, for a form where every field is required and the form
 * says so once.
 */
export type FieldNecessity = 'mark' | 'optional' | 'words' | 'none';

/**
 * What a control tells the field about its own value, so the field can draw the
 * count in the spare column of its label row. The control counts and the field
 * places it: the number belongs to the value, and the row belongs to the field.
 *
 * `length` is in UTF-16 code units, which is what `maxLength` counts, so an
 * emoji counts as two. A counter that disagreed with the limit the browser
 * enforces would be wrong at exactly the moment it is read.
 */
export interface FieldCount {
  length: number;
  max: number | undefined;
}

/** The identifiers a field derives from one base. */
export interface FieldIds {
  control: string;
  counter: string;
  description: string;
  error: string;
  help: string;
  indicator: string;
  label: string;
}

/**
 * The parts that join the control's `aria-describedby`, in the order the
 * contract reads them: what qualifies the field, the help behind the icon, the
 * description, the count, the error.
 */
export type FieldDescribedSlot = 'indicator' | 'help' | 'description' | 'counter' | 'error';

/** What an application sets once for every field under it. */
export interface FieldDefaults {
  disabled: boolean | undefined;
  labelPlacement: FieldLabelPlacement;
  necessity: FieldNecessity;
  readOnly: boolean | undefined;
  size: FieldSize;
}

export interface FieldDefaultsProviderProps {
  children?: ReactNode | undefined;
  disabled?: boolean | undefined;
  labelPlacement?: FieldLabelPlacement | undefined;
  necessity?: FieldNecessity | undefined;
  readOnly?: boolean | undefined;
  size?: FieldSize | undefined;
}

/** What a field hands its label, its control, its messages and its counter. */
export interface FieldContextValue {
  /** What the control inside has published about its value, if anything. */
  count: FieldCount | undefined;
  describedBy: string | undefined;
  disabled: boolean | undefined;
  /** Whether the page wrote a counter of its own; the field then draws none. */
  hasCounter: boolean;
  /** Whether the page wrote a header; the header then draws the published count. */
  hasHeader: boolean;
  ids: FieldIds;
  invalid: boolean | undefined;
  messageSize: 'sm' | 'md';
  necessity: FieldNecessity;
  readOnly: boolean | undefined;
  registerControl: () => void;
  /**
   * Whether the page wrote a counter of its own. It does, and the field draws
   * none: a count the page computes — words, bytes, line items — is the only
   * count the control cannot know.
   */
  registerCounter: (present: boolean) => void;
  registerHeader: (present: boolean) => void;
  registerMessage: (slot: FieldDescribedSlot, present: boolean) => void;
  required: boolean | undefined;
  /** Called by a control this library ships, whenever its value changes. */
  setCount: (count: FieldCount | undefined) => void;
  size: FieldSize;
  /**
   * The field's words in the language in force, with this field's `messages`
   * laid over them: the necessity words and the help control's name.
   */
  t: FamilyTranslator<FieldMessages>;
}

/**
 * What `render` receives. It is written against `HTMLAttributes<HTMLElement>`
 * rather than against the element the part renders by default, because that is
 * what makes substitution real: a props object typed for a `div` cannot be
 * spread onto a `ul` or a `textarea`.
 *
 * `ref` is not among them. A consumer who substitutes the element writes the
 * element, so they attach their own ref to it; `ref` on the component reaches
 * the default element.
 */
export interface FieldRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-label-placement': FieldLabelPlacement;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-necessity': FieldNecessity;
  'data-required'?: '' | undefined;
  'data-size': FieldSize;
  'data-ui': string;
  'data-width': FieldWidth;
}

export interface FieldProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  children?: ReactNode | undefined;
  /**
   * Unstated rather than `false`, so the field defers to its `FieldGroup` and
   * the group to the application. Stated, it wins, and it is the native
   * attribute on the control: removing it from the tab order and from
   * submission is what the word means.
   */
  disabled?: boolean | undefined;
  /**
   * The base every identifier is derived from — `<id>-control`, `<id>-label`,
   * `<id>-description`, `<id>-error`. Generated with `useId` when unstated.
   */
  id?: string | undefined;
  /** Unstated rather than `false`. Writes `aria-invalid` on the control. */
  invalid?: boolean | undefined;
  /** Defaults to the provider, then to `top`. */
  labelPlacement?: FieldLabelPlacement | undefined;
  /** Defaults to the provider, then to `mark`. */
  necessity?: FieldNecessity | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * necessity words (`optional`, `required`) and the help control's name (`help`).
   */
  messages?: PartialMessages<FieldMessages> | undefined;
  /** Unstated rather than `false`. Writes the native `readonly` on the control. */
  readOnly?: boolean | undefined;
  /**
   * Unstated rather than `false`. Writes `aria-required` on the control and
   * never the native `required`, which would engage browser constraint
   * validation and change submit behaviour.
   */
  required?: boolean | undefined;
  /** Renders the field into another element. */
  render?: ((props: FieldRootProps) => ReactNode) | undefined;
  /** Defaults to the provider, then to `md`. */
  size?: FieldSize | undefined;
  /** Defaults to `full`. */
  width?: FieldWidth | undefined;
}

export interface FieldLabelRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  htmlFor: string | undefined;
}

export interface FieldLabelProps extends ComponentPropsWithRef<'label'> {
  render?: ((props: FieldLabelRootProps) => ReactNode) | undefined;
}

export interface FieldControlRootProps extends AllHTMLAttributes<HTMLElement> {
  'aria-describedby': string | undefined;
  'aria-invalid': AriaAttributes['aria-invalid'];
  'aria-required': AriaAttributes['aria-required'];
  'data-part': string;
}

export interface FieldControlProps extends ComponentPropsWithRef<'input'> {
  render?: ((props: FieldControlRootProps) => ReactNode) | undefined;
}

/**
 * The field's own message props. `id`, `size` and `disabled` come from the
 * field and are not accepted here; everything else `inline-message` takes —
 * `tone`, `live`, `mark`, `prefix`, `icon`, `hideIcon`, `reserve`, `render` —
 * passes through, which is what makes a warning that does not block submission
 * `tone="warning"` on the same part rather than a member of its own.
 *
 * `mark` is the one the field answers rather than passes: a field's messages
 * draw no mark at all, so `none` is what they draw unless the page asks for
 * `glyph` or `dot`.
 */
export type FieldMessageProps = Omit<InlineMessageProps, 'disabled' | 'id' | 'size'>;

export interface FieldCounterRootProps extends HTMLAttributes<HTMLElement> {
  'data-invalid'?: '' | undefined;
  'data-part': string;
  id: string | undefined;
}

export interface FieldCounterProps extends ComponentPropsWithRef<'span'> {
  /**
   * The count has passed its limit. It is the counter's own state rather than
   * the field's: a count can pass its maximum while validation has not run, and
   * a counter that only turned at submit would say nothing at the moment it is
   * being read.
   *
   * Unstated, it is read from the count the control published, so a counter
   * with no children needs nothing written on it at all.
   */
  invalid?: boolean | undefined;
  render?: ((props: FieldCounterRootProps) => ReactNode) | undefined;
}

export interface FieldHeaderRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
}

export interface FieldHeaderProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: FieldHeaderRootProps) => ReactNode) | undefined;
}

export interface FieldIndicatorRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  id: string | undefined;
}

export interface FieldIndicatorProps extends ComponentPropsWithRef<'span'> {
  render?: ((props: FieldIndicatorRootProps) => ReactNode) | undefined;
}

/**
 * What `render` receives for the action. It is a `button` by default, and
 * `type` is only written there: a link substituted through `render` takes the
 * props without it.
 */
export interface FieldActionRootProps extends AllHTMLAttributes<HTMLElement> {
  'data-part': string;
}

export interface FieldActionProps extends ComponentPropsWithRef<'button'> {
  render?: ((props: FieldActionRootProps) => ReactNode) | undefined;
}

/**
 * The help beside the label: a button with the family's glyph, and the hint in
 * a tooltip. Its element is fixed rather than substitutable, because the button
 * carries the name, the description and the control of the layer, and every one
 * of them is the family's.
 */
export interface FieldHelpProps extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'type'> {
  /** The hint. It is written once and reaches the tooltip and the description. */
  children?: ReactNode | undefined;
  /** The hint's state, uncontrolled. */
  defaultOpen?: boolean | undefined;
  /** Asked before the hint opens or closes, with the reason. */
  onOpenChange?: ((open: boolean, request: TooltipChangeRequest) => void) | undefined;
  /** The hint's state, controlled. */
  open?: boolean | undefined;
  /** Where the hint opens. Defaults to the tooltip provider, then `top`. */
  side?: TooltipSide | undefined;
}
