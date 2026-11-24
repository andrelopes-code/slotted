import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTag, SlTagBody } from '@slotted/angular/tag';

@Component({
  selector: 'app-tag-sizes',
  imports: [SlInline, SlStack, SlTag, SlTagBody],
  template: `
    <div slStack [gap]="3">
      @for (shape of shapes; track shape) {
        <div slInline align="center" [gap]="2">
          @for (item of sizes; track item.size) {
            <span slTag tone="success" [shape]="shape" [size]="item.size">
              <span slTagBody>{{ item.label }}</span>
            </span>
          }
        </div>
      }
    </div>
  `,
})
export class TagSizes {
  protected readonly shapes = ['pill', 'square'] as const;
  protected readonly sizes = [
    { size: 'sm', label: 'Small' },
    { size: 'md', label: 'Medium' },
    { size: 'lg', label: 'Large' },
  ] as const;
}
