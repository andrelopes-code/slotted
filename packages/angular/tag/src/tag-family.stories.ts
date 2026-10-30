import { scenario } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlText } from '../../typography/src/text';
import { SlVisuallyHidden } from '../../visually-hidden/src/visually-hidden';
import { SlTag } from './tag';
import { SlTagBody } from './tag-body';
import { SlTagStart } from './tag-content';
import { provideTagDefaults } from './tag-defaults';
import { glyph, GLYPH_TAG, scene, SlTagFiltersDemo } from './tag-demo';
import { SlTagGroup } from './tag-group';
import { SlTagRemove } from './tag-remove';
import { SlTagToggle } from './tag-toggle';

const TONES = ['accent', 'secondary', 'info', 'success', 'warning', 'danger'];
const VARIANTS = ['solid', 'soft', 'outline', 'dashed'];
const SIZES = ['sm', 'md', 'lg'];

const IMPORTS = [
  SlTag,
  SlTagBody,
  SlTagFiltersDemo,
  SlTagGroup,
  SlTagRemove,
  SlTagStart,
  SlTagToggle,
  SlText,
  SlVisuallyHidden,
];

const meta: Meta = {
  title: 'Components/Tag/Overview',
  decorators: [moduleMetadata({ imports: IMPORTS })],
  parameters: { controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

const chip = (tone: string, variant: string) =>
  `<span slTag tone="${tone}" variant="${variant}"><span slTagBody>${tone}</span></span>`;

/**
 * One band of the overview page: the heading and its sentence in the sidebar
 * column, the demonstration in the wide one.
 *
 * The section is what carries the page's inset and the gap between its two
 * columns; the intro is only the column. An overview that put its headings and
 * its demonstrations straight into the intro — which is what this page did
 * before a reviewer read it — inherits neither, so every chip sits against the
 * panel's own edge and the bands run into each other.
 */
const band = (title: string, description: string, body: string) => `
  <section class="slotted-component-lab__section">
    <header class="slotted-component-lab__intro">
      <h2>${title}</h2>
      <p>${description}</p>
    </header>
    <div class="slotted-component-lab__body">${body}</div>
  </section>`;

export const Matrix: Story = {
  parameters: scenario('members'),
  render: () => ({
    template: `<main class="slotted-component-lab">
      ${band(
        'Appearance system',
        'Five tones over three paintings. Every member reads the same axes, because a chip that acts is the same box as a chip that does not.',
        `<div data-slotted-matrix="tag">
          <table class="slotted-matrix">
            <thead><tr><th class="slotted-matrix__corner" aria-hidden="true"></th>${VARIANTS.map(
              (variant) => `<th class="slotted-matrix__heading" scope="col">${variant}</th>`,
            ).join('')}</tr></thead>
            <tbody>${TONES.map(
              (tone) =>
                `<tr><th class="slotted-matrix__row-label" scope="row">${tone}</th>${VARIANTS.map(
                  (variant) => `<td class="slotted-matrix__cell">${chip(tone, variant)}</td>`,
                ).join('')}</tr>`,
            ).join('')}</tbody>
          </table>
        </div>`,
      )}
      ${band(
        'Tag',
        'A value that does nothing when it is pressed, and can still be removed.',
        `<div slTagGroup role="list" aria-label="Tag">
          <span slTag><span slTagBody>Design</span></span>
          <span slTag tone="success"><span slTagBody><span slTagStart>${glyph(GLYPH_TAG)}</span>delivered</span></span>
          <span slTag removable><span slTagBody>Anna Reed</span><button slTagRemove></button></span>
          <span slTag tone="warning" variant="outline" shape="square"><span slTagBody>in review</span></span>
        </div>`,
      )}
      ${band(
        'TagButton',
        'A command, on the consumer’s own button, which is the chip’s body — never the chip itself, so a chip that both acts and removes stays legal HTML.',
        `<div slTagGroup aria-label="TagButton">
          <span slTag><button slTagBody>Assign owner</button></span>
          <span slTag tone="accent" removable><button slTagBody>Command and removal</button><button slTagRemove></button></span>
          <span slTag disabled><button slTagBody>Unavailable</button></span>
        </div>`,
      )}
      ${band(
        'TagLink',
        'A destination, on the consumer’s own anchor, where routerLink composes and the platform keeps middle click and “open in new tab”.',
        `<div slTagGroup aria-label="TagLink">
          <span slTag><a slTagBody href="#equipes">#plataforma</a></span>
          <span slTag tone="accent"><a slTagBody href="#equipes">#produto</a></span>
          <span slTag disabled><a slTagBody href="#equipes">#arquivado</a></span>
        </div>`,
      )}
      ${band(
        'TagToggle',
        'A selection, with both modes and a request that says how it moved. The check grows into the label, so the state is never color alone.',
        `<div slTagGroup aria-label="TagToggle">
          <span slTag tone="accent"><button slTagToggle defaultSelected>Aberto</button></span>
          <span slTag tone="accent"><button slTagToggle>Fechado</button></span>
          <span slTag tone="success" removable><button slTagToggle defaultSelected>Delivered</button><button slTagRemove></button></span>
        </div>`,
      )}
      ${band(
        'Composition',
        'A filter bar: values that leave, a facet that toggles, and a command to put them back — one tab stop, arrow keys inside it.',
        '<sl-tag-filters-demo></sl-tag-filters-demo>',
      )}
    </main>`,
  }),
};

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => ({
    template: `<div class="slotted-demo-grid" data-columns="1">${VARIANTS.map((variant) =>
      scene(
        variant,
        variant === 'solid'
          ? 'Filled, and its edge is its own fill — except secondary, whose fill is the color of the page.'
          : variant === 'soft'
            ? 'Tinted, and it keeps the tone’s edge: in high contrast every tone surface becomes the page’s own white.'
            : 'The edge alone.',
        `<div slTagGroup role="list" aria-label="${variant}">${TONES.map((tone) =>
          chip(tone, variant),
        ).join('')}</div>`,
      ),
    ).join('')}</div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'sizes',
        'Type, glyph and gap come from the control scale, so a tag shrinks with density beside the controls it sits with. The chip’s height is floored at the WCAG target minimum, which keeps the remove control hittable.',
        `<div slTagGroup role="list" aria-label="Tamanhos">${SIZES.map(
          (size) =>
            `<span slTag tone="accent" size="${size}" removable><span slTagBody>${size}</span><button slTagRemove></button></span>`,
        ).join('')}</div>`,
      )}
      ${scene(
        'shapes',
        'A rounded chip, or a rectangle with the small radius.',
        `<div slTagGroup role="list" aria-label="Formas">
          <span slTag shape="pill"><span slTagBody>pill</span></span>
          <span slTag shape="pill" variant="solid" removable><span slTagBody>pill</span><button slTagRemove></button></span>
          <span slTag shape="square"><span slTagBody>square</span></span>
          <span slTag shape="square" variant="solid" removable><span slTagBody>square</span><button slTagRemove></button></span>
        </div>`,
      )}
    </div>`,
  }),
};

export const Group: Story = {
  parameters: scenario('group'),
  render: () => ({
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'toolbar',
        'One tab stop. Arrow keys move between every control in the run — a chip’s body, then its remove control, then the next chip’s — mirrored in a right-to-left document. Home and End reach the ends.',
        '<sl-tag-filters-demo></sl-tag-filters-demo>',
      )}
      ${scene(
        'vertical',
        'The same run down the block axis, which writes aria-orientation.',
        `<div slTagGroup orientation="vertical" aria-label="Labels">
          <span slTag size="sm" shape="square" tone="success" removable><span slTagBody>delivered</span><button slTagRemove></button></span>
          <span slTag size="sm" shape="square" tone="warning" removable><span slTagBody>in review</span><button slTagRemove></button></span>
          <span slTag size="sm" shape="square" tone="danger" removable><span slTagBody>blocked</span><button slTagRemove></button></span>
        </div>`,
      )}
      ${scene(
        'list',
        'Written role="list", the run stops being a widget: no arrow keys, every chip a listitem, and a screen reader announces the length.',
        `<div slTagGroup role="list" aria-label="Tecnologias">
          <span slTag><span slTagBody>TypeScript</span></span>
          <span slTag><span slTagBody>Angular</span></span>
          <span slTag><span slTagBody>React</span></span>
        </div>`,
      )}
      ${scene(
        'empty',
        'A run emptied by a permission filter takes no room at all: the line below sits where the group would have been.',
        `<div class="slotted-demo-stack">
          <div slTagGroup aria-label="No filter"></div>
          <span slText tone="muted">No filter applied.</span>
        </div>`,
      )}
    </div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [moduleMetadata({ imports: IMPORTS, providers: [] })],
  render: () => ({
    applicationConfig: { providers: [provideTagDefaults({ size: 'sm' })] },
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'defaults',
        'An application decides once how its tags are painted and how large they are. An explicit input still wins; the remove word comes from the language in force.',
        `<div slTagGroup aria-label="With defaults">
          <span slTag removable><span slTagBody>Inherits everything</span><button slTagRemove></button></span>
          <span slTag tone="danger" removable><span slTagBody>Overrides the tone</span><button slTagRemove></button></span>
          <span slTag size="lg" removable><span slTagBody>Sobrescreve o tamanho</span><button slTagRemove></button></span>
        </div>`,
      )}
      ${scene(
        'in context',
        'Inside a sentence a tag sits on the text’s center; inside a list it becomes the list item itself.',
        `<div class="slotted-demo-stack">
          <span slText>The <span slTag size="sm"><span slTagBody>March</span></span> delivery is blocked by <span slTag size="sm" tone="danger" variant="outline"><span slTagBody>two dependencies</span></span>.</span>
          <ul style="display: flex; gap: 0.25rem; list-style: none; margin: 0; padding: 0">
            <li slTag><span slTagBody>TypeScript</span></li>
            <li slTag><span slTagBody>Angular</span></li>
            <li slTag><span slTagBody>React</span></li>
          </ul>
        </div>`,
      )}
    </div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'the remove control’s name',
        'Composed, not repeated: a hidden word joined to the tag’s own label by aria-labelledby, so it announces “Remover Ana Reis” rather than “Remover”.',
        `<div slTagGroup aria-label="Participants">
          <span slTag removable [messages]="{ remove: 'Remove' }"><span slTagBody>Anna Reed</span><button slTagRemove></button></span>
          <span slTag removable [messages]="{ remove: 'Remove' }"><span slTagBody>Brian Shaw</span><button slTagRemove></button></span>
        </div>`,
      )}
      ${scene(
        'a value a color cannot say',
        'A tone is not a word. What the color means is written beside it, out of the flow.',
        `<div slTagGroup role="list" aria-label="Status">
          <span slTag tone="danger" variant="solid"><span slTagBody>SLA<span slVisuallyHidden> overdue</span></span></span>
          <span slTag tone="success" variant="solid"><span slTagBody>SLA<span slVisuallyHidden> on time</span></span></span>
        </div>`,
      )}
      ${scene(
        'keyboard',
        'Tab reaches the run once. Arrow keys move between its controls, Home and End reach the ends, Backspace or Delete removes the chip focus is inside, and focus lands on the control that took its place.',
        `<div class="slotted-demo-stack">
          <sl-tag-filters-demo></sl-tag-filters-demo>
          <span slText tone="muted">After the group, the next Tab continues on the page — never at the top of it.</span>
        </div>`,
      )}
    </div>`,
  }),
};
