import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';

@Component({
  selector: 'app-result-state-basic',
  imports: [
    SlButton,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
  ],
  template: `
    <section slResultState>
      <div slResultStateContent>
        <div slResultStateTitle>No purchase orders yet</div>
        <p slResultStateDescription>
          Create the first order to start tracking what you buy from suppliers.
        </p>
      </div>
      <div slResultStateActions>
        <button slButton>Create purchase order</button>
      </div>
    </section>
  `,
})
export class ResultStateBasic {}
