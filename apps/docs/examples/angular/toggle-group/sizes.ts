import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlToggleGroup, SlToggleGroupItem } from '@slotted/angular/toggle-group';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-toggle-group-sizes',
  imports: [SlStack, SlText, SlToggleGroup, SlToggleGroupItem],
  template: `
    <div slStack [gap]="5">
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">sm</p>
        <div slToggleGroup aria-label="Order sorting, small" size="sm" [defaultValue]="['newest']">
          <button slToggleGroupItem value="newest">Newest</button>
          <button slToggleGroupItem value="oldest">Oldest</button>
          <button slToggleGroupItem value="largest">Largest</button>
        </div>
      </div>
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">md</p>
        <div slToggleGroup aria-label="Order sorting, medium" size="md" [defaultValue]="['newest']">
          <button slToggleGroupItem value="newest">Newest</button>
          <button slToggleGroupItem value="oldest">Oldest</button>
          <button slToggleGroupItem value="largest">Largest</button>
        </div>
      </div>
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">lg</p>
        <div slToggleGroup aria-label="Order sorting, large" size="lg" [defaultValue]="['newest']">
          <button slToggleGroupItem value="newest">Newest</button>
          <button slToggleGroupItem value="oldest">Oldest</button>
          <button slToggleGroupItem value="largest">Largest</button>
        </div>
      </div>
    </div>
  `,
})
export class ToggleGroupSizes {}
