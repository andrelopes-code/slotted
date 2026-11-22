import floatingPanelTokens from '@slotted/styles/floating-panel/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
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

export const ANGULAR_FLOATING_PANEL_TOKENS = floatingPanelTokens.map((name) => ({
  name,
  purpose: 'Theme-owned FloatingPanel decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  SlFloatingPanel,\n  SlFloatingPanelBody,\n  SlFloatingPanelClose,\n  SlFloatingPanelHandle,\n  SlFloatingPanelTitle,\n} from '@slotted/angular/floating-panel';",
  selector: '[slFloatingPanel]',
  exportAs: 'slFloatingPanel',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'section',
    required: true,
    purpose:
      'role="region", named by the title or label: a tool over the page that holds nobody, with no scrim and nothing made inert. Its place is clamped by the viewport and its own size.',
  },
  {
    part: 'handle',
    element: 'div',
    required: true,
    purpose:
      'The bar the panel is moved by: a press that moves drags it, with the pointer captured and no scroll of the page.',
  },
  {
    part: 'grip',
    element: 'button',
    required: true,
    purpose:
      'The handle’s focusable start, named Move in the language in force: an arrow key moves the panel one step, a larger one with Shift.',
  },
  {
    part: 'title',
    element: 'h2',
    required: false,
    purpose: 'The panel’s name, one line, which names the region when no label does.',
  },
  {
    part: 'close',
    element: 'button',
    required: false,
    purpose: 'Closes the panel; focus returns to the element that held it before it opened.',
  },
  {
    part: 'body',
    element: 'div',
    required: true,
    purpose: 'What the tool holds. It scrolls when the panel is held shorter than it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A calculator left open over a page that stays usable: drag the handle, press a button of the page under it, and close the panel with Escape.',
    snippet: defineSnippet({
      id: 'floating-panel-angular-playground',
      language: 'angular',
      label: 'A tool over the page',
      source:
        '<section slFloatingPanel [open]="open()" (openChange)="open.set($event)">\n  <div slFloatingPanelHandle>\n    <h2 slFloatingPanelTitle>Calculator</h2>\n    <button slFloatingPanelClose></button>\n  </div>\n  <div slFloatingPanelBody>…</div>\n</section>',
    }),
  },
  {
    id: 'keyboard',
    title: 'Moved by the keyboard, and stored where it was left',
    note: 'The grip takes focus; an arrow key moves the panel eight pixels, thirty-two with Shift. placeChange reports the end of every move, so the application stores the place and hands it back as place.',
    snippet: defineSnippet({
      id: 'floating-panel-angular-keyboard',
      language: 'angular',
      label: 'A place the application keeps',
      source:
        '<section\n  slFloatingPanel\n  [open]="open()"\n  [place]="place()"\n  (openChange)="open.set($event)"\n  (placeChange)="place.set($event)"\n>\n  …\n</section>',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader meets',
    note: 'A region named by its title, not a dialog: the shortcuts an application holds back while a dialog is open keep working, and focus is never trapped. Escape inside it closes it and returns focus to where it was.',
    snippet: defineSnippet({
      id: 'floating-panel-angular-accessibility',
      language: 'angular',
      label: 'A name of its own',
      source:
        '<section slFloatingPanel label="Notes" [open]="open()" (openChange)="open.set($event)">…</section>',
    }),
  },
];

export const ANGULAR_FLOATING_PANEL_DOCS = {
  floatingPanel: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      ['open', 'boolean', '—', 'slFloatingPanel', 'Whether the panel is drawn'],
      [
        'openChange',
        'output<boolean>',
        '—',
        'slFloatingPanel',
        'Asked with false on Escape inside the panel and on its close control',
      ],
      [
        'defaultPlace',
        "'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'",
        'bottom-end',
        'slFloatingPanel',
        'The corner the panel first opens in, in the reading direction',
      ],
      [
        'place',
        '{ x: number; y: number }',
        '—',
        'slFloatingPanel',
        'A controlled place, the top-left corner in viewport pixels, drawn inside the viewport',
      ],
      [
        'placeChange',
        'output<{ x: number; y: number }>',
        '—',
        'slFloatingPanel',
        'Fired at the end of a move, by pointer or by key, for the application to store',
      ],
      [
        'label',
        'string',
        '—',
        'slFloatingPanel',
        'The region’s name when no slFloatingPanelTitle names it',
      ],
      [
        'messages',
        'PartialMessages<FloatingPanelMessages>',
        '—',
        'slFloatingPanel',
        'Words laid over the catalog of the language in force: close, move',
      ],
      [
        'native props',
        'section, div, h2, button attributes',
        '—',
        'every part',
        'Reach the element each part renders',
      ],
    ]),
    accessibility: [
      'The root is a region named by slFloatingPanelTitle or label, never a dialog: nothing on the page is inert, no scrim takes a press, and focus is not trapped, so the panel is a tool beside the work rather than a step of it.',
      'The grip is a button named Move in the language in force; an arrow key moves the panel one step and Shift a larger one, so the panel can be put out of the way without a pointer.',
      'Escape inside the panel and the close control ask openChange(false), and focus returns to the element that held it before the panel opened.',
      'The place is clamped by the viewport and the panel’s own size in the stylesheet, so a narrowed window or a stored place never leaves part of the tool out of reach.',
    ],
    snippets: [
      defineSnippet({
        id: 'floating-panel-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='floating-panel'] {\n  --slotted-floating-panel-shadow: var(--slotted-shadow-md);\n  --slotted-floating-panel-radius: 12px;\n}",
      }),
    ],
  },
} as const;
