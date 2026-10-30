import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A hexagon with three nodes joined at the centre: a nexus. Inherits `currentColor`. */
@Component({
  selector: 'app-brand-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[style.display]': '"inline-flex"' },
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M12 2.5 20.2 7.25v9.5L12 21.5 3.8 16.75v-9.5z" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 12 12 6.5M12 12l4.8 2.75M12 12l-4.8 2.75" />
      <circle cx="12" cy="6.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16.8" cy="14.75" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="7.2" cy="14.75" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  `,
})
export class BrandMark {
  readonly size = input<number | string>(24);
}
