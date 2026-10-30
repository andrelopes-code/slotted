import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';

const CARRIERS = ['UPS', 'FedEx', 'DHL', 'USPS', 'OnTrac', 'LaserShip'];

/** Stands in for a rate service that fails its first request and answers after. */
let outage = true;
function searchCarriers(query: string): Promise<string[]> {
  const needle = query.trim().toLowerCase();
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (outage) {
        outage = false;
        reject(new Error('The rate service did not answer.'));
        return;
      }
      resolve(CARRIERS.filter((carrier) => carrier.toLowerCase().includes(needle)));
    }, 500),
  );
}

@Component({
  selector: 'app-combobox-search-error',
  imports: [SlButton, SlCombobox, SlComboboxItem, SlField, SlFieldError, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="3">
      <div slField [invalid]="failed()">
        <label slFieldLabel>Carrier</label>
        <sl-combobox
          placeholder="Search carriers"
          [filter]="null"
          [inputValue]="query()"
          [loading]="loading()"
          [messages]="{ empty: failed() ? 'Rates are unavailable.' : 'No carrier by that name.' }"
          (inputValueChange)="type($event)"
        >
          @for (carrier of results(); track carrier) {
            <sl-combobox-item [value]="carrier" [label]="carrier" />
          }
        </sl-combobox>
        @if (failed()) {
          <span slFieldError>The rate service did not answer. Your text is kept.</span>
        }
      </div>
      @if (failed()) {
        <div>
          <button slButton size="sm" variant="outline" (click)="search(query())">Retry</button>
        </div>
      }
    </div>
  `,
})
export class ComboboxSearchError {
  protected readonly query = signal('');
  protected readonly results = signal<string[]>([]);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  private latest = 0;

  protected search(text: string) {
    const request = ++this.latest;
    this.loading.set(true);
    this.failed.set(false);
    searchCarriers(text).then(
      (found) => {
        if (request !== this.latest) return;
        this.results.set(found);
        this.loading.set(false);
      },
      () => {
        if (request !== this.latest) return;
        this.results.set([]);
        this.failed.set(true);
        this.loading.set(false);
      },
    );
  }

  protected type(text: string) {
    this.query.set(text);
    if (text.trim() !== '') this.search(text);
  }
}
