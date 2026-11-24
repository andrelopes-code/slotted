import { Component, signal } from '@angular/core';
import { SlCard, SlCardHeader, SlCardSelection } from '@slotted/angular/card';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-card-choice',
  imports: [SlCard, SlCardHeader, SlCardSelection, SlStack, SlText],
  template: `
    <div slStack role="radiogroup" aria-label="Delivery method" [gap]="3">
      @for (option of methods; track option.id) {
        <label slCard [disabled]="!option.available" [selected]="method() === option.id">
          <div slCardHeader>
            <span slCardSelection>
              <input
                name="delivery"
                type="radio"
                [checked]="method() === option.id"
                [disabled]="!option.available"
                [value]="option.id"
                (change)="method.set(option.id)"
              />
            </span>
            <span slText size="lg" weight="semibold">{{ option.name }}</span>
            <span slText size="sm" tone="muted">{{ option.note }}</span>
          </div>
        </label>
      }
    </div>
  `,
})
export class CardChoice {
  protected readonly method = signal('standard');

  protected readonly methods = [
    { id: 'standard', name: 'Standard', note: '5 to 7 days, free', available: true },
    { id: 'express', name: 'Express', note: '2 days, $12.00', available: true },
    { id: 'same-day', name: 'Same day', note: 'Not offered for this address', available: false },
  ];
}
