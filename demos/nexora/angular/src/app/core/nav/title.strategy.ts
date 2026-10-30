import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, type RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class NexoraTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    this.title.setTitle(page === undefined ? 'Nexora' : `${page} · Nexora`);
  }
}
