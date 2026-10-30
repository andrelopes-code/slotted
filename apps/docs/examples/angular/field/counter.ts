import { Component, computed, signal } from '@angular/core';
import {
  SlField,
  SlFieldCounter,
  SlFieldDescription,
  SlFieldHeader,
  SlFieldLabel,
} from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextarea } from '@slotted/angular/textarea';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

const MAX_TAGS = 5;

@Component({
  selector: 'app-field-counter',
  imports: [
    SlField,
    SlFieldCounter,
    SlFieldDescription,
    SlFieldHeader,
    SlFieldLabel,
    SlStack,
    SlTextarea,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Public description</label>
        <textarea
          slTextarea
          autoSize
          countMax="140"
          showCount
          defaultValue="Ships within two business days. Returns are free for thirty days."
        ></textarea>
      </div>
      <div slField [invalid]="over() ? true : undefined">
        <div slFieldHeader>
          <label slFieldLabel>Search tags</label>
          <span slFieldCounter [invalid]="over()">{{ count() }}/{{ max }} tags</span>
        </div>
        <div slTextField>
          <input slTextFieldInput [value]="tags()" (valueChange)="tags.set($event.value)" />
        </div>
        <span slFieldDescription>Separate tags with commas.</span>
      </div>
    </div>
  `,
})
export class FieldCounter {
  readonly max = MAX_TAGS;
  readonly tags = signal('tea, organic, fair trade');
  readonly count = computed(
    () =>
      this.tags()
        .split(',')
        .filter((tag) => tag.trim() !== '').length,
  );
  readonly over = computed(() => this.count() > MAX_TAGS);
}
