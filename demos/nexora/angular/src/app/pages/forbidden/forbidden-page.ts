import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlButtonLink } from '@slotted/angular/button';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';

@Component({
  selector: 'app-forbidden-page',
  imports: [
    RouterLink,
    SlButtonLink,
    SlPage,
    SlPageBody,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div slPage>
      <div slPageBody>
        <div slResultState status="error" reach="page">
          <div slResultStateContent>
            <h1 slResultStateTitle>You don't have access to this area</h1>
            <p slResultStateDescription>
              Your role is missing the <code>{{ permission() }}</code> permission. Ask an
              administrator, or switch persona from the demo panel.
            </p>
          </div>
          <div slResultStateActions>
            <a slButtonLink routerLink="/dashboard" variant="outline">Back to dashboard</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ForbiddenPage {
  readonly permission = input.required<string>();
}
