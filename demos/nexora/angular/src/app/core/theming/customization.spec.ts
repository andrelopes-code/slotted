import { describe, expect, it } from 'vitest';

import {
  CONTROL_AXES,
  customizedAxes,
  isCustomised,
  NO_CUSTOMISATION,
  readCustomisation,
  type Customization,
} from './customization';

describe('customization', () => {
  const full: Customization = {
    radius: 12,
    body: 'source-serif',
    heading: 'fraunces',
    scale: 112,
    border: 2,
    shadow: 'strong',
    motion: 'off',
    cards: 'elevated',
    tabs: 'pill',
    chart: 'accent',
    input: 'filled',
    focus: 'glow',
    button: 'soft',
    controlRadius: 9999,
    cardRadius: 16,
    overlayRadius: 24,
    controlBorder: 2,
    labelWeight: 700,
    labelSpacing: 'wide',
    controlText: 2,
    controlHeight: 8,
  };

  it('keeps every axis a reader set, and leaves the rest to the theme', () => {
    expect(readCustomisation(full)).toEqual(full);
    expect(readCustomisation({ body: 'inter' })).toEqual({ ...NO_CUSTOMISATION, body: 'inter' });
    expect(customizedAxes(readCustomisation({ heading: 'outfit', cards: 'flat' }))).toEqual([
      'heading',
      'cards',
    ]);
  });

  /** The Controls section's axes, in its order: each one independent of the others. */
  it('reads the Controls axes one by one', () => {
    expect(CONTROL_AXES).toEqual([
      'input',
      'focus',
      'button',
      'controlRadius',
      'cardRadius',
      'overlayRadius',
      'controlBorder',
      'labelWeight',
      'labelSpacing',
      'controlText',
      'controlHeight',
    ]);
    for (const axis of CONTROL_AXES) {
      const one = readCustomisation({ [axis]: full[axis] });
      expect(customizedAxes(one), axis).toEqual([axis]);
    }
    expect(readCustomisation({ controlRadius: 0, controlText: -1, controlHeight: -4 })).toEqual({
      ...NO_CUSTOMISATION,
      controlRadius: 0,
      controlText: -1,
      controlHeight: -4,
    });
  });

  /** A stored value the builder does not offer is the theme's own again, axis by axis. */
  it('reads a value it does not offer as the theme’s own, without losing the others', () => {
    const read = readCustomisation({
      ...full,
      radius: 25,
      body: 'comic-sans',
      heading: 'serif',
      scale: '112',
      border: 3,
      shadow: null,
      motion: 'fast',
      cards: 1,
      tabs: 'segmented',
      chart: 'accent',
      input: 'boxed',
      focus: 'halo',
      button: 'link',
      controlRadius: 5,
      cardRadius: '16',
      overlayRadius: 30,
      controlBorder: 3,
      labelWeight: 450,
      labelSpacing: 0.02,
      controlText: 0,
      controlHeight: 12,
    });
    expect(read).toEqual({ ...NO_CUSTOMISATION, chart: 'accent' });
    expect(readCustomisation({ radius: 7 }).radius).toBeNull();
    expect(readCustomisation({ radius: -2 }).radius).toBeNull();
    expect(readCustomisation({ radius: 0 }).radius).toBe(0);
    expect(readCustomisation('serif')).toEqual(NO_CUSTOMISATION);
    expect(readCustomisation(null)).toEqual(NO_CUSTOMISATION);
  });

  it('is customized while any axis is set', () => {
    expect(isCustomised(NO_CUSTOMISATION)).toBe(false);
    expect(isCustomised({ ...NO_CUSTOMISATION, radius: 0 })).toBe(true);
    expect(isCustomised({ ...NO_CUSTOMISATION, focus: 'underline' })).toBe(true);
    expect(isCustomised(full)).toBe(true);
  });
});
