---
topic: forms
prefix: FM
triggers:
  [
    form,
    create,
    new record,
    edit,
    save,
    submit,
    validation,
    field error,
    server error,
    draft,
    required,
    optional,
    read-only,
    permission,
    conflict,
    layout,
    section,
    width,
    dialog,
  ]
families:
  [
    form,
    field,
    field-group,
    text-field,
    number-field,
    select,
    currency-field,
    checkbox,
    radio-group,
    segmented-control,
    section,
    grid,
    page-header,
    dialog,
  ]
---

# Forms

Where a form that writes a record stands, how a rule the backend owns reaches
the control it is about, and what happens to what a reader typed when they
leave. The library gives `form` an error map, a summary and an action row,
`field` a label, a description and a message, and the controls their states;
it does not say which route a create form lives on, which key the error map
is written with, or whether a draft outlives the page.

### FM-01 · A create form is a page of its own

Level: SHOULD
Applies to: a form that creates a record a module lists — an account, an order, a ticket
Rule: The form stands on its own route under the list it returns to, and the way back is the header's `back` part; a layer holds a form of one or two fields over a record already on screen.
Why: A form of several sections has a link a colleague can paste, a place in the history the phone's back gesture answers, and the whole height of a phone; a layer has none of the three.
Do: Give the route a segment of its own before the list's record segment, gate it on the permission the command requires, and name the list in the back link. The page header carries the title and the sentence that says what the record will be on arrival; the actions that confirm stand in the form's own action row.
Don't: Open the create form as a dialog over the list, or route it through the record page under a reserved id.
Seen in: Nexora · New customer · corrected
Verified in: the new customer suite, "opens the form on its own route rather than the record page".; /crm/customers/new
Check: Open the create route: the form draws with the list's name and the arrow above the title, and the system back gesture returns to the list.

### FM-02 · A control is named as the backend names the field

Level: MUST
Applies to: every control in a form whose value a command validates
Rule: The control's `name` is the field name the command answers with, and the page's error map is keyed by the same name; a nested field is the leaf name the backend uses, prefixed by its group.
Why: A server answers field errors keyed by its own field names, and a map keyed by anything else needs a translation table that drifts from the backend on the first rename.
Do: Name each control as the command names the value it writes, and translate only the leaf of a nested group — a contact's first name becomes the group's name, a dot and the leaf — in one place the store owns.
Don't: Name controls after the label a reader sees, or after the shape of the draft.
Seen in: Nexora · New customer · corrected
Verified in: the new customer suite, "puts the backend's refusal on the control the backend named".
Check: Every `name` in the form is a field of the command's input.

### FM-03 · A refusal is said at the control and in the summary

Level: MUST
Applies to: a form whose submit can fail — on the platform's own check or on the backend's answer
Rule: One error map feeds the form's summary and each field's message: every message a reader is given stands under the control it is about, and the same words stand in the summary.
Why: A refusal that lives only in a toast leaves the reader to find which of twelve controls it meant; one that lives only beside a control is missed by a reader who was sent to the top of a long form.
Do: Hold the map in the screen's store, bind it to the form, accept the form's own request back into it — the family drops a field's error the moment that field is edited — and render the message as the field's `error` part. Where the backend answers a code the product has words for, the words are the product's; where it does not, the server's sentence is shown as it came.
Don't: Report a failed submit through a toast alone, or write a second sentence beside the control that does not match the summary's.
Seen in: Nexora · New customer, a 422 on a name of spaces · corrected
Verified in: the new customer suite, "puts the backend's refusal on the control the backend named"; A submit the backend refuses shows the message under its control and in "This account was not created"
Check: A submit the backend refuses shows the message under its control and in the form's summary.

### FM-04 · A value read but not written is a read-only field

Level: SHOULD
Applies to: a field whose value one permission lets a persona see and another lets them change — a credit limit under a permission to read it and a permission to change it
Rule: The field stands in its read-only state with the value and one sentence naming who does change it; a value the persona may not see at all is not drawn.
Why: A field that disappears reads as a fact the record does not hold, and a disabled control reads as something that could become available by trying again.
Do: Bind the field's read-only state to the permission that writes, and its presence to the permission that reads. The sentence under it names the holder of the other permission, not the permission.
Don't: Hide a value the reader is allowed to see, or leave a control the reader can type into and the backend will refuse.
Seen in: Nexora · New customer, the credit limit for Noah Bennett · corrected
Verified in: the new customer suite, "shows a representative the credit limit as a value they cannot write"; signed in as a Sales Representative, the Credit limit field is present, read-only, and says Finance sets it.
Check: Signed in as a reader who may read the value and not change it, the field is present, read-only, and says who sets it.

### FM-05 · A draft outlives the page

Level: SHOULD
Applies to: a create form a reader can leave without submitting
Rule: What was typed lives in the screen's store rather than in the component: leaving the form and opening it again finds it; a successful create empties it.
Why: On a phone the back gesture is the way out of everything, and a form that empties itself on the way back is a form typed twice.
Do: Keep the draft in the module's store, read it from the component, and clear it on the answer that made the record. Offer no guard that refuses to leave: the draft is not lost, so there is nothing to warn about.
Don't: Hold the values in the component's own signals, or register an unsaved-changes guard over a draft that survives.
Seen in: Nexora · New customer · corrected
Verified in: the new customer suite, "keeps the draft when the reader leaves the form and opens it again"; Type a name, return to the list, open the form again: the name is there
Check: Type a value, leave for the list, open the form again: the value is there.

### FM-06 · An optional group is opened by a choice

Level: MAY
Applies to: a group of fields a command accepts and does not require — a primary contact, a billing address, a first note
Rule: The group stands behind a checkbox that opens it, and while it is open its fields carry the platform's `required`.
Why: A group half filled is a record the backend accepts and nobody meant — a contact with an email and no name — and a form that asks for everything at once reads as a form that requires everything.
Do: Word the choice as what it adds ("Add the primary contact now"), keep it closed at first, and send the group only while it is open.
Don't: Draw the optional fields open and guess intent from which of them were filled.
Seen in: Nexora · New customer, the contact and the billing address · corrected
Verified in: the new customer suite, "opens the optional groups closed, and requires what an opened group holds".
Check: The groups are closed on arrival; opening one makes its fields required.

### FM-07 · A record's facts are edited where they are read

Level: SHOULD
Applies to: the fields of a record already on screen — the account's own facts, a contact, a term
Rule: The section that shows the facts becomes the form that writes them: the record's header, its figures and its tabs stay where they are, and the section's body is the form.
Why: The reader came to this record for these values; a page of its own or a layer over it hides the figures the edit is judged against and costs the way back.
Do: Put the control that opens the form in the section's `actions`, keep the heading, and let the form's own action row carry Save and Cancel. A create form is the other case, and FM-01 says where it stands.
Don't: Route to a page of its own for one section of a record, or open a layer that covers the record's figures.
Seen in: Nexora · Customer 360, the Account section · corrected
Verified in: the account section suite, "reads the account, and writes it in the section it was read in"; Press Edit: the title row, the four `stat-card`s and the tabs stay, and the form stands in the section
Check: Press Edit: the title row, the figures and the tabs stay, and the form stands in the section.

### FM-08 · A version someone else moved past is answered field by field

Level: MUST
Applies to: any command carrying the last observed version
Rule: A stale-version refusal re-reads the record and states which fields moved under the open form, what the record holds now and what the form holds; the reader keeps what they wrote and chooses between writing it over the version now stored and starting again from the record.
Why: A conflict the screen answers with "try again" makes the reader guess what they would overwrite, and a form that reloads itself throws away what they typed.
Do: Compare the values the form opened on with the values now stored, list only what differs, and mark the fields the reader also changed. Offer two controls with the two outcomes named.
Don't: Show the server's sentence alone, reload the form, or re-send the same command on the new version without saying what changed.
Seen in: Nexora · Customer 360, two writers on one account · corrected
Verified in: the account section suite, "says what the other writer changed, and offers the two answers".
Check: Write to the record from elsewhere while a form is open, then save: the panel names the field, both values and the two answers.

### FM-09 · A command carries only what the reader changed

Level: SHOULD
Applies to: an edit of a record that several people write
Rule: The command carries the fields whose value moved since the form opened, not every field the form draws.
Why: A whole-form patch writes a colleague's change back to what it was, and a value covered by its own permission — a credit limit — refuses an edit the persona is otherwise allowed to make.
Do: Keep the values the form opened on and compare against them, including after a conflict: "keep what I wrote" writes the reader's own fields over the newer version and leaves the rest as the other writer left them.
Don't: Send the draft whole, or re-base the comparison on the record read back after a conflict.
Seen in: Nexora · Customer 360, a representative saving an account without `customers.credit_edit` · corrected
Verified in: the customer edit suite, "lets a representative save their own account without writing the credit limit" and "answers a version someone else moved past with what they changed".
Check: Change one field of an edit form and submit: the request carries that field alone.

### FM-10 · Partial success is reported row by row

Level: MUST
Applies to: a command that writes many records at once and refuses some of them — a CSV import, a bulk action over a selection
Rule: The screen reports what was written and what was refused in the same answer: the counts of both, and one line per refused record with its position, its field and the reason.
Why: "Some rows failed" leaves the reader to find which, and a screen that reports only the failures hides that the rest of the file is already in the system.
Do: Draw the counts as figures — written, written with a value changed, refused, read — and the refusals as a table keyed by the row number the file has. Say what the reader does next, including what happens if they import the same file again.
Don't: Report a partial result as an error, as a success, or as a toast.
Seen in: Nexora · Import customers, three rows written and three refused · corrected
Verified in: the import store suite, "writes the rows it can read and lists the rest with the reason"; Import the example file: the figures say 3 of 6 written, and the table names rows 3, 4 and 6 with their reasons
Check: Import a file in which some rows are refused: the figures state both counts, and the table names each refused row with its position and reason.

### FM-11 · A threshold the backend enforces is said before the submit

Level: MUST
Applies to: a field a command requires only above a size — a note from ten units or US$1,000, an approval from a variance of US$2,500
Rule: The form applies the backend's threshold as the reader types: the field becomes required, and the sentence under it names the threshold and the value that crossed it; a value the reader may not be shown is replaced by the rule in words.
Why: A requirement the reader meets only as a refusal is a form filled twice, and a note asked for after the submit reads as a punishment for the size of the change.
Do: Compute the size the backend measures — the quantity, and the value at standard cost where the reader holds the permission — and bind the field's `required` and its description to it. Where the value is withheld (PM-01), state the rule and who sees the value, and let the backend's refusal land on the same field (FM-03).
Don't: Leave the field optional until the backend refuses, or compute the value from a cost the backend handed to a reader who may not see it.
Seen in: Nexora · the stock adjustment's note, and the cycle count's approval threshold read by a warehouse operator · corrected
Verified in: the inventory module suite, "asks for a note from ten units, before the backend does" and "tells a counter without cost.view the rule and not the figure".
Check: Type a value across the threshold: before the submit the field becomes required and its sentence names the threshold and the value; for a reader who may not see the value, the sentence states the rule in words.

### FM-12 · A form written in place is a query parameter

Level: SHOULD
Applies to: a form that takes the place of a record's section (FM-07) — an adjustment, a receipt, a count
Rule: Opening the form adds a query parameter to the record's address, so the platform's back gesture closes it and stays on the record; a successful save leaves the history as it came.
Why: A form held in the component alone is closed by the back gesture only by leaving the record, and a save that pushes the record again makes the next back gesture land on the same page.
Do: Open the form with a link that adds the parameter, derive "the form is open" from the address, and on success pop the entry that opened it — or replace it where the form was opened from a pasted link.
Don't: Open the form with a component flag, or navigate forward to the record after the save.
Seen in: Nexora · the stock of one SKU, where a save left the same position twice in the history · corrected
Check: Open the form, save, then press back twice: the first back leaves the record for the page before it, not for the same record.

### FM-13 · A submission that asks for an approval says so before it is sent

Level: MUST
Applies to: a form or a record whose submit is decided by an approval policy the backend runs — a purchase order, a quote, a count
Rule: Before the submit, the screen states whether the submission will wait on an approval, the roles of its steps in order and each reason, from the values on screen; the submit control's own label says it asks for approval.
Why: A buyer who learns after the submit that an order waits on a manager has sent it without choosing to, and a submit labelled the same whether it approves at once or waits for days hides the one thing that differs.
Do: Run the backend's own policy on what the form holds as it changes, list the reasons in the product's sentence form, give the value the threshold is measured in with its currency, and name the control "Submit for approval" while one is needed.
Don't: Announce the approval only in the toast after the submit, or state the thresholds without saying which of them the order crosses.
Seen in: Nexora · New purchase order and the draft purchase order's submit · corrected
Verified in: the procurement module suite, "asks for a Procurement Manager from US$25,000, and the submit asks for what the form said".
Check: Fill the form with values that need an approval: before the submit the screen lists the steps' roles in order with each reason, and the submit control's label says it asks for approval.

### FM-14 · A quantity sent to several places says where each part goes

Level: SHOULD
Applies to: a command that splits one line into destinations — a receipt's accepted, damaged and rejected units, a return's restock and scrap
Rule: Before the confirm, the form states in lines what each destination receives and what the record becomes after it, including a state the command changes on its own.
Why: The three numbers of a line are typed one at a time and read as one; the reader confirms a movement of stock and a change of the order they did not see stated.
Do: Count the lines per destination (RP-08: the units differ), say what a destination does with what it receives — into the stock, into its damaged bucket, back to the supplier — and say whether the record closes, with the rule that closes it.
Don't: Leave the outcome to the answer after the confirm, or sum the quantities of different units into one number.
Seen in: Nexora · the goods receipt of a purchase order, which closes the order once every line reaches 95% · corrected
Verified in: the procurement module suite, "receives in part with damaged and rejected units, reports the partial success and writes the movements".
Check: Before the confirm of a command that splits a quantity, the form states in lines what each destination receives and the state the record takes after it.

### FM-15 · An action no command writes is the record that says it

Level: SHOULD
Applies to: an action the domain names and the backend has no command for — a contact attempt on an invoice, a call logged against an account
Rule: The action is written through the command whose record says the same thing, with a fixed prefix that names the document it is about, and the document reads its own entries back by that prefix; no endpoint is invented in the client.
Why: An action a screen fakes in its own state is lost on the next read, and one written as a free note cannot be found from the document it was about.
Do: Name the nearest record the domain gives the action — a collection note is a customer note — write it with the prefix, the document's identifier and the fields the action carries (channel, what was agreed, a promised date), and read it back on the document's own tab. The control's holders are the command's: the note's permission at the note's scope.
Don't: Keep the attempt in the page's state, write it as a note with no prefix, or draw the control for a reader the note command refuses.
Seen in: Nexora · the invoice record's contact attempt, a customer note read back in its Collection tab · corrected
Verified in: the invoice suite, "records a contact attempt as the customer’s note and reads it back on the invoice".
Check: Write the action and read the document: the entry reads back by its fixed prefix, and the client calls no endpoint the backend does not declare.

### FM-16 · A date chosen in a form opens a calendar

Level: SHOULD
Applies to: a date a form asks for — a due date, a promised date, a day of receipt, a validity
Rule: A date entered in a form is a `date-picker`, which keeps typing in its field and adds the calendar behind its trigger; a `date-field` alone is not used in a form.
Why: A reader who has to type a date they could have pointed at is doing what the calendar exists to spare them, and the weekday the calendar shows is often the fact the date is chosen by.
Do: Write the picker with the limits the backend enforces as the picker's minimum and maximum — a due date not before the issue date — and read the one date a single-mode picker reports.
Don't: Write `date-field` for every date because it is the smaller family; a form that does so states no reason for it.
Seen in: Nexora · invoice, payment, purchase order, cycle count and quote forms (ledger row "date-picker, date-field") · corrected
Check: Every date control of a form opens a calendar from its trigger, and a date the backend limits refuses the days outside the limit.

### FM-17 · Fields take the form's spacing

Level: SHOULD
Applies to: every form that holds more than one field
Rule: The fields of a form are written as its direct children, in a `field-group` or in a `grid` for fields that stand side by side; the form spaces consecutive fields by `--slotted-form-field-gap`, and no field carries a margin of its own.
Why: A form whose fields touch reads as one control, and a spacing written field by field drifts from one form to the next.
Do: Write one `field` after another inside the `form`; set `--slotted-form-field-gap` on the theme to change the step for every form.
Don't: Write a margin or a spacer element between two fields, or wrap each field in an element of the page's own that breaks the run of fields the form spaces.
Seen in: a consumer application · forms written from the minimal example rendered their fields touching · corrected
Check: Two consecutive fields of a form stand apart by the form's step, and no field or wrapper between them carries its own margin.

### FM-18 · One column at a bounded measure

Level: SHOULD
Applies to: every form a page draws, on any page width
Rule: The fields of a form stand in one column no wider than `--slotted-form-measure` (40rem); a field never spans the page's whole measure, and the page's own width does not widen the column.
Why: A reader goes down one column without losing their place, and a field as wide as an 80rem page puts the label and the end of the answer a head turn apart (Baymard, "Avoid Multi-Column Forms"; CXL, "Form Field Usability").
Do: Write the fields as direct children of `form`, which holds them at the measure; let the page keep its own width for the header and the footer.
Don't: Set the page to `measure` to narrow the form, widen a field past the measure with a style of the page's own, or wrap the fields in a grid that fills the page.
Check: In a page 80rem wide, no control of the form is wider than 40rem.

### FM-19 · Two fields share a row only when they are one answer

Level: SHOULD
Applies to: a row of a form that holds more than one field, except in a form inside a `dialog`, which FM-25 lays out
Rule: Two fields stand side by side only when together they answer one question — a start and an end, a frequency and its interval, an amount and its unit — in a `field-group` whose `orientation` is `horizontal`; unrelated fields never share a row to fill width.
Why: Two unrelated fields side by side make the reading order zig-zag, and a reader skips the field on the right (Baymard, "Avoid Multi-Column Forms").
Do: Write the pair in one horizontal `field-group` whose legend names the answer they make together; keep every other field on a row of its own.
Don't: Write a two-column `grid` of fields to fill the width, or pair a name with a date because both are short.
Check: Every row with two or more fields is one `field-group`, and its legend names one answer the fields make together.

### FM-20 · A field's width says what it expects

Level: SHOULD
Applies to: every field whose answer has a known length, except in a form inside a `dialog`, which FM-25 lays out
Rule: A field's `width` follows its expected answer: `short` for an integer of up to four digits, `medium` for an amount, a code or a choice among short words, `full` (the default) for free text, a name or a picker of records.
Why: The width of a control is a cue to the length of its answer, and a two-digit field as wide as a description reads as a request for a sentence (Baymard, "Form Field Usability: Matching User Expectations").
Do: Set `width` to `short` on a day of the month or an interval, and to `medium` on an amount or a currency; change `--slotted-field-width-short` and `--slotted-field-width-medium` on the theme to change the steps for every form.
Don't: Write a class or a style that sizes one field, or leave a numeric field of two digits at full width.
Check: No field whose answer is an integer of up to four digits renders a control wider than `--slotted-field-width-short`.

### FM-21 · Sections group a topic

Level: SHOULD
Applies to: a form with more than six fields, or with two or more topics
Rule: The fields are split by topic into `field-group`s, each with a legend that names the topic; consecutive groups stand apart by `--slotted-form-section-gap`, a step larger than the gap between two fields.
Why: A long form whose fields all stand at one distance shows no structure, and a reader cannot tell where one topic ends.
Do: Write each topic as a `field-group` whose `kind` is `section`, with a `legend`, the groups as direct children of `form`; set `--slotted-form-section-gap` on the theme to change the step.
Don't: Write a margin, a heading or a separator of the page's own between two groups, or hold seven fields in one run with no group.
Check: A form with more than six fields holds at least two `field-group`s, and two consecutive groups stand further apart than two fields of one group.

### FM-22 · Every set of choices is a question

Level: MUST
Applies to: a `segmented-control`, a `radio-group` or a set of checkboxes in a form
Rule: A set of choices is a `field-group` whose legend asks the question the choices answer.
Why: A set of options with no question above it is announced as a list of words, and a reader who sees it out of order cannot tell what is being chosen.
Do: Write the legend as the question — "How often does it run?" — and the options as its answers.
Don't: Leave a segmented control or a radio set with no legend, or put the question in a placeholder or a description under the options.
Check: Every segmented control, radio group and checkbox set of the form has a `field-group` legend as its accessible name.

### FM-23 · Necessity is said once, the same way

Level: SHOULD
Applies to: every application whose forms hold required and optional fields
Rule: One `necessity` holds for the whole application, set once through the field defaults provider; `optional` is preferred, which marks the fields a reader may skip and says nothing on the rest.
Why: A form that marks some fields with an asterisk and others with a word asks the reader to learn two conventions, and in a form where most fields are required the asterisk on every one says nothing (Adam Silver, "Don't mark required fields with an asterisk").
Do: Set `necessity` to `optional` on the field defaults provider at the application's root.
Don't: Set `necessity` field by field, or mix a mark and a word in one form.
Check: No field of the application sets `necessity` on itself, and every form renders one convention.

### FM-24 · Help sits where its question is

Level: SHOULD
Applies to: every text that helps a reader answer a form
Rule: A format or a consequence of one answer is a one-line `description` under its control; the definition of a term is the field's `help` beside the label; what the whole record will do is the form's `aside`, beside the fields on a wide form and after them on a narrow one.
Why: Help placed away from its question is read after the answer is given, or not at all, and a paragraph above the form is skipped.
Do: Write the format under the field it applies to, the definition behind the help control, and the summary of the record in the aside.
Don't: Write a paragraph of help above the form, a description of more than one line, or a summary of the record in a field's description.
Check: Every help text of the form is a description, a help hint or the aside, and no description runs past one line.

### FM-25 · A dialog's form fills its body

Level: SHOULD
Applies to: a form inside a `dialog`, in place of FM-19 and FM-20
Rule: A form inside a `dialog` takes the dialog's body as its measure, with fields whose answers are short (an amount, a date, a count, a currency) two to a row in two equal columns in the order the reader answers them, each control filling its column, and a field whose answer is long (a name, free text, a picker of records) on a row of its own.
Why: The dialog's body is narrower than `--slotted-form-measure`, so a width step leaves a control at a fraction of the body, and the form reads as a ragged column of narrow boxes with nothing beside them to compare their widths against.
Do: Write consecutive short fields in a `grid` of two equal columns inside the form, each `field` at the default `width`, and every long field as a direct child of the form.
Don't: Set `width` to `short` or `medium` on a field inside a dialog, or leave a short field alone on a row when the next field is short too.
Check: No control of a dialog's form ends before its column ends, and no row of the form holds one short field while the next field is short.
