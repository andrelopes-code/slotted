import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import {
  SlField,
  SlFieldAction,
  SlFieldHeader,
  SlFieldIndicator,
  SlFieldLabel,
} from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-field-header',
  imports: [
    SlBadge,
    SlField,
    SlFieldAction,
    SlFieldHeader,
    SlFieldIndicator,
    SlFieldLabel,
    SlStack,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <div slStack [gap]="5">
      <div slField required>
        <div slFieldHeader>
          <label slFieldLabel>Password</label>
          <a slFieldAction href="#reset-password">Forgot password?</a>
        </div>
        <div slTextField>
          <input slTextFieldInput type="password" autocomplete="current-password" />
        </div>
      </div>
      <div slField>
        <div slFieldHeader>
          <label slFieldLabel>Webhook URL</label>
          <span slFieldIndicator>
            <span slBadge size="sm" tone="accent" variant="soft">Beta</span>
          </span>
          <button slFieldAction>Send test event</button>
        </div>
        <div slTextField>
          <input
            slTextFieldInput
            type="url"
            defaultValue="https://hooks.northwind.example/orders"
          />
        </div>
      </div>
    </div>
  `,
})
export class FieldHeader {}
