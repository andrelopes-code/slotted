import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-result-state-align',
  imports: [
    SlButton,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="8">
      <div slStack [gap]="1">
        <p slText size="sm" tone="muted">center</p>
        <section slResultState align="center">
          <div slResultStateContent>
            <div slResultStateTitle>No saved reports</div>
            <p slResultStateDescription>Save a report to run it again in one click.</p>
          </div>
          <div slResultStateActions>
            <button slButton>Save a report</button>
          </div>
        </section>
      </div>

      <div slStack [gap]="1">
        <p slText size="sm" tone="muted">start</p>
        <section slResultState align="start">
          <div slResultStateContent>
            <div slResultStateTitle>No saved reports</div>
            <p slResultStateDescription>Save a report to run it again in one click.</p>
          </div>
          <div slResultStateActions>
            <button slButton>Save a report</button>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class ResultStateAlign {}
