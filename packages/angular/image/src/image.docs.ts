import imageTokens from '@slotted/styles/image/tokens.json';
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

export const ANGULAR_IMAGE_TOKENS = imageTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Image decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlImage, SlImageMedia, SlImageFallback, SlImagePlaceholder, provideImageDefaults } from '@slotted/angular/image';",
  selector: '[slImage]',
  exportAs: 'slImage',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The box: a grid of one cell the three layers share, cut at the corner and clipped there. Carries every axis, the status, and the edge. The component attaches to the element you wrote: a div, an a, a button or a figure.',
  },
  {
    part: 'picture',
    element: 'picture',
    required: false,
    purpose:
      'The platform’s element for art direction, present only with sources: one source per entry and the img last. Takes no box of its own (display: contents).',
  },
  {
    part: 'image',
    element: 'img',
    required: true,
    purpose:
      'The picture, with every native attribute the consumer wrote. Hidden until it reports loaded, then crossed over the placeholder; never removed, so its alt is the name in every status.',
  },
  {
    part: 'placeholder',
    element: 'span',
    required: true,
    purpose:
      'What stands under the picture before it arrives: the sunken ground, a blurred preview, or nothing; plus whatever [slImagePlaceholder] projects over it. Hidden from assistive technology.',
  },
  {
    part: 'fallback',
    element: 'span',
    required: true,
    purpose:
      'What stands in after the picture failed: the image-off glyph on the ground, or the [slImageFallback] content projected in its place. Out of the flow until then, so nothing in it is focusable while the picture is fine.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One survey photograph in a landscape frame, driven by the controls: switch fit, position, radius and bordered and watch the crop, the focal point, the corner and the edge answer.',
    snippet: defineSnippet({
      id: 'image-angular-playground',
      language: 'angular',
      label: 'A picture in a decided frame',
      source:
        '<div slImage alt="The fjord lookout at site 12" ratio="landscape" [src]="site.photo"></div>',
    }),
  },
  {
    id: 'sizing',
    title: 'Nothing is reserved without a decision',
    note: 'width and height on the element reserve the ratio before the first byte, the platform’s own way; fill takes the parent’s box in both axes; a picture with neither and no ratio has no height until it reports, which is the honest answer rather than a guess.',
    snippet: defineSnippet({
      id: 'image-angular-sizing',
      language: 'angular',
      label: 'Reserved by the element, or by the parent',
      source:
        '<div slImage alt="The fjord lookout at site 12" width="800" height="600" [src]="site.photo"></div>\n<div slImage alt="The fjord lookout at site 12" layout="fill" [src]="site.photo"></div>',
    }),
  },
  {
    id: 'ratio',
    title: 'A ratio decided on the image renders an AspectRatio inside its root',
    note: 'landscape, portrait and wide frames at the column’s width, each holding its shape before the picture arrives and cropping it with fit once it has. The frame is the other family’s, composed rather than restated.',
    snippet: defineSnippet({
      id: 'image-angular-ratio',
      language: 'angular',
      label: 'By ratio',
      source:
        '<div slImage alt="…" ratio="landscape" [src]="site.photo"></div>\n<div slImage alt="…" ratio="portrait" [src]="site.photo"></div>\n<div slImage alt="…" [ratio]="[2, 1]" [src]="site.photo"></div>',
    }),
  },
  {
    id: 'fit',
    title: 'The five fits, in one square frame',
    note: 'cover crops to fill; contain shows the picture whole with the ground either side; fill stretches it; none draws it at its natural size; scale-down is none unless the picture is larger than the frame.',
    snippet: defineSnippet({
      id: 'image-angular-fit',
      language: 'angular',
      label: 'By fit',
      source:
        '<div slImage alt="…" fit="cover" ratio="square" [src]="site.photo"></div>\n<div slImage alt="…" fit="contain" ratio="square" [src]="site.photo"></div>',
    }),
  },
  {
    id: 'position',
    title: 'The focal point a crop keeps',
    note: 'A wide picture in a square frame keeps its start, its center or its end; a portrait in a 16:9 frame keeps its top or its bottom; a CMS focal point is any object-position value. Switch the toolbar to rtl and start and end swap sides, which object-position alone does not do.',
    snippet: defineSnippet({
      id: 'image-angular-position',
      language: 'angular',
      label: 'By position',
      source:
        '<div slImage alt="…" position="start" ratio="square" [src]="site.wide"></div>\n<div slImage alt="…" position="top" ratio="video" [src]="site.portrait"></div>\n<div slImage alt="…" position="30% 20%" ratio="video" [src]="site.portrait"></div>',
    }),
  },
  {
    id: 'appearance',
    title: 'Four corners and an edge',
    note: 'radius takes the steps of the radius scale, and every layer is cut to the same corner. bordered draws border-subtle inside the box for a photograph of a white wall on a white page — and it moves nothing, because the edge is inset.',
    snippet: defineSnippet({
      id: 'image-angular-appearance',
      language: 'angular',
      label: 'A corner, and an edge',
      source:
        '<div slImage alt="…" bordered radius="md" ratio="landscape" [src]="site.photo"></div>',
    }),
  },
  {
    id: 'loading',
    title: 'Before the picture',
    note: 'The sunken ground, a blurred preview from a forty-pixel version of the same picture, nothing at all, and a Skeleton the consumer put over the ground. All four are held at loading with the status prop, which wins over what the element reports.',
    snippet: defineSnippet({
      id: 'image-angular-loading',
      language: 'angular',
      label: 'A blurred preview, and a skeleton',
      source:
        '<div\n  slImage\n  alt="…"\n  placeholder="blur"\n  ratio="landscape"\n  [placeholderSrc]="site.preview"\n  [src]="site.photo"\n></div>\n<div slImage alt="…" ratio="landscape" [src]="site.photo">\n  <span slImagePlaceholder slSkeleton shape="block"></span>\n</div>',
    }),
  },
  {
    id: 'error',
    title: 'After the picture failed',
    note: 'A request to a picture that is not there: the image-off glyph on the ground in a decided frame; the same with nothing reserved, where the fallback’s own minimum is the box; and a consumer’s message and retry in place of the glyph. The fourth tile tried a second URL first and shows it.',
    snippet: defineSnippet({
      id: 'image-angular-error',
      language: 'angular',
      label: 'A second URL, then a message',
      source:
        '<div slImage alt="…" ratio="landscape" [fallbackSrc]="site.archivedPhoto" [src]="site.photo">\n  <button slImageFallback slButton type="button" (click)="retry()">Retry</button>\n</div>',
    }),
  },
  {
    id: 'sources',
    title: 'Art direction and formats, with the platform’s picture element',
    note: 'One source per entry, in order, and the img last: a WebP for browsers that take it, and a portrait crop when the column is narrower than 480 pixels. Resize the window past that width and the picture changes.',
    snippet: defineSnippet({
      id: 'image-angular-sources',
      language: 'angular',
      label: 'By format, and by width',
      source:
        '<div slImage alt="…" ratio="landscape" [sources]="sources" [src]="site.photo"></div>',
    }),
  },
  {
    id: 'status',
    title: 'Four statuses, reported as facts',
    note: 'idle when nothing was asked for, loading while the request is out, loaded once it answered, error after the second URL failed too. The status is derived from the element and reported through onStatusChange; a status passed in wins and is never reported.',
    snippet: defineSnippet({
      id: 'image-angular-status',
      language: 'angular',
      label: 'Reading the status',
      source:
        '<div\n  slImage\n  alt="…"\n  ratio="landscape"\n  [src]="site.photo"\n  (statusChange)="log(site.id, $event)"\n></div>',
    }),
  },
  {
    id: 'interactive',
    title: 'A thumbnail that is a link, and one that is a button',
    note: 'render puts the root on an a or a button; the family paints the focus ring outside the box and a strong edge on hover, and touches the photograph itself for neither. A picture that opens a dialog is a button, and the dialog is where the zoom lives.',
    snippet: defineSnippet({
      id: 'image-angular-interactive',
      language: 'angular',
      label: 'A picture that opens something',
      source:
        '<button\n  slImage\n  type="button"\n  alt="Open the photo of site 12"\n  ratio="square"\n  [src]="site.photo"\n  (click)="open()"\n></button>',
    }),
  },
  {
    id: 'in-context',
    title: 'A grid of survey sites',
    note: 'Six cards, each with a bordered landscape thumbnail as its media: three arrived, one is still on its way, one failed, one is a portrait cropped to its top. The captions sit under the pictures because a framed image is exactly the frame’s height.',
    snippet: defineSnippet({
      id: 'image-angular-in-context',
      language: 'angular',
      label: 'In a card',
      source:
        '<article slCard>\n  <div slCardMedia>\n    <div slImage alt="" bordered ratio="landscape" [src]="site.photo"></div>\n  </div>\n  <div slCardHeader>{{ site.name }}</div>\n</article>',
    }),
  },
  {
    id: 'accessibility',
    title: 'The alt decides what a reader hears',
    note: 'An informative picture says what it shows; a decorative one beside its own text has alt=""; a picture that is a link says what the link does. The img is never removed, so the name holds in every status, and a caption is a figcaption rather than a repeat of the alt.',
    snippet: defineSnippet({
      id: 'image-angular-accessibility',
      language: 'angular',
      label: 'Three kinds of alt',
      source:
        '<div slImage alt="Rockfall debris below the red escarpment" [src]="finding.photo"></div>\n<div slImage alt="" ratio="landscape" [src]="site.photo"></div>\n<button slImage type="button" alt="Open the full-size photo of site 12" [src]="site.photo"></button>',
    }),
  },
];

export const ANGULAR_IMAGE_DOCS = {
  image: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'src',
        'string',
        '—',
        'Image',
        'The picture. Absent, nothing is requested and the status is idle',
      ],
      [
        'alt',
        'string',
        '—',
        'Image',
        'What the picture shows, or "" for a picture that is decoration beside its own text. Written on the component’s own img; a projected img carries its own',
      ],
      ['srcset', 'string', '—', 'Image', 'The platform’s candidates by width or density'],
      ['sizes', 'string', '—', 'Image', 'The platform’s sizes, beside srcSet'],
      [
        'width',
        'number',
        '—',
        'Image',
        'The intrinsic width; with height, reserves the ratio before the picture loads',
      ],
      ['height', 'number', '—', 'Image', 'The intrinsic height, beside width'],
      [
        'ratio',
        "'square' | 'landscape' | 'portrait' | 'video' | 'wide' | number | [number, number]",
        '—',
        'Image',
        'Renders an AspectRatio inside the root and lays the picture out framed',
      ],
      [
        'layout',
        "'intrinsic' | 'fill' | 'framed'",
        'intrinsic',
        'Image',
        'The picture’s own size, the parent’s box, or the frame’s. A ratio implies framed unless one is stated',
      ],
      [
        'fit',
        "'cover' | 'contain' | 'fill' | 'none' | 'scale-down'",
        'cover',
        'Image',
        'What the picture does about a box that is not its shape: object-fit',
      ],
      [
        'position',
        "'center' | 'top' | 'bottom' | 'start' | 'end' | string",
        'center',
        'Image',
        'The focal point a crop keeps. start and end mirror in RTL; any other value is written on the instance',
      ],
      ['radius', "'none' | 'sm' | 'md' | 'lg'", 'none', 'Image', 'The corner, on the radius scale'],
      [
        'bordered',
        'boolean',
        'false',
        'Image',
        'A subtle inset edge, for a photograph of a white wall on a white page',
      ],
      [
        'placeholder',
        "'none' | 'surface' | 'blur'",
        'surface',
        'Image',
        'What stands under the picture before it arrives: nothing, the sunken ground, or placeholderSrc blurred',
      ],
      [
        'placeholderSrc',
        'string',
        '—',
        'Image',
        'The small picture placeholder="blur" scales and blurs; a data URI, usually',
      ],
      [
        '[slImagePlaceholder]',
        'projected content',
        '—',
        'Image',
        'Content over the placeholder’s ground while the picture is on its way — an slSkeleton',
      ],
      [
        'fallbackSrc',
        'string',
        '—',
        'Image',
        'A second URL to try when src fails, on the component’s own img; error is reached only if it fails too',
      ],
      [
        '[slImageFallback]',
        'projected content',
        '—',
        'Image',
        'Content of the fallback in place of the glyph, once the picture has failed',
      ],
      [
        'sources',
        '{ srcSet, media?, type?, sizes? }[]',
        '—',
        'Image',
        'The sources of a picture element, in order; the img is written last',
      ],
      [
        'loading',
        "'lazy' | 'eager'",
        'lazy',
        'Image',
        'The platform’s loading. priority makes it eager unless it is stated',
      ],
      ['decoding', "'async' | 'sync' | 'auto'", 'async', 'Image', 'The platform’s decoding'],
      [
        'priority',
        'boolean',
        'false',
        'Image',
        'The picture the page is waiting for: eager, with fetchpriority high, unless either is stated',
      ],
      [
        'status',
        "'idle' | 'loading' | 'loaded' | 'error'",
        '—',
        'Image',
        'Where the picture is. Supplied, it wins over what the family derives from the element',
      ],
    ]),
    events: [
      {
        name: '(statusChange)',
        payload: "'idle' | 'loading' | 'loaded' | 'error'",
        when: 'The derived status changed: loaded when the picture reported, error after the second URL failed too. Never for a status passed in.',
      },
      {
        name: '(load), (error) on img[slImageMedia]',
        payload: 'Event',
        when: 'The element’s own events, on the img the consumer projected; the family listens beside the consumer and replaces nothing.',
      },
    ] satisfies EventRow[],
    composition: apiRows([
      [
        '[slImage]',
        'attribute selector',
        '—',
        'your element',
        'The component attaches to the element you wrote — a div, an a, a button, a figure — and it stays yours',
      ],
      [
        'img[slImageMedia]',
        'directive on your img',
        '—',
        'a projected img',
        'The picture in the consumer’s own element — the one ngSrc and NgOptimizedImage belong on — while the family keeps reading the load',
      ],
      [
        'exportAs slImage, slImageMedia',
        'template reference',
        '—',
        'SlImage, SlImageMedia',
        'Reaches the instance from a template',
      ],
      [
        'class, style',
        'attributes',
        '—',
        'your element',
        'Stay on the host, which is the root; the component writes only data attributes and one custom property beside them',
      ],
      [
        '--slotted-image-position',
        'custom property',
        '—',
        'an instance',
        'What a custom focal point writes on the root; --slotted-aspect-ratio is what a custom ratio writes on the frame',
      ],
      [
        'provideImageDefaults',
        'ImageDefaults',
        '—',
        'Application',
        'Sets layout, fit, position, radius, bordered, placeholder, loading and decoding once for an injector; an input still wins',
      ],
    ]),
    accessibility: [
      'There is no image pattern in the WAI-ARIA Authoring Practices; the applicable guidance is the W3C WAI alt decision tree, and the family follows it by writing the alt on its own img and leaving a projected img’s alone: an informative picture says what it shows, a decorative one says "" and is skipped, a functional one (a link, a button) says what it does.',
      'The img is never taken out of the DOM. While the picture loads it is transparent over the ground; after it fails it takes no box and the fallback takes its place — but its alt is still the name a reader hears, so a broken thumbnail is announced as what it was meant to show.',
      'The placeholder is aria-hidden and the blurred preview inside it has an empty alt: neither is content. The fallback is not hidden, because a consumer may put a retry button in it, and it is out of the flow until the picture fails so that button is neither focusable nor announced before then.',
      'A picture is not a control and paints nothing at rest. The component attaches to an a or a button, and for exactly that case the family paints the focus ring outside the box and a 2px strong edge on hover — color and geometry, not the photograph — and holds the hover back on a disabled button.',
      'The picture crosses over the ground on --slotted-duration-short, which prefers-reduced-motion collapses to 1ms in the theme; nothing loops. Under forced colors the ground becomes Canvas, the edge ButtonBorder, and the glyph keeps currentColor; the photograph is left alone by the user agent’s own rule.',
      'A caption belongs in a figcaption after the frame, and is not repeated in the alt; zoom and preview belong to Dialog, opened from a host that is a button.',
    ],
    snippets: [
      defineSnippet({
        id: 'image-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div\n  data-ui="image"\n  data-part="root"\n  data-layout="framed"\n  data-fit="cover"\n  data-position="center"\n  data-radius="md"\n  data-placeholder="surface"\n  data-status="loaded"\n>\n  <div data-ui="aspect-ratio" data-part="root" data-ratio="landscape">\n    <img\n      data-part="image"\n      src="…"\n      alt="The fjord lookout at site 12"\n      loading="lazy"\n      decoding="async"\n    />\n    <span data-part="placeholder" aria-hidden="true"></span>\n    <span data-part="fallback"></span>\n  </div>\n</div>',
      }),
      defineSnippet({
        id: 'image-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='image'] {\n  --slotted-image-radius: var(--slotted-radius-lg);\n  --slotted-image-placeholder-background: var(--slotted-tone-secondary-surface);\n  --slotted-image-placeholder-blur: 1.5rem;\n}\n\n/* Logotypes shown whole, on a neutral tile. */\n[data-ui='image'][data-fit='contain'] {\n  --slotted-image-background: var(--slotted-surface-sunken);\n}",
      }),
    ],
  },
} as const;
