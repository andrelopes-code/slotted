import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-checkbox-form',
  imports: [SlButton, SlCheckbox, SlFieldGroup, SlFieldGroupLegend, SlInline, SlStack, SlText],
  template: `
    <form (submit)="submit($event)" (reset)="saved.set(null)">
      <div slStack [gap]="4">
        <fieldset slFieldGroup>
          <legend slFieldGroupLegend>Reports emailed each morning</legend>
          <div slStack [gap]="2">
            <div slCheckbox name="reports" value="daily-sales" defaultChecked>Daily sales</div>
            <div slCheckbox name="reports" value="low-stock">Low stock</div>
            <div slCheckbox name="reports" value="payouts" defaultChecked>Payouts</div>
          </div>
        </fieldset>
        <div slInline [gap]="3" align="center">
          <button slButton type="submit">Save</button>
          <button slButton type="reset" variant="outline" tone="secondary">Reset</button>
        </div>
        <span slText size="sm" tone="muted" role="status">
          {{ saved() === null ? '' : 'Submitted reports: ' + saved() + '.' }}
        </span>
      </div>
    </form>
  `,
})
export class CheckboxForm {
  readonly saved = signal<string | null>(null);

  submit(event: SubmitEvent): void {
    event.preventDefault();
    const reports = new FormData(event.target as HTMLFormElement).getAll('reports');
    this.saved.set(reports.length === 0 ? 'none' : reports.join(', '));
  }
}
