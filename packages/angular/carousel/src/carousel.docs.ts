import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import carouselTokens from '@slotted/styles/carousel/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_CAROUSEL_TOKENS = carouselTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Carousel decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideCarouselDefaults,\n  SlCarousel,\n  SlCarouselAutoplay,\n  SlCarouselControls,\n  SlCarouselCounter,\n  SlCarouselIndicator,\n  SlCarouselIndicators,\n  SlCarouselIndicatorTemplate,\n  SlCarouselNext,\n  SlCarouselPrevious,\n  SlCarouselSlide,\n  SlCarouselViewport,\n} from '@slotted/angular/carousel';",
  selector: 'section[slCarousel]',
  exportAs: 'slCarousel',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'section[slCarousel]',
    required: true,
    purpose:
      'The region, with aria-roledescription "carousel" and the name the consumer gives it. A one-cell grid: previous, next and an overlay bar written as its children stand over the viewport. Carries data-orientation, data-transition, data-align, data-arrows, data-size, and data-playing, data-paused, data-dragging and data-measured.',
  },
  {
    part: 'viewport',
    element: 'div[slCarouselViewport]',
    required: true,
    purpose:
      'The scroller with snap — or, in fade, the stack — and a tab stop of its own: the arrows of its axis, PageUp, PageDown, Home and End move a page.',
  },
  {
    part: 'slide',
    element: 'div[slCarouselSlide]',
    required: true,
    purpose:
      'A group named "3 of 8" unless it carries a name; data-current on the slides of the page shown, data-inview on the ones in view, and inert on the ones that are not.',
  },
  {
    part: 'previous',
    element: 'button[slCarouselPrevious]',
    required: false,
    purpose:
      'Shows the previous page. aria-disabled at the first page without a loop, so a focused control keeps its focus. Over the viewport as a child of the root, in the bar as a child of controls.',
  },
  {
    part: 'next',
    element: 'button[slCarouselNext]',
    required: false,
    purpose: 'Shows the next page, with the same rules as previous at the last page.',
  },
  {
    part: 'controls',
    element: 'div[slCarouselControls]',
    required: false,
    purpose:
      'The bar the controls stand in: placement "below" under the viewport, "overlay" on a pill of the raised surface over its foot.',
  },
  {
    part: 'autoplay',
    element: 'button[slCarouselAutoplay]',
    required: false,
    purpose:
      'The rotation control, named by the action it performs — Stop rotation, Resume rotation — with no pressed state. Hidden in a carousel that does not rotate. Written first, so it is first in the tab sequence.',
  },
  {
    part: 'indicators',
    element: 'div[slCarouselIndicators] role="tablist"',
    required: false,
    purpose:
      'The slide picker, one tab stop. variant "dots", "line" or "thumbnails"; past eight pages the dots window themselves (data-adaptive).',
  },
  {
    part: 'indicator',
    element: 'button[slCarouselIndicator] role="tab"',
    required: false,
    purpose:
      'One page. aria-selected on the page shown, aria-controls naming its first slide. While the rotation runs the current one fills over the delay.',
  },
  {
    part: 'counter',
    element: 'span[slCarouselCounter] aria-hidden',
    required: false,
    purpose: '"3 / 8" in tabular figures, isolated so a right-to-left page reads it first to last.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A slideshow of the workshop’s pieces with every axis below the canvas. Press next, drag with the mouse, swipe on a touch screen, or focus the viewport and use the arrows: the dots, the counter and the slide names follow.',
    snippet: defineSnippet({
      id: 'carousel-angular-playground',
      language: 'angular',
      label: 'A slideshow with arrows, dots and a counter',
      source: `<section slCarousel aria-label="Autumn Collection">
  <div slCarouselViewport>
    @for (piece of pieces; track piece.name) {
      <div slCarouselSlide>
        <div slImage ratio="landscape" [alt]="piece.name" [src]="piece.image"></div>
      </div>
    }
  </div>
  <button slCarouselPrevious></button>
  <button slCarouselNext></button>
  <div slCarouselControls>
    <div slCarouselIndicators></div>
    <span slCarouselCounter></span>
  </div>
</section>`,
    }),
  },
  {
    id: 'orientation',
    title: 'A column of slides',
    note: 'orientation="vertical" turns the scroller and both arrows a quarter; the arrows of the keyboard that page it are now Up and Down, and Left and Right are left to the page. The column needs a height, which --slotted-carousel-viewport-size gives it.',
    snippet: defineSnippet({
      id: 'carousel-angular-orientation',
      language: 'angular',
      label: 'Vertical, two slides per view',
      source: `<section slCarousel aria-label="Novidades" orientation="vertical" [slidesPerView]="2">
  <div slCarouselViewport>…</div>
  <button slCarouselPrevious></button>
  <button slCarouselNext></button>
</section>`,
    }),
  },
  {
    id: 'transition',
    title: 'Slide or fade',
    note: 'slide moves the track on a spring timed by the theme’s long duration, which keeps the speed of a hand that lets go or of a movement it interrupts; fade stacks the slides and crossfades them — the arriving one on the enter curve, the leaving one faster on the exit curve. Under reduced motion both change at once.',
    snippet: defineSnippet({
      id: 'carousel-angular-transition',
      language: 'angular',
      label: 'The same notices, crossfaded',
      source: `<section slCarousel aria-label="Avisos" loop transition="fade">
  <div slCarouselViewport>…</div>
  <div slCarouselControls>
    <button slCarouselPrevious></button>
    <div slCarouselIndicators></div>
    <button slCarouselNext></button>
  </div>
</section>`,
    }),
  },
  {
    id: 'align',
    title: 'Centred, with the neighbours showing',
    note: 'align="center" makes every slide a page and centres it; --slotted-carousel-peek pads the viewport so the slides either side show at its edges. Press a slide that peeks and it comes to the centre.',
    snippet: defineSnippet({
      id: 'carousel-angular-align',
      language: 'angular',
      label: 'Centre alignment and a peek',
      source: `<section slCarousel align="center" aria-label="One-of-a-kind pieces" class="peek">
  <div slCarouselViewport>…</div>
  <button slCarouselPrevious></button>
  <button slCarouselNext></button>
</section>
<!-- .peek { --slotted-carousel-peek: 2.5rem; } -->`,
    }),
  },
  {
    id: 'arrows',
    title: 'Over the picture, or beside the row',
    note: 'arrows="inset" stands previous and next over the ends of the viewport, for a slideshow; "outside" gives them columns of their own, so a row of cards keeps its whole width and no arrow covers the first card.',
    snippet: defineSnippet({
      id: 'carousel-angular-arrows',
      language: 'angular',
      label: 'Arrows outside a row of cards',
      source: `<section slCarousel aria-label="Mais vendidos" arrows="outside" [slidesPerView]="3">
  <div slCarouselViewport>…</div>
  <button slCarouselPrevious></button>
  <button slCarouselNext></button>
</section>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Three control sizes',
    note: 'size steps the round controls along the control scale — 30, 34 and 38 pixels at comfortable — and the density shrinks them with every other control. The dots keep the 24-pixel target in every size.',
    snippet: defineSnippet({
      id: 'carousel-angular-sizes',
      language: 'angular',
      label: 'sm, md and lg',
      source: `<section slCarousel aria-label="Pequeno" size="sm">…</section>
<section slCarousel aria-label="Grande" size="lg">…</section>`,
    }),
  },
  {
    id: 'indicators',
    title: 'Dots, a line, and many pages',
    note: 'dots draw the current page as a bar three dots long; line shares the width between segments; past eight pages the dots window themselves, the ones two steps away shrink and the rest fold away while staying in the arrow ring.',
    snippet: defineSnippet({
      id: 'carousel-angular-indicators',
      language: 'angular',
      label: 'The two families’ marks',
      source: `<div slCarouselIndicators></div>
<div slCarouselIndicators variant="line"></div>`,
    }),
  },
  {
    id: 'thumbnails',
    title: 'A product gallery',
    note: 'variant="thumbnails" with an slCarouselIndicatorTemplate draws each indicator from the consumer’s picture. The strip scrolls on its own when it holds more than it shows, and keeps the current picture in view — one carousel, nothing to synchronise.',
    snippet: defineSnippet({
      id: 'carousel-angular-thumbnails',
      language: 'angular',
      label: 'Thumbnails as the slide picker',
      source: `<div slCarouselIndicators aria-label="Fotografias" variant="thumbnails">
  <ng-template slCarouselIndicatorTemplate let-page>
    <button slCarouselIndicator [page]="page">
      <img [alt]="photos[page].alt" [src]="photos[page].thumbnail" />
    </button>
  </ng-template>
</div>`,
    }),
  },
  {
    id: 'autoplay',
    title: 'A rotation the reader controls',
    note: 'autoplay turns it on; the current dot fills over the delay. Hovering holds it with the time that was left, a hidden browser tab holds it, and the first keyboard focus inside stops it until the rotation control starts it again.',
    snippet: defineSnippet({
      id: 'carousel-angular-autoplay',
      language: 'angular',
      label: 'Six seconds a page, the control first',
      source: `<section slCarousel aria-label="Destaques" loop [autoplay]="6000">
  <div slCarouselViewport>…</div>
  <div slCarouselControls placement="overlay">
    <button slCarouselAutoplay></button>
    <div slCarouselIndicators></div>
  </div>
</section>`,
    }),
  },
  {
    id: 'multiple',
    title: 'A row of cards that pages by what it shows',
    note: '[slidesPerView]="3" sizes the cards; the pages are read from the layout, so the row pages by three and its last page ends flush. --slotted-carousel-slide-min-size keeps a card readable when the container narrows: at 240 pixels the same carousel shows one card and the edge of the next.',
    snippet: defineSnippet({
      id: 'carousel-angular-multiple',
      language: 'angular',
      label: 'Three per view, paged by three',
      source: `<section slCarousel aria-label="Mais vendidos" arrows="outside" [slidesPerView]="3">
  <div slCarouselViewport>
    @for (piece of pieces; track piece.name) {
      <div slCarouselSlide [attr.aria-label]="piece.name">
        <article slCard>…</article>
      </div>
    }
  </div>
  <button slCarouselPrevious></button>
  <button slCarouselNext></button>
  <div slCarouselControls>
    <div slCarouselIndicators variant="line"></div>
  </div>
</section>`,
    }),
  },
  {
    id: 'loop',
    title: 'Past the last page',
    note: 'loop sends next on the last page to the first and previous on the first to the last; the track travels back rather than cloning a slide, so ids, focus and form state stay single. Without it the controls at the ends say they have nowhere to go.',
    snippet: defineSnippet({
      id: 'carousel-angular-loop',
      language: 'angular',
      label: 'A loop',
      source: `<section slCarousel aria-label="Collection" loop>…</section>`,
    }),
  },
  {
    id: 'controlled',
    title: 'A page the application owns',
    note: '[(page)] and (pageRequest) make the page the application’s; the request carries the reason — pointer, keyboard, scroll, timeout, resize, programmatic. The buttons outside the carousel move it through the same state, and the log shows each request.',
    snippet: defineSnippet({
      id: 'carousel-angular-controlled',
      language: 'angular',
      label: 'Controlled page, requests logged',
      source: `<section slCarousel aria-label="Collection" [(page)]="page" (pageRequest)="log($event.reason)">
  …
</section>`,
    }),
  },
  {
    id: 'states',
    title: 'Every control in every state',
    note: 'Hover lifts a round control onto the neutral hover ground, a press shrinks it to 94 per cent, focus draws the ring two pixels out; at an end it keeps its place in the disabled ink. Use Tab to see the rings.',
    snippet: defineSnippet({
      id: 'carousel-angular-states',
      language: 'angular',
      label: 'The controls the reader presses',
      source: `<div slCarouselControls>
  <button slCarouselPrevious></button>
  <div slCarouselIndicators></div>
  <button slCarouselNext></button>
</div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'Cards of different heights stand at the height of the tallest; a long Portuguese name wraps inside its card; a right-to-left page mirrors the track, the arrows and the dots, and the counter still reads first to last.',
    snippet: defineSnippet({
      id: 'carousel-angular-content',
      language: 'angular',
      label: 'Long names, uneven heights, right to left',
      source: `<div dir="rtl">
  <section slCarousel aria-label="معرض" [slidesPerView]="2">…</section>
</div>`,
    }),
  },
  {
    id: 'empty',
    title: 'Nothing yet, and loading',
    note: 'With no slide the controls are disabled and the counter reads 0 / 0; the empty state is a result-state the consumer puts in the viewport. While the pieces load, skeleton slides with the same anatomy hold the height.',
    snippet: defineSnippet({
      id: 'carousel-angular-empty',
      language: 'angular',
      label: 'An empty collection',
      source: `<section slCarousel aria-label="Collection">
  <div slCarouselViewport>
    <section slResultState status="empty">
      <div slResultStateContent>
        <div slResultStateTitle>No pieces in this collection</div>
      </div>
    </section>
  </div>
</section>`,
    }),
  },
  {
    id: 'composition',
    title: 'Inside a product page',
    note: 'The gallery beside the buy box, as a product page lays them out: the picture and its thumbnails on the start, the name, the price and the action on the end. the instance’s scrollToSlide, reached through exportAs takes the gallery to the picture of the colour chosen.',
    snippet: defineSnippet({
      id: 'carousel-angular-composition',
      language: 'angular',
      label: 'A gallery driven by a colour choice',
      source: `<section slCarousel #gallery="slCarousel" aria-label="Fotografias">…</section>
<div slSegmentedControl aria-label="Cor" (valueChange)="gallery.scrollToSlide(photoOf($event))">
  …
</div>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Tab reaches the rotation control, the viewport, the arrows and then one tab stop in the dots. In the viewport the arrows, PageUp, PageDown, Home and End move a page; in the dots the arrows move and show, and stop at the ends. Holding a key moves without animating.',
    snippet: defineSnippet({
      id: 'carousel-angular-keyboard',
      language: 'angular',
      label: 'Nothing to wire',
      source: `<section slCarousel aria-label="Collection">
  <div slCarouselViewport>…</div>
  <div slCarouselControls>
    <div slCarouselIndicators></div>
  </div>
</section>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'pageRequest',
    payload: 'ChangeRequest<number> — value, previous, reason, source, cancel()',
    when: 'Before the page moves: a control or an indicator ("pointer" or "keyboard"), a key in the viewport ("keyboard"), a swipe, a trackpad or a wheel that came to rest ("scroll"), a mouse drag ("pointer"), the rotation ("timeout"), a page that stopped existing ("resize"), scrollTo or scrollToSlide ("programmatic"). cancel() keeps the page; a refused request brings the viewport back.',
  },
  {
    name: 'pageChange',
    payload: 'number',
    when: 'After a request nobody cancelled, for [(page)].',
  },
  {
    name: 'playingRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the rotation starts or stops: the rotation control ("pointer" or "keyboard"), keyboard focus entering ("keyboard"), the reader moving the page by hand ("pointer", "keyboard", "scroll"), the last page reached without a loop ("timeout").',
  },
  {
    name: 'playingChange',
    payload: 'boolean',
    when: 'After a rotation request nobody cancelled, for [(playing)].',
  },
  {
    name: '(click), (keydown), (focusin)',
    payload: 'the elements’ own events',
    when: 'Whenever the elements fire them; a handler that calls preventDefault() first stops the family’s answer.',
  },
];

export const ANGULAR_CAROUSEL_DOCS = {
  carousel: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'page',
        'number',
        '—',
        'slCarousel',
        'Present means the consumer owns the page, counted from 0; [(page)] binds both ways',
      ],
      ['defaultPage', 'number', '0', 'slCarousel', 'The page an uncontrolled carousel starts on'],
      [
        'autoplay',
        'boolean | number',
        'false',
        'slCarousel',
        'Turns the rotation on: present as an attribute waits autoplayDelay, a number waits that many milliseconds',
      ],
      [
        'autoplayDelay',
        'number',
        '5000',
        'provideCarouselDefaults',
        'The wait on a page when autoplay carries no number; written as --slotted-carousel-autoplay-delay',
      ],
      [
        'playing',
        'boolean',
        '—',
        'slCarousel',
        'Present means the consumer owns whether the rotation runs; [(playing)] binds both ways',
      ],
      [
        'defaultPlaying',
        'boolean',
        'true with autoplay, false under reduced motion',
        'slCarousel',
        'Whether an uncontrolled rotation starts running',
      ],
      [
        'loop',
        'boolean',
        'false',
        'slCarousel, provideCarouselDefaults',
        'Next on the last page goes to the first; without it the rotation stops there',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'slCarousel, provideCarouselDefaults',
        'The axis of the track, the arrows and the keys',
      ],
      [
        'transition',
        "'slide' | 'fade'",
        'slide',
        'slCarousel, provideCarouselDefaults',
        'A scroll with snap, or slides stacked and crossfaded',
      ],
      [
        'align',
        "'start' | 'center'",
        'start',
        'slCarousel, provideCarouselDefaults',
        'Where a page snaps; center makes every slide a page',
      ],
      [
        'arrows',
        "'inset' | 'outside'",
        'inset',
        'slCarousel, provideCarouselDefaults',
        'Where previous and next stand when they are children of the root',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slCarousel, provideCarouselDefaults',
        'The step of the control scale the round controls take',
      ],
      [
        'slidesPerView',
        'number',
        '1',
        'slCarousel',
        'Written as --slotted-carousel-slides-per-view; unset, a container query of the consumer’s may write it',
      ],
      [
        'slidesPerMove',
        "number | 'page'",
        'page',
        'slCarousel',
        'How many slides a page moves; page is the slides wholly in view',
      ],
      [
        'draggable',
        'boolean',
        'true',
        'slCarousel, provideCarouselDefaults',
        'Whether a mouse drags the row; a finger and a trackpad always scroll it',
      ],
      [
        'messages',
        'PartialMessages<CarouselMessages>',
        '—',
        'slCarousel',
        'Words laid over the language in force, key by key: roleDescription, slide, indicators, indicator, previous, next, stop, start, viewport, announce — with {index}, {page} and {count}',
      ],
      [
        'placement',
        "'below' | 'overlay'",
        'below',
        'slCarouselControls',
        'Under the viewport, or over its foot on a raised pill',
      ],
      [
        'variant',
        "'dots' | 'line' | 'thumbnails'",
        'dots',
        'slCarouselIndicators',
        'The mark of each page; thumbnails is the consumer’s picture inside each indicator',
      ],
      ['page', 'number', '—', 'slCarouselIndicator', 'The page this indicator shows'],
    ]),
    composition: apiRows([
      [
        'exportAs',
        "'slCarousel'",
        '—',
        'section[slCarousel]',
        'scrollTo(page), scrollToSlide(index) and refresh(): the actions a consumer cannot express declaratively',
      ],
      [
        'slCarouselIndicatorTemplate',
        'ng-template, let-page',
        '—',
        'inside slCarouselIndicators',
        'Draws each indicator from the consumer’s template, re-rendered per page',
      ],
      [
        'ng-content',
        'projected content',
        'the chevron, play or pause glyph',
        'previous, next, autoplay',
        'Replaces the glyph; the accessible name stays the message unless aria-label is written',
      ],
      [
        'aria-label',
        'static attribute',
        'the message',
        'viewport, previous, next, autoplay, indicators, indicator',
        'Read with HostAttributeToken before the host binding writes the family’s word, so it survives',
      ],
      [
        'provideCarouselDefaults',
        '{ orientation, transition, align, arrows, size, loop, draggable, autoplayDelay }',
        '—',
        'an injector',
        'The decisions an application takes once',
      ],
    ]),
    accessibility: [
      'The root is a region with aria-roledescription "carousel" and the consumer’s name; each slide is a group with aria-roledescription "slide" and the name "3 of 8", as the APG carousel asks, and a name the consumer gives a slide is never replaced, because the engine skips a slide that already carries one.',
      'The slides out of view are inert, so the Tab key and a screen reader reach only what the reader can see; a press on a slide that peeks reaches the viewport, which brings that slide in.',
      'Previous and next at an end without a loop are aria-disabled rather than disabled, so the focus they hold is not dropped onto the page; a press does nothing and the disabled ink says so.',
      'The slide picker is the APG tabs pattern: one tab stop, arrows that move and show and stop at the ends, Home and End. Each tab names its page and controls its first slide; the slides stay groups because a page can hold several.',
      'A page the reader asked for is announced once through the shared live announcer — "Slide 3 of 8" — and nothing is announced while the rotation turns, so a screen reader is never interrupted by a page the reader did not ask for.',
      'The rotation never starts unless asked, does not start under reduced motion, pauses on hover and on a hidden browser tab, and stops on the first keyboard focus inside; its control is named by its action and carries no pressed state.',
    ],
    snippets: [
      defineSnippet({
        id: 'carousel-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<section aria-label="Autumn Collection" aria-roledescription="carousel" data-ui="carousel">
  <div aria-label="Slides" data-part="viewport" role="group" tabindex="0">
    <div
      aria-label="1 of 5"
      aria-roledescription="slide"
      data-current
      data-inview
      data-part="slide"
      role="group"
    ></div>
    <div
      aria-label="2 of 5"
      aria-roledescription="slide"
      data-part="slide"
      inert
      role="group"
    ></div>
  </div>
  <button
    aria-disabled="true"
    aria-label="Previous slide"
    data-part="previous"
    type="button"
  ></button>
  <button aria-label="Next slide" data-part="next" type="button"></button>
  <div data-part="controls" data-placement="below">
    <div aria-label="Choose slide" data-part="indicators" data-variant="dots" role="tablist">
      <button aria-selected="true" data-current data-part="indicator" role="tab"></button>
    </div>
    <span aria-hidden="true" data-part="counter">1 / 5</span>
  </div>
</section>`,
      }),
      defineSnippet({
        id: 'carousel-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='carousel'] {
  --slotted-carousel-gap: var(--slotted-space-4);
  --slotted-carousel-radius: var(--slotted-radius-md);
  --slotted-carousel-duration: var(--slotted-duration-medium);
  --slotted-carousel-slide-min-size: 12rem;
}`,
      }),
    ],
  },
} as const;
