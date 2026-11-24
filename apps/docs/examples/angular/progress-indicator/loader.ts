import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlLoader } from '@slotted/angular/progress-indicator';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-progress-indicator-loader',
  imports: [SlInline, SlLoader, SlStack, SlText],
  template: `
    <div slStack align="start" [gap]="5">
      <div slLoader label="Signing you in"></div>
      <div slLoader contained label="Checking warehouse access" size="lg"></div>
      <div slInline align="center" [gap]="3">
        <div slLoader decorative size="sm"></div>
        <span slText size="sm">Importing contacts, 62% done.</span>
      </div>
    </div>
  `,
})
export class ProgressIndicatorLoader {}
