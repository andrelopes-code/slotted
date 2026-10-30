import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AtSign, BadgeCheck, ChevronDown, Ellipsis, Info, Lock, Search } from 'lucide-react';
import { useRef, useState } from 'react';

import { Field, FieldCounter, FieldDescription, FieldError, FieldLabel } from '../field';
import { Button } from '../button';
import { ButtonGroup } from '../button-group';
import { Icon } from '../icon';
import { Kbd } from '../kbd';
import { Menu, MenuContent, MenuItem, MenuRadioGroup, MenuRadioItem, MenuTrigger } from '../menu';
import { Switch } from '../switch';
import { Tooltip, TooltipContent, TooltipLayer, TooltipTrigger } from '../tooltip';
import { TextField, TextFieldAction } from './text-field';
import { TextFieldDefaultsProvider } from './text-field-defaults';
import { Grid, Measure, Scene } from './text-field-demo';
import { REACT_TEXT_FIELD_DOCS, REACT_TEXT_FIELD_TOKENS } from './text-field.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TEXT_FIELD_DOCS.textField.scenes, {
    playground: Playground,
    sizes: Sizes,
    variants: Variants,
    adornments: Adornments,
    actions: Actions,
    menu: MenuInside,
    copy: Copy,
    password: Password,
    loading: Loading,
    states: States,
    count: Count,
    types: Types,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/TextField',
  component: TextField,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Text Field',
        description:
          'One line of text and everything that sits inside its border — an adornment, a clear button, a password toggle — around an input that keeps the value, the identifier and every native attribute.',
        framework: 'React',
        ...REACT_TEXT_FIELD_DOCS.textField,
        tokens: REACT_TEXT_FIELD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    clearable: true,
    mono: false,
    revealable: false,
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Field>
        <FieldLabel>E-mail</FieldLabel>
        <TextField {...args} placeholder="you@company.com" type="email" />
        <FieldDescription>We will use this address for billing.</FieldDescription>
      </Field>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The three steps on their own"
        note="Height, inline padding, type and glyph all come from the control scales, so switching the toolbar to dense shrinks each step whole rather than in parts."
        layout="stack"
      >
        <TextField defaultValue="Compact" size="sm" />
        <TextField defaultValue="Default" size="md" />
        <TextField defaultValue="Comfortable" size="lg" />
      </Scene>
      <Scene
        label="Inside a field, the field decides"
        note="A small field holding a medium control is a field and a control disagreeing about one row, so the control reads the field’s step before its own provider’s."
        layout="stack"
      >
        <Field size="sm">
          <FieldLabel>Code</FieldLabel>
          <TextField defaultValue="SR-4412" />
        </Field>
        <Field size="lg">
          <FieldLabel>Legal name</FieldLabel>
          <TextField defaultValue="Sirius Group Technology" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A frame that takes the ground it is placed on"
        note="outline paints no ground of its own, so the same control looks right on a page, inside a card and inside a sunken panel without a second token."
        layout="stack"
      >
        <TextField defaultValue="outline" />
        <TextField defaultValue="subtle" variant="subtle" />
      </Scene>
      <Scene
        label="A cell that is only a control while it is used"
        note="plain shows no border at rest and keeps exactly the same box, so a table row does not reflow when the pointer crosses it. Hover one and the edge arrives."
        layout="stack"
      >
        <TextField defaultValue="20260442" mono variant="plain" />
        <TextField defaultValue="Reembolso da nota" variant="plain" />
      </Scene>
    </Grid>
  ),
};

export const Adornments: Story = {
  parameters: scenario('adornments'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A mark before the value and a unit after it"
        note="Neither is ever squeezed: the value gives up width first, because the value is the part that can scroll. Switch the toolbar to rtl and R$ stays R$."
        layout="stack"
      >
        <TextField defaultValue="1.480,00" end="BRL" inputMode="decimal" start="R$" />
        <TextField defaultValue="ada.lovelace" start="@" />
      </Scene>
      <Scene
        label="Anything that renders, sized by the control"
        note="An icon placed here reads the control’s own glyph scale, so a small control in a dense table draws a twelve-pixel glyph with nothing written per instance."
        layout="stack"
      >
        <TextField
          placeholder="Search orders"
          start={
            <Icon>
              <Search />
            </Icon>
          }
          type="search"
        />
        <TextField
          placeholder="username"
          size="sm"
          start={
            <Icon>
              <AtSign />
            </Icon>
          }
        />
      </Scene>
    </Grid>
  ),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Clear, and where focus lands after it"
        note="The button is drawn only once there is something to clear. Press it: the value goes, the request says reason “clear”, and focus returns to the control rather than staying on a button that has just vanished."
        layout="stack"
      >
        <TextField clearable defaultValue="invoice 2026" type="search" />
        <TextField clearable placeholder="Nothing to clear yet" />
      </Scene>
      <Scene
        label="Reveal, and the caret it does not move"
        note="Put the caret in the middle of the password and press the toggle: the type swaps and the caret stays. aria-pressed carries the state, so the label never changes with it."
        layout="stack"
      >
        <TextField
          autoComplete="current-password"
          defaultValue="senha-secreta"
          revealable
          type="password"
        />
        <TextField
          clearable
          defaultValue="ada@sirius.com.br"
          end={
            <Icon>
              <BadgeCheck />
            </Icon>
          }
          type="email"
        />
      </Scene>
    </Grid>
  ),
};

function CountryCode() {
  const [country, setCountry] = useState('+55');
  return (
    <Menu>
      <TextField
        aria-label="Phone"
        autoComplete="tel-national"
        defaultValue="206 555-0100"
        start={
          <MenuTrigger
            render={(props) => (
              <TextFieldAction {...props} aria-label={undefined}>
                {country}
                <Icon>
                  <ChevronDown />
                </Icon>
              </TextFieldAction>
            )}
          />
        }
        type="tel"
      />
      <MenuContent>
        <MenuRadioGroup onValueChange={(value) => setCountry(value as string)} value={country}>
          <MenuRadioItem value="+55">Brasil +55</MenuRadioItem>
          <MenuRadioItem value="+351">Portugal +351</MenuRadioItem>
          <MenuRadioItem value="+244">Angola +244</MenuRadioItem>
          <MenuRadioItem value="+1">Estados Unidos +1</MenuRadioItem>
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

function CategorySearch() {
  const [category, setCategory] = useState('Todos');
  return (
    <Menu>
      <TextField
        aria-label="Search products"
        end={
          <MenuTrigger
            render={(props) => (
              <TextFieldAction {...props}>
                {category}
                <Icon>
                  <ChevronDown />
                </Icon>
              </TextFieldAction>
            )}
          />
        }
        placeholder="Search products"
        start={
          <Icon>
            <Search />
          </Icon>
        }
        type="search"
      />
      <MenuContent>
        <MenuRadioGroup onValueChange={(value) => setCategory(value as string)} value={category}>
          <MenuRadioItem value="Todos">Todos</MenuRadioItem>
          <MenuRadioItem value="Parafusos">Parafusos</MenuRadioItem>
          <MenuRadioItem value="Arruelas">Arruelas</MenuRadioItem>
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

export const MenuInside: Story = {
  name: 'Menu',
  parameters: scenario('menu'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A menu that names part of the value"
        note="The country code is a menu of radio items: open it with Enter, Space or ArrowDown, and the trigger stays pressed while the menu is open. A category beside a search is the same shape at the other end."
        layout="stack"
      >
        <CountryCode />
        <CategorySearch />
      </Scene>
      <Scene
        label="A command, an overflow, a hint and a shortcut"
        note="A button named by its words is padded and carries the value’s ink; one named by aria-label is square and quiet, like the family’s own. A key sits at the inner height of the control."
        layout="stack"
      >
        <TextField
          aria-label="Search invoices"
          defaultValue="invoice"
          end={<TextFieldAction>Search</TextFieldAction>}
          type="search"
        />
        <Menu>
          <TextField
            aria-label="File name"
            defaultValue="report-q3.pdf"
            end={
              <MenuTrigger
                render={(props) => (
                  <TextFieldAction {...props} aria-label="More actions">
                    <Icon>
                      <Ellipsis />
                    </Icon>
                  </TextFieldAction>
                )}
              />
            }
          />
          <MenuContent>
            <MenuItem>Renomear</MenuItem>
            <MenuItem>Duplicar</MenuItem>
            <MenuItem>Mover para…</MenuItem>
          </MenuContent>
        </Menu>
        <TextField
          aria-label="Credit limit"
          defaultValue="5,000.00"
          end={
            <Tooltip>
              <TooltipTrigger
                render={(props) => (
                  <TextFieldAction {...props} aria-label="How the limit is calculated">
                    <Icon>
                      <Info />
                    </Icon>
                  </TextFieldAction>
                )}
              />
              <TooltipLayer>
                <TooltipContent>Average of the last six months of billing.</TooltipContent>
              </TooltipLayer>
            </Tooltip>
          }
          inputMode="decimal"
          start="R$"
        />
        <TextField
          aria-label="Search the documentation"
          end={
            <>
              <Kbd keyName="mod" />
              <Kbd>K</Kbd>
            </>
          }
          placeholder="Search the documentation"
          type="search"
        />
      </Scene>
      <Scene
        label="Joined to a button outside the frame"
        note="An addon outside the border is button-group’s shape: shared edges, one seam, corners on the ends. The field takes the width the button leaves, so the button’s label never wraps."
        layout="block"
      >
        <ButtonGroup justify="start">
          <TextField aria-label="Domain" defaultValue="nexora.app" start="https://" />
          <Button tone="secondary" variant="outline">
            Verify
          </Button>
        </ButtonGroup>
      </Scene>
    </Grid>
  ),
};

export const Copy: Story = {
  parameters: scenario('copy'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A link somebody has to paste elsewhere"
        note="Press the copy button: the mark turns to a check in the success ink for two seconds and “Copied” is announced. The value is read-only and still selectable."
        layout="stack"
      >
        <TextField
          aria-label="Link de convite"
          copyable
          defaultValue="https://nexora.app/convite/8f3a"
          readOnly
        />
      </Scene>
      <Scene
        label="A secret key, set in the monospaced face"
        note="Copy stays while the value is read-only and leaves only when there is nothing to copy or the control is disabled."
        layout="stack"
      >
        <TextField
          aria-label="Chave da API"
          copyable
          defaultValue="sk_live_51Hx9fQ2"
          mono
          readOnly
          start={
            <Icon>
              <Lock />
            </Icon>
          }
        />
        <TextField aria-label="Empty key" copyable placeholder="No key generated" readOnly />
      </Scene>
    </Grid>
  ),
};

export const Password: Story = {
  parameters: scenario('password'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Sign in"
        note="Focus the password and switch Caps Lock on: the warning mark appears before the eye, in the warning ink, and “Caps Lock is on” is announced once. Blur the control and it goes."
        layout="stack"
      >
        <Field>
          <FieldLabel>Senha</FieldLabel>
          <TextField
            autoComplete="current-password"
            defaultValue="senha-secreta"
            revealable
            start={
              <Icon>
                <Lock />
              </Icon>
            }
            type="password"
          />
        </Field>
      </Scene>
      <Scene
        label="Choose a new one"
        note="The rule is the application’s, written in the field’s description; the family counts and reveals, and does not score a password."
        layout="stack"
      >
        <Field>
          <FieldLabel>Nova senha</FieldLabel>
          <TextField
            autoComplete="new-password"
            revealable
            showCount
            countMax={12}
            type="password"
          />
          <FieldDescription>At least 12 characters, with a number.</FieldDescription>
        </Field>
      </Scene>
    </Grid>
  ),
};

function HandleCheck() {
  const [loading, setLoading] = useState(true);
  return (
    <div className="slotted-demo-stack">
      <Field>
        <FieldLabel>Username</FieldLabel>
        <TextField clearable defaultValue="ada.lovelace" loading={loading} start="@" />
        <FieldDescription>We check whether the name is free as you type.</FieldDescription>
      </Field>
      <Switch checked={loading} onCheckedChange={setLoading}>
        A verificar
      </Switch>
    </div>
  );
}

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A check that never takes the keyboard"
        note="The ring stands before the clear button and the input is aria-busy, but the value stays editable. Switch the check off and the ring shrinks out on the leaving curve."
        layout="block"
      >
        <HandleCheck />
      </Scene>
      <Scene
        label="Searching as the reader types"
        note="The same ring in a search, with nothing after it: it takes the end of the frame the clear button would take."
        layout="stack"
      >
        <TextField aria-label="Supplier" defaultValue="supplier" loading type="search" />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Invalid, and what says so besides the border"
        note="The border is the quietest part of it: aria-invalid announces the state and the field’s error says it in words, because in the high-contrast scheme the border cannot carry it at all."
        layout="stack"
      >
        <Field invalid>
          <FieldLabel>EIN</FieldLabel>
          <TextField defaultValue="12-3456" />
          <FieldError>Three digits missing.</FieldError>
        </Field>
      </Scene>
      <Scene
        label="Read-only is not disabled"
        note="Read-only keeps full-strength ink, stays focusable and copyable and is still submitted; disabled is muted to a measured colour rather than faded, so a disabled form still says what it holds."
        layout="stack"
      >
        <TextField defaultValue="Somente leitura" readOnly />
        <TextField defaultValue="Desativado" disabled />
        <TextField defaultValue="Desativado com adorno" disabled start="R$" />
      </Scene>
    </Grid>
  ),
};

export const Count: Story = {
  parameters: scenario('count'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A limit the browser enforces"
        note="The control counts and the field draws it in the spare column of its label row, so a count that appears on the first keystroke never pushes the message below it."
        layout="stack"
      >
        <Field>
          <FieldLabel>Assunto</FieldLabel>
          <TextField defaultValue="Reembolso da nota 2026-0442" maxLength={60} showCount />
          <FieldDescription>Aparece na lista de chamados.</FieldDescription>
        </Field>
      </Scene>
      <Scene
        label="A limit the browser does not"
        note="countMax without maxLength is a soft limit: the value may pass it, and the counter turns red before validation has run — which is the only moment the count is being read."
        layout="stack"
      >
        <Field>
          <FieldLabel>Public nickname</FieldLabel>
          <TextField countMax={16} defaultValue="Ada Lovelace Byron" showCount />
        </Field>
        <Field>
          <FieldLabel>Description</FieldLabel>
          <FieldCounter>3 words</FieldCounter>
          <TextField defaultValue="late delivery" showCount />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Types: Story = {
  parameters: scenario('types'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The type, and what travels with it"
        note="A phone field that offers the wrong keyboard on a phone is a field nobody fills in twice, so inputMode, enterKeyHint and autoComplete all reach the element untouched."
        layout="stack"
      >
        <TextField autoComplete="email" defaultValue="ada@sirius.com.br" type="email" />
        <TextField autoComplete="tel" defaultValue="+55 11 98765-4321" inputMode="tel" type="tel" />
        <TextField defaultValue="https://sirius.com.br" enterKeyHint="go" type="url" />
      </Scene>
      <Scene
        label="Search, and the decoration the family withdrew"
        note="WebKit adds its own clear button to a search input; the family draws one of its own, so the platform’s is withdrawn rather than left to sit beside it."
        layout="stack"
      >
        <TextField
          clearable
          defaultValue="invoice"
          enterKeyHint="search"
          start={
            <Icon>
              <Search />
            </Icon>
          }
          type="search"
        />
        <TextField defaultValue="ghp_9Xk2LmQ4pR7tV0wZ" mono />
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Longer than the box, and unbreakable"
        note="The value ellipsises rather than clipping mid-glyph, and nothing is removed from the DOM: the whole string stays selectable, copyable and reachable with the caret."
        layout="stack"
      >
        <TextField defaultValue="Kraftfahrzeug-Haftpflichtversicherungsnummer-2026-0442-XZ" />
        <TextField placeholder="Enter the invoice number, with series and subseries" />
      </Scene>
      <Scene
        label="At 240 pixels, and in the other direction"
        note="The value surrenders width first while the adornments keep their target size, so the clear button stays hittable in a drawer as narrow as a phone."
        layout="stack"
      >
        <Measure>
          <TextField clearable defaultValue="1.480.320.559,00" start="R$" />
        </Measure>
        <Measure>
          <TextField clearable defaultValue="مرحبا بالعالم" dir="rtl" />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => <CompositionScenes />,
};

function CompositionScenes() {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <Grid columns={2}>
      <Scene
        label="Three decisions an application takes once"
        note="The provider carries the appearance, so a form of twenty controls repeats none of it; the button names come from the language in force. A control that states one itself still wins."
        layout="stack"
      >
        <TextFieldDefaultsProvider variant="subtle">
          <TextField clearable defaultValue="Herdado do provider" />
          <TextField clearable defaultValue="Escolhido aqui" variant="outline" />
        </TextFieldDefaultsProvider>
      </Scene>
      <Scene
        label="Reaching the element, and substituting the frame"
        note="ref reaches the input, which already has focus, select and setSelectionRange; render replaces the frame with the consumer’s own element and hands it every attribute."
        layout="stack"
      >
        <TextField
          defaultValue="Click to select all"
          onFocus={() => ref.current?.select()}
          ref={ref}
        />
        <TextField
          defaultValue="A moldura virou um label"
          render={(props) => <label {...props} />}
        />
      </Scene>
    </Grid>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => <KeyboardScenes />,
};

function KeyboardScenes() {
  const [submitted, setSubmitted] = useState('');

  return (
    <Grid columns={2}>
      <Scene
        label="Tab reaches the value, then each button"
        note="Both buttons are real buttons in the tab order, each with its own ring inside the frame — so tabbing from the value moves something visible rather than leaving one ring around the whole box."
        layout="stack"
      >
        <TextField clearable defaultValue="invoice 2026" revealable type="search" />
        <TextField defaultValue="secret-password" revealable type="password" />
      </Scene>
      <Scene
        label="Enter submits, and Escape is left alone"
        note="Enter is the platform’s behaviour for a single-line control and is not intercepted. Nothing is bound to Escape: a control that swallowed it inside a dialog would be one a keyboard user cannot leave."
        layout="stack"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(new FormData(event.currentTarget).get('q')?.toString() ?? '');
          }}
        >
          <Field>
            <FieldLabel>Pesquisa</FieldLabel>
            <TextField clearable defaultValue="press Enter" name="q" type="search" />
            <FieldDescription>
              {submitted === '' ? 'Nothing sent.' : `Sent: ${submitted}`}
            </FieldDescription>
          </Field>
        </form>
      </Scene>
    </Grid>
  );
}
