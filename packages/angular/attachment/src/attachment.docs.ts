import attachmentTokens from '@slotted/styles/attachment/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_ATTACHMENT_TOKENS = attachmentTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Attachment decision',
}));

const imports: ReferenceImport = {
  source:
    "import { provideAttachmentDefaults, SlAttachment, SlAttachmentAction, SlAttachmentActions, SlAttachmentBody, SlAttachmentDetail, SlAttachmentFilename, SlAttachmentGroup, SlAttachmentMessage, SlAttachmentPreview, SlAttachmentProgress, SlAttachmentRemove, SlAttachmentTrigger } from '@slotted/angular/attachment';",
  selector:
    '[slAttachment], [slAttachmentGroup], [slAttachmentPreview], [slAttachmentBody], a[slAttachmentTrigger], button[slAttachmentTrigger], [slAttachmentFilename], [slAttachmentDetail], [slAttachmentMessage], [slAttachmentProgress], [slAttachmentActions], button[slAttachmentAction], a[slAttachmentAction], button[slAttachmentRemove]',
  exportAs:
    'slAttachment, slAttachmentGroup, slAttachmentPreview, slAttachmentBody, slAttachmentTrigger, slAttachmentFilename, slAttachmentDetail, slAttachmentMessage, slAttachmentProgress, slAttachmentActions, slAttachmentAction, slAttachmentRemove',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'li, or div alone',
    required: true,
    purpose:
      'The attachment. Carries data-ui="attachment", data-kind, data-size, data-orientation, data-invalid, data-loading, data-disabled and aria-busy, and handles Backspace and Delete when it is removable.',
  },
  {
    part: 'group',
    element: 'ul',
    required: false,
    purpose:
      'The set, as a native list with tabindex -1: a column, a wrapping grid or one scrolling line. It hands its size and orientation down and keeps focus when an attachment leaves.',
  },
  {
    part: 'preview',
    element: 'span',
    required: false,
    purpose:
      'The kind’s tile with the kind’s mark knocked out of it, or the thumbnail [src] names. A thumbnail that fails to load returns to the tile.',
  },
  {
    part: 'body',
    element: 'div',
    required: true,
    purpose: 'The text column, and the one box that shrinks so a long name truncates.',
  },
  {
    part: 'trigger',
    element: 'a or button',
    required: false,
    purpose:
      'The file’s target. Named by the file, described by the detail and the message, and stretched over the whole attachment by a transparent ::after.',
  },
  {
    part: 'filename',
    element: 'span',
    required: true,
    purpose:
      'The name as one run in its own direction: the trigger’s fallback content, or written on its own for a file that cannot be opened.',
  },
  {
    part: 'name',
    element: 'span',
    required: true,
    purpose: 'The stem, which shrinks to an ellipsis.',
  },
  {
    part: 'extension',
    element: 'span',
    required: false,
    purpose: 'The extension, which never shrinks, so the part that says what the file is stays.',
  },
  {
    part: 'detail',
    element: 'p',
    required: false,
    purpose:
      'One line under the name. With nothing projected it writes the size with formatBytes in the language in force.',
  },
  {
    part: 'message',
    element: 'p',
    required: false,
    purpose: 'Why the file failed, under the name; it wraps rather than truncating a reason.',
  },
  {
    part: 'progress',
    element: 'div',
    required: false,
    purpose:
      'The transfer, as the attachment’s bottom edge. Named by the file; indeterminate without a value.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'The application’s controls, beside the trigger and above its stretched target. On a card they stand on a plate over the picture.',
  },
  {
    part: 'action',
    element: 'button or a',
    required: false,
    purpose: 'One icon control of the application’s own: download, share, reply with.',
  },
  {
    part: 'remove',
    element: 'button',
    required: false,
    purpose:
      'Asks to take the attachment out of its list. Hidden unless the attachment is removable; named Remove and the file name.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One attachment with every input on the controls below the canvas. Point at it: the whole attachment answers, and the remove control answers on its own.',
    snippet: defineSnippet({
      id: 'attachment-angular-playground',
      language: 'angular',
      label: 'A file in a thread',
      source: `<li slAttachment [file]="file" removable (remove)="drop($event.file)">
  <span slAttachmentPreview></span>
  <div slAttachmentBody>
    <a slAttachmentTrigger [href]="file.url"></a>
    <p slAttachmentDetail></p>
  </div>
  <div slAttachmentActions><button slAttachmentRemove></button></div>
</li>`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, and a file with almost none',
    note: 'An absent part leaves no column behind: without a tile or actions the name takes the width they held. A file that cannot be opened writes its name without a trigger.',
    snippet: defineSnippet({
      id: 'attachment-angular-anatomy-scene',
      language: 'angular',
      label: 'A name and nothing else',
      source: `<div slAttachment [file]="{ name: 'telematics-export' }">
  <div slAttachmentBody>
    <span slAttachmentFilename></span>
    <p slAttachmentDetail>No preview available</p>
  </div>
</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Three sizes, one tile rule',
    note: 'The tile is the height of the two lines beside it — 40 pixels at md — so its edges meet the name’s cap and the detail’s foot. Density shrinks all three with the fields around them.',
    snippet: defineSnippet({
      id: 'attachment-angular-sizes',
      language: 'angular',
      label: 'The size step',
      source: `<div slAttachment [file]="file" size="sm"></div>`,
    }),
  },
  {
    id: 'orientation',
    title: 'A row, or a card stood on end',
    note: 'A card is three tiles wide — 120 pixels at md — with the picture square inside it. The actions move onto the picture on a plate of their own, and a card with no picture writes its extension under the mark.',
    snippet: defineSnippet({
      id: 'attachment-angular-orientation',
      language: 'angular',
      label: 'A photo as a card',
      source: `<li slAttachment [file]="photo" orientation="vertical" removable (remove)="drop(photo)">
  <span slAttachmentPreview [src]="photo.thumbnail"></span>
  <div slAttachmentBody>
    <button slAttachmentTrigger (click)="openViewer(photo)"></button>
    <p slAttachmentDetail></p>
  </div>
  <div slAttachmentActions><button slAttachmentRemove></button></div>
</li>`,
    }),
  },
  {
    id: 'layout',
    title: 'A column, a grid, a scrolling tray',
    note: 'The group is a native list. Grid rows share the width and never go narrower than a name; cards keep their own width so each is a whole pixel. The strip scrolls on one line and snaps to each attachment, and its ring never meets the clip.',
    snippet: defineSnippet({
      id: 'attachment-angular-layout',
      language: 'angular',
      label: 'The composer’s tray',
      source: `<ul slAttachmentGroup aria-label="Attached to your reply" layout="strip" size="sm">
  @for (file of files(); track file.name) {
    <li slAttachment [file]="file" removable (remove)="drop(file)">
      <span slAttachmentPreview></span>
      <div slAttachmentBody>
        <span slAttachmentFilename></span>
        <p slAttachmentDetail></p>
      </div>
      <div slAttachmentActions><button slAttachmentRemove></button></div>
    </li>
  }
</ul>`,
    }),
  },
  {
    id: 'kinds',
    title: 'Nine kinds, read before the name',
    note: 'The kind comes from the media type first and the extension second, and paints the tile from the scale upload uses, so a PDF is the same red in a reply as in the upload it came from. A thumbnail replaces the tile, and falls back to it if it fails.',
    snippet: defineSnippet({
      id: 'attachment-angular-kinds',
      language: 'angular',
      label: 'A record from the server needs only its name',
      source: `<div slAttachment [file]="{ name: 'repair-estimate.xlsx', size: 86000 }">
  <span slAttachmentPreview></span>
  <div slAttachmentBody>
    <span slAttachmentFilename></span>
    <p slAttachmentDetail></p>
  </div>
</div>`,
    }),
  },
  {
    id: 'trigger',
    title: 'A link, or a button that opens a viewer',
    note: 'On an a the trigger is a real anchor, so href, download and a modified click are the browser’s; on a button it is a real button for a viewer the page opens. Either one is the whole attachment’s target, and the ring goes round the attachment.',
    snippet: defineSnippet({
      id: 'attachment-angular-trigger',
      language: 'angular',
      label: 'Two elements, one target',
      source: `<a slAttachmentTrigger [href]="file.url"></a>
<button slAttachmentTrigger (click)="openViewer(file)"></button>`,
    }),
  },
  {
    id: 'actions',
    title: 'Actions beside the file, never inside it',
    note: 'slAttachmentAction is an inner control on the button or the a the page wrote: no frame at rest, a state layer on hover and a deeper one on press. The remove control is hidden unless the attachment is removable.',
    snippet: defineSnippet({
      id: 'attachment-angular-actions',
      language: 'angular',
      label: 'Download and remove',
      source: `<div slAttachmentActions>
  <a slAttachmentAction [href]="file.url" download [attr.aria-label]="'Download ' + file.name">
    <span slIcon><svg slGlyph name="external"></svg></span>
  </a>
  <button slAttachmentRemove></button>
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'Failed, sending, waiting, unavailable',
    note: 'A failed file tints its ground, doubles its edge and says why in a sentence the trigger names as its description; its tile keeps the kind. A sending file carries its bar as its bottom edge and refuses its trigger but not remove.',
    snippet: defineSnippet({
      id: 'attachment-angular-states',
      language: 'angular',
      label: 'A transfer the application runs',
      source: `<li slAttachment [file]="file" [loading]="percent() < 100" removable (remove)="cancel()">
  <span slAttachmentPreview></span>
  <div slAttachmentBody>
    <button slAttachmentTrigger></button>
    <p slAttachmentDetail>Uploading · {{ percent() }}%</p>
  </div>
  <div slAttachmentProgress [value]="percent()"></div>
  <div slAttachmentActions><button slAttachmentRemove></button></div>
</li>`,
    }),
  },
  {
    id: 'content',
    title: 'Names the family did not choose',
    note: 'The stem shrinks and the extension stays, so a sixty-character report still ends in .pdf; the whole name stays in the title. A name in Arabic keeps its own direction, and a name with no dot is one run.',
    snippet: defineSnippet({
      id: 'attachment-angular-content',
      language: 'angular',
      label: 'The long name',
      source: `<div slAttachment [file]="report"></div>`,
    }),
  },
  {
    id: 'composition',
    title: 'In a claim thread',
    note: 'A message carries its files the way the product would: the group under the text, links that download, one file still sending. provideAttachmentDefaults sets the size once for the application; the words and the locale come from provideSlotted.',
    snippet: defineSnippet({
      id: 'attachment-angular-composition',
      language: 'ts',
      label: 'One decision for the whole application',
      source: `bootstrapApplication(App, {
  providers: [provideAttachmentDefaults({ size: 'sm' })],
});`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Tab reaches every control; Delete asks',
    note: 'Tab reaches the trigger, each action and remove. Backspace or Delete anywhere in a removable attachment asks to remove it, a held key is ignored, and focus moves to the attachment that took its place, then the last one, then the list.',
    snippet: defineSnippet({
      id: 'attachment-angular-keyboard',
      language: 'angular',
      label: 'Removal that keeps the keyboard',
      source: `<li slAttachment [file]="file" removable (remove)="drop($event.file, $event.reason)"></li>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: '(remove)',
    payload: "{ reason: 'remove' | 'keyboard', file: AttachmentFile, source: Event }",
    when: 'The remove control was pressed, or Backspace or Delete arrived inside a removable attachment. A request: the list is the page’s, and nothing leaves until the page removes it. Not emitted while disabled, nor for a repeated key.',
  },
];

export const ANGULAR_ATTACHMENT_DOCS = {
  attachment: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        '[file]',
        '{ name: string; type?: string; size?: number }',
        '—',
        'slAttachment',
        'Required. A File already is one; a server record needs only the name',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slAttachment, slAttachmentGroup',
        'The room the attachment gets. Falls back to the group, then the token',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'slAttachment, slAttachmentGroup',
        'A row, or a card stood on end. Falls back to the group, then the token',
      ],
      [
        'layout',
        "'list' | 'grid' | 'strip'",
        'list',
        'slAttachmentGroup',
        'A column, a wrapping grid, or one line that scrolls',
      ],
      [
        'invalid',
        'boolean',
        'false',
        'slAttachment',
        'The file failed: tinted ground, doubled edge, and the message named as the trigger description',
      ],
      [
        'loading',
        'boolean',
        'false',
        'slAttachment',
        'aria-busy on the root and the trigger refused; remove stays operable',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slAttachment',
        'The trigger, every action and remove are refused',
      ],
      [
        'removable',
        'boolean',
        'false',
        'slAttachment',
        'Shows slAttachmentRemove and lets Backspace and Delete ask for removal',
      ],
      [
        'messages',
        'Partial<AttachmentMessages>',
        '—',
        'slAttachment',
        'Words laid over the language in force, key by key: the remove control name (remove, with the file name) and the tile word for a file without an extension (noExtension)',
      ],
      [
        'src',
        'string',
        '—',
        'slAttachmentPreview',
        'A thumbnail. Absent or failing, the kind tile is drawn',
      ],
      [
        'value',
        'number | null',
        'null',
        'slAttachmentProgress',
        'Per cent, 0 to 100; null draws the indeterminate bar',
      ],
      [
        'href / download',
        'string',
        '—',
        'a[slAttachmentTrigger], a[slAttachmentAction]',
        'The anchor own attributes, untouched',
      ],
    ]),
    composition: apiRows([
      [
        'provideAttachmentDefaults',
        '{ size, orientation, layout }',
        '—',
        'an injector',
        'Sets the three once; the group and the attachment still win',
      ],
      [
        'exportAs',
        'slAttachment and every part',
        '—',
        'template reference',
        '#attachment="slAttachment" reaches kind(), blocked() and request()',
      ],
      [
        'projected content',
        'ng-content',
        '—',
        'trigger, filename, detail, remove',
        'Replaces the name, the size or the cross the family draws by default',
      ],
      [
        'static attributes',
        'id, title, dir, type, aria-label, aria-describedby',
        '—',
        'every part',
        'Read with HostAttributeToken and kept; aria-describedby is joined, not replaced',
      ],
    ]),
    accessibility: [
      'The set is a native ul and each attachment an li, so a reader hears the count of files; an attachment alone goes on a div, because a list item outside a list is an error.',
      'The trigger is a real a or button whose accessible name is the file name and whose description is the detail and the message, so a failed file is heard as its name and then its reason.',
      'The trigger is stretched over the attachment by a transparent pseudo-element rather than wrapping it, because interactive content may not nest inside a or button; the actions are its siblings and sit above it.',
      'ARIA 1.2 deprecates aria-invalid and aria-disabled on listitem, so the three states are painted from data attributes on the root and carried by the controls: disabled on a button, aria-disabled on a link that keeps its destination.',
      'A refused link is refused by slAttachment in the capture phase, so the page’s own (click) on the trigger never runs while the file is loading or unavailable.',
      'Backspace and Delete ask to remove a removable attachment from wherever focus is inside it; a held key does not repeat the request, and a field inside the attachment keeps its editing keys.',
      'When an attachment leaves, focus goes to the control that took its place, then to the last one, then to the list, which holds tabindex -1 for that purpose.',
      'The progress bar is named by the file, so a reader hears the file and the percentage together, and without a value it is announced as indeterminate.',
    ],
    snippets: [
      defineSnippet({
        id: 'attachment-angular-anatomy',
        language: 'angular',
        label: 'Every part',
        source: `<ul slAttachmentGroup aria-label="Attachments">
  <li slAttachment [file]="file" removable (remove)="drop(file)">
    <span slAttachmentPreview [src]="file.thumbnail"></span>
    <div slAttachmentBody>
      <a slAttachmentTrigger [href]="file.url"></a>
      <p slAttachmentDetail></p>
    </div>
    <p slAttachmentMessage>{{ file.error }}</p>
    <div slAttachmentProgress [value]="file.percent"></div>
    <div slAttachmentActions>
      <button slAttachmentAction [attr.aria-label]="'Share ' + file.name">…</button>
      <button slAttachmentRemove></button>
    </div>
  </li>
</ul>`,
      }),
    ],
  },
} as const;
