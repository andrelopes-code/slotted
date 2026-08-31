# FileUpload Design

## Outcome

A region that accepts files by drop and by picker, holds the selection, and
turns away the files that do not qualify. It is the last component of T2.

It exists as a component, rather than a styled div, for four reasons: the
pairing that makes the picker reachable from the keyboard, drag tracking that
survives the pointer crossing a child element, validation that makes drop and
picker agree, and a selection held either by the consumer or by the component.
Everything else it leaves alone.

## The Native Input Is the Control; the Region Is Its Label

The dropzone is a `<label>`. The `<input type="file">` sits inside it.

That single decision answers the accessible-name question the catalog raised.
A label names the control it contains, so the region's own text becomes the
input's accessible name with nothing generated, no `id` invented, and no
`aria-labelledby` to keep in step. It also makes the whole region activate the
picker — native label behaviour, no click handler, and correct from the
keyboard because the thing being activated is a real focusable input.

The alternatives were a `div` with `role="button"`, and a `div` labelling the
input through `aria-labelledby`. The first replaces a control that works with
one that has to be reimplemented — Enter and Space, the picker, form
association, and `:disabled` all become the component's problem. The second
needs a generated id, which React and Angular solve differently, in exchange
for exactly what a `<label>` already does.

Drag and drop is a pointer-only affordance and cannot be made otherwise. It is
an enhancement layered on the region; the input underneath it is the accessible
path, and it is never hidden from the accessibility tree or from the tab order.

Keep the region's visible text short. It is the input's accessible name, so a
paragraph of guidance inside the dropzone is a paragraph a screen reader reads
before the control is identified. Guidance belongs beside the region, not in
it.

## The Input Is Hidden From Sight and From Nothing Else

The input is removed visually with the clip technique, not with
`display: none`, `visibility: hidden`, or `opacity: 0` on a zero-size box.

The first two remove it from the accessibility tree and from the tab order,
which discards the reason the label pairing exists. Stretching a transparent
input across the region — the other common approach — puts the input on top of
the content, so the drop lands on the input rather than the region and the
component cannot show that a drag is over it.

Its rules are restated in this family's stylesheet rather than reached for from
`visually-hidden`. Four declarations keep the family self-contained, and a
stylesheet that depends on another family's class makes the class part of both
families' public surface.

## Focus Belongs to the Input; the Ring Belongs to the Region

The region draws the focus ring, using `:has(:focus-visible)`.

What the reader focuses is the input, which is one pixel and invisible. A ring
around it would be a ring around nothing. The region is what they see and what
they activate, so the region is what the ring must outline. The contract
records `focus-visible` on the dropzone for that reason, and the stylesheet
reaches it through the input inside.

## Drag Tracking Counts Enters Rather Than Trusting Leaves

`dragenter` and `dragleave` fire for every element the pointer crosses, so a
drag moving from the region onto a child inside it fires `dragleave` on the
region. Clearing the state there makes the highlight flicker across the whole
zone — the single most common defect in a hand-written dropzone.

The component keeps a depth counter: `dragenter` increments, `dragleave`
decrements, and the state clears only at nought. `drop` resets it outright,
because no `dragleave` follows a drop.

`dragover` is cancelled on every event. The default action of `dragover` is to
refuse the drop, so a handler that does not cancel it gets no `drop` at all,
and the browser navigates to the dropped file instead.

## Validation Exists So That Drop and Picker Agree

`accept` on an `<input type="file">` filters the picker's dialog and nothing
else. It is a hint to the file browser; it constrains neither what the picker
ultimately yields nor, more importantly, what a drop delivers. Without a check
of its own the component would accept by drop exactly what it refuses by
picker, on the same page, from the same reader.

So the component applies `accept` itself, in the same syntax the attribute
uses, and passes it to the input as well so the dialog still filters. `maxSize`
is checked in the same pass, as bytes, because a size limit that only the
server enforces is a limit the reader discovers after the upload.

Rejected files are not silently dropped and do not throw. They are reported —
`onReject` in React, a `reject` output in Angular — as `{ file, reason }` with
`reason` one of `type`, `size`, or `multiple`. Silence leaves the reader
staring at a file that did not appear; an exception makes a routine outcome
into an error. The consumer decides what the message says, because only they
know whether the limit is a policy, a plan, or a bug.

`multiple` is a rejection reason rather than a truncation. When a
single-file upload receives three, the two it discards are reported like any
other refusal.

## `core/files`

`accept` matching is framework-free string work that both frameworks need to
perform identically, so it lives in `@slotted/core/files` rather than being
written twice.

The catalog's core table does not list a module for FileUpload. That table was
written before this component was, and it is corrected alongside this document:
the test of a core module is not only whether a second component will call it
but whether both frameworks must agree on its answer. `clampPosition` is four
lines and reads the same in either language; a parser for three token forms
with case-insensitive extension matching is a place where two copies drift, and
a drift here means drop and picker disagreeing in one framework and not the
other.

```ts
matchesAccept(file: { name: string; type: string }, accept: string): boolean;
```

An empty or absent `accept` matches everything, which is what the attribute
means. The three token forms are those the attribute defines: `image/png`, an
exact type; `image/*`, a type with any subtype; and `.pdf`, an extension,
matched case-insensitively because a file called `REPORT.PDF` is a PDF.

It takes a shape rather than a `File`, so it is testable without a DOM and
usable against anything that reports a name and a type.

## Selection

`files` is a `File[]`, held by the consumer or by the component:
`defaultFiles`, `files` and `onFilesChange` in React, a `model` in Angular —
the shape Tabs and Splitter already established.

A multiple-file upload appends what it receives; a single-file upload replaces.
That matches what each affordance means: dropping a second file onto a
multi-file region adds it, and picking a second file for a single-file control
is a correction of the first.

Nothing is de-duplicated. Whether two files are the same file is a question
about name, size, modification time or content, and the answer differs by
application. It is left to the consumer rather than guessed at here.

## The Component Never Uploads, So Progress Is Not Its Number

`FileUploadItem` is an `<li>` and takes no `progress`.

The library selects files. Whoever uploads them is the only party that knows
how far along the upload is, which request it belongs to, and whether a retry
reset it. A `progress` prop would take that number, render one bar in one
place, and fix a row layout the consumer cannot change. Instead the item is a
row, and a consumer who wants a bar in it composes ProgressBar inside — which
is what the reference pages do, and why the catalog lists ProgressBar as a
dependency.

## Accessibility Contract

- The `<input type="file">` is the control, always focusable and always in the
  accessibility tree. The region is its label.
- The region shows the focus ring for the input inside it.
- The list of selected files is `aria-live="polite"`. A drop is otherwise
  silent: the pointer completes an action and nothing tells a screen reader
  that four files arrived. Additions announce; the list's initial content does
  not, which is the behaviour a live region already has.
- `disabled` disables the input, which is what stops the label activating it.
  The drag handlers check it as well, since dragging is not routed through the
  input at all.
- Rejections are reported to the consumer rather than announced by the
  component. What to say about a refused file is a message, and the library
  does not write messages.
