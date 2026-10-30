import type { FamilyTranslator, FieldMessages, PartialMessages } from '@slotted/core/i18n';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

import type { FieldLabelPlacement, FieldMessageProps, FieldNecessity, FieldSize } from '../field';

/**
 * Whether the group asks something. A `question` (a set of radios) states its
 * own necessity on the legend; a `section` ("Address") is a topic, and says
 * nothing about it.
 */
export type FieldGroupKind = 'question' | 'section';

/** How the fields inside the group flow. */
export type FieldGroupOrientation = 'vertical' | 'horizontal';

/** The three identifiers a group derives from one base. */
export interface FieldGroupIds {
  description: string;
  error: string;
  legend: string;
}

export interface FieldGroupContextValue {
  ids: FieldGroupIds;
  kind: FieldGroupKind;
  messageSize: 'sm' | 'md';
  registerMessage: (slot: 'description' | 'error', present: boolean) => void;
  necessity: FieldNecessity;
  /** Unset unless the page states it; a member with no `invalid` of its own defers to it. */
  invalid: boolean | undefined;
  required: boolean | undefined;
  size: FieldSize;
  /** The field family's words in the language in force, with the group's `messages` laid over them. */
  t: FamilyTranslator<FieldMessages>;
}

/**
 * What `render` receives, written against `HTMLAttributes<HTMLElement>` for the
 * reason the field's own root props record: a props object typed for a
 * `fieldset` cannot be spread onto anything else, which is what `render` is for.
 */
export interface FieldGroupRootProps extends HTMLAttributes<HTMLElement> {
  disabled: boolean | undefined;
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-orientation': FieldGroupOrientation;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-necessity': FieldNecessity;
  'data-size': FieldSize;
  'data-ui': string;
}

export interface FieldGroupProps extends Omit<ComponentPropsWithRef<'fieldset'>, 'children'> {
  children?: ReactNode | undefined;
  /**
   * The native attribute on the `fieldset`, which the platform propagates to
   * every control inside with nothing passed down. The group still provides
   * `disabled` to its fields, because the platform disables controls and a
   * label is not one.
   */
  disabled?: boolean | undefined;
  /** The base for `<id>-legend`, `<id>-description` and `<id>-error`. */
  id?: string | undefined;
  /** Unstated rather than `false`. Writes `data-invalid` on the fieldset. */
  invalid?: boolean | undefined;
  /** A `section` draws no necessity on its legend. Defaults to `question`. */
  kind?: FieldGroupKind | undefined;
  /** Provided to every field inside, unless the field states its own. */
  labelPlacement?: FieldLabelPlacement | undefined;
  /**
   * Words laid over the field catalog of the language in force for the
   * legend's own necessity word (`optional`, `required`). A field inside
   * states its own `messages`.
   */
  messages?: PartialMessages<FieldMessages> | undefined;
  /** How the fields inside flow. Defaults to `vertical`. */
  orientation?: FieldGroupOrientation | undefined;
  /** Provided to every field inside, unless the field states its own. */
  readOnly?: boolean | undefined;
  /** Draws the necessity marker on the legend, and is not provided to the fields. */
  required?: boolean | undefined;
  /** Provided to every field inside. Defaults to the field provider, then `mark`. */
  necessity?: FieldNecessity | undefined;
  render?: ((props: FieldGroupRootProps) => ReactNode) | undefined;
  /** Provided to every field inside. Defaults to `md`. */
  size?: FieldSize | undefined;
}

export interface FieldGroupLegendRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
}

export interface FieldGroupLegendProps extends ComponentPropsWithRef<'legend'> {
  render?: ((props: FieldGroupLegendRootProps) => ReactNode) | undefined;
}

export interface FieldGroupContentRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
}

export interface FieldGroupContentProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: FieldGroupContentRootProps) => ReactNode) | undefined;
}

export type FieldGroupMessageProps = FieldMessageProps;
