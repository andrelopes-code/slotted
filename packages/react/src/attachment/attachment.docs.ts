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

export const REACT_ATTACHMENT_TOKENS = attachmentTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Attachment decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Attachment, AttachmentAction, AttachmentActions, AttachmentBody, AttachmentDefaultsProvider, AttachmentDetail, AttachmentFilename, AttachmentGroup, AttachmentLink, AttachmentMessage, AttachmentPreview, AttachmentProgress, AttachmentRemove, AttachmentTrigger } from '@slotted/react';",
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
      'The set, as a native list with tabIndex -1: a column, a wrapping grid or one scrolling line. It hands its size and orientation down and keeps focus when an attachment leaves.',
  },
  {
    part: 'preview',
    element: 'span',
    required: false,
    purpose:
      'The kind’s tile with the kind’s mark knocked out of it, or the thumbnail the page gives. A thumbnail that fails to load returns to the tile.',
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
      'The name as one run in its own direction. Rendered by the trigger when it has no children, or on its own for a file that cannot be opened.',
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
      'One line under the name. Absent children it writes the size with formatBytes in the language in force.',
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
    element: 'button',
    required: false,
    purpose: 'One icon control of the application’s own: download, share, reply with.',
  },
  {
    part: 'remove',
    element: 'button',
    required: false,
    purpose:
      'Asks to take the attachment out of its list. Rendered only when onRemove is present; named Remove and the file name.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One attachment with every axis on the controls below the canvas. Point at it: the whole attachment answers, and the remove control answers on its own.',
    snippet: defineSnippet({
      id: 'attachment-react-playground',
      language: 'tsx',
      label: 'A file in a thread',
      source: `<Attachment file={file} onRemove={remove}>
  <AttachmentPreview />
  <AttachmentBody>
    <AttachmentLink href={file.url} />
    <AttachmentDetail />
  </AttachmentBody>
  <AttachmentActions>
    <AttachmentRemove />
  </AttachmentActions>
</Attachment>;`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, and a file with almost none',
    note: 'An absent part leaves no column behind: without a tile or actions the name takes the width they held. A file that cannot be opened writes its name without a trigger.',
    snippet: defineSnippet({
      id: 'attachment-react-anatomy-scene',
      language: 'tsx',
      label: 'A name and nothing else',
      source: `<Attachment file={{ name: 'telematics-export' }}>
  <AttachmentBody>
    <AttachmentFilename />
    <AttachmentDetail>No preview available</AttachmentDetail>
  </AttachmentBody>
</Attachment>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Three sizes, one tile rule',
    note: 'The tile is the height of the two lines beside it — 40 pixels at md — so its edges meet the name’s cap and the detail’s foot. Density shrinks all three with the fields around them.',
    snippet: defineSnippet({
      id: 'attachment-react-sizes',
      language: 'tsx',
      label: 'The size step',
      source: `<Attachment file={file} size="sm" />;`,
    }),
  },
  {
    id: 'orientation',
    title: 'A row, or a card stood on end',
    note: 'A card is three tiles wide — 120 pixels at md — with the picture square inside it. The actions move onto the picture on a plate of their own, and a card with no picture writes its extension under the mark.',
    snippet: defineSnippet({
      id: 'attachment-react-orientation',
      language: 'tsx',
      label: 'A photo as a card',
      source: `<Attachment file={photo} orientation="vertical" onRemove={remove}>
  <AttachmentPreview src={photo.thumbnail} />
  <AttachmentBody>
    <AttachmentTrigger onClick={() => openViewer(photo)} />
    <AttachmentDetail />
  </AttachmentBody>
  <AttachmentActions>
    <AttachmentRemove />
  </AttachmentActions>
</Attachment>;`,
    }),
  },
  {
    id: 'layout',
    title: 'A column, a grid, a scrolling tray',
    note: 'The group is a native list. Grid rows share the width and never go narrower than a name; cards keep their own width so each is a whole pixel. The strip scrolls on one line and snaps to each attachment, and its ring never meets the clip.',
    snippet: defineSnippet({
      id: 'attachment-react-layout',
      language: 'tsx',
      label: 'The composer’s tray',
      source: `<AttachmentGroup aria-label="Attached to your reply" layout="strip" size="sm">
  {files.map((file) => (
    <Attachment file={file} key={file.name} onRemove={remove}>
      <AttachmentPreview />
      <AttachmentBody>
        <AttachmentFilename />
        <AttachmentDetail />
      </AttachmentBody>
      <AttachmentActions>
        <AttachmentRemove />
      </AttachmentActions>
    </Attachment>
  ))}
</AttachmentGroup>;`,
    }),
  },
  {
    id: 'kinds',
    title: 'Nine kinds, read before the name',
    note: 'The kind comes from the media type first and the extension second, and paints the tile from the scale upload uses, so a PDF is the same red in a reply as in the upload it came from. A thumbnail replaces the tile, and falls back to it if it fails.',
    snippet: defineSnippet({
      id: 'attachment-react-kinds',
      language: 'tsx',
      label: 'A record from the server needs only its name',
      source: `<Attachment file={{ name: 'repair-estimate.xlsx', size: 86_000 }}>
  <AttachmentPreview />
  <AttachmentBody>
    <AttachmentFilename />
    <AttachmentDetail />
  </AttachmentBody>
</Attachment>;`,
    }),
  },
  {
    id: 'trigger',
    title: 'A link, or a button that opens a viewer',
    note: 'AttachmentLink is a real anchor, so href, download and a modified click are the browser’s. AttachmentTrigger is a real button for a viewer the page opens. Either one is the whole attachment’s target, and the ring goes round the attachment.',
    snippet: defineSnippet({
      id: 'attachment-react-trigger',
      language: 'tsx',
      label: 'Two elements, one target',
      source: `<AttachmentLink href={file.url} />;
<AttachmentTrigger onClick={() => openViewer(file)} />;`,
    }),
  },
  {
    id: 'actions',
    title: 'Actions beside the file, never inside it',
    note: 'AttachmentAction is an inner control: no frame at rest, a state layer on hover and a deeper one on press. render puts it on an anchor with download. AttachmentRemove renders only when the attachment has onRemove.',
    snippet: defineSnippet({
      id: 'attachment-react-actions',
      language: 'tsx',
      label: 'Download and remove',
      source: `<AttachmentActions>
  <AttachmentAction
    aria-label={\`Download \${file.name}\`}
    render={({ disabled, type, ...props }) => <a {...props} download href={file.url} />}
  >
    <Icon>
      <DownloadIcon />
    </Icon>
  </AttachmentAction>
  <AttachmentRemove />
</AttachmentActions>;`,
    }),
  },
  {
    id: 'states',
    title: 'Failed, sending, waiting, unavailable',
    note: 'A failed file tints its ground, doubles its edge and says why in a sentence the trigger names as its description; its tile keeps the kind. A sending file carries its bar as its bottom edge and refuses its trigger but not remove.',
    snippet: defineSnippet({
      id: 'attachment-react-states',
      language: 'tsx',
      label: 'A transfer the application runs',
      source: `<Attachment file={file} loading={percent < 100} onRemove={cancel}>
  <AttachmentPreview />
  <AttachmentBody>
    <AttachmentTrigger />
    <AttachmentDetail>Uploading · {percent}%</AttachmentDetail>
  </AttachmentBody>
  <AttachmentProgress value={percent} />
  <AttachmentActions>
    <AttachmentRemove />
  </AttachmentActions>
</Attachment>;`,
    }),
  },
  {
    id: 'content',
    title: 'Names the family did not choose',
    note: 'The stem shrinks and the extension stays, so a sixty-character report still ends in .pdf; the whole name stays in the title. A name in Arabic keeps its own direction, and a name with no dot is one run.',
    snippet: defineSnippet({
      id: 'attachment-react-content',
      language: 'tsx',
      label: 'The long name',
      source: `<Attachment file={{ name: 'quarterly-loss-adjustment-report-consolidated-final-v7-signed.pdf' }} />;`,
    }),
  },
  {
    id: 'composition',
    title: 'In a claim thread',
    note: 'A message carries its files the way the product would: the group under the text, links that download, one file still sending. The provider sets the size once for the whole thread; the words come from the language in force.',
    snippet: defineSnippet({
      id: 'attachment-react-composition',
      language: 'tsx',
      label: 'One decision for the whole thread',
      source: `<AttachmentDefaultsProvider size="sm">
  <ClaimThread />
</AttachmentDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Tab reaches every control; Delete asks',
    note: 'Tab reaches the trigger, each action and remove. Backspace or Delete anywhere in a removable attachment asks to remove it, a held key is ignored, and focus moves to the attachment that took its place, then the last one, then the list.',
    snippet: defineSnippet({
      id: 'attachment-react-keyboard',
      language: 'tsx',
      label: 'Removal that keeps the keyboard',
      source: `<Attachment
  file={file}
  onRemove={({ reason }) => {
    setFiles((all) => all.filter((each) => each !== file));
    if (reason === 'keyboard') announce(\`\${file.name} removed\`);
  }}
/>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onRemove',
    payload: "{ reason: 'remove' | 'keyboard', file: AttachmentFile, source: SyntheticEvent }",
    when: 'The remove control was pressed, or Backspace or Delete arrived inside a removable attachment. A request: the list is the page’s, and nothing leaves until the page removes it. Not emitted while disabled, nor for a repeated key.',
  },
];

export const REACT_ATTACHMENT_DOCS = {
  attachment: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'file',
        '{ name: string; type?: string; size?: number }',
        '—',
        'Attachment',
        'The file. A File already is one; a server record needs only the name',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'Attachment, AttachmentGroup',
        'The room the attachment gets. Falls back to the group, then the provider',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'Attachment, AttachmentGroup',
        'A row, or a card stood on end. Falls back to the group, then the provider',
      ],
      [
        'layout',
        "'list' | 'grid' | 'strip'",
        'list',
        'AttachmentGroup',
        'A column, a wrapping grid, or one line that scrolls',
      ],
      [
        'invalid',
        'boolean',
        'false',
        'Attachment',
        'The file failed: tinted ground, doubled edge, and the message named as the trigger description',
      ],
      [
        'loading',
        'boolean',
        'false',
        'Attachment',
        'aria-busy on the root and the trigger refused; remove stays operable',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'Attachment',
        'The trigger, every action and remove are refused',
      ],
      [
        'onRemove',
        '(request) => void',
        '—',
        'Attachment',
        'Makes the attachment removable: AttachmentRemove renders and Backspace and Delete answer',
      ],
      [
        'messages',
        'Partial<AttachmentMessages>',
        '—',
        'Attachment',
        'Words laid over the language in force, key by key: the remove control name (remove, with the file name) and the tile word for a file without an extension (noExtension)',
      ],
      [
        'src',
        'string',
        '—',
        'AttachmentPreview',
        'A thumbnail. Absent or failing, the kind tile is drawn',
      ],
      [
        'href / download',
        'string',
        '—',
        'AttachmentLink',
        'The anchor own attributes; the platform follows and downloads',
      ],
      [
        'type',
        "'button' | 'submit' | 'reset'",
        'button',
        'AttachmentTrigger, AttachmentAction, AttachmentRemove',
        'The button own type',
      ],
      [
        'value',
        'number | null',
        'null',
        'AttachmentProgress',
        'Per cent, 0 to 100; null draws the indeterminate bar',
      ],
      [
        'children',
        'ReactNode',
        'the size',
        'AttachmentDetail',
        'Replaces the size with the page own line',
      ],
      [
        'children',
        'ReactNode',
        'the filename',
        'AttachmentTrigger, AttachmentLink',
        'Replaces the name the trigger renders',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part',
        'Renders the wiring into another element — a router link, an anchor with download',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'every part',
        'Reaches the native element; each part extends its own element props',
      ],
    ]),
    composition: apiRows([
      [
        'AttachmentDefaultsProvider',
        '{ size, orientation, layout }',
        '—',
        'a subtree',
        'Sets the three once; the group and the attachment still win',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part',
        'The consumer element receives data-part and the wiring; spread it',
      ],
      [
        'onKeyDown / onClick',
        'handler',
        '—',
        'root, remove',
        'Composed: the page handler runs first and preventDefault refuses the family behavior',
      ],
      [
        'aria-describedby',
        'string',
        '—',
        'AttachmentLink, AttachmentTrigger',
        'Joined with the detail and message ids rather than replaced',
      ],
    ]),
    accessibility: [
      'The set is a native ul and each attachment an li, so a reader hears the count of files; an attachment alone is a div, because a list item outside a list is an error.',
      'The trigger is a real a or button whose accessible name is the file name and whose description is the detail and the message, so a failed file is heard as its name and then its reason.',
      'The trigger is stretched over the attachment by a transparent pseudo-element rather than wrapping it, because interactive content may not nest inside a or button; the actions are its siblings and sit above it.',
      'ARIA 1.2 deprecates aria-invalid and aria-disabled on listitem, so the three states are painted from data attributes on the root and carried by the controls: disabled on a button, aria-disabled on a link that keeps its destination.',
      'The tile is aria-hidden: the name already says what the file is, and a thumbnail alt text would repeat it.',
      'Backspace and Delete ask to remove a removable attachment from wherever focus is inside it; a held key does not repeat the request, and a field inside the attachment keeps its editing keys.',
      'When an attachment leaves, focus goes to the control that took its place, then to the last one, then to the list, which holds tabIndex -1 for that purpose; nothing is lost to the document body.',
      'The progress bar is named by the file, so a reader hears the file and the percentage together, and without a value it is announced as indeterminate.',
      'A failed attachment doubles its edge as well as tinting its ground, because every tone surface is the page white in the high-contrast scheme.',
    ],
    snippets: [
      defineSnippet({
        id: 'attachment-react-anatomy',
        language: 'tsx',
        label: 'Every part',
        source:
          '<AttachmentGroup aria-label="Attachments">\n  <Attachment file={file} onRemove={remove}>\n    <AttachmentPreview src={file.thumbnail} />\n    <AttachmentBody>\n      <AttachmentLink href={file.url} />\n      <AttachmentDetail />\n    </AttachmentBody>\n    <AttachmentMessage>{file.error}</AttachmentMessage>\n    <AttachmentProgress value={file.percent} />\n    <AttachmentActions>\n      <AttachmentAction aria-label={`Share ${file.name}`}>{shareIcon}</AttachmentAction>\n      <AttachmentRemove />\n    </AttachmentActions>\n  </Attachment>\n</AttachmentGroup>;',
      }),
    ],
  },
} as const;
