import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bold, Italic, Pin, Underline, WrapText } from 'lucide-react';
import { useState } from 'react';

import { ToggleButton } from '../button';
import { Grid, Measure, Scene } from '../field/field-demo';
import { TextField } from '../text-field';
import { Toolbar, ToolbarSeparator } from '../toolbar';
import { Text } from '../typography';
import { Toggle } from './toggle';
import { ToggleDefaultsProvider } from './toggle-defaults';
import { REACT_TOGGLE_DOCS, REACT_TOGGLE_TOKENS } from './toggle.docs';
import type { ToggleChangeRequest } from './toggle.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TOGGLE_DOCS.toggle.scenes, {
    playground: Playground,
    pressed: Pressed,
    variant: Variant,
    sizes: Sizes,
    iconOnly: IconOnly,
    states: States,
    toolbar: InsideAToolbar,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
    versus: Versus,
  });

const meta = {
  title: 'Components/Toggle',
  component: Toggle,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Toggle',
        description:
          'A two-state button standing on its own: a mode — Bold, Wrap, Pin — that is true the moment it is pressed, neutral until it is on and one color when it is. It is the APG Button pattern’s toggle button; the action that persists and waits is button’s ToggleButton.',
        framework: 'React',
        ...REACT_TOGGLE_DOCS.toggle,
        tokens: REACT_TOGGLE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    defaultPressed: true,
    disabled: false,
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="stack">
      <Toggle {...args} icon={<WrapText size={16} />}>
        Quebrar linhas
      </Toggle>
    </div>
  ),
};

function Controlled() {
  const [wrap, setWrap] = useState(false);
  return (
    <div className="slotted-demo-stack">
      <Toggle icon={<WrapText size={16} />} onPressedChange={setWrap} pressed={wrap}>
        Wrap lines
      </Toggle>
      <Text tone="muted">{wrap ? 'The page stores: on' : 'The page stores: off'}</Text>
    </div>
  );
}

export const Pressed: Story = {
  parameters: scenario('pressed'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Uncontrolled"
        note="The toggle owns its state and starts from defaultPressed. Press it and it moves on its own, emitting the request after the fact for anyone listening."
        layout="stack"
      >
        <Toggle icon={<WrapText size={16} />} defaultPressed>
          Quebrar linhas
        </Toggle>
      </Scene>
      <Scene
        label="Controlled"
        note="The page holds the value. The toggle asks with a request carrying the reason, and shows nothing until the page has answered — which here it does at once."
        layout="stack"
      >
        <Controlled />
      </Scene>
    </Grid>
  ),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="outline"
        note="An edge of its own, in the control border color, so the toggle stands beside a field as a control. On, the edge turns accent and the ground tints inside it."
        layout="row"
      >
        <Toggle icon={<Pin size={16} />}>Pin header</Toggle>
        <Toggle icon={<Pin size={16} />} defaultPressed>
          Pin header
        </Toggle>
      </Scene>
      <Scene
        label="ghost"
        note="No edge until it is on: the toggle for a bar or a card header that is already framed. Hover gives it the neutral ground; on gives it the same accent pair as outline."
        layout="row"
      >
        <Toggle icon={<Pin size={16} />} variant="ghost">
          Pin header
        </Toggle>
        <Toggle icon={<Pin size={16} />} variant="ghost" defaultPressed>
          Pin header
        </Toggle>
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="sm, md and lg beside a field of the same step"
        note="Each step reads the control scale, so the toggle is exactly as tall as the field next to it and the pair stays level at every density. Switch the density in the toolbar and both move together."
        layout="row"
      >
        <Toggle icon={<WrapText size={14} />} size="sm" defaultPressed>
          Quebrar
        </Toggle>
        <Measure>
          <TextField aria-label="Buscar nos registros" placeholder="Buscar nos registros" />
        </Measure>
        <Toggle icon={<WrapText size={16} />} defaultPressed>
          Quebrar
        </Toggle>
        <Toggle icon={<WrapText size={18} />} size="lg">
          Quebrar
        </Toggle>
      </Scene>
    </Grid>
  ),
};

export const IconOnly: Story = {
  parameters: scenario('iconOnly'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Square, named by aria-label"
        note="With no words the toggle is as wide as it is tall and the mark is centerd. The name a reader hears is the aria-label the consumer wrote, and it does not change when the state does."
        layout="row"
      >
        <Toggle aria-label="Bold" icon={<Bold size={16} />} defaultPressed />
        <Toggle aria-label="Italic" icon={<Italic size={16} />} />
        <Toggle aria-label="Underline" icon={<Underline size={16} />} />
      </Scene>
      <Scene
        label="The same marks, ghost"
        note="A bare icon toggle is the one most toolbars hold. Off, only the mark is drawn; on, the accent pair frames it — so the state is never carried by the mark alone."
        layout="row"
      >
        <Toggle aria-label="Bold" icon={<Bold size={16} />} variant="ghost" defaultPressed />
        <Toggle aria-label="Italic" icon={<Italic size={16} />} variant="ghost" />
        <Toggle aria-label="Underline" icon={<Underline size={16} />} variant="ghost" />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Off, on, and both unavailable — outline"
        note="Hover the first two: off takes the neutral ground, on takes the accent ground’s own hover step, and the two never share a surface. The disabled pair keeps the accent edge on the one that is on."
        layout="row"
      >
        <Toggle icon={<Pin size={16} />}>Pin header</Toggle>
        <Toggle icon={<Pin size={16} />} defaultPressed>
          Pin header
        </Toggle>
        <Toggle icon={<Pin size={16} />} disabled>
          Pin header
        </Toggle>
        <Toggle icon={<Pin size={16} />} defaultPressed disabled>
          Pin header
        </Toggle>
      </Scene>
      <Scene
        label="The same four, ghost"
        note="A ghost toggle that is on has taken a fill and an edge, so it is a framed thing; unavailable and on, it keeps the edge and takes the disabled ground, which in high contrast is the page’s own white."
        layout="row"
      >
        <Toggle icon={<Pin size={16} />} variant="ghost">
          Pin header
        </Toggle>
        <Toggle icon={<Pin size={16} />} variant="ghost" defaultPressed>
          Pin header
        </Toggle>
        <Toggle icon={<Pin size={16} />} variant="ghost" disabled>
          Pin header
        </Toggle>
        <Toggle icon={<Pin size={16} />} variant="ghost" defaultPressed disabled>
          Pin header
        </Toggle>
      </Scene>
    </Grid>
  ),
};

export const InsideAToolbar: Story = {
  parameters: scenario('toolbar'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="An editor bar"
        note="Tab reaches the bar once and lands on one control; the arrows move across every control in it, toggles included; Space presses the one under focus. The bar found each toggle as it finds every focusable control it holds."
        layout="stack"
      >
        <ToggleDefaultsProvider variant="ghost">
          <Toolbar aria-label="Editor">
            <Toggle aria-label="Bold" icon={<Bold size={16} />} defaultPressed />
            <Toggle aria-label="Italic" icon={<Italic size={16} />} />
            <Toggle aria-label="Underline" icon={<Underline size={16} />} />
            <ToolbarSeparator />
            <Toggle icon={<WrapText size={16} />}>Quebrar</Toggle>
            <Toggle icon={<Pin size={16} />} defaultPressed>
              Fixar
            </Toggle>
          </Toolbar>
        </ToggleDefaultsProvider>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A long translated label in a narrow column"
        note="The words clamp at the ellipsis rather than wrapping the control onto a second line, and the string stays whole in the DOM, so the accessible name is the full label."
        layout="block"
      >
        <Measure>
          <Toggle icon={<WrapText size={16} />} defaultPressed>
            Zeilenumbruch aktivieren
          </Toggle>
        </Measure>
      </Scene>
      <Scene
        label="Reading direction"
        note="Switch the direction in the toolbar: the mark moves to the other side of the words, because the gap between them is logical and the family names no left or right."
        layout="row"
      >
        <Toggle icon={<WrapText size={16} />} defaultPressed>
          Wrap lines
        </Toggle>
        <Toggle icon={<Pin size={16} />}>Pin header</Toggle>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Defaults set once"
        note="The provider hands size and variant to every toggle under it. The last one states its own size and wins, because an explicit value is never overridden by context."
        layout="row"
      >
        <ToggleDefaultsProvider size="sm" variant="ghost">
          <Toggle icon={<Bold size={14} />} aria-label="Bold" defaultPressed />
          <Toggle icon={<Italic size={14} />} aria-label="Italic" />
          <Toggle icon={<Pin size={16} />} size="md">
            Pin
          </Toggle>
        </ToggleDefaultsProvider>
      </Scene>
      <Scene
        label="The consumer’s own element"
        note="render receives every attribute the family was going to write — the identity, aria-pressed, the state, the handler — and puts it on a button the consumer owns, here one carrying an analytics attribute."
        layout="row"
      >
        <Toggle
          icon={<Pin size={16} />}
          render={(props) => <button {...props} data-track="pin-header" type="button" />}
        >
          Pin header
        </Toggle>
      </Scene>
    </Grid>
  ),
};

function ReasonLog() {
  const [seen, setSeen] = useState<string>('none yet');
  const onPressedChange = (_pressed: boolean, request: ToggleChangeRequest) =>
    setSeen(request.reason);
  return (
    <div className="slotted-demo-stack">
      <Toggle icon={<WrapText size={16} />} onPressedChange={onPressedChange}>
        Wrap lines
      </Toggle>
      <Text tone="muted">Last reason: {seen}</Text>
    </div>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Space, Enter, and the reason they carry"
        note="Tab to the toggle and press Space or Enter: it turns on, and the request says keyboard. Click it and the request says pointer. No other key is bound — a single button has no arrows of its own."
        layout="stack"
      >
        <ReasonLog />
      </Scene>
    </Grid>
  ),
};

function Follow() {
  const [followed, setFollowed] = useState(false);
  const [following, setFollowing] = useState(false);
  const follow = (next: boolean) => {
    setFollowing(true);
    setTimeout(() => {
      setFollowed(next);
      setFollowing(false);
    }, 900);
  };
  return (
    <ToggleButton loading={following} onPressedChange={follow} pressed={followed}>
      Seguir
    </ToggleButton>
  );
}

export const Versus: Story = {
  parameters: scenario('versus'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Toggle: a mode"
        note="True the moment it is pressed, neutral until on, one color when on. Wrap, Pin, Bold: nothing is sent anywhere, and the reader sees the effect at once."
        layout="row"
      >
        <Toggle icon={<WrapText size={16} />}>Wrap lines</Toggle>
        <Toggle icon={<Pin size={16} />} defaultPressed>
          Pin header
        </Toggle>
      </Scene>
      <Scene
        label="ToggleButton: an action that persists"
        note="Follow reaches a server before it is true, so button’s ToggleButton waits with its indicator and holds the state it still has. It stands in a tone, beside the page’s other actions. Same state model, different member."
        layout="row"
      >
        <Follow />
      </Scene>
    </Grid>
  ),
};
