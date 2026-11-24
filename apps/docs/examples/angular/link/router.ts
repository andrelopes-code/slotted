import { Component, computed, signal } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlLink } from '@slotted/angular/link';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-link-router',
  imports: [SlInline, SlLink, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <nav aria-label="Workspace">
        <div slInline [gap]="4">
          @for (view of views; track view.href) {
            <a
              slLink
              underline="hover"
              [attr.aria-current]="view.href === path() ? 'page' : null"
              [href]="view.href"
              (click)="navigate($event, view.href)"
              >{{ view.label }}</a
            >
          }
        </div>
      </nav>
      <span slText size="sm" tone="muted">Showing {{ label() }}.</span>
    </div>
  `,
})
export class LinkRouter {
  protected readonly views = [
    { href: '#orders', label: 'Orders' },
    { href: '#shipments', label: 'Shipments' },
    { href: '#returns', label: 'Returns' },
  ] as const;
  protected readonly path = signal<string>(this.views[0].href);
  protected readonly label = computed(
    () => this.views.find((view) => view.href === this.path())?.label,
  );

  protected navigate(event: Event, href: string) {
    event.preventDefault();
    this.path.set(href);
  }
}
