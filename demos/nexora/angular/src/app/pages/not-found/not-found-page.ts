import { ChangeDetectionStrategy, Component } from '@angular/core';
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
  selector: 'app-not-found-page',
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
        <div slResultState status="empty" reach="page">
          <div slResultStateContent>
            <h1 slResultStateTitle>Page not found</h1>
            <p slResultStateDescription>Nothing lives at this address.</p>
          </div>
          <div slResultStateActions>
            <a slButtonLink routerLink="/dashboard" variant="outline">Back to dashboard</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundPage {}
