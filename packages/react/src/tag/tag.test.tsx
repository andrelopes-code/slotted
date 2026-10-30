import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SlottedProvider } from '../i18n';
import { Tag, TagButton, TagDefaultsProvider, TagGroup, TagLink, TagToggle } from './index';
import type { TagRemoveRequest } from './tag.types';

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

const root = (element: HTMLElement) => element.closest('[data-ui="tag"][data-part="root"]');

describe('Tag', () => {
  it('renders one anatomy: a chip box, a content box, and the words in a box of their own', () => {
    const { container } = render(<Tag>Design</Tag>);
    const chip = container.querySelector('[data-ui="tag"][data-part="root"]');

    expect(chip?.tagName).toBe('SPAN');
    expect(chip).toHaveAttribute('data-tone', 'secondary');
    expect(chip).toHaveAttribute('data-variant', 'soft');
    expect(chip).toHaveAttribute('data-size', 'md');
    expect(chip).toHaveAttribute('data-shape', 'pill');
    expect(chip?.querySelector('[data-part="body"] [data-part="label"]')?.textContent).toBe(
      'Design',
    );
  });

  it('wraps a glyph in the part that sizes and centers it', () => {
    const { container } = render(
      <Tag end={<span data-testid="after" />} start={<span data-testid="before" />}>
        Design
      </Tag>,
    );

    expect(container.querySelector('[data-part="start"] [data-testid="before"]')).not.toBeNull();
    expect(container.querySelector('[data-part="end"] [data-testid="after"]')).not.toBeNull();
  });

  it('renders no remove control until something asks to be told about it', () => {
    const { container, rerender } = render(<Tag>Design</Tag>);
    expect(container.querySelector('[data-part="remove"]')).toBeNull();

    rerender(<Tag onRemove={() => undefined}>Design</Tag>);
    expect(container.querySelector('[data-part="remove"]')).not.toBeNull();
    expect(
      container
        .querySelector('[data-part="remove"] > [data-ui="icon"] > svg[data-glyph]')
        ?.getAttribute('data-glyph'),
    ).toBe('x');
  });

  /**
   * The name four surveyed implementations make the consumer write by hand,
   * and keep in step with a value that changes.
   */
  it('names the remove control after the value it removes', () => {
    render(<Tag onRemove={() => undefined}>Ana Reis</Tag>);

    expect(screen.getByRole('button', { name: 'Remove Ana Reis' })).toBeInTheDocument();
  });

  it('says the removal was asked for by the control', () => {
    const onRemove = vi.fn();
    render(<Tag onRemove={onRemove}>Design</Tag>);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Design' }));

    expect(onRemove).toHaveBeenCalledOnce();
    expect((onRemove.mock.calls[0]?.[0] as TagRemoveRequest).reason).toBe('remove');
  });

  it.each(['Backspace', 'Delete'])('removes on %s, and says the keyboard asked', (key) => {
    const onRemove = vi.fn();
    render(<Tag onRemove={onRemove}>Design</Tag>);

    fireEvent.keyDown(screen.getByRole('button', { name: 'Remove Design' }), { key });

    expect((onRemove.mock.calls[0]?.[0] as TagRemoveRequest).reason).toBe('keyboard');
  });

  it('ignores a held key, so one press removes one tag', () => {
    const onRemove = vi.fn();
    render(<Tag onRemove={onRemove}>Design</Tag>);
    const control = screen.getByRole('button', { name: 'Remove Design' });

    fireEvent.keyDown(control, { key: 'Backspace' });
    fireEvent.keyDown(control, { key: 'Backspace', repeat: true });

    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('lets the request be refused before anything commits', () => {
    let seen: TagRemoveRequest | undefined;
    render(
      <Tag
        onRemove={(request) => {
          request.cancel();
          seen = request;
        }}
      >
        Design
      </Tag>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove Design' }));

    expect(seen?.cancelled).toBe(true);
  });

  it('refuses the removal when the control or the chip is unavailable', () => {
    const onRemove = vi.fn();
    const { container, rerender } = render(
      <Tag onRemove={onRemove} removeDisabled>
        Design
      </Tag>,
    );
    const control = () => container.querySelector('[data-part="remove"]') as HTMLButtonElement;

    expect(control()).toBeDisabled();
    fireEvent.keyDown(control(), { key: 'Delete' });
    expect(onRemove).not.toHaveBeenCalled();

    rerender(
      <Tag disabled onRemove={onRemove}>
        Design
      </Tag>,
    );
    expect(control()).toBeDisabled();
    expect(container.querySelector('[data-part="root"]')).toHaveAttribute('data-disabled');
  });

  it('keeps a removal off a handler the consumer put on the chip', () => {
    const onClick = vi.fn();
    render(
      <Tag onClick={onClick} onRemove={() => undefined}>
        Design
      </Tag>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove Design' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders the chip box into the element the page means', () => {
    const { container } = render(<Tag render={(props) => <li {...props} />}>Design</Tag>);

    expect(container.querySelector('li[data-ui="tag"][data-part="root"]')).not.toBeNull();
  });
});

describe('TagDefaultsProvider', () => {
  it('sets the appearance once, and loses to an explicit prop', () => {
    const { container } = render(
      <TagDefaultsProvider size="sm" tone="accent">
        <Tag onRemove={() => undefined}>Herda</Tag>
        <Tag size="lg">Sobrescreve</Tag>
      </TagDefaultsProvider>,
    );
    const chips = [...container.querySelectorAll('[data-ui="tag"][data-part="root"]')];

    expect(chips[0]).toHaveAttribute('data-tone', 'accent');
    expect(chips[0]).toHaveAttribute('data-size', 'sm');
    expect(chips[1]).toHaveAttribute('data-size', 'lg');
  });
});

describe('messages', () => {
  it('announces the remove word of the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Tag onRemove={() => undefined}>Design</Tag>
      </SlottedProvider>,
    );

    expect(screen.getByRole('button', { name: 'Remover Design' })).toBeInTheDocument();
  });

  it('lays its own messages over the catalog', () => {
    render(
      <Tag messages={{ remove: 'Tirar' }} onRemove={() => undefined}>
        Design
      </Tag>,
    );

    expect(screen.getByRole('button', { name: 'Tirar Design' })).toBeInTheDocument();
  });
});

describe('TagButton', () => {
  it('puts the command on a real button that is the chip’s body, not the chip', () => {
    const onClick = vi.fn();
    render(<TagButton onClick={onClick}>Atribuir</TagButton>);
    const control = screen.getByRole('button', { name: 'Atribuir' });

    expect(control).toHaveAttribute('data-part', 'body');
    expect(control.tagName).toBe('BUTTON');
    expect(control).toHaveAttribute('type', 'button');
    expect(root(control)).not.toBeNull();

    fireEvent.click(control);
    expect(onClick).toHaveBeenCalledOnce();
  });

  /** A button inside a button is not legal HTML, and this is why the root is a span. */
  it('keeps the remove control beside the command rather than inside it', () => {
    render(
      <TagButton onClick={() => undefined} onRemove={() => undefined}>
        Atribuir
      </TagButton>,
    );
    const command = screen.getByRole('button', { name: 'Atribuir' });
    const remove = screen.getByRole('button', { name: 'Remove Atribuir' });

    expect(command.contains(remove)).toBe(false);
    expect(remove.parentElement).toBe(command.parentElement);
  });

  it('reaches the chip box through rootProps and the control through its own props', () => {
    render(
      <TagButton id="control" onClick={() => undefined} rootProps={{ id: 'chip' }}>
        Atribuir
      </TagButton>,
    );

    expect(document.getElementById('chip')).toHaveAttribute('data-part', 'root');
    expect(document.getElementById('control')).toHaveAttribute('data-part', 'body');
  });
});

describe('TagLink', () => {
  it('navigates on a real anchor', () => {
    render(<TagLink href="/equipes">#plataforma</TagLink>);
    const link = screen.getByRole('link', { name: '#plataforma' });

    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/equipes');
    expect(link).toHaveAttribute('data-part', 'body');
  });

  it('loses its destination when it cannot be followed', () => {
    render(
      <TagLink disabled href="/equipes">
        #arquivado
      </TagLink>,
    );
    const link = screen.getByRole('link', { name: '#arquivado' });

    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '0');
    expect(root(link)).toHaveAttribute('data-disabled');
  });

  it('refuses the activation before a consumer’s own handler can run', () => {
    const onClick = vi.fn();
    render(
      <TagLink disabled href="/equipes" onClick={onClick}>
        #arquivado
      </TagLink>,
    );

    fireEvent.click(screen.getByRole('link', { name: '#arquivado' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('TagToggle', () => {
  it('announces its selection as a pressed state and keeps its label', () => {
    render(<TagToggle>Open</TagToggle>);
    const control = screen.getByRole('button', { name: 'Open' });

    expect(control).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(control);
    expect(control).toHaveAttribute('aria-pressed', 'true');
    expect(control).toHaveAccessibleName('Open');
    expect(root(control)).toHaveAttribute('data-selected');
  });

  it('starts an uncontrolled chip from a value read once', () => {
    const { rerender } = render(<TagToggle defaultSelected>Open</TagToggle>);
    const control = screen.getByRole('button', { name: 'Open' });

    expect(control).toHaveAttribute('aria-pressed', 'true');
    rerender(<TagToggle defaultSelected={false}>Open</TagToggle>);
    expect(control).toHaveAttribute('aria-pressed', 'true');
  });

  it('never moves a selection the consumer owns', () => {
    const onSelectedChange = vi.fn();
    render(
      <TagToggle onSelectedChange={onSelectedChange} selected={false}>
        Open
      </TagToggle>,
    );
    const control = screen.getByRole('button', { name: 'Open' });

    fireEvent.click(control, { detail: 1 });

    expect(onSelectedChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(control).toHaveAttribute('aria-pressed', 'false');
  });

  it('recovers the reason from the event a native button reports', () => {
    const onSelectedChange = vi.fn();
    render(<TagToggle onSelectedChange={onSelectedChange}>Open</TagToggle>);

    fireEvent.click(screen.getByRole('button', { name: 'Open' }), { detail: 0 });

    expect(onSelectedChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  it('moves nothing when the consumer refuses the activation', () => {
    const onSelectedChange = vi.fn();
    render(
      <TagToggle onClick={(event) => event.preventDefault()} onSelectedChange={onSelectedChange}>
        Open
      </TagToggle>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it('gives the selection a mark of its own, so color is never the only signal', () => {
    const { container } = render(<TagToggle defaultSelected>Open</TagToggle>);

    expect(container.querySelector('[data-part="indicator"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(
      container
        .querySelector('[data-part="indicator"] > [data-ui="icon"] > svg[data-glyph]')
        ?.getAttribute('data-glyph'),
    ).toBe('check');
  });
});

describe('TagGroup', () => {
  it('is a toolbar with one tab stop, and moves between every control inside it', () => {
    render(
      <TagGroup aria-label="Filtros">
        <Tag onRemove={() => undefined}>Open</Tag>
        <Tag onRemove={() => undefined}>Closed</Tag>
      </TagGroup>,
    );
    const group = screen.getByRole('toolbar', { name: 'Filtros' });
    const controls = within(group).getAllByRole('button');

    expect(controls).toHaveLength(2);
    expect(controls[0]).toHaveAttribute('tabindex', '0');
    expect(controls[1]).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(controls[0]!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(controls[1]);

    fireEvent.keyDown(controls[1]!, { key: 'Home' });
    expect(document.activeElement).toBe(controls[0]);
  });

  it('reaches the remove control with the same arrow key, in DOM order', () => {
    render(
      <TagGroup aria-label="Filtros">
        <TagButton onClick={() => undefined} onRemove={() => undefined}>
          Open
        </TagButton>
        <TagButton onClick={() => undefined}>Closed</TagButton>
      </TagGroup>,
    );
    const group = screen.getByRole('toolbar', { name: 'Filtros' });
    const controls = within(group).getAllByRole('button');

    expect(controls.map((control) => control.getAttribute('data-part'))).toEqual([
      'body',
      'remove',
      'body',
    ]);
    fireEvent.keyDown(controls[0]!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(controls[1]);
  });

  it('stops being a widget when it is written as a list', () => {
    render(
      <TagGroup aria-label="Tecnologias" role="list">
        <Tag>TypeScript</Tag>
        <Tag>Angular</Tag>
      </TagGroup>,
    );
    const items = screen.getAllByRole('listitem');

    expect(screen.getByRole('list', { name: 'Tecnologias' })).toBeInTheDocument();
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute('data-ui', 'tag');
  });

  it('writes the orientation only when it is not the role’s own default', () => {
    const { rerender } = render(<TagGroup aria-label="Run" />);
    expect(screen.getByRole('toolbar')).not.toHaveAttribute('aria-orientation');

    rerender(<TagGroup aria-label="Run" orientation="vertical" />);
    expect(screen.getByRole('toolbar')).toHaveAttribute('aria-orientation', 'vertical');
    expect(screen.getByRole('toolbar')).toHaveAttribute('data-orientation', 'vertical');
  });
});

function RemovableFilters({ initial }: { initial: readonly string[] }) {
  const [filters, setFilters] = useState(initial);

  return (
    <TagGroup aria-label="Filtros">
      {filters.map((filter) => (
        <Tag key={filter} onRemove={() => setFilters(filters.filter((it) => it !== filter))}>
          {filter}
        </Tag>
      ))}
    </TagGroup>
  );
}

describe('TagGroup focus after a removal', () => {
  it('sends focus to the control that took the removed one’s place', async () => {
    render(<RemovableFilters initial={['Open', 'Closed', 'Blocked']} />);
    const controls = () => within(screen.getByRole('toolbar')).getAllByRole('button');

    controls()[1]!.focus();
    fireEvent.click(controls()[1]!);
    await settled();

    expect(document.activeElement).toHaveAccessibleName('Remove Blocked');
  });

  it('falls back to the last control when the removed one was last', async () => {
    render(<RemovableFilters initial={['Open', 'Closed']} />);
    const controls = () => within(screen.getByRole('toolbar')).getAllByRole('button');

    controls()[1]!.focus();
    fireEvent.click(controls()[1]!);
    await settled();

    expect(document.activeElement).toHaveAccessibleName('Remove Open');
  });

  /** The step no surveyed implementation takes: focus never returns to the body. */
  it('holds focus in the group when its last tag is removed', async () => {
    render(<RemovableFilters initial={['Open']} />);
    const group = screen.getByRole('toolbar');

    within(group).getAllByRole('button')[0]!.focus();
    fireEvent.click(within(group).getAllByRole('button')[0]!);
    await settled();

    expect(document.activeElement).toBe(group);
    expect(group).toHaveAttribute('tabindex', '-1');
  });

  it('keeps the tab stop on a control that still exists', async () => {
    render(<RemovableFilters initial={['Open', 'Closed', 'Blocked']} />);
    const controls = () => within(screen.getByRole('toolbar')).getAllByRole('button');

    fireEvent.click(controls()[0]!);
    await settled();

    expect(controls()[0]).toHaveAttribute('tabindex', '0');
  });
});
