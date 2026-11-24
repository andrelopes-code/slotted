import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTag, SlTagBody, SlTagGroup, SlTagRemove } from '@slotted/angular/tag';
import type { TagRemoveReason, TagRemoveRequest } from '@slotted/angular/tag';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-tag-confirm',
  imports: [SlButton, SlInline, SlStack, SlTag, SlTagBody, SlTagGroup, SlTagRemove, SlText],
  template: `
    <div slStack [gap]="3">
      <div slTagGroup aria-label="Environments of the release rule">
        @if (!removed()) {
          <span slTag removable tone="danger" variant="outline" (remove)="ask($event)">
            <span slTagBody>Production</span>
            <button slTagRemove></button>
          </span>
        }
        <span slTag><span slTagBody>Staging</span></span>
      </div>

      @if (reason() !== null) {
        <div slStack [gap]="2">
          <p slText size="sm">Remove Production from this rule? Requested with {{ via() }}.</p>
          <div slInline [gap]="2">
            <button slButton type="button" (click)="confirm()">Remove</button>
            <button slButton variant="outline" type="button" (click)="reason.set(null)">
              Keep
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class TagConfirm {
  protected readonly reason = signal<TagRemoveReason | null>(null);
  protected readonly removed = signal(false);
  protected readonly via = computed(() =>
    this.reason() === 'keyboard' ? 'Backspace or Delete' : 'the remove control',
  );

  protected ask(request: TagRemoveRequest) {
    request.cancel();
    this.reason.set(request.reason);
  }

  protected confirm() {
    this.removed.set(true);
    this.reason.set(null);
  }
}
