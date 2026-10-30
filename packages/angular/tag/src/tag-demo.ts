import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { SlText } from '../../typography/src/text';
import { SlTag } from './tag';
import { SlTagBody } from './tag-body';
import { SlTagGroup } from './tag-group';
import { SlTagRemove } from './tag-remove';
import { SlTagToggle } from './tag-toggle';

/** The frame the four reference pages share. */
export const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage">${body}</div>
  </section>`;

/** The artwork belongs to the consumer; these pages draw geometry, never a character. */
export const glyph = (path: string) =>
  `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}" /></svg>`;

export const GLYPH_CHECK = 'M20 6 9 17l-5-5';
export const GLYPH_TAG = 'M3 3h8l10 10-8 8L3 11zM7.5 7.5h.01';
export const GLYPH_CHEVRON = 'm6 9 6 6 6-6';

/**
 * A real list, because a removal that removes nothing demonstrates nothing.
 * The reviewer can press the X, press Backspace on a focused chip, and watch
 * where the keyboard lands when the last one goes.
 */
@Component({
  selector: 'sl-tag-removal-demo',
  standalone: true,
  imports: [SlTag, SlTagBody, SlTagGroup, SlTagRemove, SlText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="slotted-demo-stack">
      <div slTagGroup aria-label="Filtros ativos">
        @for (label of labels(); track label) {
          <span slTag removable (remove)="drop(label)">
            <span slTagBody>{{ label }}</span>
            <button slTagRemove></button>
          </span>
        }
      </div>
      <span slText tone="muted">
        @if (labels().length === 0) {
          The last tag left and focus stayed on the group: the next Tab continues from here.
        } @else {
          {{ labels().length }} filters. Backspace or Delete on a tag removes the same one the X
          removes.
        }
      </span>
      <button type="button" (click)="reset()">Repor</button>
    </div>
  `,
})
export class SlTagRemovalDemo {
  readonly labels = signal([
    'Aberto',
    'Prioridade alta',
    'Time de plataforma',
    'Vencendo em 7 dias',
  ]);

  drop(label: string) {
    this.labels.update((current) => current.filter((it) => it !== label));
  }

  reset() {
    this.labels.set(['Aberto', 'Prioridade alta']);
  }
}

/** The controlled set, which is the shape a filter bar actually has. */
@Component({
  selector: 'sl-tag-selection-demo',
  standalone: true,
  imports: [SlTag, SlTagGroup, SlTagToggle, SlText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="slotted-demo-stack">
      <div slTagGroup aria-label="Status">
        @for (facet of facets; track facet) {
          <span slTag tone="accent">
            <button
              slTagToggle
              [selected]="chosen().includes(facet)"
              (selectedChange)="choose(facet, $event.value)"
            >
              {{ facet }}
            </button>
          </span>
        }
      </div>
      <span slText tone="muted">
        {{ chosen().length === 0 ? 'No status chosen' : chosen().join(', ') }}
      </span>
    </div>
  `,
})
export class SlTagSelectionDemo {
  readonly facets = ['Open', 'In review', 'Blocked', 'Delivered'];
  readonly chosen = signal<readonly string[]>(['Open']);

  choose(facet: string, selected: boolean) {
    this.chosen.update((current) =>
      selected ? [...current, facet] : current.filter((it) => it !== facet),
    );
  }
}

/** A filter bar: values that leave, a facet that toggles, and a command to put them back. */
@Component({
  selector: 'sl-tag-filters-demo',
  standalone: true,
  imports: [SlTag, SlTagBody, SlTagGroup, SlTagRemove, SlTagToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div slTagGroup aria-label="Filtros ativos">
      @for (filter of filters(); track filter) {
        <span slTag size="sm" removable (remove)="drop(filter)">
          <span slTagBody>{{ filter }}</span>
          <button slTagRemove></button>
        </span>
      }
      <span slTag size="sm" tone="accent">
        <button slTagToggle [selected]="onlyMine()" (selectedChange)="onlyMine.set($event.value)">
          Somente meus
        </button>
      </span>
      <span slTag size="sm" variant="outline">
        <button slTagBody (click)="reset()">Repor</button>
      </span>
    </div>
  `,
})
export class SlTagFiltersDemo {
  private readonly initial = ['Aberto', 'Prioridade alta', 'Time de plataforma'];
  readonly filters = signal<readonly string[]>(this.initial);
  readonly onlyMine = signal(false);

  drop(filter: string) {
    this.filters.update((current) => current.filter((it) => it !== filter));
  }

  reset() {
    this.filters.set(this.initial);
  }
}

/** The overflow chip every surveyed group ships, composed from what this family has. */
@Component({
  selector: 'sl-tag-overflow-demo',
  standalone: true,
  imports: [SlTag, SlTagBody, SlTagGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div slTagGroup aria-label="Participantes">
      @for (person of shown(); track person) {
        <span slTag
          ><span slTagBody>{{ person }}</span></span
        >
      }
      @if (hidden() > 0) {
        <span slTag tone="accent" variant="outline">
          <button slTagBody (click)="all.set(true)">+{{ hidden() }}</button>
        </span>
      }
    </div>
  `,
})
export class SlTagOverflowDemo {
  private readonly people = [
    'Anna Reed',
    'Brian Shaw',
    'Cole Lane',
    'Dana Nunn',
    'Eva Price',
    'Frank Moss',
  ];
  readonly all = signal(false);
  readonly shown = () => (this.all() ? this.people : this.people.slice(0, 3));
  readonly hidden = () => this.people.length - this.shown().length;
}
