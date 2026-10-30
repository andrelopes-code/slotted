import type { ColorFormat, ContrastLevel } from '@slotted/core/color';
import type { ColorPickerMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import type { TextFieldProps } from '../text-field';

export type { ColorFormat, ContrastLevel };
export type ColorPickerSize = 'sm' | 'md' | 'lg';

/** Why the colour moved: a drag, a key, a preset or the colour it opened with, the eyedropper. */
export type ColorPickerValueReason = Extract<
  ChangeRequest<string>['reason'],
  'pointer' | 'keyboard' | 'select' | 'programmatic'
>;

/** What an application sets once for every colour picker under it. */
export interface ColorPickerDefaults {
  format: ColorFormat;
  presets: readonly string[] | undefined;
  size: ColorPickerSize;
}

export interface ColorPickerDefaultsProviderProps extends Partial<ColorPickerDefaults> {
  children?: ReactNode | undefined;
}

interface ColorStateProps {
  /** Present means controlled: a colour string in any supported notation. */
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((value: string, request: ChangeRequest<string>) => void) | undefined;
  /** The notation the value is written in. Defaults to the value's own, then to the provider's. */
  format?: ColorFormat | undefined;
  defaultFormat?: ColorFormat | undefined;
  onFormatChange?: ((format: ColorFormat, request: ChangeRequest<ColorFormat>) => void) | undefined;
  /** Whether the colour carries an alpha channel. Defaults to `true`. */
  alpha?: boolean | undefined;
  /** Colours offered as one press. Defaults to the provider's. */
  presets?: readonly string[] | undefined;
  /** The background the contrast is measured against; absent, no contrast is drawn. */
  contrastWith?: string | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  size?: ColorPickerSize | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: every
   * control's name, the gamut sentence and the contrast levels.
   */
  messages?: PartialMessages<ColorPickerMessages> | undefined;
}

/**
 * The panel. With no children it draws the whole anatomy; with children it
 * draws exactly the parts given, so a compact picker is a choice of parts.
 */
export interface ColorPickerProps
  extends ColorStateProps, Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange'> {
  children?: ReactNode | undefined;
}

export type ColorPickerPartProps = ComponentPropsWithRef<'div'>;

export interface ColorPickerChannelProps extends ComponentPropsWithRef<'div'> {
  channel: 'hue' | 'alpha';
}

export interface ColorPickerFieldProps
  extends
    ColorStateProps,
    Omit<
      TextFieldProps,
      'value' | 'defaultValue' | 'onValueChange' | 'size' | 'start' | 'messages'
    > {
  /** Present means the consumer owns whether the panel is open. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined;
  /** What the panel holds; defaults to the whole anatomy. */
  children?: ReactNode | undefined;
}
