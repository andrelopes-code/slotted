import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlButton } from '@slotted/angular/button';
import { SlText } from '@slotted/angular/typography';

import { SlToastRegion } from './toast';
import { SlToastContent, SlToastDescription, SlToastTitle } from './toast-parts';
import { SlToastDemo } from './toast.demo';
import { ANGULAR_TOAST_DOCS, ANGULAR_TOAST_TOKENS } from './toast.docs';
import type { ToastPlacement, ToastStacking } from './toast-defaults';

interface ToastStoryArgs {
  limit: number;
  placement: ToastPlacement;
  stacking: ToastStacking;
  swipe: boolean;
}

const DIGEST = 'sha256:9f2c4be7d1a05e83bb47c6f0e19d3a7c58e2b41d6f90ac3e7215b8d40c6ea915';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TOAST_DOCS.toast.scenes, {
    playground: Playground,
    tones: Tones,
    variants: Variants,
    placement: Placement,
    timing: Timing,
    actions: Actions,
    promise: PromiseScene,
    queue: Queue,
    stacking: Stacking,
    dismissal: Dismissal,
    keyboard: Keyboard,
    content: Content,
    composition: Composition,
  }) as never;

const meta: Meta<ToastStoryArgs> = {
  title: 'Components/Toast',
  component: SlToastRegion,
  decorators: [
    moduleMetadata({
      imports: [
        SlButton,
        SlText,
        SlToastContent,
        SlToastDemo,
        SlToastDescription,
        SlToastRegion,
        SlToastTitle,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Toast',
        description:
          'Transient feedback about something that already happened — a tone, a mark, a sentence, sometimes a control that acts on it, and a clock that stops whenever the reader is reading. The dashed box in every demonstration stands in for the screen: in an application the region is fixed against the viewport and the messages are given a duration.',
        framework: 'Angular',
        ...ANGULAR_TOAST_DOCS.toast,
        tokens: ANGULAR_TOAST_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ToastStoryArgs>;

/** The stage every story stands on, so no story reaches for an inline style. */
const stage = (body: string) => `<div class="slotted-demo-stage" data-layout="block">${body}</div>`;

export const Playground: Story = {
  args: { limit: 3, placement: 'bottom-end', stacking: 'list', swipe: true },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: {
      ...args,
      seed: [
        {
          title: 'Draft saved',
          description: 'Everything since 2:02 PM is saved.',
          tone: 'accent',
        },
      ],
    },
    template: stage(`
      <sl-toast-demo
        #demo="slToastDemo"
        size="layer"
        [limit]="limit"
        [placement]="placement"
        [seed]="seed"
        [stacking]="stacking"
        [swipe]="swipe"
      >
        <button
          slButton
          size="sm"
          type="button"
          (click)="demo.show({ title: 'Draft saved', description: 'Everything since 2:02 PM is saved.', duration: 0 })"
        >
          Show one more
        </button>
      </sl-toast-demo>`),
  }),
};

export const Tones: Story = {
  parameters: scenario('tones'),
  render: () => ({
    props: {
      seed: [
        { tone: 'accent', title: 'Two people joined' },
        { tone: 'secondary', title: 'Filters cleared' },
        { tone: 'success', title: 'Invoice sent' },
        { tone: 'warning', title: 'The license expires in 3 days' },
        { tone: 'danger', title: 'Could not send' },
      ],
    },
    template: stage('<sl-toast-demo size="tall" [limit]="5" [seed]="seed" />'),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    props: {
      seed: [
        {
          title: 'raised',
          description: 'The tone is in the mark and nowhere else.',
          tone: 'success',
        },
        {
          title: 'soft',
          description: 'The tone’s surface, and the tone’s ink.',
          tone: 'success',
          variant: 'soft',
        },
        {
          title: 'solid',
          description: 'The fill, and the one ink measured against it.',
          tone: 'danger',
          variant: 'solid',
        },
      ],
    },
    template: stage('<sl-toast-demo size="tall" [limit]="3" [seed]="seed" />'),
  }),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => ({
    props: {
      top: [{ title: 'top-start', tone: 'accent' }],
      bottom: [{ title: 'bottom, centered' }],
    },
    template: stage(`
      <sl-toast-demo placement="top-start" size="layer" [seed]="top" />
      <sl-toast-demo placement="bottom" size="layer" [seed]="bottom" />`),
  }),
};

export const Timing: Story = {
  parameters: scenario('timing'),
  render: () => ({
    props: {
      seed: [
        {
          title: 'Exported 1,204 rows',
          description: 'The file is in your downloads.',
          tone: 'success',
          duration: 8000,
          progress: true,
        },
        { title: 'Session expired', tone: 'danger', duration: 0 },
      ],
    },
    template: stage('<sl-toast-demo size="layer" [limit]="2" [seed]="seed" />'),
  }),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => ({
    props: {},
    template: stage(`
      <ng-template #undo let-message>
        <button slButton size="sm" type="button" variant="outline" (click)="demo.dismiss(message.id)">
          Undo
        </button>
      </ng-template>
      <sl-toast-demo #demo="slToastDemo" size="layer">
        <button
          slButton
          size="sm"
          type="button"
          (click)="demo.show({ title: 'Message archived', description: 'It left the inbox and stays in the account.', tone: 'secondary', actions: undo })"
        >
          Arquivar
        </button>
      </sl-toast-demo>`),
  }),
};

export const PromiseScene: Story = {
  parameters: scenario('promise'),
  render: () => ({
    props: {
      publish: () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('4.2'), 1600);
        }),
      onPublished: (version: string) => ({
        title: `Version ${version} is live`,
        tone: 'success',
        duration: 0,
      }),
    },
    template: stage(`
      <sl-toast-demo #demo="slToastDemo" size="layer">
        <button
          slButton
          size="sm"
          type="button"
          (click)="demo.promise(publish(), { loading: { id: 'publish', title: 'Publishing', description: 'It takes a minute.' }, success: onPublished, error: { title: 'Publishing failed', tone: 'danger', duration: 0 } })"
        >
          Publicar
        </button>
      </sl-toast-demo>`),
  }),
};

export const Queue: Story = {
  parameters: scenario('queue'),
  render: () => ({
    props: {
      seed: [
        { title: 'First', description: 'It arrived before the others.' },
        { title: 'Second', tone: 'secondary' },
        { title: 'Third', tone: 'success' },
        { title: 'Fourth', tone: 'warning' },
      ],
    },
    template: stage(`
      <sl-toast-demo size="layer" [limit]="2" [seed]="seed" />
      <p slText size="sm" tone="muted">
        Two on screen, two waiting. Close one and the next appears — and only then does its clock
        start.
      </p>`),
  }),
};

export const Stacking: Story = {
  parameters: scenario('stacking'),
  render: () => ({
    props: {
      seed: [
        { title: 'Filters cleared', tone: 'secondary' },
        { title: 'Draft saved', tone: 'accent' },
        {
          title: 'Invoice sent',
          description: 'A copy went to finance.',
          tone: 'success',
        },
      ],
    },
    template: stage('<sl-toast-demo size="layer" stacking="stack" [limit]="3" [seed]="seed" />'),
  }),
};

export const Dismissal: Story = {
  parameters: scenario('dismissal'),
  render: () => ({
    props: {
      seed: [
        { title: 'With a close control', description: 'Press the ✕, or drag it to the edge.' },
        { title: 'No control', dismissible: false, tone: 'secondary' },
        { title: 'With a clock', duration: 12000, progress: true, tone: 'success' },
      ],
    },
    template: stage('<sl-toast-demo size="tall" [limit]="3" [seed]="seed" />'),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: {
      seed: [
        { title: 'Invoice sent', description: 'Press F6 to get here.', tone: 'success' },
        { title: 'Draft saved', tone: 'accent' },
      ],
    },
    template: stage(`
      <button slButton size="sm" type="button">Any control on the page</button>
      <sl-toast-demo size="layer" [limit]="2" [seed]="seed" />
      <p slText size="sm" tone="muted">
        F6 takes focus to the newest message. Tab walks the controls, Escape closes the message
        focus is on and returns it to the control above.
      </p>`),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: {
      seed: [
        { title: 'Deployment rejected', description: DIGEST, tone: 'danger' },
        {
          title: 'Die Zwischenspeicherung der Berechtigungsnachweise wurde zurückgesetzt',
          tone: 'warning',
        },
        {
          title: 'No mark at all',
          description: 'The words start at the box’s own inset.',
          hideIcon: true,
          tone: 'secondary',
        },
      ],
    },
    template: stage('<sl-toast-demo size="tall" [limit]="3" [seed]="seed" />'),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: {},
    template: stage(`
      <ng-template #body let-message>
        <div slToastContent>
          <div slToastTitle>{{ message.data.title }}</div>
          <p slToastDescription>{{ message.data.description }}</p>
        </div>
      </ng-template>
      <sl-toast-demo #demo="slToastDemo" size="layer">
        <button
          slButton
          size="sm"
          type="button"
          (click)="demo.show({ title: 'Written by the page', description: 'The behaviour still belongs to the family.', duration: 0, body: body })"
        >
          Mostrar
        </button>
      </sl-toast-demo>`),
  }),
};
