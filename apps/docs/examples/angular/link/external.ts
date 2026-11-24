import { Component } from '@angular/core';
import { SlLink } from '@slotted/angular/link';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-link-external',
  imports: [SlLink, SlStack],
  template: `
    <div slStack [gap]="3">
      <a slLink external href="https://example.com/carriers/northwind-freight">
        Carrier tracking page
      </a>
      <a slLink href="https://example.com/status" target="_blank">Carrier service status</a>
      <a slLink external href="https://example.com/customs/guide" [messages]="newWindow">
        Customs documentation guide
      </a>
    </div>
  `,
})
export class LinkExternal {
  protected readonly newWindow = { externalHint: '(opens in a new window)' };
}
