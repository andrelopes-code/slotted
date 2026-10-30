import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-button-tones',
  imports: [SlButton, SlInline, SlStack],
  template: `
    <div slStack [gap]="3">
      <div slInline [gap]="2">
        <button slButton>Create order</button>
        <button slButton tone="secondary">Export</button>
        <button slButton tone="success">Approve</button>
        <button slButton tone="warning">Hold shipment</button>
        <button slButton tone="danger">Void invoice</button>
      </div>
      <div slInline [gap]="2">
        <button slButton variant="outline">Create order</button>
        <button slButton tone="secondary" variant="outline">Export</button>
        <button slButton tone="success" variant="outline">Approve</button>
        <button slButton tone="warning" variant="outline">Hold shipment</button>
        <button slButton tone="danger" variant="outline">Void invoice</button>
      </div>
    </div>
  `,
})
export class ButtonTones {}
