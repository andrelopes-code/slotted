import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

export type LinkUnderline = 'always' | 'hover' | 'none';

/**
 * The hint carries a leading space inside the interpolated string rather than
 * in the template. Accessible name computation concatenates adjacent
 * alternatives without inserting one, and Angular strips a template's own
 * whitespace-only text node.
 */
@Component({
  selector: 'a[slLink]',
  standalone: true,
  template: `
    <ng-content></ng-content>
    @if (external()) {
      <span class="slotted-visually-hidden" data-part="external-hint">{{ hint() }}</span>
    }
  `,
  styleUrls: [
    '../../../styles/src/link/link.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-link',
    'data-slotted-component': 'link',
    'data-part': 'root',
    '[attr.data-underline]': 'underline()',
    '[attr.rel]': 'rel()',
    '[attr.target]': 'target()',
  },
})
export class SlLink {
  readonly external = input(false, { transform: booleanAttribute });
  readonly externalHint = input('(opens in a new tab)');
  readonly underline = input<LinkUnderline>('always');

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly own = {
    rel: this.element.getAttribute('rel'),
    target: this.element.getAttribute('target'),
  };

  readonly hint = computed(() => ` ${this.externalHint()}`);
  readonly rel = computed(() => this.own.rel ?? (this.external() ? 'noopener noreferrer' : null));
  readonly target = computed(() => this.own.target ?? (this.external() ? '_blank' : null));
}
