import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

export interface ConflictField {
  readonly label: string;
  readonly theirs: string;
  readonly mine: string | null;
}

/**
 * A version someone else moved past, answered field by field (FM-08): what is
 * stored now, what the form holds where the reader changed it too, and the two
 * ways out. No family shows two values of one field side by side, so the
 * panel is a `stack` of rows inside an `inline-message`, as on Customer 360
 * (CP-04).
 */
@Component({
  selector: 'app-conflict-panel',
  imports: [SlButton, SlInline, SlInlineMessage, SlInlineMessageIcon, SlStack, SlText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .row {
      display: grid;
      grid-template-columns: minmax(8rem, 1fr) 2fr;
      gap: var(--slotted-space-2) var(--slotted-space-4);
    }
  `,
  template: `
    <div slInlineMessage tone="warning" data-testid="conflict">
      <span slInlineMessageIcon></span>
      <div slStack [gap]="3">
        <span slText size="sm">{{ sentence() }} The page has been read again. Choose which version the {{ subject() }} keeps.</span>
        <div slStack [gap]="2">
          @for (field of fields(); track field.label) {
            <div class="row">
              <span slText size="sm" weight="medium">{{ field.label }}</span>
              <div slStack [gap]="1">
                <span slText size="sm">Now on the {{ subject() }}: {{ field.theirs }}</span>
                @if (field.mine !== null) {
                  <span slText size="sm">In your form: {{ field.mine }}</span>
                } @else {
                  <span slText size="sm" tone="muted">You did not change this field.</span>
                }
              </div>
            </div>
          }
        </div>
        <span slInline [gap]="3">
          <button slButton size="sm" type="button" [loading]="busy()" [messages]="{ loading: 'Saving' }" (click)="mine.emit()">
            Keep what I wrote
          </button>
          <button slButton size="sm" variant="outline" tone="secondary" type="button" (click)="theirs.emit()">
            Start from the {{ subject() }}
          </button>
        </span>
      </div>
    </div>
  `,
})
export class ConflictPanel {
  readonly fields = input.required<readonly ConflictField[]>();
  /** What the record is called in the sentence: "supplier", "purchase order". */
  readonly subject = input.required<string>();
  readonly busy = input(false);
  readonly mine = output<void>();
  readonly theirs = output<void>();

  sentence(): string {
    const count = this.fields().length;
    if (count === 0) return 'Someone else saved this record while the form was open, without changing a field you see.';
    return count === 1
      ? 'Someone changed one field while this form was open.'
      : `Someone changed ${count} fields while this form was open.`;
  }
}
