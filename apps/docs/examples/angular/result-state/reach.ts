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
  selector: 'app-result-state-reach',
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
        <p slText size="sm" tone="muted">inline</p>
        <section slResultState reach="inline" status="no-results">
          <div slResultStateContent>
            <div slResultStateTitle>No rows match the filter</div>
          </div>
          <div slResultStateActions>
            <button slButton size="sm" variant="ghost">Clear filters</button>
          </div>
        </section>
      </div>

      <div slStack [gap]="1">
        <p slText size="sm" tone="muted">section</p>
        <section slResultState reach="section" status="empty">
          <div slResultStateContent>
            <div slResultStateTitle>No open invoices</div>
            <p slResultStateDescription>
              Invoices appear here when an order ships and stay until they are paid.
            </p>
          </div>
        </section>
      </div>

      <div slStack [gap]="1">
        <p slText size="sm" tone="muted">page</p>
        <section slResultState reach="page" status="not-found">
          <div slResultStateContent>
            <div slResultStateTitle>Page not found</div>
            <p slResultStateDescription>The page you opened does not exist or has moved.</p>
          </div>
          <div slResultStateActions>
            <button slButton>Go to the dashboard</button>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class ResultStateReach {}
