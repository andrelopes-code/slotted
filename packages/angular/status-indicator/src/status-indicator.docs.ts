import statusIndicatorTokens from '@slotted/styles/status-indicator/tokens.json';
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

export const ANGULAR_STATUS_INDICATOR_TOKENS = statusIndicatorTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Status Indicator decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  SlStatusIndicator,\n  provideStatusIndicatorDefaults,\n} from '@slotted/angular/status-indicator';",
  selector: '[slStatusIndicator]',
  exportAs: 'slStatusIndicator',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s element',
    required: true,
    purpose:
      'The host the directive attaches to — a span, a td, an anchor. Carries data-ui="status-indicator", the axes as data attributes, data-pulse when the wave is drawn, and the live role unless the consumer wrote one.',
  },
  {
    part: 'mark',
    element: 'span',
    required: true,
    purpose:
      'The disc or the glyph, inside the first line and centred on its capitals, so the mark stays on that line however far the label wraps. Hidden from assistive technology: it says nothing the label does not.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose:
      'The projected content. It wraps rather than truncating, with the lines after the first under the first word, and breaks an unbroken token, so a deployment id does not widen the column it sits in. A table row aligns on its first line.',
  },
  {
    part: 'detail',
    element: 'the consumer’s element with slStatusIndicatorDetail',
    required: false,
    purpose:
      'A second, quieter line under the words — a progress, a time — set in the muted text colour and hanging under the first word. Projected inside the label, so it is read with the words.',
  },
  {
    part: 'announcement',
    element: 'span',
    required: false,
    purpose:
      'The status’s own word, clipped from view by visually-hidden. It is the fallback content of <ng-content>, so it renders only when nothing was projected and a bare mark is never nameless.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One indicator with every input on it, driven by the controls below the canvas. Switch mark to icon and the meaning survives with the colour switched off.',
    snippet: defineSnippet({
      id: 'status-indicator-angular-playground',
      language: 'angular',
      label: 'One status',
      source:
        '<span slStatusIndicator status="success">Healthy</span>\n\n<!-- With nothing projected, the status names itself. -->\n<span slStatusIndicator status="success"></span>',
    }),
  },
  {
    id: 'statuses',
    title: 'The six operational states',
    note: 'Each maps onto one of the library’s five tones and owns one glyph. neutral and unknown share a tone, so the mark is what tells “nothing is happening” from “nobody knows”.',
    snippet: defineSnippet({
      id: 'status-indicator-angular-statuses',
      language: 'angular',
      label: 'Every status, with the words a product would write',
      source:
        '<span slStatusIndicator status="neutral">Draft</span>\n<span slStatusIndicator status="info">Live</span>\n<span slStatusIndicator status="success">Healthy</span>\n<span slStatusIndicator status="warning">Degraded</span>\n<span slStatusIndicator status="danger">Failed</span>\n<span slStatusIndicator status="unknown">No data</span>',
    }),
  },
  {
    id: 'marks',
    title: 'The dot, and the mark that does not need colour',
    note: 'A dot is compact and chromatic, so the words beside it carry the meaning. An icon carries a distinct silhouette per status, which is what WCAG 2.2 1.4.1 asks for where the words cannot be shown.',
    snippet: defineSnippet({
      id: 'status-indicator-angular-marks',
      language: 'angular',
      label: 'Two marks, one status',
      source:
        '<span slStatusIndicator status="warning">Degraded</span>\n<span slStatusIndicator status="warning" mark="icon">Degraded</span>',
    }),
  },
  {
    id: 'sizes',
    title: 'How large the indicator is',
    note: 'Type and glyph read the control scales, the only ones the theme restates per density, so a status shrinks with the table row it sits in rather than pushing that row taller.',
    snippet: defineSnippet({
      id: 'status-indicator-angular-sizes',
      language: 'angular',
      label: 'Three steps',
      source:
        '<span slStatusIndicator status="success" size="sm">Healthy</span>\n<span slStatusIndicator status="success" size="lg">Healthy</span>',
    }),
  },
  {
    id: 'pulse',
    title: 'A change happening now',
    note: 'A wave leaves the dot and fades, then rests before the next beat. An icon mark does not pulse. It is for a value moving while the reader watches — a deploy, a reindex, an error rate climbing — and never decoration on a status that settled a week ago.',
    snippet: defineSnippet({
      id: 'status-indicator-angular-pulse',
      language: 'angular',
      label: 'The wave, on a dot',
      source:
        '<span slStatusIndicator status="info" pulse>Deploying to production</span>\n\n<!-- Not this: nothing is changing. -->\n<span slStatusIndicator status="success" pulse>Healthy since Tuesday</span>',
    }),
  },
  {
    id: 'announcements',
    title: 'What a screen reader hears when the status changes',
    note: 'off by default, because a status already on the page when it loaded is not news. polite waits for a pause; assertive interrupts, and belongs to something a reader has to act on now.',
    snippet: defineSnippet({
      id: 'status-indicator-angular-announcements',
      language: 'angular',
      label: 'Three policies',
      source:
        '<span slStatusIndicator status="success">Healthy</span>\n\n<span slStatusIndicator status="info" live="polite">Deploying</span>\n\n<span slStatusIndicator status="danger" live="assertive">Region offline</span>',
    }),
  },
  {
    id: 'context',
    title: 'Where a status actually lives',
    note: 'A column of services, and a header where one status stands for a whole page. The words take the page’s own colour, so the status column reads as easily as the one beside it.',
    snippet: defineSnippet({
      id: 'status-indicator-angular-context',
      language: 'angular',
      label: 'A row in a table of services',
      source:
        '<tr>\n  <td>checkout-api</td>\n  <td slStatusIndicator status="success" size="sm">Healthy</td>\n</tr>',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A status that is a sentence, a container digest with nothing to break on, and a German label: the label wraps, the token breaks, and the mark stays on the first line of all three.',
    snippet: defineSnippet({
      id: 'status-indicator-angular-content',
      language: 'angular',
      label: 'Long, unbroken, and translated',
      source:
        '<span slStatusIndicator status="warning" mark="icon">\n  Waiting for approval from the security review board\n</span>\n\n<span slStatusIndicator status="danger">sha256:9f2b7c1de4a80b35c7f9a1e6d2408baf5c31</span>',
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The provider decides for a whole application, the host element stays the consumer’s, and a mark on the corner of an avatar is badge’s anchor rather than a second answer here.',
    snippet: defineSnippet({
      id: 'status-indicator-angular-composition',
      language: 'ts',
      label: 'One decision for the application',
      source:
        "bootstrapApplication(App, {\n  providers: [provideStatusIndicatorDefaults({ mark: 'icon', size: 'sm' })],\n});",
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'A mark with nothing projected still carries its own word, clipped rather than absent — so it is announced, findable by a page search, and available to an aria-labelledby elsewhere.',
    snippet: defineSnippet({
      id: 'status-indicator-angular-accessibility',
      language: 'angular',
      label: 'Named three ways',
      source:
        '<!-- “Error”, from the family’s own table. -->\n<span slStatusIndicator status="danger"></span>\n\n<!-- “Deploy failed”, from the application. -->\n<span slStatusIndicator status="danger" label="Deploy failed"></span>\n\n<!-- “Build 4821 failed”, from the words on the page. -->\n<span slStatusIndicator status="danger">Build 4821 failed</span>',
    }),
  },
];

export const ANGULAR_STATUS_INDICATOR_DOCS = {
  statusIndicator: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'status',
        "'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'unknown'",
        'neutral',
        'SlStatusIndicator',
        'The operational state. Each value owns a tone and a glyph; the vocabulary is closed, so a domain status maps onto one of the six and projects its own words',
      ],
      [
        'mark',
        "'dot' | 'icon'",
        'dot',
        'SlStatusIndicator',
        'dot is the compact chromatic mark; icon carries a distinct silhouette per status and is the alternative that does not depend on colour',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'SlStatusIndicator',
        'Reads the control type and glyph scales, so all three steps answer density',
      ],
      [
        'live',
        "'off' | 'polite' | 'assertive'",
        'off',
        'SlStatusIndicator',
        'Whether a change is announced. polite writes role="status"; assertive writes role="alert" and interrupts. A role written on the host is read first and never replaced',
      ],
      [
        'pulse',
        'boolean',
        'false',
        'SlStatusIndicator',
        'A wave leaving the dot, for a change happening now. Not drawn on an icon mark, and withdrawn under reduced motion and under forced colours, so it is never the only carrier',
      ],
      [
        'label',
        'string',
        '—',
        'SlStatusIndicator',
        'What a reader hears when nothing is projected. Ignored when something is. Falls back to the status’s word in the catalog',
      ],
      [
        'messages',
        'Partial<StatusIndicatorMessages>',
        '—',
        'SlStatusIndicator',
        'Words laid over the language in force, key by key: the word each status is heard as when nothing is projected (neutral, info, success, warning, danger, unknown)',
      ],
    ]),
    composition: apiRows([
      [
        'ng-content',
        'projected content',
        '—',
        'SlStatusIndicator',
        'The visible words, which are also the accessible name. Its fallback content is the clipped word, so the template itself decides which of the two a reader gets',
      ],
      [
        '[slStatusIndicatorDetail]',
        'projected content',
        '—',
        'SlStatusIndicatorDetail',
        'A second, quieter line under the words, projected inside the label as the detail part',
      ],
      [
        'host element',
        'any',
        '—',
        'SlStatusIndicator',
        'The selector is a bare attribute, so the element stays the consumer’s: a td, an anchor, a list item. Its own attributes and events are untouched',
      ],
      [
        'exportAs',
        "'slStatusIndicator'",
        '—',
        'SlStatusIndicator',
        'Reaches the instance from a template — name(), markValue(), sizeValue() and liveValue() are the resolved values after the provider',
      ],
      [
        'provideStatusIndicatorDefaults',
        '{ mark, size, live }',
        '—',
        'an injector',
        'Sets the three once for an application or a route. An explicit input still wins',
      ],
      [
        'outputs',
        'none',
        '—',
        'SlStatusIndicator',
        'The family emits nothing. status is the application’s fact about a system this component cannot see, so there is no value for it to request and no reason to carry',
      ],
    ]),
    accessibility: [
      'There is no status-indicator pattern in the WAI-ARIA Authoring Practices: the pattern index carries thirty entries and none of them is this family. The applicable guidance is the ARIA status role, WCAG 2.2 1.4.1 Use of Color and 1.4.11 Non-text Contrast, and each is answered below.',
      'The name is always real text in the document — the projected content, or the status’s own word clipped by visually-hidden. role="img" with an aria-label, which is Fluent’s answer, is deliberately not used: text is what lets a live region announce its own contents, lets an aria-labelledby elsewhere point at it, and lets a page search find the word.',
      'Colour is never the only carrier. Every indicator has words, and mark="icon" adds a distinct silhouette per status — six circles — so the six survive greyscale, the high-contrast scheme, and the operating system’s forced colours, where every author colour is replaced and the glyph is all that is left.',
      'Every dot fill clears the 3:1 that WCAG 2.2 1.4.11 asks of a graphic against the surface in the light and dark schemes, except warning, whose yellow is 1.53:1 on white; that dot alone is rimmed in the warning border role, 2.94:1. The word beside the dot carries the status, so the dot is never the only carrier.',
      'live="polite" writes role="status", which the platform gives an implicit aria-live="polite" and aria-atomic="true", so the mark and its word are announced as one thing rather than as two events. live="assertive" writes role="alert" and interrupts, which the APG reserves for a message needing immediate attention. A role written on the host element is read once through HostAttributeToken and kept.',
      'The pulse is withdrawn under prefers-reduced-motion rather than shortened, because an endless animation has to stop; a wave frozen halfway through an expansion is a rendering fault rather than a state. Nothing is lost, since the tone, the glyph and the word were already carrying the status.',
      'Nothing in the family is focusable on its own and no key is bound. The focus ring is painted for the case a consumer creates — the directive on their own anchor or button — so the ring is never missing where focus can land.',
    ],
    snippets: [
      defineSnippet({
        id: 'status-indicator-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<span\n  data-ui="status-indicator"\n  data-part="root"\n  data-status="danger"\n  data-mark="icon"\n  data-size="md"\n  data-pulse=""\n  role="status"\n>\n  <span aria-hidden="true" data-part="mark">\n    <span aria-hidden="true" data-part="root" data-ui="icon">\n      <svg data-glyph="circle-x" data-part="glyph">…</svg>\n    </span>\n  </span>\n  <span data-part="label">\n    Build 4821 failed\n    <!-- Or, with nothing projected: -->\n    <span data-part="announcement" data-ui="visually-hidden">Error</span>\n  </span>\n</span>',
      }),
      defineSnippet({
        id: 'status-indicator-theming',
        language: 'css',
        label: 'Retuning the family',
        source:
          "[data-ui='status-indicator'] {\n  --slotted-status-indicator-mark-border-width: 2px;\n}",
      }),
    ],
  },
} as const;
