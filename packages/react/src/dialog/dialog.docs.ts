import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import dialogTokens from '@slotted/styles/dialog/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_DIALOG_TOKENS = dialogTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Dialog decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Dialog, DialogBody, DialogClose, DialogContent, DialogDefaultsProvider, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@slotted/react';",
};

const alertImports: ReferenceImport = {
  source:
    "import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogIcon, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@slotted/react';",
};

const sharedAnatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, in a portal',
    required: true,
    purpose:
      'The layer, fixed over the viewport. It carries data-ui="dialog", one attribute per axis, data-open and data-loading, and a z-index of --slotted-z-index-overlay plus the depth of the layer stack, so a dialog opened over another sits above it. It is also the container that fullScreen="narrow" measures, so full screen follows the width of the layer rather than the width of the window.',
  },
  {
    part: 'trigger',
    element: 'button, or the element render returns',
    required: false,
    purpose:
      'The control that opens the dialog. It stays where it is written while the layer is rendered in a portal, and carries aria-haspopup, aria-expanded and aria-controls. A press on it does not count as a press outside the dialog. Rendered as a Button, the element keeps the button’s data-part="root".',
  },
  {
    part: 'backdrop',
    element: 'div',
    required: true,
    purpose:
      'The scrim behind the panel, painted from --slotted-scrim. It does not scroll. A non-modal dialog does not paint it and lets the pointer through to the page.',
  },
  {
    part: 'viewport',
    element: 'div',
    required: true,
    purpose:
      'The box that positions the panel and, with scroll="viewport", the box that scrolls. A panel taller than the layer aligns to the top edge, so its title stays on screen.',
  },
  {
    part: 'content',
    element: 'div',
    required: true,
    purpose:
      'The panel. It carries role="dialog" and, while modal, aria-modal="true". It is a grid of three rows, header, body and footer, and only the body row shrinks, so the actions stay on screen when the body is long. It draws no padding: DialogHeader, DialogBody and DialogFooter carry the panel inset. A layout that skips them reads --slotted-dialog-inset-inline and --slotted-dialog-inset-block, which the panel states, and a theme sets the inset with --slotted-dialog-padding-inline and --slotted-dialog-padding-block.',
  },
  {
    part: 'header',
    element: 'header, or the element render returns',
    required: false,
    purpose:
      'Three columns: the mark, the words and the corner buttons. A title that wraps makes the row taller and never pushes the close button off the line. Any other content written in the header, such as a badge, is placed in the words column under the description.',
  },
  {
    part: 'title',
    element: 'h2, or the element render returns',
    required: false,
    purpose:
      'The visible name of the dialog. The panel points aria-labelledby at it only while it is rendered.',
  },
  {
    part: 'description',
    element: 'p, or the element render returns',
    required: false,
    purpose:
      'The sentence that says what the dialog is for. The panel points aria-describedby at it only while it is rendered. It is optional in Dialog and required in AlertDialog.',
  },
  {
    part: 'body',
    element: 'div, or the element render returns',
    required: false,
    purpose:
      'The row that scrolls. It carries aria-busy while loading is set. Scrolling it to the end does not scroll the page behind a non-modal dialog.',
  },
  {
    part: 'footer',
    element: 'footer, or the element render returns',
    required: false,
    purpose:
      'The actions: a row aligned to the end that wraps when the buttons do not fit, on the sunken surface. Each row of the panel draws the rule above itself, so a panel without a body draws one rule, not two.',
  },
];

const anatomy: AnatomyRow[] = [
  ...sharedAnatomy,
  {
    part: 'close',
    element: 'button',
    required: false,
    purpose:
      'The ✕ button. Its target is at least 24 by 24 pixels. It closes the dialog with the reason dismiss, carrying its value as the result.',
  },
  {
    part: 'fullscreen',
    element: 'button',
    required: false,
    purpose:
      'The button that expands the panel to the whole layer and restores it, rendered by DialogHeader when fullscreenToggle is set. It sits before the close button, carries aria-pressed, and its mark shows what the next press does.',
  },
];

const alertAnatomy: AnatomyRow[] = [
  ...sharedAnatomy.map((row) =>
    row.part === 'content'
      ? {
          ...row,
          purpose: row.purpose.replace('role="dialog"', 'role="alertdialog"'),
        }
      : row.part === 'description'
        ? {
            ...row,
            required: true,
            purpose:
              'The sentence that says what is about to happen. Required: the alertdialog pattern makes aria-describedby mandatory, and AlertDialog throws an error when it is missing.',
          }
        : row,
  ),
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose:
      'The mark of the tone, drawn from a glyph, so the kind of decision does not depend on color alone. Under forced colors it is the only signal of the tone.',
  },
  {
    part: 'cancel',
    element: 'button',
    required: true,
    purpose:
      'The least destructive answer, and where focus lands when the dialog opens. It closes with the reason dismiss and the result "cancel". Rendered as a Button, the element keeps the button’s data-part="root".',
  },
  {
    part: 'action',
    element: 'button',
    required: true,
    purpose:
      'The action being confirmed. It closes with the reason submit and the result "confirm". Rendered as a Button, the element keeps the button’s data-part="root".',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A layer opened inside the scene rather than over the page. Press the trigger, then Tab: focus is contained, Escape closes, and focus returns to the button it came from.',
    snippet: defineSnippet({
      id: 'dialog-react-playground',
      language: 'tsx',
      label: 'A trigger, a panel and the actions',
      source: `<Dialog>
  <DialogTrigger>Edit project</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit project</DialogTitle>
      <DialogDescription>The name is visible to the whole space.</DialogDescription>
      <DialogClose />
    </DialogHeader>
    <DialogBody>
      <TextField aria-label="Name" defaultValue="Home page redesign" />
    </DialogBody>
    <DialogFooter>
      <Button variant="ghost" tone="secondary">
        Cancel
      </Button>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'How wide the panel is allowed to be',
    note: 'Five named steps rather than a pixel string, because a theme can retune a step and cannot retune width: 600px. full spends the whole layer minus its padding, for a dialog that is a document.',
    snippet: defineSnippet({
      id: 'dialog-react-sizes',
      language: 'tsx',
      label: 'sm through full',
      source: `<Dialog size="lg">
  <DialogTrigger>View the invoice</DialogTrigger>
  <DialogContent>…</DialogContent>
</Dialog>;`,
    }),
  },
  {
    id: 'placement',
    title: 'Where the panel sits in the layer',
    note: 'center is right for a panel whose height is settled; top is right for one that grows as the reader types, because a centerd panel moves under the cursor every time a line is added.',
    snippet: defineSnippet({
      id: 'dialog-react-placement',
      language: 'tsx',
      label: 'A panel that grows stays put',
      source: `<Dialog placement="top">
  <DialogTrigger>Write a comment</DialogTrigger>
  <DialogContent>…</DialogContent>
</Dialog>;`,
    }),
  },
  {
    id: 'scroll',
    title: 'What scrolls when the content is long',
    note: 'content bounds the panel to the layer and scrolls the body, so the actions stay on screen; viewport scrolls the whole panel, for content that is read rather than acted on. Radix and React Aria ship neither, and a footer past the fold is the default of following their examples.',
    snippet: defineSnippet({
      id: 'dialog-react-scroll',
      language: 'tsx',
      label: 'The body scrolls; the footer stays',
      source: `<Dialog scroll="content">
  <DialogTrigger>Terms of use</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Terms of use</DialogTitle>
    </DialogHeader>
    <DialogBody>{longText}</DialogBody>
    <DialogFooter>
      <Button>Accept</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;`,
    }),
  },
  {
    id: 'surface',
    title: 'The layer, around a box you painted',
    note: 'surface="plain" turns the family’s own paint off — no ground, no border, no radius, no shadow, no rows — and keeps the portal, the scrim, the containment and the dismissal policy. It is what a headless library ships by default, offered here as an axis rather than as the only shape.',
    snippet: defineSnippet({
      id: 'dialog-react-surface',
      language: 'tsx',
      label: 'A Card as the whole panel',
      source: `<Dialog surface="plain">
  <DialogTrigger>View the media</DialogTrigger>
  <DialogContent>
    <Card fill="elevated">
      <DialogTitle>A card, inside the layer</DialogTitle>
      <DialogDescription>The family paints nothing here.</DialogDescription>
    </Card>
  </DialogContent>
</Dialog>;`,
    }),
  },
  {
    id: 'fullScreen',
    title: 'Taking the whole layer on a narrow one',
    note: 'A container query at a literal breakpoint, not a viewport query: the layer answers its own inline size, so a dialog inside a named portal container is as narrow as that container rather than as the window.',
    snippet: defineSnippet({
      id: 'dialog-react-full-screen',
      language: 'tsx',
      label: 'narrow, never and always',
      source: `<Dialog fullScreen="always">
  <DialogTrigger>New invoice</DialogTrigger>
  <DialogContent>…</DialogContent>
</Dialog>;`,
    }),
  },
  {
    id: 'modal',
    title: 'A layer the page behind can still be used',
    note: 'modal={false} writes no aria-modal, makes nothing inert, locks no scroll and contains no focus. The APG warns that marking a dialog modal without doing all four has severe consequences for the readers who rely on the mark.',
    snippet: defineSnippet({
      id: 'dialog-react-modal',
      language: 'tsx',
      label: 'Non-modal, and honest about it',
      source: `<Dialog modal={false}>
  <DialogTrigger>Order details</DialogTrigger>
  <DialogContent>…</DialogContent>
</Dialog>;`,
    }),
  },
  {
    id: 'policy',
    title: 'Refusing a close, and refusing it once',
    note: 'Six ways to close and one request. A guard on onOpenChange covers Escape, an outside press, the close button and the imperative handle together; Radix reports the same policy through four callbacks.',
    snippet: defineSnippet({
      id: 'dialog-react-policy',
      language: 'tsx',
      label: 'One guard for every way out',
      source: `<Dialog
  open={open}
  onOpenChange={(next, request) => {
    if (!next && saving) return request.cancel();
    setOpen(next);
  }}
>
  …
</Dialog>;`,
    }),
  },
  {
    id: 'focus',
    title: 'Where focus goes, and where it comes back to',
    note: 'By default the first tabbable element, and the trigger again on close. initialFocus names another element — a search input, or the panel itself for content that has to be read before it is operated, which is the APG’s own note.',
    snippet: defineSnippet({
      id: 'dialog-react-focus',
      language: 'tsx',
      label: 'Naming the element focus lands on',
      source: `const search = useRef<HTMLInputElement>(null);

<Dialog initialFocus={search}>
  <DialogTrigger>Search</DialogTrigger>
  <DialogContent>
    <DialogBody>
      <TextField aria-label="Search" ref={search} />
    </DialogBody>
  </DialogContent>
</Dialog>;`,
    }),
  },
  {
    id: 'loading',
    title: 'Open before the content arrived',
    note: 'The body carries aria-busy and keeps a floor so the panel does not jump to size when the data lands. The header, the close button and Escape all stay operable: a loading dialog a reader cannot leave is the worse failure of the two.',
    snippet: defineSnippet({
      id: 'dialog-react-loading',
      language: 'tsx',
      label: 'Busy, and still closable',
      source: `<Dialog loading={invoice === undefined} defaultOpen>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Invoice 4471</DialogTitle>
      <DialogClose />
    </DialogHeader>
    <DialogBody>
      <Skeleton shape="text" />
    </DialogBody>
  </DialogContent>
</Dialog>;`,
    }),
  },
  {
    id: 'nested',
    title: 'A layer opened from a layer',
    note: 'Escape reaches the topmost one only, and a layer that refuses stops the request reaching the one beneath it. The depth comes from the single stack dismissable-layer keeps, so nothing here states a z-index.',
    snippet: defineSnippet({
      id: 'dialog-react-nested',
      language: 'tsx',
      label: 'A confirmation over a dialog',
      source: `<Dialog>
  <DialogTrigger>Billing</DialogTrigger>
  <DialogContent>
    <DialogBody>
      <AlertDialog>
        <DialogTrigger>Cancel subscription</DialogTrigger>
        <DialogContent>…</DialogContent>
      </AlertDialog>
    </DialogBody>
  </DialogContent>
</Dialog>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A ninety-character unbroken token in the title would widen a centerd panel past both edges of the layer at once; overflow-wrap and a zero minimum are the pair that answer it. Long German and right-to-left strings are in the same scene.',
    snippet: defineSnippet({
      id: 'dialog-react-content',
      language: 'tsx',
      label: 'A title with nowhere to break',
      source: `<DialogTitle>deployment-pipeline-eu-west-1-production-rollback-2026-09-04T01</DialogTitle>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Replacing a part, and reaching the instance',
    note: 'render substitutes the element of every part, which is how the trigger becomes a Button. The ref on Dialog is a handle with open, close and focus — the three actions a consumer cannot express declaratively.',
    snippet: defineSnippet({
      id: 'dialog-react-composition',
      language: 'tsx',
      label: 'The trigger is the consumer’s own button',
      source: `<DialogTrigger render={(props) => <Button {...props}>Edit project</Button>} />;`,
    }),
  },
  {
    id: 'layout',
    title: 'A layout of its own',
    note: 'DialogContent draws no padding: the header, the body and the footer carry the inset. A layout of its own — one field, a preview, a footer — reads --slotted-dialog-inset-inline and --slotted-dialog-inset-block, so it stands in the column the parts stand in.',
    snippet: defineSnippet({
      id: 'dialog-react-layout',
      language: 'tsx',
      label: 'One field, a preview and a footer, at the panel inset',
      source: `<DialogContent>
  <div
    style={{
      display: 'grid',
      gap: 'var(--slotted-space-5)',
      paddingBlock: 'var(--slotted-dialog-inset-block)',
      paddingInline: 'var(--slotted-dialog-inset-inline)',
    }}
  >
    <DialogTitle>Rename file</DialogTitle>
    <TextField aria-label="Name" defaultValue="report-q3.pdf" />
    <img alt="First page of report-q3.pdf" src={preview} />
  </div>
  <DialogFooter>
    <Button size="sm">Rename</Button>
  </DialogFooter>
</DialogContent>;`,
    }),
  },
  {
    id: 'form',
    title: 'A dialog that is a form',
    note: 'A dialog that edits a record submits with Enter from any field and with the footer’s submit. render makes the panel the form itself, so the header, the body and the footer stay its rows and keep its inset; a form written around them inside DialogContent keeps them too.',
    snippet: defineSnippet({
      id: 'dialog-react-form',
      language: 'tsx',
      label: 'The panel rendered as the form',
      source: `<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent
    render={(props) => (
      <form
        {...props}
        onSubmit={(event) => {
          event.preventDefault();
          save(new FormData(event.currentTarget));
          setOpen(false);
        }}
      />
    )}
  >
    <DialogHeader>
      <DialogTitle>Edit contact</DialogTitle>
      <DialogClose />
    </DialogHeader>
    <DialogBody>
      <TextField aria-label="Name" defaultValue="Ana Ribeiro" name="name" />
    </DialogBody>
    <DialogFooter>
      <Button type="submit">Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;`,
    }),
  },
  {
    id: 'defaults',
    title: 'Deciding once for the application',
    note: 'Eight decisions an application takes once instead of eight props on every dialog in a product. Angular Material is the only surveyed library with an equivalent, and a dialog that states one itself still wins.',
    snippet: defineSnippet({
      id: 'dialog-react-defaults',
      language: 'tsx',
      label: 'Eight decisions, taken once',
      source: `<DialogDefaultsProvider size="lg" placement="top" fullScreen="never">
  <App />
</DialogDefaultsProvider>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'The pattern’s table, and what it costs',
    note: 'Tab and Shift+Tab wrap inside the layer, Escape closes the topmost one, and the background is inert to the pointer and to the accessibility tree at once. All three are JavaScript here, because the platform’s dialog element is declined.',
    snippet: defineSnippet({
      id: 'dialog-react-accessibility',
      language: 'tsx',
      label: 'Reading the reason off the request',
      source: `<Dialog onOpenChange={(open, request) => report(request.reason, request.result)}>…</Dialog>;`,
    }),
  },
];

const alertScenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A confirmation opened inside the scene. Focus lands on the least destructive action, an outside press does nothing at all, and Escape answers because a member with a cancel action can always cancel.',
    snippet: defineSnippet({
      id: 'alert-dialog-react-playground',
      language: 'tsx',
      label: 'A question and two answers',
      source: `<AlertDialog>
  <DialogTrigger>Delete project</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <AlertDialogIcon />
      <DialogTitle>Delete this project?</DialogTitle>
      <DialogDescription>
        The project and its 42 documents leave for everyone. This cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <AlertDialogCancel
        render={(props) => <Button {...props} variant="outline" tone="secondary" />}
      >
        Keep project
      </AlertDialogCancel>
      <AlertDialogAction render={(props) => <Button {...props} tone="danger" />}>
        Delete project
      </AlertDialogAction>
    </DialogFooter>
  </DialogContent>
</AlertDialog>;`,
    }),
  },
  {
    id: 'tones',
    title: 'What kind of decision this is',
    note: 'Each tone carries its own mark, so the register survives a reader who cannot tell the colors apart and forced colors, where every tone ground becomes one system color and the silhouette is all that is left.',
    snippet: defineSnippet({
      id: 'alert-dialog-react-tones',
      language: 'tsx',
      label: 'danger, warning and the rest',
      source: `<AlertDialog tone="warning">
  <DialogTrigger>Leave without saving</DialogTrigger>
  <DialogContent>…</DialogContent>
</AlertDialog>;`,
    }),
  },
  {
    id: 'actions',
    title: 'Two controls, each saying what it does',
    note: 'Labels name the action rather than answering a question — “Delete project”, not “Yes”. The action closes with submit and the cancel with dismiss, so a consumer reading the reason knows which one the reader chose.',
    snippet: defineSnippet({
      id: 'alert-dialog-react-actions',
      language: 'tsx',
      label: 'Concrete labels, and the result each carries',
      source: `<DialogFooter>
  <AlertDialogCancel>Keep project</AlertDialogCancel>
  <AlertDialogAction value="deleted">Delete project</AlertDialogAction>
</DialogFooter>;`,
    }),
  },
  {
    id: 'policy',
    title: 'What can and cannot dismiss it',
    note: 'An outside press never closes an alert dialog, whatever the consumer asks for. Ark and React Aria make the role a prop, so setting role="alertdialog" and forgetting the policy ships a destructive confirmation a stray click dismisses.',
    snippet: defineSnippet({
      id: 'alert-dialog-react-policy',
      language: 'tsx',
      label: 'Escape, for a cancel that is not safe',
      source: `<AlertDialog escape="none">
  <DialogTrigger>End the migration</DialogTrigger>
  <DialogContent>…</DialogContent>
</AlertDialog>;`,
    }),
  },
  {
    id: 'focus',
    title: 'The safest thing under the reader’s hands',
    note: 'Focus lands on the cancel action rather than on the first tabbable element, which is what the APG advises for a step that is not easily reversible. It is a default of the member, not something a consumer remembers to set.',
    snippet: defineSnippet({
      id: 'alert-dialog-react-focus',
      language: 'tsx',
      label: 'Cancel first, by default',
      source: `<AlertDialog initialFocus="cancel">
  <DialogTrigger>Delete</DialogTrigger>
  <DialogContent>…</DialogContent>
</AlertDialog>;`,
    }),
  },
  {
    id: 'content',
    title: 'A confirmation that has more to say',
    note: 'A body between the header and the actions holds the list of what is about to go. The description stays the one sentence aria-describedby announces, so the reader hears the consequence before the detail.',
    snippet: defineSnippet({
      id: 'alert-dialog-react-content',
      language: 'tsx',
      label: 'Description, then the detail',
      source: `<DialogHeader>
  <AlertDialogIcon />
  <DialogTitle>Delete 3 documents?</DialogTitle>
  <DialogDescription>This cannot be undone.</DialogDescription>
</DialogHeader>;`,
    }),
  },
  {
    id: 'composition',
    title: 'The actions are the consumer’s own buttons',
    note: 'render hands each control every attribute the family wrote, so the danger button is the library’s Button with the family’s behavior on it — nothing is reimplemented and nothing is wrapped.',
    snippet: defineSnippet({
      id: 'alert-dialog-react-composition',
      language: 'tsx',
      label: 'A Button that also closes the layer',
      source: `<AlertDialogAction render={(props) => <Button {...props} tone="danger" />}>
  Delete project
</AlertDialogAction>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What the role changes, and what it does not',
    note: 'role="alertdialog" and a mandatory aria-describedby are the two things the pattern adds; the keyboard is the modal dialog’s. The trigger still says aria-haspopup="dialog", because the property has no alertdialog token.',
    snippet: defineSnippet({
      id: 'alert-dialog-react-accessibility',
      language: 'tsx',
      label: 'The description the pattern requires',
      source: `<DialogDescription>The project and its 42 documents leave for everyone.</DialogDescription>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: DialogChangeRequest)',
    when: 'Before the dialog opens or closes, whatever caused it. The request carries the new value, the previous value, the reason (pointer, keyboard, dismiss, escape, outsidePress, back, submit or programmatic), the result of the close, the originating event, and cancel(), which keeps the dialog as it is. One handler therefore guards the ✕, Escape, a press outside, the way back and the ref handle together.',
  },
  {
    name: 'onOpenChangeComplete',
    payload: '(open: boolean)',
    when: 'After the entrance or the exit has ended: true once the layer is settled open, false once it has left — the moment an application that renders the layer conditionally removes it, so the exit runs. A layer mounted open enters from its closed style, as one opened later does.',
  },
  {
    name: 'onFullscreenChange',
    payload: '(fullscreen: boolean, request: DialogFullscreenRequest)',
    when: 'Before the panel expands to the whole layer or is restored. The request carries the new value, the previous value, the reason (pointer, keyboard or programmatic), the originating event, and cancel(), which keeps the panel as it is.',
  },
  {
    name: 'onClick, onKeyDown and the other native events, on every part',
    payload: 'the element’s own event',
    when: 'Whenever the element fires them. Your handler runs before the dialog’s own, and calling preventDefault() in it cancels the dialog’s behavior, such as opening on a trigger press or closing on a close press.',
  },
];

const composition = apiRows([
  [
    'render',
    '(props) => ReactNode',
    '—',
    'every part',
    'Replaces the element a part renders and passes it every attribute the part writes. Use it to make the trigger, the cancel and the action a Button.',
  ],
  [
    'ref',
    'Ref<DialogHandle> on Dialog, Ref<HTMLElement> on every part',
    '—',
    'Dialog, AlertDialog, every part',
    'On a part, the element. On Dialog and AlertDialog, a handle with open(), close(result), focus() and content, the panel element once it is rendered.',
  ],
  [
    '--slotted-dialog-measure',
    'length',
    'from size',
    'the root part',
    'The maximum width of the panel, for a width the five sizes do not hold, such as a two-column form at 46rem. Set it with a style attribute on one dialog, with a rule for a region, or once in the theme. It takes precedence over size, and a step token takes precedence over it.',
  ],
  [
    '--slotted-dialog-measure-sm, -md, -lg, -xl',
    'length',
    'from size',
    'the root part',
    'The maximum width of one size step, read before --slotted-dialog-measure, so a theme widens one step and keeps the others.',
  ],
  [
    'container',
    'Element | null',
    '—',
    'Dialog, AlertDialog',
    'The element this dialog is rendered into, instead of the shared portal root. To change the portal root for the whole document, call setPortalContainer from @slotted/core/portal.',
  ],
  [
    'useDialog()',
    '() => DialogContextValue',
    '—',
    'inside Dialog or AlertDialog',
    'What the parts read: the open state, the ids, the resolved axes and close(reason, result). It throws outside Dialog and AlertDialog.',
  ],
  [
    'DialogDefaultsProvider',
    '{ size, placement, scroll, surface, mount, fullScreen, modal, escape, outsidePress, back }',
    '—',
    'a subtree',
    'Sets these ten values once for every dialog under it. A value set on one dialog takes precedence.',
  ],
]);

const accessibility = [
  'Dialog follows the WAI-ARIA dialog (modal) pattern. While a modal dialog is open, Tab and Shift+Tab move through the focusable elements inside it and wrap from the last to the first and back. Escape closes the topmost dialog only; a dialog that refuses the close keeps the Escape from reaching the dialog beneath it.',
  'The panel carries role="dialog", aria-labelledby pointing at the title and aria-describedby pointing at the description, each only while that part is rendered. An aria-label of your own on DialogContent replaces aria-labelledby.',
  'aria-modal="true" is written only while the dialog is modal. A modal dialog makes everything outside it inert, which removes the page from the accessibility tree and from the pointer, and locks the page scroll. modal={false} does none of this and writes no aria-modal.',
  'When the dialog opens, focus moves to its first focusable element, to the element initialFocus names, or to the panel itself with initialFocus="container", for content that is read before it is used. When it closes, focus returns to the element that had it when the dialog opened, or to the element finalFocus names. If that element has left the document, focus goes to its nearest ancestor still in the document.',
  'Containment, inertness and Escape are implemented in JavaScript rather than with the native dialog element, so every overlay of the library shares one stacking order: a select opened inside a dialog paints above it. Without JavaScript, there is no dialog.',
  'The close button’s target is at least 24 by 24 pixels, and its mark is drawn from a glyph, not a character.',
  'The panel has a border as well as a shadow, so its edge stays visible under forced colors, where shadows are removed and the scrim becomes opaque.',
];

const alertAccessibility = [
  'AlertDialog follows the WAI-ARIA alert dialog pattern: the modal dialog pattern with role="alertdialog" and a required description. The keyboard is the same: Tab and Shift+Tab wrap inside the panel, and Escape closes it.',
  'aria-describedby is required. AlertDialog throws an error when no DialogDescription is rendered, so a confirmation is never announced without the sentence that says what it does.',
  'Focus starts on AlertDialogCancel, the least destructive answer, as the pattern advises for a step that cannot be undone easily.',
  'A press outside never closes an alert dialog, and it is always modal. Escape closes it, which answers with the cancel; set escape="none" when cancelling is not safe either.',
  'There is no close part: the reader answers with the cancel or the action. Rendering DialogClose inside AlertDialog throws an error.',
  'The tone is carried by the icon’s shape as well as by its color, so it survives forced colors and readers who cannot tell the colors apart.',
];

const snippets = [
  defineSnippet({
    id: 'dialog-react-anatomy',
    language: 'tsx',
    label: 'Anatomy, as it reaches the DOM',
    source: `<div
  data-ui="dialog"
  data-part="root"
  data-size="md"
  data-placement="center"
  data-scroll="content"
  data-mount="active"
  data-full-screen="narrow"
  data-outside-press="close"
  data-modal
  data-open
>
  <div data-part="backdrop" />
  <div data-part="viewport">
    <div
      data-part="content"
      role="dialog"
      aria-modal="true"
      aria-labelledby="d-t"
      aria-describedby="d-d"
    >
      <header data-part="header">
        <h2 data-part="title" id="d-t">
          Edit project
        </h2>
        <p data-part="description" id="d-d">
          The name is visible to the whole space.
        </p>
        <button data-part="close" type="button" aria-label="Close" />
      </header>
      <div data-part="body">…</div>
      <footer data-part="footer">…</footer>
    </div>
  </div>
</div>;`,
  }),
  defineSnippet({
    id: 'dialog-theming',
    language: 'css',
    label: 'Retuning the family for an application',
    source: `[data-ui='dialog'] {
  /* The measure the five size steps do not hold. It wins over the step. */
  --slotted-dialog-measure: 46rem;
  --slotted-dialog-scrim: rgb(12 20 40 / 0.6);
  --slotted-dialog-radius: var(--slotted-radius-lg);
  --slotted-dialog-border-color: var(--slotted-border-subtle);
  --slotted-dialog-footer-surface: transparent;
}`,
  }),
];

const sharedApi: ApiTuple[] = [
  [
    'open',
    'boolean',
    '—',
    'Dialog, AlertDialog',
    'Whether the dialog is open. Passing it makes the state controlled: the dialog asks through onOpenChange and waits for the new value.',
  ],
  [
    'defaultOpen',
    'boolean',
    '—',
    'Dialog, AlertDialog',
    'Whether an uncontrolled dialog starts open. Read once.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg' | 'xl' | 'full'",
    'md',
    'Dialog, DialogDefaultsProvider',
    'The maximum width of the panel: 32rem, the form measure plus the panel padding (43rem by default), 48rem, 56rem, or the whole layer less its padding. For another width, set --slotted-dialog-measure, or --slotted-dialog-measure-sm, -md, -lg or -xl for one step.',
  ],
  [
    'placement',
    "'center' | 'top'",
    'center',
    'Dialog, AlertDialog, DialogDefaultsProvider',
    'Where the panel sits in the layer. Use top for content that grows while the reader types, so the panel does not move with each new line.',
  ],
  [
    'scroll',
    "'content' | 'viewport'",
    'content',
    'Dialog, AlertDialog, DialogDefaultsProvider',
    'What scrolls when the content is long. content keeps the panel inside the layer and scrolls the body, so the actions stay on screen; viewport lets the panel grow and scrolls the layer. With content, the layer still scrolls when the header and footer alone are taller than it.',
  ],
  [
    'mount',
    "'active' | 'lazy' | 'eager'",
    'active',
    'Dialog, AlertDialog, DialogDefaultsProvider',
    'When the layer is in the document. active renders it while open and removes it after the closing animation, lazy renders it on the first open and keeps it, eager renders it from the start and hides it with content-visibility and inert while closed.',
  ],
  [
    'escape',
    "'close' | 'none'",
    'close',
    'Dialog, AlertDialog, DialogDefaultsProvider',
    'Whether Escape asks the dialog to close. Escape reaches the topmost dialog only.',
  ],
  [
    'loading',
    'boolean',
    'false',
    'Dialog, AlertDialog',
    'Marks the body with aria-busy and gives it a minimum height while the content is on its way. The header, the close button and Escape stay available.',
  ],
  [
    'messages',
    'Partial<DialogMessages>',
    '—',
    'Dialog, AlertDialog',
    'Replaces words of the language in force, key by key: the accessible names of the close and full-screen buttons (close, fullScreen). An aria-label on DialogClose takes precedence.',
  ],
  [
    'initialFocus',
    "'first' | 'container' | 'cancel' | RefObject | false",
    'first',
    'Dialog',
    'Where focus goes when the dialog opens: the first focusable element, the panel itself (container), the cancel part, the element of a ref, or nowhere (false). Use container for content that is read before it is used, such as a list or a table.',
  ],
  [
    'finalFocus',
    'RefObject | false',
    '—',
    'Dialog, AlertDialog',
    'Where focus goes when the dialog closes. Unset, focus returns to the element that had it when the dialog opened, usually the trigger. false leaves focus where it is.',
  ],
  [
    'value',
    'string',
    '—',
    'DialogClose, AlertDialogCancel, AlertDialogAction',
    'The result this button closes the dialog with, read from request.result in onOpenChange. AlertDialogCancel defaults to "cancel" and AlertDialogAction to "confirm".',
  ],
];

export const REACT_DIALOG_DOCS = {
  dialog: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      ...sharedApi,
      [
        'modal',
        'boolean',
        'true',
        'Dialog, DialogDefaultsProvider',
        'Whether the page behind is inert, its scroll locked and focus kept inside the panel. false does none of this, paints no scrim, lets the pointer reach the page and writes no aria-modal.',
      ],
      [
        'outsidePress',
        "'close' | 'none'",
        'close',
        'Dialog, DialogDefaultsProvider',
        'Whether a press outside the panel asks the dialog to close. AlertDialog fixes it at none.',
      ],
      [
        'back',
        "'close' | 'none'",
        'close',
        'Dialog, DialogDefaultsProvider',
        'Whether the browser’s way back, a back button or a phone’s back gesture, closes a modal dialog instead of leaving the page. Each open modal dialog holds one close watcher where the browser has CloseWatcher, and adds one history entry elsewhere; the close request carries the reason back. A dialog opened without a press shares the way back with the layer opened before it.',
      ],
      [
        'surface',
        "'panel' | 'plain'",
        'panel',
        'Dialog, DialogDefaultsProvider',
        'Whether Dialog paints the panel. plain removes the background, border, radius, shadow, rows and padding, and keeps the portal, the scrim, focus handling and the dismissal policy, for a panel of your own such as a Card or an image viewer. A plain panel does not keep its footer on screen for a long body.',
      ],
      [
        'fullScreen',
        "'never' | 'narrow' | 'always'",
        'narrow',
        'Dialog, DialogDefaultsProvider',
        'When the panel fills the whole layer, without margins or radius. narrow does so while the layer is narrower than 480 pixels, measured with a container query on the layer.',
      ],
      [
        'fullscreenToggle',
        'boolean',
        'false',
        'Dialog',
        'Adds a button to the header that expands the panel to the whole layer and restores it, for content the reader wants more room for.',
      ],
      [
        'fullscreen',
        'boolean',
        '—',
        'Dialog',
        'Whether the panel is expanded by the toggle. Passing it makes the state controlled, with onFullscreenChange.',
      ],
      [
        'defaultFullscreen',
        'boolean',
        'false',
        'Dialog',
        'Whether an uncontrolled panel opens expanded. Read once.',
      ],
    ]),
    composition,
    accessibility,
    snippets,
  },
  alertDialog: {
    imports: alertImports,
    anatomy: alertAnatomy,
    scenes: alertScenes,
    events,
    api: apiRows([
      ...sharedApi.map((row) =>
        row[0] === 'size'
          ? ([
              'size',
              "'sm' | 'md' | 'lg' | 'xl' | 'full'",
              'sm',
              'AlertDialog',
              'The maximum width of the panel. AlertDialog defaults to sm, 32rem.',
            ] as ApiTuple)
          : row[0] === 'initialFocus'
            ? ([
                'initialFocus',
                "'first' | 'container' | 'cancel' | RefObject | false",
                'cancel',
                'AlertDialog',
                'Where focus goes when the dialog opens. The default, cancel, is the least destructive answer.',
              ] as ApiTuple)
            : row,
      ),
      [
        'tone',
        "'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'danger',
        'AlertDialog',
        'The kind of decision. It sets the mark AlertDialogIcon draws and its color.',
      ],
      ['modal', 'boolean', 'true', 'AlertDialog', 'Fixed: an alert dialog is always modal.'],
      [
        'outsidePress',
        "'close' | 'none'",
        'none',
        'AlertDialog',
        'Fixed: a press outside never closes an alert dialog.',
      ],
      [
        'back',
        "'close' | 'none'",
        'close',
        'AlertDialog',
        'Whether the browser’s way back cancels the confirmation, as Escape does. The close request carries the reason back.',
      ],
      [
        'surface',
        "'panel' | 'plain'",
        'panel',
        'AlertDialog',
        'Whether AlertDialog paints the panel. plain removes the paint and keeps the behavior.',
      ],
      [
        'fullScreen',
        "'never' | 'narrow' | 'always'",
        'never',
        'AlertDialog',
        'When the panel fills the whole layer. AlertDialog keeps its margins at every width by default.',
      ],
    ]),
    composition,
    accessibility: alertAccessibility,
    snippets: [
      defineSnippet({
        id: 'alert-dialog-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="dialog"
  data-part="root"
  data-size="sm"
  data-tone="danger"
  data-outside-press="none"
  data-modal
  data-open
>
  <div data-part="backdrop" />
  <div data-part="viewport">
    <div
      data-part="content"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="a-t"
      aria-describedby="a-d"
    >
      <header data-part="header">
        <span data-part="icon" aria-hidden="true" />
        <h2 data-part="title" id="a-t">
          Delete this project?
        </h2>
        <p data-part="description" id="a-d">
          This cannot be undone.
        </p>
      </header>
      <footer data-part="footer">
        <button data-part="cancel" type="button">
          Keep project
        </button>
        <button data-part="action" type="button">
          Delete project
        </button>
      </footer>
    </div>
  </div>
</div>;`,
      }),
      snippets[1] as never,
    ],
  },
} as const;
