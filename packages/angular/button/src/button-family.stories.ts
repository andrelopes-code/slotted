import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideBold,
  lucideChevronDown,
  lucideEllipsis,
  lucideExternalLink,
  lucideItalic,
  lucidePlus,
  lucideRefreshCw,
  lucideSave,
  lucideStar,
  lucideTrash2,
  lucideUnderline,
} from '@ng-icons/lucide';
import { scenario } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlButton } from './button';
import { SlButtonEnd, SlButtonStart } from './button-appearance';
import { SlButtonLink } from './button-link';
import { BUTTON_SIZES, BUTTON_TONES, BUTTON_VARIANTS } from './button.constants';
import type { ButtonTone, ButtonVariant } from './button.constants';
import { SlIconButton } from './icon-button';
import { SlToggleButton } from './toggle-button';

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * A slot marker is a component, so it cannot sit on `ng-icon` — two components
 * on one element is NG0300. It goes on an element the template writes, which
 * is also the tree the React binding renders: the glyph inside `[data-part]`.
 */
const icon = (name: string, marker = '') => {
  const glyph = `<ng-icon aria-hidden="true" name="${name}"></ng-icon>`;
  return marker ? `<span ${marker}>${glyph}</span>` : glyph;
};

const scene = (label: string, note: string, content: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage">${content}</div>
  </section>`;

const section = (title: string, description: string, body: string, columns?: '2' | '3') => `
  <section class="slotted-component-lab__section">
    <header class="slotted-component-lab__intro">
      <h2>${title}</h2>
      <p>${description}</p>
    </header>
    <div class="slotted-component-lab__body${columns ? ' slotted-demo-grid' : ''}"${columns ? ` data-columns="${columns}"` : ''}>${body}</div>
  </section>`;

const matrix = (name: string, renderCell: (tone: ButtonTone, variant: ButtonVariant) => string) => `
  <div data-slotted-matrix="${name}">
    <div aria-label="Component comparison" class="slotted-matrix-scroll" role="region" tabindex="0">
      <table class="slotted-matrix">
        <thead><tr>
          <th aria-hidden="true" class="slotted-matrix__corner"></th>
          ${BUTTON_TONES.map((tone) => `<th class="slotted-matrix__heading" scope="col">${titleCase(tone)}</th>`).join('')}
        </tr></thead>
        <tbody>${BUTTON_VARIANTS.map(
          (variant) => `<tr>
              <th class="slotted-matrix__row-label" scope="row">${titleCase(variant)}</th>
              ${BUTTON_TONES.map(
                (tone) => `<td class="slotted-matrix__cell">${renderCell(tone, variant)}</td>`,
              ).join('')}
            </tr>`,
        ).join('')}</tbody>
      </table>
    </div>
  </div>`;

const meta: Meta = {
  title: 'Components/Button family/Overview',
  decorators: [
    moduleMetadata({
      imports: [
        NgIcon,
        SlButton,
        SlButtonEnd,
        SlButtonLink,
        SlButtonStart,
        SlIconButton,
        SlToggleButton,
      ],
      providers: [
        provideIcons({
          lucideArrowRight,
          lucideBold,
          lucideChevronDown,
          lucideEllipsis,
          lucideExternalLink,
          lucideItalic,
          lucidePlus,
          lucideRefreshCw,
          lucideSave,
          lucideStar,
          lucideTrash2,
          lucideUnderline,
        }),
      ],
    }),
  ],
  parameters: { controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Matrix: Story = {
  parameters: scenario('matrix'),
  render: () => ({
    template: `<main class="slotted-component-lab">
      ${section(
        'Appearance system',
        'Four members, one surface. Button acts, ButtonLink navigates, IconButton acts without room for a label, and ToggleButton stays on. They share the tone, variant and size axes, so the appearance is decided once.',
        scene(
          'Tone by variant',
          'Five semantic colours across four ways of painting them.',
          matrix(
            'button',
            (tone, variant) =>
              `<button slButton size="sm" tone="${tone}" variant="${variant}">${titleCase(tone)}</button>`,
          ),
        ),
      )}
      ${section(
        'Button',
        'A momentary action. It waits without changing size, and it wraps rather than pushing past a narrow container.',
        [
          scene(
            'Emphasis',
            'One primary action per region.',
            `<div class="slotted-demo-row">
              <button slButton>${icon('lucideSave', 'slButtonStart')}Publish</button>
              <button slButton tone="secondary" variant="outline">Save draft</button>
              <button slButton variant="ghost">Discard</button>
            </div>`,
          ),
          scene(
            'Waiting',
            'The label stays, so the width and the name do too.',
            `<div class="slotted-demo-row">
              <button slButton>${icon('lucideSave', 'slButtonStart')}Save changes</button>
              <button slButton loading>Save changes</button>
            </div>`,
          ),
          scene(
            'Sizes',
            'Three steps of the control scale, at every density.',
            `<div class="slotted-demo-row">${BUTTON_SIZES.map(
              (size) =>
                `<button slButton size="${size}">${size}${icon('lucideChevronDown', 'slButtonEnd')}</button>`,
            ).join('')}</div>`,
          ),
          scene(
            'Extreme content',
            'A long label wraps; a long token breaks.',
            `<div class="slotted-demo-measure"><div class="slotted-demo-stack">
              <button slButton fullWidth>Export every invoice issued this quarter</button>
              <button slButton size="sm" tone="secondary" variant="outline">reconciliation_2026_Q3_final.xlsx</button>
            </div></div>`,
          ),
        ].join(''),
        '2',
      )}
      ${section(
        'ButtonLink',
        'An anchor wearing the action surface. It is announced as a link, activates on Enter alone, and loses its destination entirely when disabled.',
        [
          scene(
            'Navigation',
            'Internal, external, and a router’s own link.',
            `<div class="slotted-demo-row">
              <a slButtonLink href="/settings">Open settings${icon('lucideArrowRight', 'slButtonEnd')}</a>
              <a slButtonLink href="https://example.com" rel="noreferrer" target="_blank" variant="outline">Status page${icon('lucideExternalLink', 'slButtonEnd')}</a>
              <a slButtonLink href="/billing" data-router-link="true" variant="ghost">Billing</a>
            </div>`,
          ),
          scene(
            'Unavailable',
            'No href at all, and still reachable by keyboard.',
            '<div class="slotted-demo-row"><a slButtonLink href="/settings" disabled>Open settings</a></div>',
          ),
        ].join(''),
        '2',
      )}
      ${section(
        'IconButton',
        'The same control with no room for a label, so the accessible name is an explicit attribute. Its box is square from the control height, which keeps the target at or above 24 by 24 at every density.',
        [
          scene(
            'Shape and size',
            'Square or circular, at all three steps.',
            `<div class="slotted-demo-row">${BUTTON_SIZES.map(
              (size) =>
                `<button slIconButton aria-label="Add, ${size}" size="${size}" tone="accent" variant="solid">${icon('lucidePlus')}</button>`,
            ).join('')}${BUTTON_SIZES.map(
              (size) =>
                `<button slIconButton aria-label="Add, circle, ${size}" shape="circle" size="${size}" tone="accent" variant="solid">${icon('lucidePlus')}</button>`,
            ).join('')}</div>`,
          ),
          scene(
            'A toolbar',
            'Icon toggles keep their name while their state moves.',
            `<div class="slotted-demo-row">
              <button slIconButton aria-label="Bold" size="sm" defaultPressed>${icon('lucideBold')}</button>
              <button slIconButton aria-label="Italic" size="sm" [defaultPressed]="false">${icon('lucideItalic')}</button>
              <button slIconButton aria-label="Underline" size="sm" [defaultPressed]="false">${icon('lucideUnderline')}</button>
              <button slIconButton aria-label="More formatting" size="sm">${icon('lucideEllipsis')}</button>
              <button slIconButton aria-label="Delete" size="sm" tone="danger">${icon('lucideTrash2')}</button>
            </div>`,
          ),
          scene(
            'Waiting',
            'The icon fades and the ring takes its place, in its size.',
            `<div class="slotted-demo-row">
              <button slIconButton aria-label="Refresh" variant="outline">${icon('lucideRefreshCw')}</button>
              <button slIconButton aria-label="Refresh" variant="outline" loading>${icon('lucideRefreshCw')}</button>
            </div>`,
          ),
          scene(
            'Unavailable',
            'A disabled toggle still says whether it is on.',
            `<div class="slotted-demo-row">
              <button slIconButton aria-label="Favourite" defaultPressed shape="circle" tone="warning">${icon('lucideStar')}</button>
              <button slIconButton aria-label="Favourite, unavailable" defaultPressed disabled shape="circle" tone="warning">${icon('lucideStar')}</button>
            </div>`,
          ),
        ].join(''),
        '2',
      )}
      ${section(
        'ToggleButton',
        'A two-state action. The label never changes with the state, and the request that moves it carries whether a pointer or the keyboard asked.',
        [
          scene(
            'On and off',
            'The fill and a heavier edge, so neither scheme flattens it.',
            `<div class="slotted-demo-row">
              <button slToggleButton>${icon('lucideStar', 'slButtonStart')}Favourite</button>
              <button slToggleButton defaultPressed>${icon('lucideStar', 'slButtonStart')}Favourite</button>
            </div>`,
          ),
          scene(
            'Unavailable',
            'Disabled wins over pressed, and pressed still shows.',
            `<div class="slotted-demo-row">
              <button slToggleButton disabled>Favourite</button>
              <button slToggleButton defaultPressed disabled>Favourite</button>
            </div>`,
          ),
        ].join(''),
        '2',
      )}
      ${section(
        'Composition',
        'Members side by side, in the composition an application actually writes.',
        scene(
          'A page header',
          'One primary action, one secondary, one destructive.',
          `<div class="slotted-demo-row">
            <button slButton>${icon('lucideSave', 'slButtonStart')}Publish</button>
            <a slButtonLink href="/preview" variant="outline">Preview</a>
            <button slIconButton aria-label="More actions" variant="outline">${icon('lucideEllipsis')}</button>
            <button slButton tone="danger" variant="ghost">Delete</button>
          </div>`,
        ),
      )}
    </main>`,
  }),
};

/** Every tone in every variant, at one size, for comparing the palette itself. */
export const Tones: Story = {
  parameters: scenario('tones'),
  render: () => ({
    template: `<div class="slotted-demo-stage">${BUTTON_TONES.map(
      (tone) =>
        `<div class="slotted-demo-row">${BUTTON_VARIANTS.map(
          (variant) =>
            `<button slButton tone="${tone}" variant="${variant}">${titleCase(tone)}</button>`,
        ).join(
          '',
        )}<button slIconButton aria-label="Add, ${tone}" tone="${tone}" variant="solid">${icon('lucidePlus')}</button></div>`,
    ).join('')}</div>`,
  }),
};

/**
 * Density changes the size of a control and nothing about its meaning. The
 * toolbar switches it; this scene is what shows the three steps against each
 * other at whichever one is selected.
 */
export const Densities: Story = {
  parameters: scenario('densities'),
  render: () => ({
    template: `<div class="slotted-demo-stage">${BUTTON_SIZES.map(
      (size) => `<div class="slotted-demo-row">
        <button slButton size="${size}">${icon('lucideSave', 'slButtonStart')}Save changes</button>
        <button slButton size="${size}" variant="outline">Cancel</button>
        <button slIconButton aria-label="More, ${size}" size="${size}" variant="outline">${icon('lucideEllipsis')}</button>
        <button slToggleButton size="${size}" defaultPressed>Pinned</button>
      </div>`,
    ).join('')}</div>`,
  }),
};
