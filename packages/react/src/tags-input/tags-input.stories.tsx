import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { TagsInput } from './tags-input';
import { TagsInputDefaultsProvider } from './tags-input-defaults';
import { REACT_TAGS_INPUT_DOCS, REACT_TAGS_INPUT_TOKENS } from './tags-input.docs';
import type { TagsInputHandle, TagsInputProps } from './tags-input.types';

const Scene = ({ children, label, note }: { children: ReactNode; label: string; note: string }) => (
  <section className="slotted-demo-scene">
    <header className="slotted-demo-scene__header">
      <span className="slotted-demo-scene__label">{label}</span>
      <span className="slotted-demo-scene__note">{note}</span>
    </header>
    <div className="slotted-demo-stage" data-layout="block">
      {children}
    </div>
  </section>
);

/**
 * One domain for the whole page: a message being composed in a support desk.
 * Real addresses, real names, real mistakes — because a control's defects
 * only appear against content a product would actually hold.
 */
const CONTACTS = new Map([
  ['ana.pereira@example.com', 'Ana Pereira'],
  ['tomas.lindqvist@example.com', 'Tomas Lindqvist'],
  ['wei.zhang@example.com', 'Wei Zhang'],
  ['nadia.haddad@example.com', 'Nadia Haddad'],
  ['support@example.com', 'Support'],
]);

const TEAM = [...CONTACTS.keys()].slice(0, 4);

const MANY = [
  'ana.pereira@example.com',
  'tomas.lindqvist@example.com',
  'wei.zhang@example.com',
  'nadia.haddad@example.com',
  'bruno.costa@example.com',
  'carla.mendes@example.org',
  'diego.alves@example.com',
  'elena.rossi@example.net',
  'felipe.souza@example.com',
  'gabi.lima@example.org',
  'hugo.leal@example.com',
  'iris.nunes@example.net',
];

const Basic = (props: Partial<TagsInputProps>) => (
  <TagsInput aria-label="To" placeholder="Add a recipient" type="email" {...props} />
);

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TAGS_INPUT_DOCS['tags-input'].scenes, {
    blur: Blur,
    composition: Composition,
    copy: Copy,
    duplicates: Duplicates,
    editing: Editing,
    form: InAForm,
    keyboard: Keyboard,
    limit: Limit,
    locked: Locked,
    'long-content': LongContent,
    overflow: Overflow,
    paste: Paste,
    'platform-validation': PlatformValidation,
    playground: Playground,
    recipients: Recipients,
    reorder: Reorder,
    sizes: Sizes,
    states: States,
    validity: Validity,
    variants: Variants,
  }) as never;

const meta = {
  title: 'Components/Tags Input',
  component: TagsInput,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Tags Input',
        description:
          'A frame of typed values, with a field that adds more. The value is a list of texts, a value that fails is held and shown rather than dropped, and the browser judges when no validator is given.',
        framework: 'React',
        ...REACT_TAGS_INPUT_DOCS['tags-input'],
        tokens: REACT_TAGS_INPUT_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof TagsInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    addOnPaste: true,
    allowDuplicates: false,
    clearable: true,
    disabled: false,
    editable: false,
    invalidValues: 'keep',
    overflow: 'wrap',
    pendingOnBlur: 'commit',
    readOnly: false,
    reorderable: false,
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => <Basic {...args} defaultValue={['ana.pereira@example.com', 'jhon.company']} />,
};

function WithNames() {
  const [to, setTo] = useState<readonly string[]>([
    'ana.pereira@example.com',
    'wei.zhang@example.com',
  ]);
  return (
    <div className="slotted-demo-stack">
      <Basic
        formatLabel={(address) => CONTACTS.get(address) ?? address}
        onValueChange={setTo}
        value={to}
      />
      <p>Value: {to.join(', ')}</p>
    </div>
  );
}

export const Recipients: Story = {
  parameters: scenario('recipients'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="The text is the label"
        note="Each chip is the address the reader typed. Remove one and the announcement says what left and how many are left."
      >
        <Basic defaultValue={TEAM.slice(0, 3)} />
      </Scene>
      <Scene
        label="A name where the value is an address"
        note="formatLabel draws the chip from the value; the value a form receives — printed under the control — stays the address."
      >
        <WithNames />
      </Scene>
    </div>
  ),
};

function Refusing() {
  const [refused, setRefused] = useState<string | null>(null);
  return (
    <div className="slotted-demo-stack">
      <TagsInput
        aria-label="SKUs"
        defaultValue={['ABC-1234']}
        invalidValues="refuse"
        onValueRefuse={(values, { cause }) =>
          setRefused(cause === 'invalid' ? `Not an SKU: ${values.join(', ')}` : null)
        }
        placeholder="ABC-0000"
        validate={(text) => /^[A-Z]{3}-\d{4}$/.test(text)}
      />
      {refused === null ? null : <p>{refused}</p>}
    </div>
  );
}

export const Validity: Story = {
  parameters: scenario('validity'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Kept, marked, described"
        note="jhon.company failed the validator and stayed. Hover the chip for its reason, or press the submit button of a form around it and read the browser's own bubble."
      >
        <Basic
          defaultValue={['ana.pereira@example.com', 'jhon.company', 'wei.zhang@example.com']}
          validate={(text) => (text.includes('@') ? true : 'Needs an @')}
        />
      </Scene>
      <Scene
        label="Refused, for a filter operand"
        note='A set filter has nowhere to put a bad identifier, so invalidValues="refuse" reports it instead: type abc and press Enter.'
      >
        <Refusing />
      </Scene>
    </div>
  ),
};

export const PlatformValidation: Story = {
  parameters: scenario('platform-validation'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label='type="email", no validator'
        note="The two marked addresses were judged by the browser's own email grammar, and the reason on each chip is the browser's own sentence, in the browser's own language."
      >
        <Basic defaultValue={['ana.pereira@example.com', 'tomas.lindqvist', 'wei@']} />
      </Scene>
      <Scene
        label="pattern, no validator"
        note="Order numbers are ORD- and six digits. The pattern is the input's own attribute, applied to each value exactly as the platform applies it to one."
      >
        <TagsInput
          aria-label="Order numbers"
          defaultValue={['ORD-104233', 'ORD-1042', '104240']}
          pattern="ORD-\d{6}"
          placeholder="ORD-000000"
        />
      </Scene>
    </div>
  ),
};

function Limited() {
  const [refused, setRefused] = useState<string | null>(null);
  return (
    <div className="slotted-demo-stack">
      <TagsInput
        aria-label="Reviewers"
        defaultValue={['ana.pereira@example.com']}
        max={3}
        onValueRefuse={(values, { cause }) =>
          setRefused(cause === 'limit' ? `Not added: ${values.join(', ')}` : null)
        }
        placeholder="Add a reviewer"
        type="email"
      />
      {refused === null ? null : <p>{refused}</p>}
    </div>
  );
}

export const Limit: Story = {
  parameters: scenario('limit'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Under the limit"
        note="The counter is drawn only because max is set. Paste four addresses separated by commas and read which ones did not fit."
      >
        <Limited />
      </Scene>
      <Scene
        label="Full"
        note="The counter takes the accent, the root carries data-complete, and the next value typed is refused and reported rather than taken silently."
      >
        <TagsInput aria-label="Reviewers" defaultValue={TEAM.slice(0, 3)} max={3} type="email" />
      </Scene>
    </div>
  ),
};

export const Duplicates: Story = {
  parameters: scenario('duplicates'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Refused, and shown where"
        note="The text in the field is the first address in capitals. Press Enter: focus lands on the chip that already holds it and its edge takes the accent for a moment."
      >
        <Basic defaultInputValue="ANA.PEREIRA@EXAMPLE.COM" defaultValue={TEAM.slice(0, 2)} />
      </Scene>
      <Scene
        label="Allowed"
        note="A picking list where the same line may be counted twice sets allowDuplicates, and the second chip stands beside the first."
      >
        <TagsInput
          allowDuplicates
          aria-label="Line items"
          defaultValue={['SKU-2201', 'SKU-2201', 'SKU-0930']}
        />
      </Scene>
    </div>
  ),
};

/** An address list with display names in it, which a split on the comma would break. */
const ADDRESS = /[^\s@,"<>]+@[^\s,>"]+/g;

export const Paste: Story = {
  parameters: scenario('paste'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Commas, semicolons and line breaks"
        note="Paste a column copied out of a spreadsheet, or a list with semicolons: every line and every delimiter becomes a value."
      >
        <TagsInput
          aria-label="Cc"
          delimiters={[',', ';']}
          placeholder="Paste a list"
          type="email"
        />
      </Scene>
      <Scene
        label="A clipboard the family cannot guess"
        note='Paste "Lopes, André" &lt;andre@example.com&gt;, bob@example.org — with split, the quoted name does not become a value of its own.'
      >
        <TagsInput
          aria-label="To"
          placeholder="Paste from another mail client"
          split={(text) => text.match(ADDRESS) ?? []}
          type="email"
        />
      </Scene>
    </div>
  ),
};

export const Blur: Story = {
  parameters: scenario('blur'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="commit, keep, discard"
        note="Type an address in each and press Tab. The first turns it into a value, the second leaves it in the box, the third empties it."
      >
        <div className="slotted-demo-stack">
          <Basic pendingOnBlur="commit" placeholder="commit" />
          <TagsInput aria-label="Filter" pendingOnBlur="keep" placeholder="keep" />
          <TagsInput aria-label="Tags" pendingOnBlur="discard" placeholder="discard" />
        </div>
      </Scene>
    </div>
  ),
};

export const Editing: Story = {
  parameters: scenario('editing'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Enter opens, Enter commits, Escape reverts"
        note="Arrow to a chip and press Enter, or double click it. Fix the typo in tomas.lindqvist, press Enter, and the chip is judged again and loses its mark."
      >
        <Basic
          defaultValue={['ana.pereira@example.com', 'tomas.lindqvist', 'wei.zhang@example.com']}
          editable
        />
      </Scene>
    </div>
  ),
};

function Ordered() {
  const [order, setOrder] = useState<readonly string[]>(TEAM);
  const [saved, setSaved] = useState<string>('');
  return (
    <div className="slotted-demo-stack">
      <TagsInput
        aria-label="Approvers, in order"
        formatLabel={(address) => CONTACTS.get(address) ?? address}
        onValueChange={(next, { reason }) => {
          setOrder(next);
          if (reason === 'keyboard')
            setSaved(`Saved: ${next.map((a) => CONTACTS.get(a)).join(' → ')}`);
        }}
        reorderable
        type="email"
        value={order}
      />
      {saved === '' ? null : <p>{saved}</p>}
    </div>
  );
}

export const Reorder: Story = {
  parameters: scenario('reorder'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Alt with an arrow"
        note="Arrow to a chip, hold Alt and press an arrow: the chip moves one place and the announcement says where it landed. Only a reorder carries the reason keyboard, which is what the line under the control listens for."
      >
        <Ordered />
      </Scene>
    </div>
  ),
};

export const Locked: Story = {
  parameters: scenario('locked'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="A mandatory recipient"
        note="support@example.com stays whatever the reader presses: no remove button, skipped by Backspace, kept by the clear button, and still reachable by arrow."
      >
        <TagsInput
          aria-label="Cc"
          defaultValue={['support@example.com', 'ana.pereira@example.com', 'wei.zhang@example.com']}
          lockedValues={['support@example.com']}
          type="email"
        />
      </Scene>
    </div>
  ),
};

function Copying() {
  const [copied, setCopied] = useState<string>('');
  return (
    <div className="slotted-demo-stack">
      <Basic
        defaultValue={TEAM}
        onValueCopy={(values, outcome) =>
          setCopied(
            outcome === 'refused'
              ? 'The clipboard refused the write'
              : `Copied: ${values.join(', ')}`,
          )
        }
      />
      {copied === '' ? null : <p>{copied}</p>}
    </div>
  );
}

export const Copy: Story = {
  parameters: scenario('copy'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="One chip, or the whole list"
        note="Press Ctrl+C on the empty field to copy every address joined by commas; arrow to a chip and press Ctrl+C for that one, or Ctrl+X to copy it and take it out."
      >
        <Copying />
      </Scene>
    </div>
  ),
};

export const Overflow: Story = {
  parameters: scenario('overflow'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="wrap: three rows, then scroll"
        note="Twelve addresses wrap to three rows and the fourth scrolls into view — the wheel and the arrow keys reach it, and every chip stays in the DOM."
      >
        <TagsInput aria-label="Cc" defaultValue={MANY} type="email" />
      </Scene>
      <Scene
        label="collapse: one line that opens where the reader is"
        note="At rest, one line and a +N. Click into the control or Tab to it and every chip appears; leave and it folds back. There is no popup, and none is needed."
      >
        <TagsInput aria-label="Cc" defaultValue={MANY} overflow="collapse" type="email" />
      </Scene>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="sm, md, lg"
        note="Three control heights and one chip: the chip keeps the small step at every size, because it is a chip and not a control."
      >
        <div className="slotted-demo-stack">
          <Basic defaultValue={TEAM.slice(0, 2)} placeholder="Small" size="sm" />
          <Basic defaultValue={TEAM.slice(0, 2)} placeholder="Medium" size="md" />
          <Basic defaultValue={TEAM.slice(0, 2)} placeholder="Large" size="lg" />
        </div>
      </Scene>
    </div>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="outline and subtle"
        note="An edge for a form, and a ground for a panel that already has one."
      >
        <div className="slotted-demo-stack">
          <Basic defaultValue={TEAM.slice(0, 1)} variant="outline" />
          <Basic defaultValue={TEAM.slice(0, 1)} variant="subtle" />
        </div>
      </Scene>
      <Scene
        label="plain, in the row it exists for"
        note="No edge, no lift and no ground: the row is the ground, and a resting shadow would draw a cell where there is none."
      >
        <div className="slotted-demo-rows">
          <span>Watchers</span>
          <Basic defaultValue={TEAM.slice(0, 2)} variant="plain" />
          <span>Approvers</span>
          <Basic defaultValue={TEAM.slice(2, 4)} variant="plain" />
        </div>
      </Scene>
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="disabled and readOnly"
        note="Disabled answers nothing and keeps its values legible; read-only keeps the chips at full ink, the caret and the copy, and withholds every remove control."
      >
        <div className="slotted-demo-stack">
          <Basic defaultValue={TEAM.slice(0, 1)} disabled />
          <Basic defaultValue={TEAM.slice(0, 2)} readOnly />
        </div>
      </Scene>
      <Scene
        label="required and invalid"
        note="required is written on the input only while the list is empty; invalid retints the border and the focus ring together, whether the consumer said so or a value failed."
      >
        <div className="slotted-demo-stack">
          <Basic required />
          <Basic invalid required />
        </div>
      </Scene>
    </div>
  ),
};

export const LongContent: Story = {
  parameters: scenario('long-content'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="An address longer than the frame"
        note="The chip truncates and the value stays whole in the accessibility tree and to a page search: truncation never removes content from the DOM."
      >
        <Basic
          defaultValue={[
            'quality-assurance-and-release-management@subsidiary.example.com',
            'Aufmerksamkeitsdefizithyperaktivitätsstörung',
          ]}
        />
      </Scene>
      <Scene
        label="In a narrow column"
        note="At 360 pixels the row wraps and the longest chip truncates, and the frame stays the frame. Narrower than 120 pixels — a table cell — a chip narrower than a word is a shape, so the chips withdraw and the counter answers instead; the width is watched rather than queried, because a container query would stop the frame’s width depending on its contents."
      >
        <div className="slotted-demo-measure">
          <Basic defaultValue={TEAM.slice(0, 3)} fullWidth />
        </div>
      </Scene>
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="One tab stop, and the keys inside it"
        note="Tab reaches the field once. Backspace from the empty field moves to the last chip and removes nothing; a second press removes it. ArrowLeft and ArrowRight walk the row, Enter edits, Alt with an arrow moves, Escape returns to the field, and any letter types itself there."
      >
        <Basic defaultValue={TEAM.slice(0, 3)} editable reorderable />
      </Scene>
    </div>
  ),
};

export const InAForm: Story = {
  parameters: scenario('form'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Named, described and in error"
        note="One hidden input per value under the name to. The field carries the label, the description and the error by ID, and the family's own verdict blocks the native submit as well."
      >
        <Field invalid required>
          <FieldLabel>To</FieldLabel>
          <FieldDescription>Everyone who should see this message.</FieldDescription>
          <Basic name="to" />
          <FieldError>Name at least one recipient</FieldError>
        </Field>
      </Scene>
      <Scene
        label="Beside the controls it sits with"
        note="A message being composed: To, Cc with a locked support address, and the same frame, the same height when empty and the same focus ring as every other control on the form."
      >
        <>
          <Field required>
            <FieldLabel>To</FieldLabel>
            <Basic defaultValue={TEAM.slice(0, 1)} name="to" />
          </Field>
          <Field>
            <FieldLabel>Cc</FieldLabel>
            <TagsInput
              defaultValue={['support@example.com']}
              lockedValues={['support@example.com']}
              name="cc"
              placeholder="Add a recipient"
              type="email"
            />
          </Field>
        </>
      </Scene>
    </div>
  ),
};

function WithHandle() {
  const [handle, setHandle] = useState<TagsInputHandle | null>(null);
  return (
    <div className="slotted-demo-stack">
      <Basic handleRef={setHandle} list="contacts" />
      <datalist id="contacts">
        {[...CONTACTS.keys()].map((address) => (
          <option key={address} value={address} />
        ))}
      </datalist>
      <button onClick={() => handle?.setValue(TEAM, 'programmatic')} type="button">
        Add the whole team
      </button>
    </div>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Defaults an application sets once"
        note="The provider carries every axis; a prop written on one control still wins over it, which is the resolution order every family declares. The words come from the language in force."
      >
        <TagsInputDefaultsProvider size="sm" variant="subtle">
          <div className="slotted-demo-stack">
            <Basic defaultValue={TEAM.slice(0, 1)} />
            <Basic defaultValue={TEAM.slice(1, 2)} variant="outline" />
          </div>
        </TagsInputDefaultsProvider>
      </Scene>
      <Scene
        label="The handle, and the browser's own completion"
        note="list names a datalist, so the browser draws its own suggestions with no popup of the family's; setValue takes the whole list at once under the reason programmatic."
      >
        <WithHandle />
      </Scene>
    </div>
  ),
};
