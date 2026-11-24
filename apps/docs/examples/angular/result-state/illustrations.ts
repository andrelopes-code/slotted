import { Component } from '@angular/core';
import { SlGrid } from '@slotted/angular/grid';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateMedia,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-result-state-illustrations',
  imports: [
    SlGlyph,
    SlGrid,
    SlIcon,
    SlResultState,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateMedia,
    SlResultStateTitle,
    SlStack,
    SlText,
  ],
  template: `
    <div slGrid [columns]="2" [gap]="6" minItemWidth="xs">
      <div slStack [gap]="1">
        <p slText size="sm" tone="muted">tile</p>
        <section slResultState illustration="tile">
          <span slIcon slResultStateMedia><svg slGlyph name="bell"></svg></span>
          <div slResultStateContent>
            <div slResultStateTitle>No alerts configured</div>
            <p slResultStateDescription>Alerts tell you when stock runs low.</p>
          </div>
        </section>
      </div>

      <div slStack [gap]="1">
        <p slText size="sm" tone="muted">stack</p>
        <section slResultState illustration="stack">
          <span slIcon slResultStateMedia><svg slGlyph name="inbox"></svg></span>
          <div slResultStateContent>
            <div slResultStateTitle>Inbox is clear</div>
            <p slResultStateDescription>No supplier messages are waiting.</p>
          </div>
        </section>
      </div>

      <div slStack [gap]="1">
        <p slText size="sm" tone="muted">cards</p>
        <section slResultState illustration="cards">
          <span slIcon slResultStateMedia><svg slGlyph name="file-text"></svg></span>
          <div slResultStateContent>
            <div slResultStateTitle>No documents attached</div>
            <p slResultStateDescription>Attach packing slips or customs forms.</p>
          </div>
        </section>
      </div>

      <div slStack [gap]="1">
        <p slText size="sm" tone="muted">cards, no glyph</p>
        <section slResultState illustration="cards">
          <div slResultStateContent>
            <div slResultStateTitle>No rows to show</div>
            <p slResultStateDescription>Import a file to fill this table.</p>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class ResultStateIllustrations {}
