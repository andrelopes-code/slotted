import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { Text } from '../typography';
import { ToastRegion } from './toast';
import { DemoRegion } from './toast-demo';
import { Toast, ToastContent, ToastDescription, ToastTitle } from './toast-parts';
import { REACT_TOAST_DOCS, REACT_TOAST_TOKENS } from './toast.docs';
import type { ToastTone } from './toast.types';

const DIGEST = 'sha256:9f2c4be7d1a05e83bb47c6f0e19d3a7c58e2b41d6f90ac3e7215b8d40c6ea915';

const TONES: readonly { tone: ToastTone; title: string }[] = [
  { tone: 'accent', title: 'Two people joined' },
  { tone: 'secondary', title: 'Filters cleared' },
  { tone: 'success', title: 'Invoice sent' },
  { tone: 'warning', title: 'The license expires in 3 days' },
  { tone: 'danger', title: 'Could not send' },
];

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TOAST_DOCS.toast.scenes, {
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

const meta = {
  title: 'Components/Toast',
  component: ToastRegion,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Toast',
        description:
          'Transient feedback about something that already happened — a tone, a mark, a sentence, sometimes a control that acts on it, and a clock that stops whenever the reader is reading. The dashed box in every demonstration stands in for the screen: in an application the region is fixed against the viewport and the messages are given a duration.',
        framework: 'React',
        ...REACT_TOAST_DOCS.toast,
        tokens: REACT_TOAST_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof ToastRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    placement: 'bottom-end',
    stacking: 'list',
    swipe: true,
    limit: 3,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <DemoRegion
        {...args}
        seed={[
          {
            title: 'Draft saved',
            description: 'Everything since 2:02 PM is saved.',
            tone: 'accent',
          },
        ]}
        size="layer"
        trigger={(toaster) => (
          <Button
            onClick={() =>
              toaster.show({
                title: 'Draft saved',
                description: 'Everything since 2:02 PM is saved.',
                duration: 0,
              })
            }
            size="sm"
          >
            Show one more
          </Button>
        )}
      />
    </div>
  ),
};

export const Tones: Story = {
  parameters: scenario('tones'),
  render: () => (
    <div className="slotted-demo-stage" data-layout="block">
      <DemoRegion limit={5} seed={TONES} size="tall" />
    </div>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <div className="slotted-demo-stage" data-layout="block">
      <DemoRegion
        limit={3}
        seed={[
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
        ]}
        size="tall"
      />
    </div>
  ),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => (
    <div className="slotted-demo-stage" data-layout="block">
      <DemoRegion
        placement="top-start"
        seed={[{ title: 'top-start', tone: 'accent' }]}
        size="layer"
      />
      <DemoRegion placement="bottom" seed={[{ title: 'bottom, centered' }]} size="layer" />
    </div>
  ),
};

export const Timing: Story = {
  parameters: scenario('timing'),
  render: () => (
    <div className="slotted-demo-stage" data-layout="block">
      <DemoRegion
        limit={2}
        seed={[
          {
            title: 'Exported 1,204 rows',
            description: 'The file is in your downloads.',
            tone: 'success',
            duration: 8000,
            progress: true,
          },
          { title: 'Session expired', tone: 'danger', duration: 0 },
        ]}
        size="layer"
      />
    </div>
  ),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => (
    <div className="slotted-demo-stage" data-layout="block">
      <DemoRegion
        seed={[]}
        size="layer"
        trigger={(toaster) => (
          <Button
            onClick={() => {
              const id = toaster.show({
                title: 'Message archived',
                description: 'It left the inbox and stays in the account.',
                tone: 'secondary',
                actions: (
                  <Button
                    onClick={() => toaster.dismiss(id, 'pointer')}
                    size="sm"
                    variant="outline"
                  >
                    Undo
                  </Button>
                ),
              });
            }}
            size="sm"
          >
            Arquivar
          </Button>
        )}
      />
    </div>
  ),
};

export const PromiseScene: Story = {
  parameters: scenario('promise'),
  render: () => (
    <div className="slotted-demo-stage" data-layout="block">
      <DemoRegion
        seed={[]}
        size="layer"
        trigger={(toaster) => (
          <Button
            onClick={() =>
              toaster
                .promise(new Promise<string>((resolve) => setTimeout(() => resolve('4.2'), 1600)), {
                  loading: {
                    id: 'publish',
                    title: 'Publishing',
                    description: 'It takes a minute.',
                  },
                  success: (version) => ({
                    title: `Version ${version} is live`,
                    tone: 'success',
                    duration: 0,
                  }),
                  error: { title: 'Publishing failed', tone: 'danger', duration: 0 },
                })
                .catch(() => undefined)
            }
            size="sm"
          >
            Publicar
          </Button>
        )}
      />
    </div>
  ),
};

export const Queue: Story = {
  parameters: scenario('queue'),
  render: () => (
    <div className="slotted-demo-stage" data-layout="block">
      <DemoRegion
        limit={2}
        seed={[
          { title: 'First', description: 'It arrived before the others.' },
          { title: 'Second', tone: 'secondary' },
          { title: 'Third', tone: 'success' },
          { title: 'Fourth', tone: 'warning' },
        ]}
        size="layer"
      />
      <Text size="sm" tone="muted">
        Two on screen, two waiting. Close one and the next appears — and only then does its clock
        start.
      </Text>
    </div>
  ),
};

export const Stacking: Story = {
  parameters: scenario('stacking'),
  render: () => (
    <div className="slotted-demo-stage" data-layout="block">
      <DemoRegion
        limit={3}
        seed={[
          { title: 'Filters cleared', tone: 'secondary' },
          { title: 'Draft saved', tone: 'accent' },
          {
            title: 'Invoice sent',
            description: 'A copy went to finance.',
            tone: 'success',
          },
        ]}
        size="layer"
        stacking="stack"
      />
    </div>
  ),
};

export const Dismissal: Story = {
  parameters: scenario('dismissal'),
  render: () => (
    <div className="slotted-demo-stage" data-layout="block">
      <DemoRegion
        limit={3}
        seed={[
          {
            title: 'With a close control',
            description: 'Press the ✕, or drag it to the edge.',
          },
          { title: 'No control', dismissible: false, tone: 'secondary' },
          { title: 'With a clock', duration: 12000, progress: true, tone: 'success' },
        ]}
        size="tall"
      />
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <div className="slotted-demo-stage" data-layout="block">
      <Button size="sm">Any control on the page</Button>
      <DemoRegion
        limit={2}
        seed={[
          {
            title: 'Invoice sent',
            description: 'Press F6 to get here.',
            tone: 'success',
          },
          { title: 'Draft saved', tone: 'accent' },
        ]}
        size="layer"
      />
      <Text size="sm" tone="muted">
        F6 takes focus to the newest message. Tab walks the controls, Escape closes the message
        focus is on and returns it to the control above.
      </Text>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-stage" data-layout="block">
      <DemoRegion
        limit={3}
        seed={[
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
        ]}
        size="tall"
      />
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-stage" data-layout="block">
      <DemoRegion
        seed={[
          {
            title: 'Written by the page',
            description: 'The behavior still belongs to the family.',
          },
        ]}
        size="layer"
      >
        {(message) => (
          <Toast key={message.id} message={message}>
            <ToastContent>
              <ToastTitle>{message.data.title}</ToastTitle>
              <ToastDescription>{message.data.description}</ToastDescription>
            </ToastContent>
          </Toast>
        )}
      </DemoRegion>
    </div>
  ),
};
