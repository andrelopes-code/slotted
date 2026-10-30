import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `color-picker` writes on its own. */
export interface ColorPickerMessages {
  readonly alpha: Message;
  readonly area: Message;
  /** What a screen reader calls the two-axis area. */
  readonly areaRoleDescription: Message;
  /** The four outcomes of the WCAG contrast check. */
  readonly contrastLevels: {
    readonly AAA: Message;
    readonly AA: Message;
    readonly AALarge: Message;
    readonly fail: Message;
  };
  /** The letters drawn in the colour to show its contrast against the background. */
  readonly contrastSample: Message;
  readonly eyedropper: Message;
  /** The notation menu's name, with the notation in force. */
  readonly format: Message<{ format: string }>;
  readonly gamut: Message;
  readonly hue: Message;
  readonly input: Message;
  readonly presets: Message;
  /** The button that puts back the colour the panel opened with, named with that colour. */
  readonly previous: Message<{ color: string }>;
  readonly trigger: Message;
}

export const en: ColorPickerMessages = {
  alpha: 'Opacity',
  area: 'Saturation and brightness',
  areaRoleDescription: '2D slider',
  contrastLevels: {
    AAA: 'AAA',
    AA: 'AA',
    AALarge: 'AA large',
    fail: 'Fail',
  },
  contrastSample: 'Aa',
  eyedropper: 'Pick a color from the screen',
  format: 'Notation: {format}',
  gamut: 'Outside sRGB: the screen shows the nearest color.',
  hue: 'Hue',
  input: 'Color',
  presets: 'Presets',
  previous: 'Restore {color}',
  trigger: 'Choose a color',
};

export const colorPickerMessages: MessageFamily<'colorPicker', ColorPickerMessages> = {
  name: 'colorPicker',
  base: en,
};
