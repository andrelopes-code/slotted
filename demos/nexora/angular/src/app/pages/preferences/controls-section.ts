import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

import type { UserPreferences } from '../../core/session/preferences.store';
import {
  BUTTON_CHOICES,
  CARD_RADIUS_CHOICES,
  CONTROL_AXES,
  CONTROL_HEIGHT_CHOICES,
  CONTROL_RADIUS_CHOICES,
  CONTROL_TEXT_CHOICES,
  FOCUS_CHOICES,
  INPUT_CHOICES,
  LABEL_SPACING_CHOICES,
  LABEL_WEIGHT_CHOICES,
  OVERLAY_RADIUS_CHOICES,
  readCustomisation,
  type Customization,
  type CustomizationAxis,
} from '../../core/theming/customization';
import { catalogueTheme } from '../../core/theming/theme-catalogue';
import { CHOICE_GRID } from './choice-grid.styles';

/** The length, in characters, of the longest of `labels`: a choice grid's narrowest track. */
const longest = (...labels: readonly string[]) => Math.max(...labels.map((label) => label.length));

/** What a Controls tile draws above its label: the style itself, in the page's colors. */
type Specimen = 'field' | 'focus' | 'button' | null;

interface ControlGroup {
  readonly axis: (typeof CONTROL_AXES)[number];
  readonly label: string;
  /** The axis's name where it stands alone, as the anatomy lists it; the label otherwise. */
  readonly change?: string;
  readonly description: string;
  readonly specimen: Specimen;
  /** The CSS property each option's label is set in, so the label shows its own value. */
  readonly labelStyle?: 'font-weight' | 'letter-spacing';
  readonly options: readonly {
    readonly value: string;
    readonly label: string;
    readonly css?: string;
  }[];
}

const px = (value: number) => (value >= 9999 ? 'Pill' : `${value} px`);
const signed = (value: number) => `${value > 0 ? '+' : '−'}${Math.abs(value)} px`;

/** The Controls section's axes, in four groups of the section, each value in full words. */
export const CONTROL_GROUPS: readonly (readonly [string, readonly ControlGroup[]])[] = [
  [
    'Fields, focus and buttons',
    [
      {
        axis: 'input',
        label: 'Fields',
        description:
          'How every text field, select, date field and text area draws its frame at rest.',
        specimen: 'field',
        options: INPUT_CHOICES.map((value) => ({
          value,
          label: {
            outlined: 'Outlined',
            filled: 'Filled',
            underline: 'Underline',
            borderless: 'Borderless',
          }[value],
        })),
      },
      {
        axis: 'focus',
        label: 'Focus',
        description:
          'How a button and a field mark keyboard focus; other controls keep a ring in the same color.',
        specimen: 'focus',
        options: FOCUS_CHOICES.map((value) => ({
          value,
          label: { ring: 'Ring', glow: 'Glow', underline: 'Underline', offset: 'Offset' }[value],
        })),
      },
      {
        axis: 'button',
        label: 'Primary button',
        description: 'How the main action of a page or a dialog is painted.',
        specimen: 'button',
        options: BUTTON_CHOICES.map((value) => ({
          value,
          label: { solid: 'Solid', soft: 'Soft', outline: 'Outline', ghost: 'Ghost' }[value],
        })),
      },
    ],
  ],
  [
    'Corners',
    [
      {
        axis: 'controlRadius',
        label: 'Controls',
        change: 'Control corners',
        description: 'Buttons, fields, toggles and segmented controls.',
        specimen: null,
        options: CONTROL_RADIUS_CHOICES.map((value) => ({
          value: String(value),
          label: px(value),
        })),
      },
      {
        axis: 'cardRadius',
        label: 'Cards',
        change: 'Card corners',
        description: 'Cards, stat cards, chart cards, tables and alerts.',
        specimen: null,
        options: CARD_RADIUS_CHOICES.map((value) => ({ value: String(value), label: px(value) })),
      },
      {
        axis: 'overlayRadius',
        label: 'Overlays',
        change: 'Overlay corners',
        description: 'Dialogs, drawers, menus, popovers, select panels, tooltips and toasts.',
        specimen: null,
        options: OVERLAY_RADIUS_CHOICES.map((value) => ({
          value: String(value),
          label: px(value),
        })),
      },
    ],
  ],
  [
    'Lines and labels',
    [
      {
        axis: 'controlBorder',
        label: 'Control line',
        description: 'The line around a control: the thin line of the scale, or the thick one.',
        specimen: null,
        options: [
          { value: '1', label: 'Thin' },
          { value: '2', label: 'Thick' },
        ],
      },
      {
        axis: 'labelWeight',
        label: 'Label weight',
        description: 'The weight of every button, tab and control label.',
        specimen: null,
        labelStyle: 'font-weight',
        options: LABEL_WEIGHT_CHOICES.map((value) => ({
          value: String(value),
          label: { 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold' }[value],
          css: String(value),
        })),
      },
      {
        axis: 'labelSpacing',
        label: 'Letter-spacing',
        description: 'The tracking of every button, tab and control label.',
        specimen: null,
        labelStyle: 'letter-spacing',
        options: LABEL_SPACING_CHOICES.map((value) => ({
          value,
          label: { tight: 'Tight', normal: 'Normal', wide: 'Wide', wider: 'Wider' }[value],
          css: { tight: '-0.01em', normal: '0em', wide: '0.02em', wider: '0.05em' }[value],
        })),
      },
    ],
  ],
  [
    'Size',
    [
      {
        axis: 'controlText',
        label: 'Control text',
        description: 'Added to the theme’s control text, in every size and density.',
        specimen: null,
        options: CONTROL_TEXT_CHOICES.map((value) => ({
          value: String(value),
          label: signed(value),
        })),
      },
      {
        axis: 'controlHeight',
        label: 'Control height',
        description:
          'Added to the theme’s control height, in every size and density; never below 24 px.',
        specimen: null,
        options: CONTROL_HEIGHT_CHOICES.map((value) => ({
          value: String(value),
          label: signed(value),
        })),
      },
    ],
  ],
];

/**
 * The Controls of the appearance section: how fields, focus, buttons,
 * corners, lines, labels and sizes are drawn, each axis on its own and over
 * any theme. A choice is a candidate in the page's draft like every other
 * appearance choice, so the whole application is drawn in it before Save;
 * the builder compiles it at the level of the theme model it belongs to
 * (`custom-theme.ts`). A field, focus or button tile draws its style above
 * its label in the page's own colors; its "Theme" tile draws the theme's
 * own style.
 */
@Component({
  selector: 'app-controls-section',
  imports: [
    NgTemplateOutlet,
    SlButton,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlHeading,
    SlRadio,
    SlRadioGroup,
    SlStack,
    SlText,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    CHOICE_GRID,
    `
      /*
     * A Controls tile draws its style above its label, in a box of one height
     * for the whole group and with room around it for a focus mark: a field,
     * a focused control or a primary button, in the page's own colors and
     * corners, painted the way the option paints it.
     */
      .with-specimen {
        --_floor: 8rem;
      }
      .control-option {
        display: grid;
        gap: var(--slotted-space-4);
        justify-items: stretch;
      }
      .control-stage {
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        block-size: calc(var(--slotted-space-9) + 2 * var(--slotted-space-5));
        padding: var(--slotted-space-5) var(--slotted-space-4);
      }
      .control-specimen {
        display: flex;
        align-items: center;
        box-sizing: border-box;
        block-size: var(--slotted-space-9);
        font-family: var(--slotted-control-font-family);
        font-size: var(--slotted-font-size-sm);
        white-space: nowrap;
      }
      .control-specimen[data-kind='field'] {
        inline-size: 100%;
        padding-inline: var(--slotted-space-4);
        border: var(--slotted-control-border-width) solid var(--slotted-control-border-color);
        border-radius: var(--slotted-control-radius);
        background: var(--slotted-control-surface);
        color: var(--slotted-text-muted);
      }
      .control-specimen[data-kind='field'][data-style='filled'] {
        border-width: 0 0 var(--slotted-control-border-width);
        border-color: var(--slotted-text-muted);
        border-end-start-radius: 0;
        border-end-end-radius: 0;
        background: var(--slotted-tone-secondary-surface);
      }
      .control-specimen[data-kind='field'][data-style='underline'] {
        border-width: 0 0 var(--slotted-control-border-width);
        border-color: var(--slotted-border-strong);
        border-radius: 0;
        background: transparent;
      }
      .control-specimen[data-kind='field'][data-style='borderless'] {
        border-color: transparent;
        background: var(--slotted-tone-secondary-surface);
      }
      .control-specimen[data-kind='focus'] {
        inline-size: 70%;
        padding-inline: var(--slotted-space-4);
        border: var(--slotted-control-border-width) solid var(--slotted-control-border-color);
        border-radius: var(--slotted-control-radius);
        background: var(--slotted-control-surface);
        color: var(--slotted-text);
      }
      .control-specimen[data-kind='focus'][data-style='ring'] {
        outline: var(--slotted-border-width-thick) solid var(--slotted-focus-ring-color);
        outline-offset: var(--slotted-border-width-thick);
      }
      .control-specimen[data-kind='focus'][data-style='offset'] {
        outline: var(--slotted-border-width-thick) solid var(--slotted-focus-ring-color);
        outline-offset: calc(2 * var(--slotted-border-width-thick));
      }
      .control-specimen[data-kind='focus'][data-style='glow'] {
        border-color: var(--slotted-focus-ring-color);
        box-shadow:
          0 0 0 1px var(--slotted-focus-ring-color),
          0 0 0 4px color-mix(in oklab, var(--slotted-focus-ring-color) 28%, transparent);
      }
      .control-specimen[data-kind='focus'][data-style='underline'] {
        border-block-end-color: var(--slotted-focus-ring-color);
        box-shadow: inset 0 calc(-1 * var(--slotted-border-width-thick)) 0
          var(--slotted-focus-ring-color);
      }
      .control-specimen[data-kind='button'] {
        justify-content: center;
        padding-inline: var(--slotted-space-6);
        border: var(--slotted-control-border-width) solid transparent;
        border-radius: var(--slotted-control-radius);
        font-weight: var(--slotted-control-font-weight);
        letter-spacing: var(--slotted-control-letter-spacing);
      }
      .control-specimen[data-kind='button'][data-style='solid'] {
        background: var(--slotted-tone-accent-solid);
        color: var(--slotted-tone-accent-on-solid);
      }
      .control-specimen[data-kind='button'][data-style='soft'] {
        background: var(--slotted-tone-accent-surface);
        color: var(--slotted-tone-accent-text);
      }
      .control-specimen[data-kind='button'][data-style='outline'] {
        border-color: var(--slotted-tone-accent-border);
        color: var(--slotted-tone-accent-text);
      }
      .control-specimen[data-kind='button'][data-style='ghost'] {
        color: var(--slotted-tone-accent-text);
        text-decoration: underline;
        text-underline-offset: 0.2em;
      }
    `,
  ],
  template: `
    <div slStack [gap]="6" data-appearance-group="controls">
      <div class="group-head">
        <h3 slHeading size="md">Controls</h3>
        <button
          slButton
          type="button"
          size="sm"
          variant="outline"
          tone="secondary"
          data-reset-controls
          [disabled]="controlChanges() === 0"
          (click)="resetControls()"
        >
          Reset controls
        </button>
      </div>
      <p slText size="sm" tone="muted">
        How fields, focus, buttons, corners, lines and labels are drawn, each on its own and over
        any theme. Every change lands in the layer of the theme it belongs to — a control token, a
        family’s tokens, or a rule — and the anatomy below lists it.
      </p>
      @for (section of controlGroups; track section[0]) {
        <h4 slHeading size="sm">{{ section[0] }}</h4>
        @for (group of section[1]; track group.axis) {
          <div slField [attr.data-axis]="group.axis">
            <label slFieldLabel>{{ group.label }}</label>
            <span slFieldDescription>{{ group.description }}</span>
            <div
              slRadioGroup
              [name]="'axis-' + group.axis"
              variant="tile"
              [value]="axisValue(group.axis)"
              (valueChange)="chooseAxis(group.axis, $event.value)"
            >
              <div
                class="choices"
                [class.with-specimen]="group.specimen !== null"
                [style.--longest]="controlLongest[group.axis]"
              >
                <div slRadio value="theme">
                  <ng-container
                    *ngTemplateOutlet="
                      controlTile;
                      context: {
                        $implicit: group,
                        style: ownControl(group.axis),
                        label: 'Theme',
                        css: null,
                      }
                    "
                  />
                </div>
                @for (option of group.options; track option.value) {
                  <div slRadio [value]="option.value">
                    <ng-container
                      *ngTemplateOutlet="
                        controlTile;
                        context: {
                          $implicit: group,
                          style: option.value,
                          label: option.label,
                          css: option.css ?? null,
                        }
                      "
                    />
                  </div>
                }
              </div>
            </div>
          </div>
        }
      }

      <!-- A Controls tile: the style drawn above its label, or the label alone. -->
      <ng-template #controlTile let-group let-style="style" let-label="label" let-css="css">
        @if (group.specimen === null) {
          <span
            class="tile-label"
            [style.font-weight]="group.labelStyle === 'font-weight' ? css : null"
            [style.letter-spacing]="group.labelStyle === 'letter-spacing' ? css : null"
            >{{ label }}</span
          >
        } @else {
          <span class="control-option">
            <span class="control-stage" aria-hidden="true">
              <span
                class="control-specimen"
                [attr.data-kind]="group.specimen"
                [attr.data-style]="style"
                >{{ group.specimen === 'button' ? 'Save' : 'Acme Ltd' }}</span
              >
            </span>
            <span class="tile-label">{{ label }}</span>
          </span>
        }
      </ng-template>
    </div>
  `,
})
export class ControlsSection {
  readonly draft = input.required<UserPreferences>();
  readonly patch = output<Partial<UserPreferences>>();

  protected readonly controlGroups = CONTROL_GROUPS;
  /** Each Controls group's narrowest track, from its own longest label. */
  protected readonly controlLongest = Object.fromEntries(
    CONTROL_GROUPS.flatMap(([, groups]) => groups).map((group) => [
      group.axis,
      longest('Theme', ...group.options.map((option) => option.label)),
    ]),
  ) as Readonly<Record<string, number>>;

  /** How many Controls axes the draft sets. */
  protected readonly controlChanges = computed(
    () => CONTROL_AXES.filter((axis) => this.draft().customization[axis] !== null).length,
  );

  /** The theme's own input, focus or button style: what a Controls group's "Theme" tile draws. */
  protected ownControl(axis: CustomizationAxis): string | null {
    const controls = catalogueTheme(this.draft().theme).controls;
    return axis === 'input' || axis === 'focus' || axis === 'button' ? controls[axis] : null;
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
    this.patch.emit({ customization: next });
  }

  /** The Controls axes go back to the theme's own; every other change stays. */
  protected resetControls(): void {
    this.patch.emit({
      customization: {
        ...this.draft().customization,
        ...Object.fromEntries(CONTROL_AXES.map((axis) => [axis, null])),
      } as Customization,
    });
  }
}
