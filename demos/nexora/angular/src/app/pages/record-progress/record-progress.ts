import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

export type ProgressState = 'done' | 'current' | 'todo' | 'stopped';

export interface ProgressStep {
  readonly key: string;
  readonly label: string;
  readonly state: ProgressState;
  /** What the step is waiting on, said in the words the operator uses. */
  readonly detail?: string;
}

/**
 * Where a record stands in its cycle, as a row of steps (RP-06): the order,
 * the transfer and the cycle count each hand it their own steps and sentence.
 *
 * No family draws this: `stepper` walks a reader through a form they are
 * filling and carries no branch for a record that was stopped, `progress-
 * indicator` is one value between two ends, and `status-indicator` says one
 * state without the road behind it. So the element is the screen's own,
 * built from `inline`, `stack`, the typography family and the theme's tones
 * (CP-04, CP-05): one bar per step, the current one named, and a tone that
 * turns where the record stopped — the danger tone for a cancellation, the
 * warning tone for a hold.
 */
@Component({
  selector: 'app-record-progress',
  imports: [SlInline, SlStack, SlText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .track {
      display: flex;
      gap: var(--slotted-space-1);
      align-items: center;
    }
    .step {
      flex: 1 1 0;
      /* literal: the bar is a rule, and the theme has no token for a painted line's thickness */
      block-size: 3px;
      border-radius: var(--slotted-radius-full);
      background: var(--slotted-border-subtle);
      min-inline-size: var(--slotted-space-5);
    }
    .step[data-state='done'] {
      background: var(--slotted-tone-success-solid);
    }
    .step[data-state='current'] {
      background: var(--slotted-tone-accent-solid);
    }
    .step[data-state='stopped'] {
      background: var(--slotted-tone-danger-solid);
    }
    :host([data-stopped='warning']) .step[data-state='stopped'] {
      background: var(--slotted-tone-warning-solid);
    }
    /* On the record page the steps carry their words, so the track stands above them. */
    .labelled {
      display: grid;
      grid-template-columns: repeat(var(--_steps, 4), minmax(0, 1fr));
      gap: var(--slotted-space-2);
    }
    .labelled .step {
      min-inline-size: 0;
    }
    .cell {
      display: grid;
      gap: var(--slotted-space-2);
      align-content: start;
    }
    /* A label over its detail: the lines, and the one gap the stack puts between the two. */
    .words {
      min-block-size: calc(
        var(--_lines, 0) * var(--slotted-font-size-sm) * var(--slotted-line-height-sm) + var(--slotted-space-1)
      );
    }
    /* The lines a page reserves for the sentence while the record is read, kept once it has loaded, in the typography family's small text. */
    .sentence {
      align-items: start;
      min-block-size: calc(var(--_lines, 0) * var(--slotted-font-size-sm) * var(--slotted-line-height-sm));
    }
  `,
  template: `
    @if (compact()) {
      <span slStack [gap]="1">
        <span slText size="sm">{{ word() }}</span>
        <span class="track" role="presentation">
          @for (step of steps(); track step.key) {
            <span class="step" [attr.data-state]="step.state" [title]="step.label"></span>
          }
        </span>
      </span>
    } @else {
      <div slStack [gap]="3">
        <div class="labelled" [style.--_steps]="steps().length">
          @for (step of steps(); track step.key) {
            <div class="cell">
              <span class="step" [attr.data-state]="step.state"></span>
              <span slStack [gap]="1" class="words" [style.--_lines]="stepLines()">
                <span
                  slText
                  size="sm"
                  [weight]="
                    step.state === 'current' || step.state === 'stopped' ? 'medium' : 'regular'
                  "
                  [tone]="step.state === 'todo' ? 'muted' : 'default'"
                >
                  {{ step.label }}
                </span>
                @if (step.detail) {
                  <span slText size="sm" tone="muted">{{ step.detail }}</span>
                }
              </span>
            </div>
          }
        </div>
        <span slInline [gap]="2" class="sentence" [style.--_lines]="sentenceLines()">
          <span slText size="sm" tone="muted" data-testid="progress-sentence">{{ sentence() }}</span>
        </span>
      </div>
    }
  `,
  host: { '[attr.data-stopped]': 'stopped()' },
})
export class RecordProgress {
  readonly steps = input.required<readonly ProgressStep[]>();
  /** One sentence for what the record is waiting on, which is what the reader came for. */
  readonly sentence = input('');
  /** The state's word, drawn above the bars in a grid cell. */
  readonly word = input('');
  /** The tone a stopped step takes: the danger tone for a cancellation, the warning tone for a hold. */
  readonly stopped = input<'danger' | 'warning' | null>(null);
  /** In a grid cell the steps carry no words: the state above them says where they are. */
  readonly compact = input(false);
  /**
   * The lines the sentence takes at least: a page whose placeholder reserves
   * them keeps the same box when a shorter sentence lands (loading-states §3).
   */
  readonly sentenceLines = input(0);
  /** The lines a step's label and detail take at least, for the same reason. */
  readonly stepLines = input(0);
}
