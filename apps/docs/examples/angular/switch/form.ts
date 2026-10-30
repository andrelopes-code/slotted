import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlSwitch } from '@slotted/angular/switch';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-switch-form',
  imports: [ReactiveFormsModule, SlButton, SlInline, SlStack, SlSwitch, SlText],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" (reset)="submitted.set(null)">
      <div slStack [gap]="4">
        <span slSwitch formControlName="dailySummary" labelPlacement="start">
          Daily sales summary
        </span>
        <span slSwitch formControlName="weeklyForecast" labelPlacement="start">
          Weekly demand forecast
        </span>
        <span slSwitch formControlName="supplierDelays" labelPlacement="start">
          Supplier delay report
        </span>
        <div slInline [gap]="3" align="center">
          <button slButton type="submit">Save</button>
          <button slButton type="reset" tone="secondary" variant="outline">Reset</button>
          @if (submitted(); as names) {
            <span slText size="sm" tone="muted">Submitted {{ names }}</span>
          }
        </div>
      </div>
    </form>
  `,
})
export class SwitchForm {
  protected readonly form = new FormGroup({
    dailySummary: new FormControl(true, { nonNullable: true }),
    weeklyForecast: new FormControl(false, { nonNullable: true }),
    supplierDelays: new FormControl(true, { nonNullable: true }),
  });
  protected readonly submitted = signal<string | null>(null);

  protected submit() {
    const names = Object.entries(this.form.getRawValue())
      .filter(([, on]) => on)
      .map(([name]) => name);
    this.submitted.set(names.length > 0 ? names.join(', ') : 'nothing');
  }
}
