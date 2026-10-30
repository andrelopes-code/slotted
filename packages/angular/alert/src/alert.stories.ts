import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideShield } from '@ng-icons/lucide';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlButton } from '@slotted/angular/button';
import { SlText } from '@slotted/angular/typography';

import { SlAlert } from './alert';
import { provideAlertDefaults } from './alert-defaults';
import type { AlertLive, AlertReach, AlertTone, AlertVariant } from './alert-defaults';
import {
  SlAlertActions,
  SlAlertContent,
  SlAlertDescription,
  SlAlertIcon,
  SlAlertTitle,
} from './alert-parts';
import { ANGULAR_ALERT_DOCS, ANGULAR_ALERT_TOKENS } from './alert.docs';

interface AlertStoryArgs {
  dismissible: boolean;
  hideIcon: boolean;
  live: AlertLive;
  reach: AlertReach;
  tone: AlertTone;
  variant: AlertVariant;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_ALERT_DOCS.alert.scenes, {
    playground: Playground,
    tones: Tones,
    variants: Variants,
    reach: Reach,
    dismissal: Dismissal,
    actions: Actions,
    live: Live,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta: Meta<AlertStoryArgs> = {
  title: 'Components/Alert',
  component: SlAlert,
  decorators: [
    moduleMetadata({
      imports: [
        NgIcon,
        SlAlert,
        SlAlertActions,
        SlAlertContent,
        SlAlertDescription,
        SlAlertIcon,
        SlAlertTitle,
        SlButton,
        SlText,
      ],
      providers: [provideIcons({ lucideShield })],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Alert',
        description:
          'A message about the page, a section, or the thing beside it — with a mark saying how serious it is, and a region that announces the text without announcing the buttons.',
        framework: 'Angular',
        ...ANGULAR_ALERT_DOCS.alert,
        tokens: ANGULAR_ALERT_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<AlertStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes this
 * rather than laying itself out, so no two examples can end up against each
 * other and no story reaches for an inline style.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'block' | 'row' | 'stack' | 'prose' = 'block',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

const message = (attributes: string, title: string, body = '') =>
  `<section slAlert ${attributes}>
     <div slAlertContent>
       ${title === '' ? '' : `<div slAlertTitle>${title}</div>`}
       ${body === '' ? '' : `<p slAlertDescription>${body}</p>`}
     </div>
   </section>`;

const TONES: readonly [AlertTone, string, string][] = [
  ['accent', 'Information', 'A notice that asks nothing of anyone.'],
  ['secondary', 'Note', 'A remark about what is in this section.'],
  ['success', 'Published', 'Version 4.2 has been live since 14:07.'],
  ['warning', 'Almost out of space', 'Only 480 MB left of the 20 GB plan.'],
  ['danger', 'Could not save', 'The connection dropped before sending.'],
];

export const Playground: Story = {
  args: {
    dismissible: true,
    hideIcon: false,
    live: 'off',
    reach: 'section',
    tone: 'warning',
    variant: 'soft',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <section
          slAlert
          [tone]="tone"
          [variant]="variant"
          [reach]="reach"
          [live]="live"
          [hideIcon]="hideIcon"
          [dismissible]="dismissible"
        >
          <div slAlertContent>
            <div slAlertTitle>Your subscription expires in three days</div>
            <p slAlertDescription>
              Renew now to keep team access to the published projects.
            </p>
          </div>
          <div slAlertActions>
            <button slButton type="button">Renovar</button>
            <button slButton variant="ghost" type="button">Ver planos</button>
          </div>
        </section>
      </div>`,
  }),
};

export const Tones: Story = {
  parameters: scenario('tones'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The five, and the marks that carry them',
        'Each tone draws the glyph the contract maps it to, so an error and a note differ by silhouette as well as by colour.',
        TONES.map(([tone, title, body]) => message(`tone="${tone}"`, title, body)).join(''),
      ) +
        scene(
          'The same five with no colour at all',
          'Switch the toolbar to high-contrast: every ground becomes the page’s own white and every border black, and the mark is the only thing left telling the five apart.',
          TONES.map(([tone, title]) => message(`tone="${tone}" variant="outline"`, title)).join(''),
        ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    template: grid(
      2,
      scene(
        'On the page’s own surface',
        'soft carries the tone’s surface and its border — the border is what keeps the box present in high-contrast, where the tinted grounds collapse to white.',
        message('tone="danger" variant="soft"', '', 'soft — the tone surface, with the border.') +
          message('tone="danger" variant="outline"', '', 'outline — no background of its own.') +
          message('tone="danger" variant="solid"', '', 'solid — the tone fill.'),
      ) +
        scene(
          'In a region that states its own scheme',
          'A dark ground is a scheme rather than a surface: state data-slotted-scheme on the region and every tone role is restated, so outline reads there too.',
          `<div
             class="slotted-demo-surface"
             data-surface="scheme"
             data-flow="stack"
             data-slotted-scheme="dark"
           >${
             message(
               'tone="success" variant="soft"',
               '',
               'soft, in a region with its own scheme.',
             ) + message('tone="success" variant="outline"', '', 'outline, in the same region.')
           }</div>`,
        ),
    ),
  }),
};

export const Reach: Story = {
  parameters: scenario('reach'),
  render: () => ({
    template: grid(
      1,
      scene(
        'inline, section, page',
        'The insets, the corner and the type step with the scope. A page banner draws no corner and no inline edge, because it runs to both edges of what holds it.',
        message('reach="inline" tone="danger"', '', 'Enter a valid EIN to continue.') +
          message(
            'reach="section"',
            'About time zones',
            'The times below are shown in the time zone of your account, not of the server.',
          ) +
          `<section slAlert reach="page" tone="warning" dismissible>
             <div slAlertContent>
               <div slAlertTitle>Maintenance scheduled for Sunday</div>
               <p slAlertDescription>The service will be unavailable from 2 AM to 4 AM (UTC−3).</p>
             </div>
             <div slAlertActions>
               <button slButton type="button">
                 Detalhes
               </button>
             </div>
           </section>`,
      ),
    ),
  }),
};

export const Dismissal: Story = {
  parameters: scenario('dismissal'),
  render: () => ({
    props: { open: true, confirmed: false },
    template: grid(
      2,
      scene(
        'It owns its own openness',
        'No state anywhere: the message closes itself, keeps its element, and drops data-open. Not one of the ten surveyed implementations ships this half.',
        message(
          'dismissible',
          'Reading mode on',
          'Nothing on this page can be edited while it is on.',
        ),
      ) +
        scene(
          'The application owns it',
          'Passing open decides the mode for good, and the family then only asks — which is what lets the same message be brought back.',
          `<section slAlert tone="success" dismissible [open]="open" (openChange)="open = $any($event).value">
             <div slAlertContent>
               <div slAlertTitle>Report ready</div>
               <p slAlertDescription>The application is what removes this message from the screen.</p>
             </div>
           </section>
           <button slButton size="sm" variant="outline" type="button" (click)="open = true">
             Mostrar de novo
           </button>`,
        ) +
        scene(
          'The request is refused',
          'cancel() stops the change before it commits, so a confirmation flow keeps the message and the keyboard exactly where they were.',
          `<section slAlert tone="danger" dismissible (openChange)="confirmed || $any($event).cancel()">
             <div slAlertContent>
               <div slAlertTitle>Three unsaved changes</div>
               <p slAlertDescription>The X asks, and the application refuses until the exit is confirmed.</p>
             </div>
           </section>
           <button slButton size="sm" variant="outline" type="button" (click)="confirmed = true">
             Confirmar
           </button>`,
        ),
    ),
  }),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Beside the message it belongs to',
        'The controls are the consumer’s own buttons in a part outside the live region, so a reader hearing the message is not read two button labels inside it.',
        `<section slAlert tone="warning" dismissible>
           <div slAlertContent>
             <div slAlertTitle>Your subscription expires in three days</div>
             <p slAlertDescription>Renew to keep access for the team.</p>
           </div>
           <div slAlertActions>
             <button slButton type="button">Renovar</button>
             <button slButton variant="ghost" type="button">
               Ver planos
             </button>
           </div>
         </section>`,
      ) +
        scene(
          'In a column too narrow for two',
          'Past the family’s own container breakpoint the row becomes a column, and each control keeps its own width — how wide a button is belongs to the button.',
          `<div class="slotted-demo-measure">
             <section slAlert tone="warning" dismissible>
               <div slAlertContent>
                 <div slAlertTitle>Sua assinatura expira</div>
                 <p slAlertDescription>Renove para manter o acesso.</p>
               </div>
               <div slAlertActions>
                 <button slButton type="button">Renovar</button>
                 <button slButton variant="ghost" type="button">
                   Ver planos
                 </button>
               </div>
             </section>
           </div>`,
        ),
    ),
  }),
};

export const Live: Story = {
  parameters: scenario('live'),
  render: () => ({
    props: { saves: [] as number[] },
    template: grid(
      2,
      scene(
        'Already on the page',
        'live is off, and the APG says why: a screen reader does not inform anyone of an alert that was present before the page finished loading.',
        message(
          '',
          'About time zones',
          'Nothing here is announced, because nothing here has changed since the page opened.',
        ),
      ) +
        scene(
          'Arriving while the reader is elsewhere',
          'Press Save with a screen reader running: role=status is on the text alone, so the message is read and the dismiss control beside it is not.',
          `<button slButton size="sm" type="button" (click)="saves = saves.concat(saves.length + 1)">
             Save
           </button>
           @for (attempt of saves; track attempt) {
             <section slAlert tone="success" live="polite" dismissible>
               <div slAlertContent>
                 <div slAlertTitle>Changes saved</div>
                 <p slAlertDescription>Attempt {{ attempt }}.</p>
               </div>
             </section>
           }`,
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Long, and in another language',
        'A German compound wraps to a second line and the mark stays on the first, because the mark is one line box tall rather than centred on the whole message.',
        message(
          'tone="warning" dismissible',
          'Die Zahlungsbestätigung konnte nicht zugestellt werden',
          'The delivery attempt failed because the registered billing address does not match the address provided by the financial institution.',
        ),
      ) +
        scene(
          'A string no language can break',
          'A container digest breaks inside itself rather than running out of the box, and nothing is removed: the whole string stays in the DOM and a page search still finds it.',
          `<div class="slotted-demo-measure">${message(
            'tone="danger"',
            'O deploy falhou',
            'sha256:9f2c4ab1de77c0d5e8b3a6f41c9d0e72b58a4437cc61de09f2a3b7d1e40c5a86',
          )}</div>`,
        ) +
        scene(
          'No mark, and no description',
          'Both parts are optional and the box has no empty row for either: the rhythm is each part’s own distance rather than a gap the grid reserves.',
          message(
            'hideIcon tone="secondary" variant="outline"',
            'No mark at all',
            'An editorial callout that carries its own illustration in the body.',
          ) + message('tone="success" dismissible', 'All saved'),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    applicationConfig({
      providers: [provideAlertDefaults({ reach: 'inline', tone: 'secondary' })],
    }),
  ],
  render: () => ({
    template: grid(
      2,
      scene(
        'One decision for the application',
        'provideAlertDefaults sets the tone and the reach once for everything in this story; a message that states any of them still wins.',
        message('dismissible', '', 'Inherits everything from the provider.') +
          message('dismissible tone="danger"', '', 'States its own tone, and wins.'),
      ) +
        scene(
          'The element the page wrote',
          'Angular needs no render prop: the directive sits on the consumer’s own element, so a title becomes a real heading when the page wants the message in its outline.',
          `<aside slAlert>
             <div slAlertContent>
               <h3 slAlertTitle>Maintenance</h3>
               <p slAlertDescription>The box is an aside; the title is an h3.</p>
             </div>
           </aside>`,
        ) +
        scene(
          'The page’s own mark',
          'An element carrying slAlertIcon is projected into the box the family draws, so it keeps the size, the colour and the place on the first line the tone’s mark would have had.',
          `<section slAlert tone="accent">
             <ng-icon slAlertIcon aria-hidden="true" name="lucideShield"></ng-icon>
             <div slAlertContent>
               <div slAlertTitle>Two-step verification</div>
               <p slAlertDescription>The artwork belongs to the application; the box belongs to the family.</p>
             </div>
           </section>`,
        ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A landmark, and a region inside it',
        'With a title the box is a region a reader can jump to; without one it is a plain grouping element, because a section named by nothing is named by nothing.',
        message('live="polite"', 'Maintenance', 'Region “Maintenance”, with a status inside it.') +
          message('', '', 'No title: plain grouping, no landmark.'),
      ) +
        scene(
          'Where the keyboard goes',
          'Tab to the button, then into the message, then close it: focus returns to the button rather than falling to the top of the page.',
          `<p slText>Tab to here, then to the X, and close the message.</p>
           <button slButton size="sm" variant="outline" type="button">Before the message</button>
           ${message('tone="danger" dismissible', 'Could not save')}`,
        ),
    ),
  }),
};
