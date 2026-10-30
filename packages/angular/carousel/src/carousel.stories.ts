import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody, SlCardHeader, SlCardMedia } from '@slotted/angular/card';
import { SlImage } from '@slotted/angular/image';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlSegment, SlSegmentedControl } from '@slotted/angular/segmented-control';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlHeading, SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlCarousel } from './carousel';
import type { CarouselPageRequest } from './carousel';
import {
  SlCarouselAutoplay,
  SlCarouselControls,
  SlCarouselCounter,
  SlCarouselIndicator,
  SlCarouselIndicators,
  SlCarouselIndicatorTemplate,
  SlCarouselNext,
  SlCarouselPrevious,
  SlCarouselSlide,
  SlCarouselViewport,
} from './carousel-parts';
import { ANGULAR_CAROUSEL_DOCS, ANGULAR_CAROUSEL_TOKENS } from './carousel.docs';

/**
 * The catalogue every demonstration draws from: eight pieces of a ceramics
 * workshop, each an SVG data URI, so the page renders offline and shows the
 * pictures the React page and the harness show.
 */
export interface Piece {
  name: string;
  price: string;
  glaze: string;
  image: string;
}

export const PIECES: readonly Piece[] = [
  {
    name: 'Terracotta Amphora',
    price: '$89.00',
    glaze: 'salt-glazed stoneware',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23efe6da%22/%3E%3Cstop offset=%221%22 stop-color=%22%23e2d4c1%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%238f4529%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%23c96f4a%22/%3E%3Cstop offset=%221%22 stop-color=%22%238f4529%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23e2d4c1%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M340 380 C300 330 300 270 330 230 C345 210 345 190 335 170 L465 170 C455 190 455 210 470 230 C500 270 500 330 460 380 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
  {
    name: 'Sage Bottle',
    price: '$64.00',
    glaze: 'matte porcelain',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23dfe7e4%22/%3E%3Cstop offset=%221%22 stop-color=%22%23c9d6d1%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%2333584e%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%235e8c7f%22/%3E%3Cstop offset=%221%22 stop-color=%22%2333584e%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23c9d6d1%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M370 385 C340 360 335 300 360 260 C378 232 385 210 385 150 L415 150 C415 210 422 232 440 260 C465 300 460 360 430 385 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
  {
    name: 'Lavender Bowl',
    price: '$48.00',
    glaze: 'stoneware with olive ash',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23e8e3ef%22/%3E%3Cstop offset=%221%22 stop-color=%22%23d6cfe2%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%234b3f72%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%237b6aa8%22/%3E%3Cstop offset=%221%22 stop-color=%22%234b3f72%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23d6cfe2%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M290 300 L510 300 C505 350 465 385 400 385 C335 385 295 350 290 300 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
  {
    name: 'Honey Pitcher',
    price: '$72.00',
    glaze: 'honey-glazed earthenware',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23f1e9d8%22/%3E%3Cstop offset=%221%22 stop-color=%22%23e3d5b8%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%239a6f22%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%23d4a24c%22/%3E%3Cstop offset=%221%22 stop-color=%22%239a6f22%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23e3d5b8%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M345 385 C325 330 330 260 360 220 L355 185 L445 185 L440 220 C470 260 475 330 455 385 Z M455 240 C505 240 505 320 458 330 L460 312 C485 305 485 260 452 258 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
  {
    name: 'Indigo Cylinder',
    price: '$58.00',
    glaze: 'cobalt stoneware',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23e1e6ee%22/%3E%3Cstop offset=%221%22 stop-color=%22%23cbd3e0%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%232c4366%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%234f6d9a%22/%3E%3Cstop offset=%221%22 stop-color=%22%232c4366%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23cbd3e0%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M350 385 L350 190 C350 180 450 180 450 190 L450 385 C450 395 350 395 350 385 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
  {
    name: 'Dusty Rose Amphora',
    price: '$92.00',
    glaze: 'polished terracotta',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23efe1e1%22/%3E%3Cstop offset=%221%22 stop-color=%22%23e0cbcb%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%237d3a42%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%23b5636b%22/%3E%3Cstop offset=%221%22 stop-color=%22%237d3a42%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23e0cbcb%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M340 380 C300 330 300 270 330 230 C345 210 345 190 335 170 L465 170 C455 190 455 210 470 230 C500 270 500 330 460 380 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
  {
    name: 'Moss Bottle',
    price: '$66.00',
    glaze: 'celadon-glazed stoneware',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23e4ebdf%22/%3E%3Cstop offset=%221%22 stop-color=%22%23d0dbc7%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%234d6533%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%237d9a5b%22/%3E%3Cstop offset=%221%22 stop-color=%22%234d6533%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23d0dbc7%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M370 385 C340 360 335 300 360 260 C378 232 385 210 385 150 L415 150 C415 210 422 232 440 260 C465 300 460 360 430 385 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
  {
    name: 'Charcoal Cylinder',
    price: '$61.00',
    glaze: 'reduction-fired black stoneware',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23eee8e2%22/%3E%3Cstop offset=%221%22 stop-color=%22%23ddd2c6%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%231f1b18%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%233f3a36%22/%3E%3Cstop offset=%221%22 stop-color=%22%231f1b18%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23ddd2c6%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M350 385 L350 190 C350 180 450 180 450 190 L450 385 C450 395 350 395 350 385 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
];

/** Three notices a shop rotates on its front page. */
export const NOTICES = [
  {
    title: 'Autumn Collection',
    body: 'Twelve new salt-glazed stoneware pieces arrive in stores on October 14.',
  },
  {
    title: 'Free shipping',
    body: 'Orders over $60 ship free to the contiguous United States.',
  },
  {
    title: 'Open workshop',
    body: 'On Saturday mornings, the kiln on Flower Street opens to anyone who wants to watch the firing.',
  },
] as const;

const CAROUSEL = [
  SlCarousel,
  SlCarouselAutoplay,
  SlCarouselControls,
  SlCarouselCounter,
  SlCarouselIndicator,
  SlCarouselIndicators,
  SlCarouselIndicatorTemplate,
  SlCarouselNext,
  SlCarouselPrevious,
  SlCarouselSlide,
  SlCarouselViewport,
];

const DIRECTIVES = [
  ...CAROUSEL,
  SlButton,
  SlCard,
  SlCardBody,
  SlCardHeader,
  SlCardMedia,
  SlHeading,
  SlImage,
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
  SlSegment,
  SlSegmentedControl,
  SlSkeleton,
  SlText,
];

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

const photos = (list: string, ratio = 'landscape') => `
  @for (piece of ${list}; track piece.name) {
    <div slCarouselSlide>
      <div slImage ratio="${ratio}" [alt]="piece.name + ', ' + piece.glaze" [src]="piece.image"></div>
    </div>
  }`;

const cards = (list: string) => `
  @for (piece of ${list}; track piece.name) {
    <div slCarouselSlide [attr.aria-label]="piece.name">
      <article slCard>
        <div slCardMedia><div slImage alt="" ratio="square" [src]="piece.image"></div></div>
        <div slCardHeader><h3 slHeading size="md">{{ piece.name }}</h3></div>
        <div slCardBody><p slText size="sm" tone="muted">{{ piece.glaze }} · {{ piece.price }}</p></div>
      </article>
    </div>
  }`;

const notices = `
  @for (notice of notices; track notice.title) {
    <div slCarouselSlide>
      <article slCard>
        <div slCardHeader><h3 slHeading size="lg">{{ notice.title }}</h3></div>
        <div slCardBody><p slText tone="muted">{{ notice.body }}</p></div>
      </article>
    </div>
  }`;

const slideshow = (label: string, attributes = '') => `
  <section slCarousel aria-label="${label}" ${attributes}>
    <div slCarouselViewport>${photos('five')}</div>
    <button slCarouselPrevious></button>
    <button slCarouselNext></button>
    <div slCarouselControls>
      <div slCarouselIndicators></div>
      <span slCarouselCounter></span>
    </div>
  </section>`;

const PROPS = {
  pieces: PIECES,
  five: PIECES.slice(0, 5),
  six: PIECES.slice(0, 6),
  notices: NOTICES,
  peek: { '--slotted-carousel-peek': '2.5rem' },
  floor: { '--slotted-carousel-slide-min-size': '14rem' },
};

/** The page is the application's: every request lands in the log with its reason. */
@Component({
  selector: 'sl-carousel-controlled-demo',
  standalone: true,
  imports: DIRECTIVES,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="slotted-demo-stack">
    <section
      slCarousel
      aria-label="Controlled collection"
      [(page)]="page"
      (pageRequest)="record($event)"
    >
      <div slCarouselViewport>
        @for (piece of five; track piece.name) {
          <div slCarouselSlide>
            <div slImage ratio="wide" [alt]="piece.name" [src]="piece.image"></div>
          </div>
        }
      </div>
      <button slCarouselPrevious></button>
      <button slCarouselNext></button>
      <div slCarouselControls><div slCarouselIndicators></div></div>
    </section>
    <div class="slotted-demo-row">
      @for (piece of five; track piece.name; let index = $index) {
        <button slButton size="sm" variant="outline" (click)="page.set(index)">
          {{ piece.name }}
        </button>
      }
    </div>
    <div class="slotted-demo-surface" data-surface="sunken">
      <p slText size="sm">Requests: {{ log().length === 0 ? 'none yet' : log().join(' — ') }}</p>
    </div>
  </div>`,
})
class ControlledDemo {
  readonly five = PIECES.slice(0, 5);
  readonly page = signal(0);
  readonly log = signal<string[]>([]);

  record(request: CarouselPageRequest) {
    this.log.update((entries) =>
      [`${request.value + 1} · ${request.reason}`, ...entries].slice(0, 4),
    );
  }
}

/** A gallery beside the buy box; the color takes the gallery to its photograph. */
@Component({
  selector: 'sl-carousel-product-demo',
  standalone: true,
  imports: DIRECTIVES,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="slotted-demo-grid" data-columns="2">
    <section slCarousel #gallery="slCarousel" aria-label="Fotografias do Jarro Mel">
      <div slCarouselViewport>
        @for (piece of six; track piece.name) {
          <div slCarouselSlide>
            <div slImage ratio="landscape" [alt]="piece.name" [src]="piece.image"></div>
          </div>
        }
      </div>
      <button slCarouselPrevious></button>
      <button slCarouselNext></button>
      <div slCarouselControls>
        <div slCarouselIndicators aria-label="Escolher fotografia" variant="thumbnails">
          <ng-template slCarouselIndicatorTemplate let-page>
            <button slCarouselIndicator [page]="page">
              <img [alt]="six[page]?.name" [src]="six[page]?.image" />
            </button>
          </ng-template>
        </div>
      </div>
    </section>
    <div class="slotted-demo-stack">
      <h3 slHeading size="2xl">Honey Pitcher</h3>
      <p slText tone="muted">Honey-glazed earthenware, hand-thrown. 1.2 liters.</p>
      <p slText size="xl">$72.00</p>
      <div slSegmentedControl aria-label="Color" [value]="color()" (valueChange)="choose($event)">
        @for (entry of colors; track entry.value) {
          <label slSegment [value]="entry.value">{{ entry.label }}</label>
        }
      </div>
      <button slButton>Add to cart</button>
    </div>
  </div>`,
})
class ProductDemo {
  readonly six = PIECES.slice(0, 6);
  readonly colors = [
    { value: 'mel', label: 'Honey', slide: 3 },
    { value: 'salvia', label: 'Sage', slide: 1 },
    { value: 'indigo', label: 'Indigo', slide: 4 },
  ];
  readonly color = signal('mel');
  private readonly gallery = viewChild.required<SlCarousel>('gallery');

  choose(value: unknown) {
    this.color.set(String(value));
    const entry = this.colors.find((candidate) => candidate.value === value);
    if (entry !== undefined) this.gallery().scrollToSlide(entry.slide);
  }
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_CAROUSEL_DOCS.carousel.scenes, {
    playground: Playground,
    orientation: Orientation,
    transition: Transition,
    align: Align,
    arrows: Arrows,
    sizes: Sizes,
    indicators: Indicators,
    thumbnails: Thumbnails,
    autoplay: Autoplay,
    multiple: Multiple,
    loop: Loop,
    controlled: Controlled,
    states: States,
    content: Content,
    empty: Empty,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/Carousel',
  component: SlCarousel,
  decorators: [moduleMetadata({ imports: [...DIRECTIVES, ControlledDemo, ProductDemo] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Carousel',
        description:
          'A set of slides shown a page at a time: a native scroller with snap that a finger, a trackpad, a mouse and the keyboard page, with previous and next, a slide picker of dots, a line or thumbnails, a counter, and a rotation the reader controls.',
        framework: 'Angular',
        ...ANGULAR_CAROUSEL_DOCS.carousel,
        tokens: ANGULAR_CAROUSEL_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<SlCarousel>;

export default meta;
type Story = StoryObj<SlCarousel>;

export const Playground: Story = {
  args: {
    align: 'start',
    arrows: 'inset',
    loop: false,
    orientation: 'horizontal',
    size: 'md',
    transition: 'slide',
  } as never,
  argTypes: {
    align: { control: 'inline-radio', options: ['start', 'center'] },
    arrows: { control: 'inline-radio', options: ['inset', 'outside'] },
    loop: { control: 'boolean' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    transition: { control: 'inline-radio', options: ['slide', 'fade'] },
  } as never,
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...PROPS, ...args },
    template: `<div class="slotted-demo-stage" data-layout="block">
      <section slCarousel aria-label="Autumn Collection" [align]="align" [arrows]="arrows" [loop]="loop" [orientation]="orientation" [size]="size" [transition]="transition">
        <div slCarouselViewport>${photos('five')}</div>
        <button slCarouselPrevious></button>
        <button slCarouselNext></button>
        <div slCarouselControls>
          <div slCarouselIndicators></div>
          <span slCarouselCounter></span>
        </div>
      </section>
    </div>`,
  }),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => ({
    props: PROPS,
    template: grid(
      2,
      scene(
        'Horizontal',
        'The arrows stand at the inline ends; Left and Right page the viewport and mirror in a right-to-left page.',
        slideshow('Horizontal collection'),
      ) +
        scene(
          'Vertical, two per view',
          'The column pages with Up and Down; the arrows turn a quarter and stand at its top and foot.',
          `<section slCarousel aria-label="Vertical collection" orientation="vertical" [slidesPerView]="2">
            <div slCarouselViewport>${photos('six', 'wide')}</div>
            <button slCarouselPrevious></button>
            <button slCarouselNext></button>
          </section>`,
        ),
    ),
  }),
};

const noticeCarousel = (label: string, transition: string, extra = '') => `
  <section slCarousel aria-label="${label}" loop transition="${transition}" ${extra}>
    <div slCarouselViewport>${notices}</div>
    <div slCarouselControls>
      <button slCarouselPrevious></button>
      <div slCarouselIndicators></div>
      <button slCarouselNext></button>
    </div>
  </section>`;

export const Transition: Story = {
  parameters: scenario('transition'),
  render: () => ({
    props: PROPS,
    template: grid(
      2,
      scene(
        'slide',
        'The track moves on a spring timed by the long duration, and a second press carries the first one’s speed.',
        noticeCarousel('Avisos a deslizar', 'slide'),
      ) +
        scene(
          'fade',
          'The arriving notice fades in on the enter curve over the leaving one, which goes faster.',
          noticeCarousel('Avisos a desvanecer', 'fade'),
        ),
    ),
  }),
};

export const Align: Story = {
  parameters: scenario('align'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'Centerd, two and a half rem of each neighbour',
        'Every slide is a page; the ones either side show at the edges. Press one and it comes to the center.',
        `<section slCarousel align="center" aria-label="One-of-a-kind pieces" [defaultPage]="1" [style]="peek">
          <div slCarouselViewport>${photos('five')}</div>
          <button slCarouselPrevious></button>
          <button slCarouselNext></button>
          <div slCarouselControls><div slCarouselIndicators></div></div>
        </section>`,
      ),
    ),
  }),
};

const rail = (arrows: string, extra = '') => `
  <section slCarousel aria-label="Mais vendidos" arrows="${arrows}" [slidesPerView]="3" ${extra}>
    <div slCarouselViewport>${cards('pieces')}</div>
    <button slCarouselPrevious></button>
    <button slCarouselNext></button>
  </section>`;

export const Arrows: Story = {
  parameters: scenario('arrows'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'inset',
        'Over the ends of a picture: the slideshow keeps its whole width and the arrows stand on it.',
        slideshow('Collection with arrows on top'),
      ) +
        scene(
          'outside',
          'Beside a row of cards: columns of their own, so no arrow covers the first card’s corner.',
          rail('outside'),
        ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: PROPS,
    template: grid(
      3,
      (['sm', 'md', 'lg'] as const)
        .map((size) =>
          scene(
            size,
            `The round controls at the ${size} step of the control scale.`,
            slideshow(`Collection ${size}`, `size="${size}"`),
          ),
        )
        .join(''),
    ),
  }),
};

export const Indicators: Story = {
  parameters: scenario('indicators'),
  render: () => ({
    props: {
      ...PROPS,
      archive: Array.from({ length: 14 }, (_, index) => PIECES[index % PIECES.length]),
    },
    template: grid(
      1,
      scene(
        'dots',
        'The current page is a bar three dots long; shape, not color alone, says which.',
        slideshow('Collection with dots'),
      ) +
        scene(
          'line',
          'Segments share the width; the current one is the ink.',
          `<section slCarousel aria-label="Collection with line">
            <div slCarouselViewport>${photos('five', 'wide')}</div>
            <button slCarouselPrevious></button>
            <button slCarouselNext></button>
            <div slCarouselControls>
              <div slCarouselIndicators variant="line"></div>
              <span slCarouselCounter></span>
            </div>
          </section>`,
        ) +
        scene(
          'fourteen pages',
          'Past eight pages the row windows itself; arrow through it and the window follows.',
          `<section slCarousel aria-label="Arquivo de campanhas" [defaultPage]="7">
            <div slCarouselViewport>
              @for (piece of archive; track $index) {
                <div slCarouselSlide><div slImage ratio="wide" [alt]="piece.name" [src]="piece.image"></div></div>
              }
            </div>
            <div slCarouselControls>
              <button slCarouselPrevious></button>
              <div slCarouselIndicators></div>
              <button slCarouselNext></button>
              <span slCarouselCounter></span>
            </div>
          </section>`,
        ),
    ),
  }),
};

const gallery = `
  <section slCarousel aria-label="Fotografias do Jarro Mel">
    <div slCarouselViewport>${photos('six')}</div>
    <button slCarouselPrevious></button>
    <button slCarouselNext></button>
    <div slCarouselControls>
      <div slCarouselIndicators aria-label="Escolher fotografia" variant="thumbnails">
        <ng-template slCarouselIndicatorTemplate let-page>
          <button slCarouselIndicator [page]="page"><img [alt]="six[page]?.name" [src]="six[page]?.image" /></button>
        </ng-template>
      </div>
    </div>
  </section>`;

export const Thumbnails: Story = {
  parameters: scenario('thumbnails'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'Six photographs, one picker',
        'The current picture carries an inset ring of the ink; the others are held back until the pointer reaches them.',
        gallery,
      ),
    ),
  }),
};

export const Autoplay: Story = {
  parameters: scenario('autoplay'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'Six seconds a page, over the picture',
        'The current dot fills over the delay. Hover holds it; Tab into it and the rotation stops until the control starts it.',
        `<section slCarousel aria-label="Destaques" loop [autoplay]="6000">
          <div slCarouselViewport>${photos('five')}</div>
          <div slCarouselControls placement="overlay">
            <button slCarouselAutoplay></button>
            <div slCarouselIndicators></div>
          </div>
        </section>`,
      ) +
        scene(
          'A line that measures the wait',
          'The segment of the current notice fills; the counter beside it says where the rotation is.',
          `<section slCarousel aria-label="Rotating notices" autoplay loop transition="fade">
            <div slCarouselViewport>${notices}</div>
            <div slCarouselControls>
              <button slCarouselAutoplay></button>
              <div slCarouselIndicators variant="line"></div>
              <span slCarouselCounter></span>
            </div>
          </section>`,
        ),
    ),
  }),
};

export const Multiple: Story = {
  parameters: scenario('multiple'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'Three per view',
        'Eight cards make three pages; the last one ends flush with the row.',
        `<section slCarousel aria-label="Mais vendidos" arrows="outside" [slidesPerView]="3">
          <div slCarouselViewport>${cards('pieces')}</div>
          <button slCarouselPrevious></button>
          <button slCarouselNext></button>
          <div slCarouselControls><div slCarouselIndicators variant="line"></div></div>
        </section>`,
      ) +
        scene(
          'A narrow column',
          'The slide floor keeps a card readable: one card and the edge of the next.',
          `<div class="slotted-demo-measure">${rail('inset', '[style]="floor"')}</div>`,
        ),
    ),
  }),
};

export const Loop: Story = {
  parameters: scenario('loop'),
  render: () => ({
    props: PROPS,
    template: grid(
      2,
      scene(
        'Without a loop',
        'At the first page previous stays in place in the disabled ink.',
        slideshow('Collection without loop'),
      ) +
        scene(
          'With a loop',
          'Previous at the first page goes to the last; the track travels back.',
          slideshow('Collection with loop', 'loop'),
        ),
    ),
  }),
};

export const Controlled: Story = {
  parameters: scenario('controlled'),
  render: () => ({
    template: grid(
      1,
      scene(
        'The page is the application’s',
        'Swipe, press, drag or use the keys; each request lands in the log with its reason before the page moves.',
        '<sl-carousel-controlled-demo />',
      ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: PROPS,
    template: grid(
      2,
      scene(
        'At the first page',
        'Previous in the disabled ink and still focusable; next answers hover and press.',
        slideshow('States at the start'),
      ) +
        scene(
          'In the bar',
          'The controls in a bar under the picture, each with its hover ground, its press and its ring.',
          noticeCarousel('Estados na barra', 'slide'),
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: {
      ...PROPS,
      uneven: PIECES.slice(0, 4).map((piece, index) => ({
        ...piece,
        name:
          index === 1
            ? `${piece.name} — numbered edition from the Flower Street workshop`
            : piece.name,
        glaze:
          index === 2
            ? `${piece.glaze}, cozida a 1280 °C em forno a lenha durante trinta horas`
            : piece.glaze,
      })),
    },
    template: grid(
      1,
      scene(
        'Uneven cards, long names',
        'The row stands at the tallest card; a long name wraps inside its card.',
        `<section slCarousel aria-label="Pieces with long names" [slidesPerView]="2">
          <div slCarouselViewport>
            @for (piece of uneven; track piece.name) {
              <div slCarouselSlide>
                <article slCard>
                  <div slCardMedia><div slImage alt="" ratio="landscape" [src]="piece.image"></div></div>
                  <div slCardHeader><h3 slHeading size="md">{{ piece.name }}</h3></div>
                  <div slCardBody><p slText size="sm" tone="muted">{{ piece.glaze }}</p></div>
                </article>
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
      ) +
        scene(
          'Right to left',
          'The track, the arrows and the dots mirror; the counter still reads first to last.',
          `<div dir="rtl">${slideshow('معرض الخزف')}</div>`,
        ),
    ),
  }),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => ({
    props: PROPS,
    template: grid(
      2,
      scene(
        'No pieces',
        'The controls are disabled, the counter reads 0 / 0, and the viewport holds the result state.',
        `<section slCarousel aria-label="Empty collection">
          <div slCarouselViewport>
            <section slResultState status="empty">
                <div slResultStateContent>
                  <div slResultStateTitle>No pieces in this collection</div>
                  <p slResultStateDescription>Pieces from the next firing appear here.</p>
                </div>
              </section>
          </div>
          <div slCarouselControls>
            <button slCarouselPrevious></button>
            <span slCarouselCounter></span>
            <button slCarouselNext></button>
          </div>
        </section>`,
      ) +
        scene(
          'Loading',
          'Skeleton cards with the anatomy of the cards they stand in for hold the row’s height.',
          `<section slCarousel aria-label="Loading collection" [slidesPerView]="2">
            <div slCarouselViewport>
              @for (index of [0, 1, 2]; track index) {
                <div slCarouselSlide>
                  <article slCard>
                    <div slCardMedia><span slSkeleton shape="block"><div slImage alt="" ratio="square" [src]="pieces[0].image"></div></span></div>
                    <div slCardHeader><span slSkeleton shape="text"><h3 slHeading size="md">Terracotta Amphora</h3></span></div>
                  </article>
                </div>
              }
            </div>
          </section>`,
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      1,
      scene(
        'A product page',
        'Choose a color and the gallery goes to its photograph through the instance’s scrollToSlide.',
        '<sl-carousel-product-demo />',
      ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'Tab, then the arrows',
        'Focus the viewport and use the arrows, PageUp, PageDown, Home and End; Tab on to the dots and use the arrows there.',
        slideshow('Collection by keyboard'),
      ),
    ),
  }),
};
