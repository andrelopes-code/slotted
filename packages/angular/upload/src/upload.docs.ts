import uploadTokens from '@slotted/styles/upload/tokens.json';
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

export const ANGULAR_UPLOAD_TOKENS = uploadTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Upload decision',
}));

const imports: ReferenceImport = {
  source:
    "import { provideUploadDefaults, SlUpload } from '@slotted/angular/upload';\nimport { createXhrUpload } from '@slotted/core/upload';",
  selector: 'div[slUpload]',
  exportAs: 'slUpload',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The family. Carries data-ui="upload", the variant, the layout, the size and every state it paints: data-disabled, data-readonly, data-invalid, data-required, data-loading while a transfer is running, data-complete once every file arrived, and data-dragging while a drag carrying files is over the document.',
  },
  {
    part: 'label',
    element: 'span',
    required: false,
    purpose:
      'The family’s own label, for an upload that stands on its own. It is not rendered inside a Field, which owns the label row for every control in this library.',
  },
  {
    part: 'description',
    element: 'p',
    required: false,
    purpose:
      'The guidance beside the region, and the input’s aria-describedby. It can be as long as the product needs, because the accessible name comes from the trigger rather than from every word in the box.',
  },
  {
    part: 'dropzone',
    element: 'div',
    required: false,
    purpose:
      'The drop region. Carries the drag handlers, the click that forwards to the trigger, data-drop-target while a drag it will take is overhead and data-drop-invalid while one it has already refused is. Absent in the button variant.',
  },
  {
    part: 'trigger',
    element: 'label',
    required: true,
    purpose:
      'The control the reader presses, and the accessible name of the input inside it. It is a label rather than a button so that activating it opens the picker natively, and so that nothing focusable is nested inside anything focusable.',
  },
  {
    part: 'input',
    element: 'input',
    required: true,
    purpose:
      'The native file control: the value, the picker, the name it submits under, accept, multiple, capture and webkitdirectory. Clipped rather than hidden, so it stays in the tab order and in the accessibility tree. It is the one part that cannot be substituted.',
  },
  {
    part: 'summary',
    element: 'div',
    required: false,
    purpose:
      'How far the whole queue has got, how much longer it has, and the control that acts on every row at once. Drawn only when the list holds more than one file, because for a single file the row says all of it.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose:
      'Removes every file, cancelling whatever is in flight. Absent when the family is read-only.',
  },
  {
    part: 'list',
    element: 'ul',
    required: false,
    purpose:
      'The selection. Bounded in rows by maxRows and scrolled by the platform past it, because four hundred rows is not a list a person reads.',
  },
  {
    part: 'item',
    element: 'li',
    required: false,
    purpose:
      'One file, as a grid of three columns and two rows: the chip, the body and the controls on the first, the message spanning the second. Carries data-status, which is one of the nine words the flow has.',
  },
  {
    part: 'body',
    element: 'div',
    required: false,
    purpose:
      'The column of a row that shrinks. It is the one part with min-inline-size: 0, which is what makes a long name truncate instead of pushing the controls off the end.',
  },
  {
    part: 'detail',
    element: 'div',
    required: false,
    purpose:
      'The second line: the size, then the word for what is happening. Everything secondary about a file is here rather than at the far end of its name, which is what let the column of sizes move with however many controls each row offered.',
  },
  {
    part: 'preview',
    element: 'span',
    required: false,
    purpose:
      'A thumbnail, or a solid tile in the kind’s color with the kind’s mark knocked out of it. Carries data-kind and data-extension; in the grid layout the tile also carries the extension in words.',
  },
  {
    part: 'filename',
    element: 'button or span',
    required: false,
    purpose:
      'The name and its extension as one bidi-isolated run, laid out in the name’s own direction. It is a button when the file can be previewed and a span when it cannot, so the affordance is present exactly when the action is.',
  },
  {
    part: 'name',
    element: 'span',
    required: false,
    purpose: 'The file’s name, shrinking to an ellipsis before the extension.',
  },
  {
    part: 'extension',
    element: 'span',
    required: false,
    purpose:
      'The last dot and what follows it, which does not shrink — so the part that says what the file is survives the truncation.',
  },
  {
    part: 'meta',
    element: 'span',
    required: false,
    purpose:
      'The size, formatted by Intl in the locale the family was given. In the field variant it is the whole of a single-file selection.',
  },
  {
    part: 'status',
    element: 'span',
    required: false,
    purpose:
      'The word for the row’s state, and the percentage while it is moving. A status said in color alone fails WCAG 2.2 SC 1.4.1, so it is a word first and a color second.',
  },
  {
    part: 'progress',
    element: 'div',
    required: false,
    purpose:
      'Where the composed SlProgressBar stands: the row’s own bottom edge, clipped by its corner radius. A row is therefore the same height waiting, sending or done, and progress reads straight down a list of nine.',
  },
  {
    part: 'actions',
    element: 'span',
    required: false,
    purpose:
      'The row’s controls, packed to the end. Which of them appear is decided by the row’s status.',
  },
  {
    part: 'start',
    element: 'button',
    required: false,
    purpose:
      'Sends a file that is ready, resumes one that is paused, or sends one the reader stopped.',
  },
  {
    part: 'pause',
    element: 'button',
    required: false,
    purpose:
      'Suspends the run. Drawn only when the running adapter declares pausable, because a pause control over a sender that cannot suspend is a control that lies.',
  },
  {
    part: 'retry',
    element: 'button',
    required: false,
    purpose: 'Sends the file again after a failure.',
  },
  {
    part: 'cancel',
    element: 'button',
    required: false,
    purpose:
      'Aborts the run through the adapter’s own AbortSignal and leaves the file in the list.',
  },
  {
    part: 'remove',
    element: 'button',
    required: false,
    purpose: 'Takes the file out of the list, cancelling its run first.',
  },
  {
    part: 'message',
    element: 'p',
    required: false,
    purpose:
      'The sentence about this row: why it was refused, or that it failed. The reason is the family’s and the words are the consumer’s.',
  },
  {
    part: 'viewer',
    element: 'div',
    required: false,
    purpose:
      'The full-screen surface a file is previewed on, inside a composed sl-dialog — which owns the layer, the scrim, the focus containment, the scroll lock and Escape. It is portalled to the end of the document, so it carries data-ui="upload" and the family’s size on itself.',
  },
  {
    part: 'viewerHeader',
    element: 'div',
    required: false,
    purpose: 'The file’s name, where it sits in the set, and the controls that act on the viewer.',
  },
  {
    part: 'viewerTitle',
    element: 'h2',
    required: false,
    purpose: 'The file’s name, and the viewer’s accessible name.',
  },
  {
    part: 'viewerMeta',
    element: 'span',
    required: false,
    purpose: 'The size, the kind, and which of how many the reader is looking at.',
  },
  {
    part: 'viewerActions',
    element: 'span',
    required: false,
    purpose:
      'The slot a consumer puts their own viewer controls in, beside the two the family ships.',
  },
  {
    part: 'viewerExternal',
    element: 'button',
    required: false,
    purpose:
      'Opens the file in a new tab, for a reader who wants the browser’s own full window — which is where a PDF is best read.',
  },
  {
    part: 'viewerClose',
    element: 'button',
    required: false,
    purpose: 'Closes the viewer and hands focus back to the name that opened it.',
  },
  {
    part: 'viewerPrevious',
    element: 'button',
    required: false,
    purpose:
      'The previous file the viewer can render. Files it cannot render are skipped rather than stopped on.',
  },
  {
    part: 'viewerNext',
    element: 'button',
    required: false,
    purpose: 'The next file the viewer can render.',
  },
  {
    part: 'viewerStage',
    element: 'div',
    required: false,
    purpose:
      'Where the file is rendered: an img, a video, an audio, or an iframe for a PDF and for text. A kind the browser cannot draw gets its own tile at the size of the stage and one sentence saying so.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Every axis on one upload, driven by the controls below the canvas. Drop a file on it, or press Browse files — nothing is sent here, because no adapter is given and a family without one selects and holds.',
    snippet: defineSnippet({
      id: 'upload-angular-playground',
      language: 'angular',
      label: 'The whole family on one element',
      source:
        '<div\n  accept="application/pdf,image/*"\n  description="PDF, JPEG or PNG, up to 10 MB each."\n  label="Supporting documents"\n  multiple\n  slUpload\n></div>',
    }),
  },
  {
    id: 'variants',
    title: 'The three shapes one family has',
    note: 'A drop region, a bare trigger and a control-height row. They are one axis rather than three families: the list, the summary and every per-row control below them are the same parts in all three, and only the region changes shape.',
    snippet: defineSnippet({
      id: 'upload-angular-variants',
      language: 'angular',
      label: 'dropzone, button, field',
      source:
        '<div multiple slUpload variant="dropzone"></div>\n<div slUpload variant="button"></div>\n<div slUpload variant="field"></div>',
    }),
  },
  {
    id: 'layout',
    title: 'A column of rows, or a wall of pictures',
    note: 'The same rows, arranged. An image set is read by looking rather than by reading, so the grid gives the preview the card, moves the controls onto the corner of the picture and puts the name underneath — and a file with no thumbnail shows its extension in words on the tile.',
    snippet: defineSnippet({
      id: 'upload-angular-layout',
      language: 'angular',
      label: 'The photographs of a claim',
      source:
        '<div accept="image/*" label="Photographs of the damage" layout="grid" multiple slUpload></div>',
    }),
  },
  {
    id: 'sizes',
    title: 'Three steps, and what moves with them',
    note: 'The trigger height, the type, the glyphs, the chip and the row’s controls all step together, because every one of them reads a control token the theme restates per density. The insets come from the space scale and do not move, which is the cost card and alert both accepted.',
    snippet: defineSnippet({
      id: 'upload-angular-sizes',
      language: 'angular',
      label: 'sm beside a dense table, lg on a page of its own',
      source:
        '<div size="sm" slUpload></div>\n<div size="md" slUpload></div>\n<div size="lg" slUpload></div>',
    }),
  },
  {
    id: 'restrictions',
    title: 'What is refused, and what the reader is told',
    note: 'Nine reasons, each with its own sentence. accept filters the picker’s dialog and nothing else, so the family applies it to a drop as well — otherwise the same region accepts by drop what it refuses by picker. A refused file stays in the list rather than vanishing, because silence leaves the reader hunting for a file that never appeared.',
    snippet: defineSnippet({
      id: 'upload-angular-restrictions',
      language: 'angular',
      label: 'Six limits, and the output that reports every refusal',
      source:
        '<div\n  (reject)="warn($event)"\n  [maxFiles]="10"\n  [maxSize]="10 * 1024 * 1024"\n  [maxTotalSize]="50 * 1024 * 1024"\n  [minSize]="1"\n  accept="application/pdf,image/*"\n  multiple\n  slUpload\n></div>',
    }),
  },
  {
    id: 'duplicates',
    title: 'The same file, twice',
    note: 'Identity is the name, the size and the modification time, and it is replaceable — because whether two files are the same file is a question about an application. reject refuses the second copy, allow keeps both, replace puts the new one in the old one’s place.',
    snippet: defineSnippet({
      id: 'upload-angular-duplicates',
      language: 'angular',
      label: 'The policy, and the identity it is decided by',
      source: '<div [fileKey]="byNameAndSize" duplicates="replace" multiple slUpload></div>',
    }),
  },
  {
    id: 'directory',
    title: 'A whole folder',
    note: 'webkitdirectory reaches the input untouched and every file keeps its webkitRelativePath. A folder dropped into a region that does not accept folders is refused with the directory reason rather than added as a zero-byte row with the folder’s name on it, which is what the surveyed implementations do.',
    snippet: defineSnippet({
      id: 'upload-angular-directory',
      language: 'angular',
      label: 'The scans of one case, as the reader filed them',
      source: '<div [maxFiles]="400" directory label="Scanned case file" multiple slUpload></div>',
    }),
  },
  {
    id: 'capture',
    title: 'Straight from the camera',
    note: 'capture is the platform’s own attribute and the family forwards it: on a phone the picker opens a camera rather than a file browser. Nothing here is implemented by the family, which is the point — an adjuster standing beside a car photographs it.',
    snippet: defineSnippet({
      id: 'upload-angular-capture',
      language: 'angular',
      label: 'The outward-facing camera',
      source:
        '<div accept="image/*" capture="environment" label="Photograph the damage" slUpload></div>',
    }),
  },
  {
    id: 'paste',
    title: 'Pasted rather than chosen',
    note: 'Focus the region and press ⌘V or Ctrl+V: a screenshot on the clipboard is a file, and it is the keyboard’s only route to one that is not on disk. It runs through the same rules a drop and a picker do.',
    snippet: defineSnippet({
      id: 'upload-angular-paste',
      language: 'angular',
      label: 'On by default, and refusable',
      source: '<div allowPaste label="Paste a screenshot" slUpload></div>',
    }),
  },
  {
    id: 'drag-verdict',
    title: 'The answer before the reader lets go',
    note: 'DataTransfer.items gives an item’s kind and its type during a drag, and neither its name nor its size. Three of the five rules are answerable then and two are not, so a certain refusal is painted and a possible one is never: teaching the reader that the red edge means nothing would be worse than saying nothing.',
    snippet: defineSnippet({
      id: 'upload-drag-verdict',
      language: 'css',
      label: 'The three facts a drag leaves in the DOM',
      source:
        "/* A drag carrying files is anywhere over the document. */\n[data-ui='upload'][data-dragging] {\n}\n\n/* It is over this region, and it will be taken. */\n[data-ui='upload'] [data-part='dropzone'][data-drop-target] {\n}\n\n/* It is over this region, and it has already been refused. */\n[data-ui='upload'] [data-part='dropzone'][data-drop-invalid] {\n}",
    }),
  },
  {
    id: 'transfer',
    title: 'Sending, with a real adapter',
    note: 'The family calls an adapter and reports what it says — it holds no URL, no method, no header and no credential. createXhrUpload is the one this library ships, and it is XMLHttpRequest rather than fetch because fetch reports no upload progress in any browser this library supports.',
    snippet: defineSnippet({
      id: 'upload-angular-transfer',
      language: 'ts',
      label: 'One sender for the whole application',
      source:
        "bootstrapApplication(App, {\n  providers: [\n    provideUploadDefaults({\n      adapter: createXhrUpload({\n        url: '/api/claims/CLM-2026-0914/attachments',\n        headers: () => ({ Authorization: `Bearer ${token()}` }),\n      }),\n    }),\n  ],\n});",
    }),
  },
  {
    id: 'manual-start',
    title: 'The reader decides when it goes',
    note: 'autoUpload off leaves every accepted file in ready with its own start control, for a form where the attachments should go with the submit rather than before it. Vaadin is the one surveyed implementation that ships the same switch.',
    snippet: defineSnippet({
      id: 'upload-angular-manual-start',
      language: 'angular',
      label: 'Held back, then sent all at once through exportAs',
      source:
        '<div #upload="slUpload" [autoUpload]="false" multiple slUpload></div>\n<button (click)="upload.upload()" type="button">Send the attachments</button>',
    }),
  },
  {
    id: 'queue',
    title: 'Nine files and three at a time',
    note: 'Uppy alone among the surveyed implementations limits how many transfers run at once; Ant Design and Vaadin start every file together, which is how twelve files on a slow uplink all stall at the same moment. What is waiting says queued, and the summary carries the count and the time left.',
    snippet: defineSnippet({
      id: 'upload-angular-queue',
      language: 'angular',
      label: 'The limit, and where the remaining time comes from',
      source: '<div [concurrency]="3" locale="pt-BR" multiple slUpload></div>',
    }),
  },
  {
    id: 'retry',
    title: 'When the server says no',
    note: 'A failed row keeps its place, says Failed and offers to try again. Automatic retry ships and is off: an upload is a POST, and a POST that succeeded on the server and failed on the response is duplicated by a retry — a second invoice, a second attachment. A library may not choose that for an application.',
    snippet: defineSnippet({
      id: 'upload-angular-retry',
      language: 'angular',
      label: 'Two attempts, backing off, for a sender you know is idempotent',
      source: '<div [retries]="2" [retryDelay]="1000" multiple slUpload></div>',
    }),
  },
  {
    id: 'pause',
    title: 'Suspending a transfer that can be suspended',
    note: 'The pause control is drawn only when the running adapter declares pausable, because one drawn over a sender that cannot suspend is a control that lies. An adapter that can suspend awaits context.whenResumed() between chunks; createXhrUpload cannot, and says so.',
    snippet: defineSnippet({
      id: 'upload-angular-pause',
      language: 'ts',
      label: 'The handshake, from the adapter’s side',
      source:
        'const resumable = {\n  pausable: true,\n  async send(file, { signal, progress, whenResumed }) {\n    for (const chunk of chunksOf(file)) {\n      await whenResumed();\n      await put(chunk, { signal });\n      progress(chunk.end, file.size);\n    }\n  },\n};',
    }),
  },
  {
    id: 'cancel',
    title: 'Stopping one, and taking one away',
    note: 'Two different actions, kept apart. Cancel aborts the run through the adapter’s own AbortSignal and leaves the file in the list so it can be sent again; remove aborts it and takes the row out. Every surveyed implementation collapses the two into one control and one red row.',
    snippet: defineSnippet({
      id: 'upload-angular-cancel',
      language: 'ts',
      label: 'What the adapter is handed, and what it does with it',
      source:
        "const adapter = {\n  async send(file, { signal }) {\n    // The platform's own cancellation: XMLHttpRequest aborts, fetch aborts,\n    // and a hand-written sender checks signal.aborted between chunks.\n    const response = await fetch('/attachments', { body: file, method: 'POST', signal });\n    if (!response.ok) throw new Error(String(response.status));\n    return response.json();\n  },\n};",
    }),
  },
  {
    id: 'stalled',
    title: 'A transfer that stops without failing',
    note: 'Vaadin has the word stalled in its i18n object and nothing that produces it. Here the runner marks a run stalled when no progress arrives inside stallAfter and clears it on the next byte, so a bar sitting at 43% has something to read beside it.',
    snippet: defineSnippet({
      id: 'upload-angular-stalled',
      language: 'angular',
      label: 'Ten seconds of silence is a stall',
      source: '<div [stallAfter]="10000" multiple slUpload></div>',
    }),
  },
  {
    id: 'previews',
    title: 'What the reader sees before they open anything',
    note: 'An image gets a thumbnail from an object URL the family creates and revokes; everything else gets its kind’s tile. §14 of the feature guide requires the revocation by name, and two of the nine surveyed implementations leave it to the consumer.',
    snippet: defineSnippet({
      id: 'upload-angular-previews',
      language: 'angular',
      label: 'On by default, and refusable for a list of contracts',
      source:
        '<div layout="grid" multiple preview="auto" slUpload></div>\n<div multiple preview="none" slUpload></div>',
    }),
  },
  {
    id: 'viewer',
    title: 'Opening a file without leaving the form',
    note: 'Click a file’s name. The viewer is a composed sl-dialog with the file rendered inside it — an img, a video, an audio, or an iframe for a PDF and for text — and arrow keys move through the set, skipping what it cannot draw. A preview that opened a new tab was the first answer and it lost the form the reader was filling in.',
    snippet: defineSnippet({
      id: 'upload-angular-viewer',
      language: 'angular',
      label: 'On by default; a page can open it itself',
      source:
        '<div [(viewing)]="openAttachment" multiple slUpload></div>\n<button (click)="openAttachment.set(key)" type="button">Open the police report</button>',
    }),
  },
  {
    id: 'kinds',
    title: 'Nine kinds, nine colors',
    note: 'A PDF red, a word-processed document blue, a spreadsheet green, a deck orange, a picture teal, a film indigo, a recording magenta, an archive amber. The colors are a scale of the theme’s rather than five tones stretched over nine kinds, because the tones hold no second blue and no indigo at all.',
    snippet: defineSnippet({
      id: 'upload-kinds',
      language: 'css',
      label: 'Retuning the palette in one place',
      source:
        ':root {\n  --slotted-upload-kind-pdf: #b3261e;\n  --slotted-upload-kind-document: #1a56db;\n  --slotted-upload-kind-spreadsheet: #0f7b3f;\n  --slotted-upload-kind-foreground: #ffffff;\n}',
    }),
  },
  {
    id: 'content',
    title: 'Names the family did not choose',
    note: 'A name two hundred characters long truncates in the middle so the extension survives; an Arabic name reads in its own direction inside a left-to-right page, because the name and its extension are one bidi-isolated run; and a refusal’s sentence wraps under the row without moving the chip or the controls.',
    snippet: defineSnippet({
      id: 'upload-angular-content',
      language: 'angular',
      label: 'Why the extension is a part of its own',
      source:
        '<span data-part="filename" dir="auto">\n  <span data-part="name">2026-09-14-northgate-motors-consolidated-repair…</span>\n  <span data-part="extension">.pdf</span>\n</span>',
    }),
  },
  {
    id: 'in-a-form',
    title: 'In the middle of a form',
    note: 'A field above owns the label, the necessity mark, the description and the error slot, so the upload draws none of its own — two labels on one control is what a form gets otherwise. And a form submitted while the bytes are still moving is refused, which none of the nine surveyed implementations answers.',
    snippet: defineSnippet({
      id: 'upload-angular-in-a-form',
      language: 'angular',
      label: 'ControlValueAccessor and Validator, in one element',
      source:
        '<div slField>\n  <label slFieldLabel>Proof of ownership</label>\n  <div [formControl]="proof" [minFiles]="1" slUpload variant="field"></div>\n</div>\n\n<!-- proof.errors is { uploadPending: true } while the bytes are moving. -->',
    }),
  },
  {
    id: 'states',
    title: 'Every state the contract declares',
    note: 'Disabled refuses the picker and the drop alike, because a drag is not routed through the input at all. Read-only keeps the list readable and takes every control away. Invalid retargets the focus ring to the danger color. Loading and complete are the queue’s own two, and they are on the root.',
    snippet: defineSnippet({
      id: 'upload-angular-states',
      language: 'angular',
      label: 'Four the form owns, two the queue does',
      source:
        '<div disabled slUpload></div>\n<div readOnly slUpload></div>\n<div invalid required slUpload></div>\n\n<!-- data-loading and data-complete are written by the queue, never by a prop. -->',
    }),
  },
  {
    id: 'keyboard',
    title: 'Everything, without a pointer',
    note: 'Tab reaches the trigger, then each row’s name and its controls in order. Enter and Space open the picker from the control and activate the button focus is on. Ctrl+V pastes. Inside the viewer, arrows move through the set, Home and End jump to its ends and Escape closes it back onto the name that opened it.',
    snippet: defineSnippet({
      id: 'upload-angular-keyboard',
      language: 'angular',
      label: 'Why drag and drop is never the only way in',
      source:
        '<!-- WCAG 2.2 SC 2.5.7: every action reachable by dragging is reachable by\n     a single pointer action that is not a drag. The trigger is that action. -->\n<div allowDrop label="Supporting documents" multiple slUpload></div>',
    }),
  },
  {
    id: 'composition',
    title: 'Substituting what the family draws',
    note: 'The directive attaches to the consumer’s own element, so the element is theirs and the identity, the axes and every state are written onto it. Projected content lands inside the root, and exportAs reaches the six actions a template cannot write.',
    snippet: defineSnippet({
      id: 'upload-angular-composition',
      language: 'angular',
      label: 'The element is the consumer’s; the behavior is the family’s',
      source:
        '<div #upload="slUpload" multiple slUpload>\n  <p>Documents are kept for seven years.</p>\n</div>\n\n<button (click)="upload.browse()" type="button">browse()</button>\n<button (click)="upload.retryAll()" type="button">retryAll()</button>\n<button (click)="upload.cancelAll()" type="button">cancelAll()</button>',
    }),
  },
  {
    id: 'defaults',
    title: 'Deciding once for the whole application',
    note: 'Where files go and how many run at once — set once in the injector rather than repeated on every form, which is how one of them ends up pointing somewhere else. An upload that states any of them itself still wins. What every control is called, what a refusal says and how the queue counts itself come from the language in force, and an upload lays its own messages over them.',
    snippet: defineSnippet({
      id: 'upload-angular-defaults',
      language: 'ts',
      label: 'The sender and the language for the application',
      source:
        "bootstrapApplication(App, {\n  providers: [\n    provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }),\n    provideUploadDefaults({ adapter, concurrency: 3 }),\n  ],\n});",
    }),
  },
  {
    id: 'adapter',
    title: 'Writing a sender of your own',
    note: 'The adapter is one function, or an object that also declares whether it can be paused. It is handed the file, an AbortSignal, a progress reporter and the pause handshake — which is everything a chunked or resumable sender needs from a control, and the reason chunking is not this family’s.',
    snippet: defineSnippet({
      id: 'upload-angular-adapter',
      language: 'ts',
      label: 'The whole contract',
      source:
        'type UploadAdapter = {\n  send(\n    file: File,\n    context: {\n      signal: AbortSignal;\n      progress(loaded: number, total?: number): void;\n      whenResumed(): Promise<void>;\n    },\n  ): Promise<unknown>;\n  pausable?: boolean;\n};',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'filesChange',
    payload: 'readonly UploadFile[]',
    when: 'The two-way binding’s own output, so [(files)] holds the selection. It fires after every movement: a pick, a drop, a paste, a removal, a clear, or the transfer reporting on a row.',
  },
  {
    name: 'filesRequest',
    payload: 'ChangeRequest<readonly UploadFile[]>',
    when: 'Before the selection moves, carrying the new value, the value it replaces, the reason — select, pointer, keyboard, remove, clear or programmatic — the originating event and cancel(). A two-way binding has one slot and can carry none of those.',
  },
  {
    name: 'viewingChange, viewingRequest',
    payload: 'string | null, ChangeRequest<string | null>',
    when: 'When the reader opens a file, moves to another, or closes the viewer. The reason says which: pointer, keyboard, escape, outsidePress, dismiss or programmatic.',
  },
  {
    name: 'reject',
    payload: 'readonly UploadFile[]',
    when: 'Once per selection that refused something, with the refused rows and their reasons. It fires before any message is written about them, because what to say is the consumer’s.',
  },
];

export const ANGULAR_UPLOAD_DOCS = {
  upload: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'files',
        'model<readonly UploadFile[]>',
        '[]',
        'div[slUpload]',
        'The selection, as a two-way binding. Each entry carries the file, its kind, its status, the bytes moved and the reason it was refused; `filesRequest` carries the reason a movement happened.',
      ],
      [
        'viewing',
        'model<string | null>',
        'null',
        'div[slUpload]',
        'The key of the file the viewer is open on, as a two-way binding',
      ],
      [
        'variant',
        "'dropzone' | 'button' | 'field'",
        'dropzone',
        'div[slUpload]',
        'Which of the three shapes the consolidation names is drawn',
      ],
      [
        'layout',
        "'list' | 'grid'",
        'list',
        'div[slUpload]',
        'A column of rows, or a wall of pictures',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'div[slUpload]',
        'The step every control measure in the family reads',
      ],
      [
        'preview',
        "'auto' | 'none'",
        'auto',
        'div[slUpload]',
        'Whether an image gets a thumbnail from an object URL the family revokes',
      ],
      [
        'view',
        "'auto' | 'none'",
        'auto',
        'div[slUpload]',
        'Whether a file the browser can render opens in the viewer from its own name',
      ],
      [
        'duplicates',
        "'reject' | 'allow' | 'replace'",
        'reject',
        'div[slUpload]',
        'What happens to a second copy of a file the list already holds',
      ],
      [
        'accept',
        'string',
        '—',
        'div[slUpload]',
        'The same syntax the attribute takes, applied to a drop as well as to the dialog',
      ],
      [
        'multiple',
        'boolean',
        'false',
        'div[slUpload]',
        'Whether more than one file may be held. Multiple appends; single replaces.',
      ],
      [
        'directory',
        'boolean',
        'false',
        'div[slUpload]',
        'Whether the picker chooses folders. Each file keeps its webkitRelativePath.',
      ],
      [
        'capture',
        "'user' | 'environment'",
        '—',
        'div[slUpload]',
        'Which camera the picker opens on a device that has one',
      ],
      [
        'maxFiles',
        'number',
        '—',
        'div[slUpload]',
        'How many files may be kept. The extras are reported, never truncated in silence.',
      ],
      [
        'minFiles',
        'number',
        '—',
        'div[slUpload]',
        'How many the form needs. Reported to Reactive Forms as minFiles.',
      ],
      ['maxSize', 'number', '—', 'div[slUpload]', 'The largest a single file may be, in bytes'],
      [
        'minSize',
        'number',
        '—',
        'div[slUpload]',
        'The smallest, in bytes. A zero-byte file is the common case it catches.',
      ],
      [
        'maxTotalSize',
        'number',
        '—',
        'div[slUpload]',
        'The largest the whole selection may be, in bytes',
      ],
      [
        'validate',
        '(file) => reason | null',
        '—',
        'div[slUpload]',
        'The consumer’s own rule, run after the family’s. It is fileValidator in the class, because Validator.validate is a method this directive already has.',
      ],
      [
        'transform',
        '(files) => files | Promise<files>',
        '—',
        'div[slUpload]',
        'Rewrites the selection before it is judged: compression, renaming, cropping',
      ],
      [
        'fileKey',
        '(file) => string',
        'name, size and lastModified',
        'div[slUpload]',
        'What makes two files the same file',
      ],
      [
        'adapter',
        'UploadAdapter | send',
        '—',
        'div[slUpload]',
        'What moves the bytes. Without one the family selects and holds.',
      ],
      [
        'autoUpload',
        'boolean',
        'true',
        'div[slUpload]',
        'Whether an accepted file is sent at once, or waits for the reader',
      ],
      ['concurrency', 'number', '3', 'div[slUpload]', 'How many transfers run at the same time'],
      [
        'retries',
        'number',
        '0',
        'div[slUpload]',
        'How many times a failure is sent again. Off, because a POST retried is a second record.',
      ],
      [
        'retryDelay',
        'number',
        '1000',
        'div[slUpload]',
        'The first backoff, doubled for each further attempt',
      ],
      [
        'stallAfter',
        'number',
        '10000',
        'div[slUpload]',
        'How long without a progress report before a running transfer is called stalled',
      ],
      [
        'maxRows',
        'number',
        '6',
        'div[slUpload]',
        'How many rows the list shows before the platform scrolls the rest. 0 is no bound.',
      ],
      [
        'clickToBrowse',
        'boolean',
        'true',
        'div[slUpload]',
        'Whether pressing the region opens the picker',
      ],
      ['allowDrop', 'boolean', 'true', 'div[slUpload]', 'Whether the region takes a drop'],
      [
        'allowPaste',
        'boolean',
        'true',
        'div[slUpload]',
        'Whether a file on the clipboard may be pasted into the region',
      ],
      [
        'preventDocumentDrop',
        'boolean',
        'true',
        'div[slUpload]',
        'Whether a file dropped beside the region is stopped from navigating the browser away',
      ],
      [
        'pendingBlocksSubmit',
        'boolean',
        'true',
        'div[slUpload]',
        'Whether a transfer still running makes the control invalid',
      ],
      [
        'locale',
        'string',
        'the language in force',
        'div[slUpload]',
        'BCP 47, for the size and the time left',
      ],
      [
        'label',
        'string',
        '—',
        'div[slUpload]',
        'The family’s own label, drawn only outside a field',
      ],
      [
        'description',
        'string',
        '—',
        'div[slUpload]',
        'The guidance, and the input’s aria-describedby',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'div[slUpload]',
        'Refuses the picker and the drop alike, because a drag is not routed through the input at all',
      ],
      [
        'readOnly',
        'boolean',
        'false',
        'div[slUpload]',
        'Keeps the list readable and takes every control away',
      ],
      [
        'invalid',
        'boolean',
        'false',
        'div[slUpload]',
        'Retargets the focus ring to the danger color and marks the region',
      ],
      [
        'required',
        'boolean',
        'false',
        'div[slUpload]',
        'Reaches the native input, so an empty selection is valueMissing before any of the family’s own rules run',
      ],
      ['name', 'string', '—', 'div[slUpload]', 'What the native input submits under'],
      [
        'messages',
        'Partial<UploadMessages>',
        '—',
        'div[slUpload]',
        'Words laid over the language in force, key by key: every control, the word for each status and each kind, the sentences about the queue (summary, selection, added, finished), and the sentence a refused file carries (rejection.*)',
      ],
    ]),
    composition: apiRows([
      [
        'provideUploadDefaults',
        'provider',
        '—',
        'any injector',
        'Sets the adapter, the limits and the behavior once for the application; the words come from provideSlotted',
      ],
      [
        'UPLOAD_DEFAULTS',
        'InjectionToken',
        '—',
        'any injector',
        'What the provider fills, for a page that wants to read what an upload here would do',
      ],
      [
        'exportAs="slUpload"',
        'template reference',
        '—',
        'div[slUpload]',
        'browse(), upload(), retryAll(), cancelAll() and setViewing() — what a template cannot write',
      ],
      [
        'ControlValueAccessor',
        'implemented',
        '—',
        'div[slUpload]',
        'formControl and ngModel hold the selection. writeValue accepts UploadFile[] or File[] and normalizes.',
      ],
      [
        'Validator',
        'implemented',
        '—',
        'div[slUpload]',
        'required, minFiles, maxFiles and uploadPending reach the form as errors, so a Reactive Form agrees with the DOM',
      ],
      [
        'ng-content',
        'projection',
        '—',
        'div[slUpload]',
        'Projected into the root, which is where an application puts its own note or its own control',
      ],
      [
        'createXhrUpload',
        '(options) => UploadAdapter',
        '—',
        '@slotted/core/upload',
        'The sender this library ships: url, method, headers, field name, credentials, and a parse of your own',
      ],
      [
        'SlProgressBar',
        'directive',
        '—',
        'composed by the row',
        'The bar on a row’s bottom edge. The family says where it stands and nothing about how it is drawn.',
      ],
    ]),
    accessibility: [
      'There is no upload, dropzone or drag-and-drop pattern in the WAI-ARIA Authoring Practices — the index at w3.org/WAI/ARIA/apg/patterns/ lists none of the three. The platform supplies the control and four sources settle the rest: the HTML file input, the APG Button Pattern for every per-row control, WCAG 2.2 SC 2.5.7 for the drag, and SC 4.1.3 for what is announced.',
      'The accessible name comes from a label around the trigger rather than around the whole region, so it is three words instead of every word in the box, and the guidance reaches the input as aria-describedby. The input itself is clipped rather than hidden: display:none and visibility:hidden take it out of the tab order and out of the accessibility tree, which is the whole reason the label pairing exists.',
      'Drag and drop is pointer-only and cannot be made otherwise. WCAG 2.2 SC 2.5.7 asks for a single-pointer alternative to every dragging action, and the trigger inside the region is it — a real control, in the tab order, that opens the picker with Enter or Space.',
      'A file arriving, being refused, failing or finishing is announced through packages/core/src/live-announcer, politely, without moving focus — WCAG 2.2 SC 4.1.3. Progress is never announced: a bar that speaks every event says nothing, and the number is on the row inside a progressbar a reader can inspect on demand.',
      'A status is a word before it is a color. Refused, Failed and Stopped are three different words for three different failures, because a reader looking at one red row cannot tell whether to try again, choose another file, or do nothing — and under forced colors the tint goes and only the word is left.',
      'The viewer is modal: focus is contained inside it, Escape closes it, and focus goes back to the name that opened it. A text frame carries sandbox with neither allow-scripts nor allow-same-origin, because an object URL inherits this document’s origin and a text/html file the reader dropped would otherwise run its own script against it. A PDF frame carries none: Chrome’s PDF viewer is blocked in a sandboxed frame, and the type is what makes the exception safe — an HTML document served as application/pdf runs no script there.',
      'A form submitted while the bytes are still moving is refused twice over: setCustomValidity on the control the reader can see, and { uploadPending: true } from Validator so a Reactive Form agrees with it. None of the nine surveyed implementations answers this at all.',
    ],
    snippets: [
      defineSnippet({
        id: 'upload-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div\n  data-ui="upload"\n  data-part="root"\n  data-variant="dropzone"\n  data-layout="list"\n  data-size="md"\n  data-loading=""\n>\n  <span data-part="label">Supporting documents</span>\n  <p data-part="description" id="slotted-upload-1-description">PDF, JPEG or PNG.</p>\n\n  <div data-part="dropzone" data-drop-target="">\n    Drop files here\n    <label data-part="trigger">\n      <input data-part="input" type="file" multiple />\n      Browse files\n    </label>\n  </div>\n\n  <div data-part="summary">\n    <span>2 of 3 uploaded · about 12 seconds left</span>\n    <button data-part="clear" type="button">Remove all</button>\n  </div>\n\n  <ul data-part="list">\n    <li data-part="item" data-status="uploading">\n      <span data-part="preview" data-kind="image" data-extension="JPG"></span>\n      <div data-part="body">\n        <button data-part="filename" dir="auto" type="button">\n          <span data-part="name">damage-front-quarter</span>\n          <span data-part="extension">.jpg</span>\n        </button>\n        <div data-part="detail">\n          <span data-part="meta">4.1 MB</span>\n          <span data-part="status">Uploading · 62%</span>\n        </div>\n      </div>\n      <span data-part="actions">\n        <button data-part="pause" type="button"></button>\n        <button data-part="cancel" type="button"></button>\n      </span>\n      <div data-part="progress"></div>\n    </li>\n  </ul>\n</div>',
      }),
      defineSnippet({
        id: 'upload-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='upload'] {\n  /* The region */\n  --slotted-upload-zone-padding-block: 2.5rem;\n  --slotted-upload-zone-border-color: var(--slotted-tone-accent-border);\n\n  /* One row */\n  --slotted-upload-item-radius: 8px;\n  --slotted-upload-preview-size: 40px;\n\n  /* The palette a file's kind is drawn in */\n  --slotted-upload-kind-pdf: #b3261e;\n  --slotted-upload-kind-foreground: #ffffff;\n}",
      }),
    ],
  },
};
