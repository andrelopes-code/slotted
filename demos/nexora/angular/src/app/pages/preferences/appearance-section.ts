import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  SlAlert,
  SlAlertActions,
  SlAlertContent,
  SlAlertDescription,
  SlAlertTitle,
} from '@slotted/angular/alert';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import { SlColorField } from '@slotted/angular/color-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';
import {
  SlSection,
  SlSectionBody,
  SlSectionDescription,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlSlider } from '@slotted/angular/slider';
import { SlStack } from '@slotted/angular/stack';
import { SlThemeScope } from '@slotted/angular/theme';
import { SlHeading, SlHeadingLevel, SlText } from '@slotted/angular/typography';

import { PreferencesStore, type UserPreferences } from '../../core/session/preferences.store';
import {
  appearanceSeeds,
  BRAND_PRESETS,
  isNeutralPreset,
  isSeed,
  NEUTRAL_PRESETS,
  NO_STATUS,
  STATUS_PRESETS,
  STATUS_SEEDS,
  type BrandPreference,
  type StatusSeed,
} from '../../core/theming/appearance';
import type * as ContrastReadingModule from '../../core/theming/contrast-reading';
import {
  BORDER_CHOICES,
  CARD_CHOICES,
  CHART_CHOICES,
  customizedAxes,
  isCustomised,
  MOTION_CHOICES,
  NO_CUSTOMISATION,
  RADIUS_RANGE,
  readCustomisation,
  SCALE_CHOICES,
  SHADOW_CHOICES,
  TAB_CHOICES,
  type Customization,
  type CustomizationAxis,
  type FontId,
} from '../../core/theming/customization';
import type * as NexoraThemesModule from '../../core/theming/nexora-themes';
import { declareFaces, FONT_FAMILIES, fontFamily } from '../../core/theming/theme-faces';
import type * as ThemeAnatomyModule from '../../core/theming/theme-anatomy';
import {
  catalogueTheme,
  DEFAULT_THEME_ID,
  RUNTIME_THEME_IDS,
  THEME_CATALOGUE,
} from '../../core/theming/theme-catalogue';
import { AnatomyTable } from './anatomy-table';
import { CHOICE_GRID } from './choice-grid.styles';
import { CONTROL_GROUPS, ControlsSection } from './controls-section';
import { ContrastTable } from './contrast-table';
import { InView } from './in-view';

/** The builder's axes of fixed values, their words and the words of each value. */
const AXES = [
  {
    axis: 'scale',
    label: 'Type scale',
    description: 'Every type size, as a share of the library’s.',
    options: SCALE_CHOICES.map((value) => ({ value: String(value), label: `${value}%` })),
  },
  {
    axis: 'border',
    label: 'Lines',
    description: 'The weight of every border and divider.',
    options: BORDER_CHOICES.map((value) => ({ value: String(value), label: `${value} px` })),
  },
  {
    axis: 'shadow',
    label: 'Shadows',
    description: 'How far raised things stand off the page.',
    options: SHADOW_CHOICES.map((value) => ({
      value,
      label: { none: 'None', soft: 'Soft', strong: 'Strong' }[value],
    })),
  },
  {
    axis: 'motion',
    label: 'Motion',
    description: 'How long transitions take: the theme’s, the library’s, half of it, or none.',
    options: MOTION_CHOICES.map((value) => ({
      value,
      label: { normal: 'Full', reduced: 'Reduced', off: 'Off' }[value],
    })),
  },
  {
    axis: 'cards',
    label: 'Cards',
    description: 'A card’s and a stat card’s edge: a line, a lift on a shadow, or a sunken fill.',
    options: CARD_CHOICES.map((value) => ({
      value,
      label: { bordered: 'Bordered', elevated: 'Elevated', flat: 'Flat' }[value],
    })),
  },
  {
    axis: 'tabs',
    label: 'Tabs',
    description:
      'The selected tab: underlined on the tab strip’s line, or a pill on the accent’s ground.',
    options: TAB_CHOICES.map((value) => ({
      value,
      label: { underline: 'Underline', pill: 'Pill' }[value],
    })),
  },
  {
    axis: 'chart',
    label: 'Chart colors',
    description: 'The series of every chart: the theme’s palette, or shades of the accent.',
    options: CHART_CHOICES.map((value) => ({
      value,
      label: { palette: 'Palette', accent: 'Accent' }[value],
    })),
  },
] as const;

/** The length, in characters, of the longest of `labels`: a choice grid's narrowest track. */
const longest = (...labels: readonly string[]) => Math.max(...labels.map((label) => label.length));

/** Every axis's name and the words of each of its values, as the anatomy lists a change. */
function axisWords(axis: CustomizationAxis, value: unknown): { label: string; value: string } {
  const builder = AXES.find((entry) => entry.axis === axis);
  if (builder !== undefined) {
    return {
      label: builder.label,
      value: builder.options.find((option) => option.value === String(value))?.label ?? '',
    };
  }
  const control = CONTROL_GROUPS.flatMap(([, groups]) => groups).find(
    (entry) => entry.axis === axis,
  );
  if (control !== undefined) {
    return {
      label: control.change ?? control.label,
      value: control.options.find((option) => option.value === String(value))?.label ?? '',
    };
  }
  if (axis === 'body' || axis === 'heading') {
    return {
      label: axis === 'body' ? 'Text face' : 'Heading face',
      value: fontFamily(value as FontId).label,
    };
  }
  return { label: 'Corner radius', value: `${String(value)} px` };
}

const STATUS_LABELS: Readonly<Record<StatusSeed, string>> = {
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
};

/**
 * How Nexora is drawn: a theme of the catalogue, the builder's changes over
 * it, the scheme and the density, each a candidate in the page's draft until
 * Save. The page hands the draft to `PreferencesStore.preview`, so the whole
 * application is drawn in the candidate while it is edited.
 *
 * Every sample on this section is a theme region of its own — a theme card
 * names its theme, a swatch carries its seed — so what it shows is what the
 * theme derives for that choice, not a color the page wrote. A customized
 * candidate is one more theme, compiled in the browser by `extendTheme`; the
 * anatomy table reads that theme object layer by layer, and the contrast
 * table reads its recipe's numbers in the three schemes.
 *
 * The runtime themes' definitions, the anatomy and the contrast arithmetic
 * load by `import()` when the section opens, and the sheets are compiled
 * then: one wait, one skeleton region, on the application's timing. A sample
 * whose sheet is missing and that no placeholder covers keeps its box and
 * draws nothing, since in `default` it would show another theme. A load that
 * fails leaves the themes without a sheet out of the choice, hides the
 * tables and offers a retry.
 */
@Component({
  selector: 'app-appearance-section',
  imports: [
    AnatomyTable,
    ControlsSection,
    ContrastTable,
    InView,
    NgTemplateOutlet,
    SlAlert,
    SlAlertActions,
    SlAlertContent,
    SlAlertDescription,
    SlAlertTitle,
    SlBadge,
    SlButton,
    SlColorField,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlHeading,
    SlHeadingLevel,
    SlInline,
    SlRadio,
    SlRadioGroup,
    SlSection,
    SlSectionBody,
    SlSectionDescription,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSkeleton,
    SlSkeletonRegion,
    SlSlider,
    SlStack,
    SlText,
    SlThemeScope,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    CHOICE_GRID,
    `
      .themes {
        --_floor: 12rem;
      }
      .swatches {
        --_lead: calc(var(--slotted-control-icon-size-lg) + var(--slotted-space-3));
      }
      /* The specimen: seven characters of the second-largest size, in the widest face offered. */
      .fonts {
        --_floor: calc(5 * var(--slotted-font-size-2xl));
      }
      /* LA-05: color fields side by side start at the line's top. */
      .colors {
        display: grid;
        align-items: start;
        gap: var(--slotted-space-6) var(--slotted-space-7);
        grid-template-columns: repeat(auto-fill, minmax(min(15rem, 100%), 1fr));
      }
      /* A font option: a line of text in its own face, its name, and what kind of face it is. */
      .specimen {
        display: block;
        block-size: var(--slotted-space-9);
        overflow: hidden;
        font-size: var(--slotted-font-size-2xl);
        line-height: var(--slotted-space-9);
        white-space: nowrap;
      }
      .font-option {
        display: grid;
        gap: var(--slotted-space-2);
      }
      /* A theme as it comes — its own face, corner, shadow, case, accent and first series — in its region. */
      /* Items keep their own width, so the title's placeholder is as long as the title. */
      /*
     * A fixed box, sized by the page's tokens outside every sample's region:
     * each card of the group is as tall as the others, whatever its theme's type.
     */
      .sample-box {
        display: block;
        align-self: stretch;
        block-size: calc(var(--slotted-space-12) + var(--slotted-space-10));
      }
      .sample {
        box-sizing: border-box;
        block-size: 100%;
        overflow: hidden;
        display: grid;
        align-content: start;
        justify-items: start;
        gap: var(--slotted-space-3);
        padding: var(--slotted-space-5);
        border: var(--slotted-border-width-thin) solid var(--slotted-border-subtle);
        border-radius: var(--slotted-radius-lg);
        background: var(--slotted-surface);
        color: var(--slotted-text);
        font-family: var(--slotted-font-family-sans);
        box-shadow: var(--slotted-shadow-md);
      }
      .sample-title {
        font-family: var(--slotted-font-family-heading);
        font-size: var(--slotted-font-size-lg);
        font-weight: var(--slotted-font-weight-semibold);
        line-height: var(--slotted-line-height-lg);
      }
      .sample-row {
        justify-self: stretch;
        display: flex;
        align-items: center;
        gap: var(--slotted-space-3);
      }
      .sample-bar {
        flex: 1;
        block-size: var(--slotted-space-4);
        border-radius: var(--slotted-radius-sm);
        background: var(--slotted-data-1);
      }
      .swatch {
        flex: none;
        inline-size: var(--slotted-control-icon-size-lg);
        block-size: var(--slotted-control-icon-size-lg);
        border-radius: var(--slotted-radius-full);
        background: var(--slotted-tone-accent-solid);
      }
      .swatch[data-neutral] {
        background: var(--slotted-surface-sunken);
        box-shadow: inset 0 0 0 var(--slotted-space-2) var(--slotted-text-muted);
      }
      /* A theme that cannot be drawn keeps its sample box, as an empty frame in the page's own theme. */
      .sample[data-missing] {
        border-style: dashed;
        background: var(--slotted-surface-sunken);
        box-shadow: none;
      }
      /* A sample whose theme's sheet is not on the page keeps its box and draws nothing. */
      .reserved {
        visibility: hidden;
      }
    `,
  ],
  template: `
    <section slSection>
      <div slSectionHeader>
        <div slSectionTitle>
          <h2 slSectionHeading>Appearance</h2>
          <p slSectionDescription>
            A theme, your changes over it, and the scheme and density Nexora is drawn in. Every
            choice draws the whole application at once; Save keeps it, and Discard or leaving this
            page returns to the saved appearance.
          </p>
        </div>
      </div>
      <div slSectionBody>
        <div
          slSkeletonRegion
          #wait="slSkeletonRegion"
          [loading]="pending()"
          [messages]="{ label: 'Loading the themes' }"
          data-appearance
        >
          <div slStack [gap]="8" slHeadingLevel>
            @if (failed()) {
              <section slAlert tone="danger" live="polite" data-themes-failed>
                <div slAlertContent>
                  <div slAlertTitle>The themes did not load</div>
                  <p slAlertDescription>
                    Standard stays available. The other themes, the builder, the anatomy and the
                    contrast readings need definitions that did not arrive.
                  </p>
                </div>
                <div slAlertActions>
                  <button
                    slButton
                    type="button"
                    size="sm"
                    variant="outline"
                    tone="danger"
                    (click)="load()"
                  >
                    Try again
                  </button>
                </div>
              </section>
            }

            @if (store.customFailed()) {
              <section slAlert tone="danger" live="polite" data-custom-failed>
                <div slAlertContent>
                  <div slAlertTitle>Your customized theme did not compile</div>
                  <p slAlertDescription>
                    Nexora stays in the theme it is drawn in until it does. Your changes are kept.
                  </p>
                </div>
                <div slAlertActions>
                  <button
                    slButton
                    type="button"
                    size="sm"
                    variant="outline"
                    tone="danger"
                    (click)="store.retryCustom()"
                  >
                    Try again
                  </button>
                </div>
              </section>
            }

            <div slStack [gap]="5" data-appearance-group="theme">
              <h3 slHeading size="md">Theme</h3>
              <div slField>
                <label slFieldLabel>Theme</label>
                <span slFieldDescription data-theme-description>
                  {{ themeLabel() }}: {{ themeDescription() }} Each theme sets its own colors,
                  type, space, corners, lines, shadows and motion, and dresses the components its
                  own way.
                </span>
                <div
                  slRadioGroup
                  name="theme"
                  variant="tile"
                  [value]="draft().theme"
                  (valueChange)="patch.emit({ theme: $event.value })"
                >
                  <div class="choices themes" [style.--longest]="longest.themes">
                    @for (entry of themes; track entry.id) {
                      <div slRadio [value]="entry.id" [disabled]="unavailable(entry.id)">
                        <span slStack [gap]="3">
                          <span class="sample-box">
                            @if (unavailable(entry.id)) {
                              <span class="sample" data-missing aria-hidden="true"></span>
                            } @else {
                              <span
                                class="sample"
                                aria-hidden="true"
                                [class.reserved]="reserved(entry.id, wait.painted())"
                                slThemeScope
                                [attr.data-theme-sample]="entry.id"
                                [theme]="drawn(entry.id)"
                                [scheme]="draft().scheme"
                                [seeds]="
                                  entry.accent === null ? undefined : { accent: entry.accent }
                                "
                              >
                                <span slSkeleton><span class="sample-title">Orders</span></span>
                                <span class="sample-row">
                                  <span class="sample-bar"></span>
                                  <span slSkeleton
                                    ><span slBadge tone="accent" variant="solid">New</span></span
                                  >
                                </span>
                              </span>
                            }
                          </span>
                          <span class="tile-label">{{ entry.label }}</span>
                        </span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div slStack [gap]="6" data-appearance-group="customize">
              <div class="group-head">
                <h3 slHeading size="md">Customize {{ themeLabel() }}</h3>
                <span slInline [gap]="3" align="center">
                  @if (changes() > 0) {
                    <span slBadge tone="accent" variant="soft" data-changes
                      >{{ changes() }} {{ changes() === 1 ? 'change' : 'changes' }}</span
                    >
                  }
                  <button
                    slButton
                    type="button"
                    size="sm"
                    variant="outline"
                    tone="secondary"
                    data-reset
                    [disabled]="changes() === 0"
                    (click)="reset()"
                  >
                    Reset to {{ themeLabel() }}
                  </button>
                </span>
              </div>
              <p slText size="sm" tone="muted">
                Every change compiles a new theme in the browser, laid over {{ themeLabel() }} with
                the same function the catalogue themes are built with. Anything left on Theme keeps
                {{ themeLabel() }}’s own value.
              </p>

              <h4 slHeading size="sm">Colors</h4>
              <div slField>
                <label slFieldLabel>Brand color</label>
                <span slFieldDescription>
                  The accent every primary action, link and selection is derived from.
                </span>
                <div
                  slRadioGroup
                  name="brand"
                  variant="tile"
                  [value]="draft().brand.preset"
                  (valueChange)="chooseBrand($event.value)"
                >
                  <div class="choices swatches" [style.--longest]="longest.brands">
                    <div slRadio value="theme">
                      <span slInline [gap]="3" wrap="nowrap">
                        <span slSkeleton
                          ><span
                            class="swatch"
                            [class.reserved]="reserved(draft().theme, wait.painted())"
                            slThemeScope
                            [theme]="drawn(draft().theme)"
                            [scheme]="draft().scheme"
                            [seeds]="themeAccent()"
                          ></span
                        ></span>
                        <span class="tile-label">Theme</span>
                      </span>
                    </div>
                    @for (preset of brands; track preset.id) {
                      <div slRadio [value]="preset.id">
                        <span slInline [gap]="3" wrap="nowrap">
                          <span slSkeleton
                            ><span
                              class="swatch"
                              [class.reserved]="reserved(draft().theme, wait.painted())"
                              slThemeScope
                              [theme]="drawn(draft().theme)"
                              [scheme]="draft().scheme"
                              [seeds]="{ accent: preset.color }"
                            ></span
                          ></span>
                          <span class="tile-label">{{ preset.label }}</span>
                        </span>
                      </div>
                    }
                    <div slRadio value="custom">
                      <span slInline [gap]="3" wrap="nowrap">
                        <span slSkeleton
                          ><span
                            class="swatch"
                            [class.reserved]="reserved(draft().theme, wait.painted())"
                            slThemeScope
                            [theme]="drawn(draft().theme)"
                            [scheme]="draft().scheme"
                            [seeds]="{ accent: draft().brand.custom }"
                          ></span
                        ></span>
                        <span class="tile-label">Custom</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div slField>
                <label slFieldLabel>Grey</label>
                <span slFieldDescription>
                  The neutral every ground, border and muted text is derived from.
                </span>
                <div
                  slRadioGroup
                  name="neutral"
                  variant="tile"
                  [value]="draft().neutral.preset"
                  (valueChange)="chooseNeutral($event.value)"
                >
                  <div class="choices swatches" [style.--longest]="longest.neutrals">
                    @for (preset of neutrals; track preset.id) {
                      <div slRadio [value]="preset.id">
                        <span slInline [gap]="3" wrap="nowrap">
                          <span slSkeleton
                            ><span
                              class="swatch"
                              data-neutral
                              [class.reserved]="reserved(draft().theme, wait.painted())"
                              slThemeScope
                              [theme]="drawn(draft().theme)"
                              [scheme]="draft().scheme"
                              [seeds]="
                                preset.color === null ? undefined : { neutral: preset.color }
                              "
                            ></span
                          ></span>
                          <span class="tile-label">{{ preset.label }}</span>
                        </span>
                      </div>
                    }
                    <div slRadio value="custom">
                      <span slInline [gap]="3" wrap="nowrap">
                        <span slSkeleton
                          ><span
                            class="swatch"
                            data-neutral
                            [class.reserved]="reserved(draft().theme, wait.painted())"
                            slThemeScope
                            [theme]="drawn(draft().theme)"
                            [scheme]="draft().scheme"
                            [seeds]="{ neutral: draft().neutral.custom }"
                          ></span
                        ></span>
                        <span class="tile-label">Custom</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="colors">
                <div slField data-brand-custom>
                  <label slFieldLabel>Custom brand color</label>
                  <div
                    slColorField
                    format="hex"
                    [alpha]="false"
                    [presets]="presetColors"
                    [value]="draft().brand.custom"
                    (valueChange)="chooseCustom($event.value)"
                  ></div>
                  <span slFieldDescription
                    >Any color; the recipe keeps every text on it readable.</span
                  >
                </div>
                <div slField data-neutral-custom>
                  <label slFieldLabel>Custom grey</label>
                  <div
                    slColorField
                    format="hex"
                    [alpha]="false"
                    [presets]="greyColors"
                    [value]="draft().neutral.custom"
                    (valueChange)="chooseNeutralCustom($event.value)"
                  ></div>
                  <span slFieldDescription
                    >Any color; grounds, lines and muted text take a share of its chroma.</span
                  >
                </div>
                @for (status of statuses; track status) {
                  <div slField [attr.data-status]="status">
                    <label slFieldLabel>{{ statusLabels[status] }}</label>
                    <div
                      slColorField
                      format="hex"
                      [alpha]="false"
                      [presets]="statusPresets[status]"
                      [value]="statusValue(status)"
                      (valueChange)="chooseStatus(status, $event.value)"
                    ></div>
                    <span slFieldDescription>
                      @if (draft().status[status] === null) {
                        {{ themeLabel() }}’s own.
                      } @else {
                        Yours.
                        <button
                          slButton
                          type="button"
                          size="sm"
                          variant="ghost"
                          tone="secondary"
                          (click)="chooseStatus(status, null)"
                        >
                          Use the theme’s
                        </button>
                      }
                    </span>
                  </div>
                }
              </div>

              <h4 slHeading size="sm">Type</h4>
              @for (picker of fontPickers; track picker.axis) {
                <div slField [attr.data-axis]="picker.axis">
                  <label slFieldLabel>{{ picker.label }}</label>
                  <span slFieldDescription>{{ picker.description }}</span>
                  <div
                    slRadioGroup
                    [name]="'font-' + picker.axis"
                    variant="tile"
                    [value]="axisValue(picker.axis)"
                    (valueChange)="chooseAxis(picker.axis, $event.value)"
                  >
                    <div class="choices fonts" [style.--longest]="longest.fonts">
                      <div slRadio value="theme">
                        <span class="font-option">
                          <!-- A specimen downloads its face: it names it once it can be seen. -->
                          <span
                            class="specimen"
                            aria-hidden="true"
                            appInView
                            #own="inView"
                            [style.font-family]="own.seen() ? ownFont(picker.axis).stack : null"
                            [style.font-weight]="picker.weight"
                            >{{ own.seen() ? 'Ag 1234' : '' }}</span
                          >
                          <span class="tile-label">Theme</span>
                          <span class="tile-label" slText size="xs" tone="muted">{{
                            ownFont(picker.axis).label
                          }}</span>
                        </span>
                      </div>
                      @for (family of fonts; track family.id) {
                        <div slRadio [value]="family.id">
                          <span class="font-option">
                            <span
                              class="specimen"
                              aria-hidden="true"
                              appInView
                              #face="inView"
                              [attr.data-specimen]="family.id"
                              [style.font-family]="face.seen() ? family.stack : null"
                              [style.font-weight]="picker.weight"
                              >{{ face.seen() ? 'Ag 1234' : '' }}</span
                            >
                            <span class="tile-label">{{ family.label }}</span>
                            <span class="tile-label" slText size="xs" tone="muted">{{
                              family.kind
                            }}</span>
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
              <ng-container
                *ngTemplateOutlet="axisGroup; context: { $implicit: axes.slice(0, 1) }"
              />

              <h4 slHeading size="sm">Shape and depth</h4>
              <div slField data-axis="radius">
                <label slFieldLabel>Corner radius</label>
                <div
                  slSlider
                  [min]="radiusRange.min"
                  [max]="radiusRange.max"
                  [step]="radiusRange.step"
                  [value]="radius()"
                  [marks]="[0, 8, 16, 24]"
                  (valueChange)="chooseRadius($event.value)"
                ></div>
                <span slFieldDescription data-radius-value>
                  @if (draft().customization.radius === null) {
                    {{ radius() }} px on the largest corner, {{ themeLabel() }}’s own.
                  } @else {
                    {{ radius() }} px on the largest corner, yours.
                    <button
                      slButton
                      type="button"
                      size="sm"
                      variant="ghost"
                      tone="secondary"
                      (click)="chooseAxis('radius', 'theme')"
                    >
                      Use the theme’s
                    </button>
                  }
                </span>
              </div>
              <ng-container
                *ngTemplateOutlet="axisGroup; context: { $implicit: axes.slice(1, 4) }"
              />

              <h4 slHeading size="sm">Components</h4>
              <ng-container *ngTemplateOutlet="axisGroup; context: { $implicit: axes.slice(4) }" />

              <!-- A builder axis: its theme's own value first, then each value in full words. -->
              <ng-template #axisGroup let-entries>
                @for (entry of entries; track entry.axis) {
                  <div slField [attr.data-axis]="entry.axis">
                    <label slFieldLabel>{{ entry.label }}</label>
                    <span slFieldDescription>{{ entry.description }}</span>
                    <div
                      slRadioGroup
                      [name]="'axis-' + entry.axis"
                      variant="tile"
                      [value]="axisValue(entry.axis)"
                      (valueChange)="chooseAxis(entry.axis, $event.value)"
                    >
                      <div class="choices" [style.--longest]="longest.axes">
                        <div slRadio value="theme"><span class="tile-label">Theme</span></div>
                        @for (option of entry.options; track option.value) {
                          <div slRadio [value]="option.value">
                            <span class="tile-label">{{ option.label }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </ng-template>
            </div>

            <app-controls-section [draft]="draft()" (patch)="patch.emit($event)" />

            <div slStack [gap]="5" data-appearance-group="scheme">
              <h3 slHeading size="md">Scheme and density</h3>
              <div class="colors">
                <div slField>
                  <label slFieldLabel>Color scheme</label>
                  <div
                    slRadioGroup
                    name="scheme"
                    [value]="draft().scheme"
                    (valueChange)="patch.emit({ scheme: $any($event.value) })"
                  >
                    <div slRadio value="light">Light</div>
                    <div slRadio value="dark">Dark</div>
                    <div slRadio value="system">System</div>
                  </div>
                </div>
                <div slField>
                  <label slFieldLabel>Density</label>
                  <div
                    slRadioGroup
                    name="density"
                    [value]="draft().density"
                    (valueChange)="patch.emit({ density: $any($event.value) })"
                  >
                    <div slRadio value="comfortable">Comfortable</div>
                    <div slRadio value="compact">Compact</div>
                    <div slRadio value="dense">Dense</div>
                  </div>
                </div>
              </div>
            </div>

            @if (!failed() || anatomy() !== null) {
              <div slStack [gap]="5" data-appearance-group="anatomy">
                <h3 slHeading size="md">Theme anatomy</h3>
                <p slText size="sm" tone="muted">
                  A theme is one object of nine layers. These are the entries
                  {{ anatomyName() }} declares over the library’s own theme; a customized theme is
                  the same object with your changes in the layers they belong to, listed after it.
                </p>
                <app-anatomy-table
                  [anatomy]="anatomy()"
                  [name]="anatomyName()"
                  [changes]="changeAnatomy()"
                />
              </div>
            }

            @if (!failed() || readings() !== null) {
              <div slStack [gap]="5" data-appearance-group="contrast">
                <h3 slHeading size="md">Contrast</h3>
                <app-contrast-table [readings]="readings()" />
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AppearanceSection {
  readonly draft = input.required<UserPreferences>();
  readonly patch = output<Partial<UserPreferences>>();

  protected readonly store = inject(PreferencesStore);
  private readonly document = inject(DOCUMENT);

  protected readonly themes = THEME_CATALOGUE;
  protected readonly brands = BRAND_PRESETS;
  protected readonly neutrals = NEUTRAL_PRESETS;
  protected readonly statuses = STATUS_SEEDS;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly statusPresets = STATUS_PRESETS;
  protected readonly axes = AXES;
  protected readonly fonts = FONT_FAMILIES;
  protected readonly fontPickers = [
    {
      axis: 'body',
      label: 'Text face',
      description: 'The face of the text, the tables and the controls.',
      weight: 'var(--slotted-font-weight-regular)',
    },
    {
      axis: 'heading',
      label: 'Heading face',
      description: 'The face of every heading and title.',
      weight: 'var(--slotted-font-weight-semibold)',
    },
  ] as const;
  protected readonly longest = {
    themes: longest(...THEME_CATALOGUE.map((entry) => entry.label)),
    brands: longest('Theme', 'Custom', ...BRAND_PRESETS.map((preset) => preset.label)),
    neutrals: longest('Custom', ...NEUTRAL_PRESETS.map((preset) => preset.label)),
    fonts: longest('Theme', ...FONT_FAMILIES.flatMap((family) => [family.label, family.kind])),
    axes: longest('Theme', ...AXES.flatMap((entry) => entry.options.map((option) => option.label))),
  };
  protected readonly radiusRange = RADIUS_RANGE;
  protected readonly presetColors = BRAND_PRESETS.map((preset) => preset.color);
  protected readonly greyColors = NEUTRAL_PRESETS.flatMap((preset) =>
    preset.color === null ? [] : [preset.color],
  );

  /** The last load of the runtime sheets failed, and nothing has been tried since. */
  protected readonly failed = signal(false);
  /** The contrast arithmetic, once its module has loaded. */
  private readonly contrast = signal<typeof ContrastReadingModule | null>(null);
  /** The theme definitions and the anatomy reader, once their modules have loaded. */
  private readonly definitions = signal<{
    readonly themes: typeof NexoraThemesModule;
    readonly anatomy: typeof ThemeAnatomyModule;
  } | null>(null);

  private readonly customized = computed(() => isCustomised(this.draft().customization));

  /** Every runtime sheet and every module the section draws from is here. */
  private readonly loaded = computed(
    () =>
      this.contrast() !== null &&
      this.definitions() !== null &&
      RUNTIME_THEME_IDS.every((id) => this.store.hasSheet(id)),
  );
  /** The section opened on a saved customization whose theme has not been compiled yet. */
  private readonly opening = signal(true);

  /**
   * One wait: the sheets and the modules, and on opening the first compile
   * of a saved customization. A change made afterwards is no wait: the
   * application keeps what it shows until the new candidate is compiled.
   */
  protected readonly pending = computed(
    () => !this.failed() && (!this.loaded() || (this.opening() && this.uncompiled())),
  );

  /** The draft is customized, no theme has been compiled for it yet, and none has failed. */
  private uncompiled(): boolean {
    return this.customized() && this.compiled() === null && !this.store.customFailed();
  }

  /** The theme the draft's customization compiled to, or the latest candidate over its theme. */
  private readonly compiled = computed(() =>
    this.store.compiledTheme(this.draft().theme, this.draft().customization),
  );

  constructor() {
    this.load();
    effect(() => {
      if (this.loaded() && !this.uncompiled()) this.opening.set(false);
    });
  }

  protected readonly themeLabel = computed(() => catalogueTheme(this.draft().theme).label);
  protected readonly themeDescription = computed(
    () => catalogueTheme(this.draft().theme).description,
  );
  protected readonly changes = computed(
    () =>
      customizedAxes(this.draft().customization).length +
      STATUS_SEEDS.filter((status) => this.draft().status[status] !== null).length,
  );
  /** Each axis the draft sets, with the layers of the model it writes, as the anatomy lists it. */
  protected readonly changeAnatomy = computed(() => {
    const definitions = this.definitions();
    if (definitions === null) return [];
    const { theme, customization } = this.draft();
    return definitions.anatomy.customizationAnatomy(theme, customization).map((entry) => ({
      ...entry,
      ...axisWords(entry.axis, customization[entry.axis]),
    }));
  });

  /** The candidate seeds, as the contrast readings take them. */
  protected readonly seeds = computed(() =>
    appearanceSeeds(
      this.draft().theme,
      this.draft().brand,
      this.draft().neutral,
      this.draft().status,
    ),
  );
  /** The accent the "Theme's own" swatch draws: Standard's violet, or the theme sheet's seed. */
  protected readonly themeAccent = computed(() => {
    const accent = catalogueTheme(this.draft().theme).accent;
    return accent === null ? undefined : { accent };
  });

  protected readonly readings = computed(
    () => this.contrast()?.contrastReadings(this.draft().theme, this.seeds()) ?? null,
  );

  protected readonly anatomy = computed(() => {
    const definitions = this.definitions();
    if (definitions === null) return null;
    const compiled = this.customized() ? this.compiled() : null;
    return definitions.anatomy.themeAnatomy(
      compiled ?? definitions.themes.nexoraTheme(this.draft().theme),
    );
  });
  protected readonly anatomyName = computed(() =>
    this.customized() ? `${this.themeLabel()}, customized` : this.themeLabel(),
  );

  /** The theme's own face for the text or the headings. */
  protected ownFont(axis: 'body' | 'heading') {
    return fontFamily(catalogueTheme(this.draft().theme)[axis]);
  }

  protected readonly radius = computed(
    () => this.draft().customization.radius ?? catalogueTheme(this.draft().theme).radius,
  );

  /**
   * Puts every runtime sheet on the page and loads the theme definitions, the
   * anatomy and the contrast arithmetic; the samples wait for all of them.
   */
  protected load(): void {
    this.failed.set(false);
    Promise.all([
      this.store.useThemes(),
      import('../../core/theming/contrast-reading'),
      import('../../core/theming/nexora-themes'),
      import('../../core/theming/theme-anatomy'),
    ]).then(
      ([, contrast, themes, anatomy]) => {
        declareFaces(this.document);
        this.definitions.set({ themes, anatomy });
        this.contrast.set(contrast);
      },
      () => this.failed.set(true),
    );
  }

  /** The theme a region names: `theme` once its sheet is on the page, `default` until then. */
  protected drawn(theme: string): string {
    return this.store.hasSheet(theme) ? theme : DEFAULT_THEME_ID;
  }

  /**
   * A sample drawn in `default` for a theme whose sheet is missing would show
   * another theme: it keeps its box and draws nothing until the placeholders
   * are painted over it or the sheet arrives.
   */
  protected reserved(theme: string, painted: boolean): boolean {
    return !painted && !this.store.hasSheet(theme);
  }

  /** A theme whose sheet failed to load cannot be drawn, so it cannot be chosen. */
  protected unavailable(theme: string): boolean {
    return this.failed() && !this.store.hasSheet(theme);
  }

  protected axisValue(axis: CustomizationAxis): string {
    const value = this.draft().customization[axis];
    return value === null ? 'theme' : String(value);
  }

  /** A choice's value, read back through the same check as storage; `theme` clears the axis. */
  protected chooseAxis(axis: CustomizationAxis, value: unknown): void {
    const raw = value === 'theme' ? null : /^-?\d+$/.test(String(value)) ? Number(value) : value;
    const next = readCustomisation({ ...this.draft().customization, [axis]: raw });
    if (raw !== null && next[axis] === null) return;
    this.patchCustomisation(next);
  }

  protected chooseRadius(value: number | number[]): void {
    const radius = Array.isArray(value) ? value[0] : value;
    const next = readCustomisation({ ...this.draft().customization, radius });
    if (next.radius !== null) this.patchCustomisation(next);
  }

  private patchCustomisation(customization: Customization): void {
    this.patch.emit({ customization });
  }

  /** The builder's changes, the reader's colors and grey go; the theme stays. */
  protected reset(): void {
    this.patch.emit({
      customization: NO_CUSTOMISATION,
      status: NO_STATUS,
      brand: { ...this.draft().brand, preset: 'theme' },
      neutral: { ...this.draft().neutral, preset: 'theme' },
    });
  }

  /** The color a status field shows: the reader's, or the theme's own once its definition is here. */
  protected statusValue(status: StatusSeed): string | undefined {
    return (
      this.draft().status[status] ??
      this.definitions()?.themes.nexoraTheme(this.draft().theme).seeds[status]
    );
  }

  protected chooseStatus(status: StatusSeed, value: string | null): void {
    if (value !== null && !isSeed(value)) return;
    const color = value?.toLowerCase() ?? null;
    const own = this.definitions()?.themes.nexoraTheme(this.draft().theme).seeds[status];
    this.patch.emit({
      status: { ...this.draft().status, [status]: color === own ? null : color },
    });
  }

  protected chooseBrand(value: unknown): void {
    if (
      value !== 'custom' &&
      value !== 'theme' &&
      !BRAND_PRESETS.some((preset) => preset.id === value)
    ) {
      return;
    }
    this.patch.emit({
      brand: { ...this.draft().brand, preset: value as BrandPreference['preset'] },
    });
  }

  /**
   * A color typed or picked becomes the custom brand, and Custom is chosen
   * with it; one of the presets offered in the panel chooses that preset.
   * The field writes hex in capitals; the store keeps it in lower case.
   */
  protected chooseCustom(value: string): void {
    if (!isSeed(value)) return;
    const color = value.toLowerCase();
    const preset = BRAND_PRESETS.find((entry) => entry.color === color);
    this.patch.emit({
      brand: preset
        ? { ...this.draft().brand, preset: preset.id }
        : { preset: 'custom', custom: color },
    });
  }

  protected chooseNeutral(value: unknown): void {
    if (value !== 'custom' && !isNeutralPreset(value)) return;
    this.patch.emit({ neutral: { ...this.draft().neutral, preset: value } });
  }

  /** A grey typed or picked becomes the custom neutral, or the preset it equals. */
  protected chooseNeutralCustom(value: string): void {
    if (!isSeed(value)) return;
    const color = value.toLowerCase();
    const preset = NEUTRAL_PRESETS.find((entry) => entry.color === color);
    this.patch.emit({
      neutral: preset
        ? { ...this.draft().neutral, preset: preset.id }
        : { preset: 'custom', custom: color },
    });
  }
}
