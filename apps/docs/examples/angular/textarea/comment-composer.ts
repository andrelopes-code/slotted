import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTextarea } from '@slotted/angular/textarea';
import { SlText } from '@slotted/angular/typography';

interface Comment {
  id: number;
  author: string;
  time: string;
  body: string;
}

const THREAD: Comment[] = [
  {
    id: 1,
    author: 'Maria Anders',
    time: '09:12',
    body: 'The customer called: the pallet has to arrive before the store opens at 8:00.',
  },
  {
    id: 2,
    author: 'Thomas Hardy',
    time: '10:47',
    body: 'Booked with the early carrier. Tracking follows once the truck is loaded.',
  },
];

@Component({
  selector: 'app-textarea-comment-composer',
  imports: [SlButton, SlField, SlFieldLabel, SlInline, SlStack, SlTextarea, SlText],
  template: `
    <div slStack [gap]="6">
      <div slStack [gap]="4">
        @for (comment of comments(); track comment.id) {
          <div slStack [gap]="1">
            <div slInline [gap]="2" align="baseline">
              <span slText size="sm" weight="semibold">{{ comment.author }}</span>
              <span slText size="sm" tone="muted">{{ comment.time }}</span>
            </div>
            <span slText size="sm">{{ comment.body }}</span>
          </div>
        }
      </div>
      <form (submit)="submit($event)">
        <div slStack [gap]="3">
          <div slField>
            <label slFieldLabel>Comment on order 10248</label>
            <textarea
              slTextarea
              autoSize
              [rows]="2"
              [maxRows]="8"
              placeholder="Write an update for the team"
              [value]="draft()"
              (valueChange)="draft.set($event.value)"
            ></textarea>
          </div>
          <div slInline justify="end">
            <button slButton type="submit">Post comment</button>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class TextareaCommentComposer {
  readonly comments = signal(THREAD);
  readonly draft = signal('');

  submit(event: Event): void {
    event.preventDefault();
    const body = this.draft().trim();
    if (body === '') return;
    this.comments.update((current) => [
      ...current,
      { id: current.length + 1, author: 'You', time: 'Just now', body },
    ]);
    this.draft.set('');
  }
}
