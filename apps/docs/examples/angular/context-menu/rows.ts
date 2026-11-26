import { Component, signal } from '@angular/core';
import { SlContextMenuTrigger } from '@slotted/angular/context-menu';
import { SlMenu, SlMenuItem, SlMenuSeparator } from '@slotted/angular/menu';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import type { ChangeRequest } from '@slotted/core/state';

@Component({
  selector: 'app-context-menu-rows',
  imports: [SlContextMenuTrigger, SlMenu, SlMenuItem, SlMenuSeparator, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <div [slContextMenuTriggerFor]="actions">
        <div slStack [gap]="3">
          @for (entry of files; track entry.name) {
            <p slText [attr.data-file]="entry.name">{{ entry.name }} · {{ entry.size }}</p>
          }
        </div>
      </div>
      <sl-menu
        #actions
        [aria-label]="file() ?? 'File actions'"
        (openChangeRequest)="remember($event)"
      >
        <button slMenuItem>Open</button>
        <button slMenuItem>Download</button>
        <hr slMenuSeparator />
        <button slMenuItem tone="danger">Move to trash</button>
      </sl-menu>
      <p slText size="sm" tone="muted">
        {{ file() === null ? 'Right-click a file.' : 'The menu acts on ' + file() + '.' }}
      </p>
    </div>
  `,
})
export class ContextMenuRows {
  protected readonly files = [
    { name: 'Supplier contract.docx', size: '180 KB' },
    { name: 'Stock count March.xlsx', size: '640 KB' },
    { name: 'Carrier rates 2026.pdf', size: '2.1 MB' },
  ];
  protected readonly file = signal<string | null>(null);

  protected remember(request: ChangeRequest<boolean>): void {
    if (request.value) this.file.set(this.fileOf(request.source));
  }

  private fileOf(source: unknown): string | null {
    const target = (source as Event | undefined)?.target;
    const row = target instanceof Element ? target.closest('[data-file]') : null;

    return row?.getAttribute('data-file') ?? null;
  }
}
