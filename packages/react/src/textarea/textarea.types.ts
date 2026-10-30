import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

/** The type step the control sits at, matching the field around it. */
export type TextareaSize = 'sm' | 'md' | 'lg';

/** How much frame the control shows. The three `text-field` draws. */
export type TextareaVariant = 'outline' | 'subtle' | 'plain';

/**
 * Which way the manual handle may drag. `block` is the default rather than the
 * platform's `both`: a control wider than its field breaks the field's grid,
 * and a reader who widens one control in a form has broken its alignment.
 */
export type TextareaResize = 'block' | 'none' | 'both';

/** Why the value moved. A multi-line control can produce exactly one reason. */
export type TextareaValueReason = Extract<ChangeRequest<string>['reason'], 'keyboard'>;

/** What an application sets once for every textarea under it. */
export interface TextareaDefaults {
  mono: boolean;
  resize: TextareaResize;
  size: TextareaSize;
  variant: TextareaVariant;
}

export interface TextareaDefaultsProviderProps extends Partial<TextareaDefaults> {
  children?: ReactNode | undefined;
}

/** What `render` receives. Spreadable onto any element, which is the point. */
export interface TextareaRootProps extends HTMLAttributes<HTMLElement> {
  'data-auto-size'?: '' | undefined;
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-mono'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-resize': TextareaResize;
  'data-size': TextareaSize;
  'data-ui': string;
  'data-variant': TextareaVariant;
}

/**
 * `value` and `defaultValue` are redeclared as strings, because the contract
 * says the value is text and the element's own type also admits a number and an
 * array. Everything else is the element's and reaches it: `rows`, `wrap`,
 * `maxLength`, `spellCheck`, `autoCapitalize`, `name`, `form`, `required`,
 * every `aria-*` and every handler.
 */
export interface TextareaProps extends Omit<
  ComponentPropsWithRef<'textarea'>,
  'defaultValue' | 'value'
> {
  /**
   * Grows with the content, through CSS `field-sizing` rather than through a
   * measurement on the main thread. `rows` is the floor and `maxRows` the
   * ceiling, and the manual handle is withdrawn while this is on: a control
   * that sizes itself and a handle that fixes its size disagree on the next
   * keystroke.
   */
  autoSize?: boolean | undefined;
  /** The limit the count is measured against. Defaults to `maxLength`. */
  countMax?: number | undefined;
  /** The value an uncontrolled control starts from, read once. */
  defaultValue?: string | undefined;
  /** Unstated rather than `false`, so the control defers to the field. */
  disabled?: boolean | undefined;
  /** Unstated rather than `false`. Writes `aria-invalid` and `data-invalid`. */
  invalid?: boolean | undefined;
  /**
   * The ceiling `autoSize` grows to, in rows. It cannot be removed: a control
   * that grows forever pushes the page out from under the caret, which is the
   * defect every auto-grow implementation ships first. A form that wants more
   * asks for more.
   */
  maxRows?: number | undefined;
  /** Sets the value in the monospaced family, for a payload or a template. */
  mono?: boolean | undefined;
  /** Called before the value moves, with the request that carries the reason. */
  onValueChange?: ((value: string, request: ChangeRequest<string>) => void) | undefined;
  /** Unstated rather than `false`. Writes the native `readonly`. */
  readOnly?: boolean | undefined;
  /** Renders the control into another element. */
  render?: ((props: TextareaRootProps) => ReactNode) | undefined;
  /** Defaults to the provider, then to `block`. */
  resize?: TextareaResize | undefined;
  /** Publishes the length of the value to the field, which draws the count. */
  showCount?: boolean | undefined;
  /** Defaults to the field, then to the provider, then to `md`. */
  size?: TextareaSize | undefined;
  /** Present means controlled, for the life of the component. */
  value?: string | undefined;
  /** Defaults to the provider, then to `outline`. */
  variant?: TextareaVariant | undefined;
}
