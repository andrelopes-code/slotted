/**
 * The builder's axes, as data the store reads back from storage: each axis is
 * `null` while the chosen theme's own value holds. The values are compiled
 * into a theme by `custom-theme.ts`, which only the store and the appearance
 * section load, by `import()`.
 */
export const RADIUS_RANGE = { min: 0, max: 24, step: 2 } as const;
/** The families of `theme-faces.ts`, by id. */
export const FONT_IDS = [
  'geist',
  'inter',
  'nunito',
  'source-sans',
  'outfit',
  'source-serif',
  'fraunces',
  'jetbrains-mono',
] as const;
export const SCALE_CHOICES = [90, 100, 112] as const;
export const BORDER_CHOICES = [1, 2] as const;
export const SHADOW_CHOICES = ['none', 'soft', 'strong'] as const;
export const MOTION_CHOICES = ['normal', 'reduced', 'off'] as const;
export const CARD_CHOICES = ['bordered', 'elevated', 'flat'] as const;
export const TAB_CHOICES = ['underline', 'pill'] as const;
export const CHART_CHOICES = ['palette', 'accent'] as const;

/** How a field draws its frame at rest. */
export const INPUT_CHOICES = ['outlined', 'filled', 'underline', 'borderless'] as const;
/** How a button and a field show keyboard focus. */
export const FOCUS_CHOICES = ['ring', 'glow', 'underline', 'offset'] as const;
/** How the primary button — solid, in the accent — is painted. */
export const BUTTON_CHOICES = ['solid', 'soft', 'outline', 'ghost'] as const;
/** Corners in px; 9999 is the pill. */
export const CONTROL_RADIUS_CHOICES = [0, 4, 8, 12, 9999] as const;
export const CARD_RADIUS_CHOICES = [0, 4, 8, 12, 16, 24] as const;
export const OVERLAY_RADIUS_CHOICES = [0, 4, 8, 12, 16, 24] as const;
/** A control's line: the scale's thin line (1 px in every catalogue theme) or its thick one (2 px). */
export const CONTROL_BORDER_CHOICES = [1, 2] as const;
/** A control label's weight. */
export const LABEL_WEIGHT_CHOICES = [400, 500, 600, 700] as const;
/** A control label's letter-spacing. */
export const LABEL_SPACING_CHOICES = ['tight', 'normal', 'wide', 'wider'] as const;
/** Px added to the theme's control text size, in every size and density. */
export const CONTROL_TEXT_CHOICES = [-1, 1, 2] as const;
/** Px added to the theme's control height, in every size and density. */
export const CONTROL_HEIGHT_CHOICES = [-4, 4, 8] as const;

export type FontId = (typeof FONT_IDS)[number];
export type ScaleChoice = (typeof SCALE_CHOICES)[number];
export type BorderChoice = (typeof BORDER_CHOICES)[number];
export type ShadowChoice = (typeof SHADOW_CHOICES)[number];
export type MotionChoice = (typeof MOTION_CHOICES)[number];
export type CardChoice = (typeof CARD_CHOICES)[number];
export type TabChoice = (typeof TAB_CHOICES)[number];
export type ChartChoice = (typeof CHART_CHOICES)[number];
export type InputChoice = (typeof INPUT_CHOICES)[number];
export type FocusChoice = (typeof FOCUS_CHOICES)[number];
export type ButtonChoice = (typeof BUTTON_CHOICES)[number];
export type ControlRadiusChoice = (typeof CONTROL_RADIUS_CHOICES)[number];
export type CardRadiusChoice = (typeof CARD_RADIUS_CHOICES)[number];
export type OverlayRadiusChoice = (typeof OVERLAY_RADIUS_CHOICES)[number];
export type ControlBorderChoice = (typeof CONTROL_BORDER_CHOICES)[number];
export type LabelWeightChoice = (typeof LABEL_WEIGHT_CHOICES)[number];
export type LabelSpacingChoice = (typeof LABEL_SPACING_CHOICES)[number];
export type ControlTextChoice = (typeof CONTROL_TEXT_CHOICES)[number];
export type ControlHeightChoice = (typeof CONTROL_HEIGHT_CHOICES)[number];

export interface Customization {
  /** The largest corner in px, `RADIUS_RANGE` in its steps; the smaller corners are its fractions. */
  readonly radius: number | null;
  /** The face of the text and the controls. */
  readonly body: FontId | null;
  /** The face of the headings and titles. */
  readonly heading: FontId | null;
  /** Percent of the library's type sizes. */
  readonly scale: ScaleChoice | null;
  /** The thin line, in px. */
  readonly border: BorderChoice | null;
  readonly shadow: ShadowChoice | null;
  readonly motion: MotionChoice | null;
  /** How a card and a stat card stand off the page: a line, a shadow, or a sunken fill. */
  readonly cards: CardChoice | null;
  /** The line tabs' selected item: underlined by the marker, or a pill on the accent's ground. */
  readonly tabs: TabChoice | null;
  /** The chart's series: the theme's data palette, or shades of the accent. */
  readonly chart: ChartChoice | null;
  readonly input: InputChoice | null;
  readonly focus: FocusChoice | null;
  readonly button: ButtonChoice | null;
  readonly controlRadius: ControlRadiusChoice | null;
  readonly cardRadius: CardRadiusChoice | null;
  readonly overlayRadius: OverlayRadiusChoice | null;
  readonly controlBorder: ControlBorderChoice | null;
  readonly labelWeight: LabelWeightChoice | null;
  readonly labelSpacing: LabelSpacingChoice | null;
  readonly controlText: ControlTextChoice | null;
  readonly controlHeight: ControlHeightChoice | null;
}

export type CustomizationAxis = keyof Customization;

export const NO_CUSTOMISATION: Customization = {
  radius: null,
  body: null,
  heading: null,
  scale: null,
  border: null,
  shadow: null,
  motion: null,
  cards: null,
  tabs: null,
  chart: null,
  input: null,
  focus: null,
  button: null,
  controlRadius: null,
  cardRadius: null,
  overlayRadius: null,
  controlBorder: null,
  labelWeight: null,
  labelSpacing: null,
  controlText: null,
  controlHeight: null,
};

const AXES = Object.keys(NO_CUSTOMISATION) as CustomizationAxis[];

/** The axes the Controls section sets, in its order. */
export const CONTROL_AXES = [
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
] as const satisfies readonly CustomizationAxis[];

const isRadius = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= RADIUS_RANGE.min &&
  value <= RADIUS_RANGE.max &&
  (value - RADIUS_RANGE.min) % RADIUS_RANGE.step === 0;

const choice = <T>(choices: readonly T[], value: unknown): T | null =>
  choices.includes(value as T) ? (value as T) : null;

/**
 * A customization read back from storage, axis by axis: a value the builder
 * does not offer is the theme's own again, and the other axes hold.
 */
export function readCustomisation(value: unknown): Customization {
  if (typeof value !== 'object' || value === null) return NO_CUSTOMISATION;
  const stored = value as Partial<Record<CustomizationAxis, unknown>>;
  return {
    radius: isRadius(stored.radius) ? stored.radius : null,
    body: choice(FONT_IDS, stored.body),
    heading: choice(FONT_IDS, stored.heading),
    scale: choice(SCALE_CHOICES, stored.scale),
    border: choice(BORDER_CHOICES, stored.border),
    shadow: choice(SHADOW_CHOICES, stored.shadow),
    motion: choice(MOTION_CHOICES, stored.motion),
    cards: choice(CARD_CHOICES, stored.cards),
    tabs: choice(TAB_CHOICES, stored.tabs),
    chart: choice(CHART_CHOICES, stored.chart),
    input: choice(INPUT_CHOICES, stored.input),
    focus: choice(FOCUS_CHOICES, stored.focus),
    button: choice(BUTTON_CHOICES, stored.button),
    controlRadius: choice(CONTROL_RADIUS_CHOICES, stored.controlRadius),
    cardRadius: choice(CARD_RADIUS_CHOICES, stored.cardRadius),
    overlayRadius: choice(OVERLAY_RADIUS_CHOICES, stored.overlayRadius),
    controlBorder: choice(CONTROL_BORDER_CHOICES, stored.controlBorder),
    labelWeight: choice(LABEL_WEIGHT_CHOICES, stored.labelWeight),
    labelSpacing: choice(LABEL_SPACING_CHOICES, stored.labelSpacing),
    controlText: choice(CONTROL_TEXT_CHOICES, stored.controlText),
    controlHeight: choice(CONTROL_HEIGHT_CHOICES, stored.controlHeight),
  };
}

/** The axes a reader has set, in the builder's order. */
export function customizedAxes(customization: Customization): CustomizationAxis[] {
  return AXES.filter((axis) => customization[axis] !== null);
}

export function isCustomised(customization: Customization): boolean {
  return customizedAxes(customization).length > 0;
}
