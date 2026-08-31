import type { AriaAttributes, ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export interface FieldIds {
  control: string;
  description: string;
  error: string;
  label: string;
}

export interface FieldContextValue {
  describedBy: string | undefined;
  disabled: boolean;
  ids: FieldIds;
  invalid: boolean;
  readOnly: boolean;
  registerControl: () => void;
  registerPart: (part: 'description' | 'error') => () => void;
  required: boolean;
}

export interface FieldRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-slotted-component': string;
}

export interface FieldProps extends Omit<ComponentPropsWithoutRef<'div'>, 'id'> {
  children?: ReactNode;
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  readOnly?: boolean;
  render?: (props: FieldRootProps) => ReactNode;
  required?: boolean;
}

export interface FieldControlRootProps extends HTMLAttributes<HTMLElement> {
  'aria-describedby': string | undefined;
  'aria-invalid': AriaAttributes['aria-invalid'];
  'aria-required': AriaAttributes['aria-required'];
  'data-part': string;
  disabled: boolean | undefined;
  id: string | undefined;
  readOnly: boolean | undefined;
}

export interface FieldControlProps extends ComponentPropsWithoutRef<'input'> {
  render?: (props: FieldControlRootProps) => ReactNode;
}

export type FieldLabelProps = ComponentPropsWithoutRef<'label'>;
export type FieldMessageProps = ComponentPropsWithoutRef<'p'>;
