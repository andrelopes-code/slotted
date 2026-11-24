import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateMedia,
  SlResultStateTitle,
} from '@slotted/angular/result-state';

@Component({
  selector: 'app-result-state-media',
  imports: [
    SlButton,
    SlGlyph,
    SlIcon,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateMedia,
    SlResultStateTitle,
  ],
  template: `
    <section slResultState status="offline">
      <span slIcon slResultStateMedia><svg slGlyph name="cloud-off"></svg></span>
      <div slResultStateContent>
        <div slResultStateTitle>You are offline</div>
        <p slResultStateDescription>
          Scans are saved on this scanner and upload when the connection returns.
        </p>
      </div>
      <div slResultStateActions>
        <button slButton variant="outline">Check connection</button>
      </div>
    </section>
  `,
})
export class ResultStateMedia {}
