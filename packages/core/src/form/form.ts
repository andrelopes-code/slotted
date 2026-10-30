/**
 * One form's errors: where they come from, what order they are read in, and
 * when they stop being true.
 *
 * The family that uses this owns exactly one piece of state — a map from a
 * control's `name` to the messages about it — because
 * `docs/component-features.md` § 6 says a form coordinates submission,
 * validation and focus "without owning the state of each framework". Values,
 * touched and dirty stay with Reactive Forms in Angular and with the
 * consumer's own state in React.
 *
 * Three sources feed the map: whatever a server sent, whatever the platform's
 * own constraint validation says, and whatever the submit handler returned.
 * Merging them, ordering them and dropping them are the same operations in
 * both bindings, so they are written once here.
 *
 * `collectValidity` is the only function that touches the DOM, and it reads it
 * rather than writing to it. It is here rather than in a binding because
 * `form.elements` and `validationMessage` are the platform's, and a form that
 * harvested them differently in React and in Angular would report different
 * errors for one page.
 */

/** What a consumer writes: one message or several, per control name. */
export type FormErrorInput = Record<string, string | readonly string[] | null | undefined>;

/** What the family holds: every control that has something wrong with it. */
export type FormErrors = Record<string, readonly string[]>;

/** One row of the summary: a control, and everything wrong with it. */
export interface FormErrorEntry {
  /** The `name` attribute of the control the messages are about. */
  name: string;
  messages: readonly string[];
  /**
   * The identifier the summary links to, when the control is in this form. A
   * server may name a field the page no longer renders; that error keeps its
   * place in the list and loses its link, because a message a reader cannot
   * reach is still a message they have to be given.
   */
  id: string | undefined;
}

/** Empty strings are not messages, and a key with none is not an error. */
export function normalizeErrors(errors: FormErrorInput | undefined): FormErrors {
  const normalized: Record<string, readonly string[]> = {};
  if (errors === undefined) return normalized;

  for (const [name, value] of Object.entries(errors)) {
    if (value === null || value === undefined) continue;
    const messages = (typeof value === 'string' ? [value] : [...value])
      .map((message) => message.trim())
      .filter((message) => message.length > 0);
    if (messages.length > 0) normalized[name] = messages;
  }

  return normalized;
}

/**
 * Every map, latest last. A later source replaces a name rather than adding to
 * it: the server's answer about one field supersedes the browser's, and two
 * messages saying the same thing twice is what a reader reads as one bug.
 */
export function mergeErrors(...maps: readonly (FormErrorInput | undefined)[]): FormErrors {
  return maps.reduce<FormErrors>((merged, map) => ({ ...merged, ...normalizeErrors(map) }), {});
}

/** The map without one control's errors, or the same map when it had none. */
export function withoutError(errors: FormErrors, name: string): FormErrors {
  if (!(name in errors)) return errors;
  return Object.fromEntries(Object.entries(errors).filter(([key]) => key !== name));
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function errorCount(errors: FormErrors): number {
  return Object.values(errors).reduce((total, messages) => total + messages.length, 0);
}

/**
 * The errors in the order a reader will fix them.
 *
 * `order` is document order — what `form.elements` gives — so the summary lists
 * the fields down the page. An object's own key order is the server's, and the
 * server does not know the layout. A name the order does not mention is
 * appended, keeping the map's own order among those.
 */
export function orderErrors(
  errors: FormErrors,
  order: readonly { name: string; id: string | undefined }[],
): FormErrorEntry[] {
  const seen = new Set<string>();
  const entries: FormErrorEntry[] = [];

  for (const control of order) {
    const messages = errors[control.name];
    if (messages === undefined || seen.has(control.name)) continue;
    seen.add(control.name);
    entries.push({ name: control.name, messages, id: control.id });
  }

  for (const [name, messages] of Object.entries(errors)) {
    if (seen.has(name)) continue;
    entries.push({ name, messages, id: undefined });
  }

  return entries;
}

/** A control the platform can validate and a form can submit. */
type ValidatableControl = HTMLElement & {
  name: string;
  id: string;
  type?: string;
  disabled?: boolean;
  willValidate?: boolean;
  validity?: ValidityState;
  validationMessage?: string;
  checkValidity?: () => boolean;
};

/**
 * Every named control in this form, in document order.
 *
 * The list is scoped to the element rather than to the document, and it is read
 * from `form.elements`, so a control associated by its `form` attribute from
 * elsewhere on the page is included and a control inside a nested widget is
 * not counted twice.
 *
 * A control that shares its name with an earlier one — the two `input`
 * elements a range slider submits, a set of radios — is reported once, under
 * the first one, because one name is one row of the summary.
 */
export function namedControls(form: HTMLFormElement): { name: string; id: string | undefined }[] {
  const seen = new Set<string>();
  const controls: { name: string; id: string | undefined }[] = [];

  for (const element of Array.from(form.elements) as ValidatableControl[]) {
    const name = element.name;
    if (typeof name !== 'string' || name === '' || seen.has(name)) continue;
    seen.add(name);
    controls.push({ name, id: element.id === '' ? undefined : element.id });
  }

  return controls;
}

/**
 * What the platform says is wrong, as a map.
 *
 * `checkValidity()` is called rather than read, because calling it is what
 * fires `invalid` on each failing control and lets a consumer listen for it.
 * The message is the browser's own `validationMessage`, which is localized by
 * the operating system's language and which no library writes better.
 *
 * A control that does not participate in validation — disabled, `type=hidden`,
 * an output — reports `willValidate: false` and is skipped rather than
 * reported as valid.
 */
export function collectValidity(form: HTMLFormElement): FormErrors {
  const errors: Record<string, readonly string[]> = {};

  for (const element of Array.from(form.elements) as ValidatableControl[]) {
    const name = element.name;
    if (typeof name !== 'string' || name === '') continue;
    if (element.willValidate !== true) continue;
    if (element.checkValidity?.() !== false) continue;

    const message = element.validationMessage ?? '';
    if (message === '' || name in errors) continue;
    errors[name] = [message];
  }

  return errors;
}

/** Whether anything inside this form has been edited since it was last reset. */
export function isDirty(form: HTMLFormElement): boolean {
  for (const element of Array.from(form.elements)) {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        if (element.checked !== element.defaultChecked) return true;
        continue;
      }
      if (element.value !== element.defaultValue) return true;
      continue;
    }
    if (element instanceof HTMLTextAreaElement && element.value !== element.defaultValue) {
      return true;
    }
    if (element instanceof HTMLSelectElement) {
      const chosen = Array.from(element.options).some(
        (option) => option.selected !== option.defaultSelected,
      );
      if (chosen) return true;
    }
  }

  return false;
}
