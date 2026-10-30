import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/list/contract.json';
import { ListItem, ListItemContent, ListItemLabel } from '../list-item';
import { List, ListDefaultsProvider, ListEmpty, ListSection } from './index';

const row = (label: string) => (
  <ListItem data-testid={`row-${label}`}>
    <ListItemContent>
      <ListItemLabel>{label}</ListItemLabel>
    </ListItemContent>
  </ListItem>
);

describe('List', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(
      <List aria-label="Folders" data-testid="list">
        <ListSection data-testid="section" label="Recent">
          {row('Photos')}
        </ListSection>
        <ListEmpty data-testid="empty">No matches</ListEmpty>
      </List>,
    );

    expect(screen.getByTestId('list')).toHaveAttribute('data-ui', contract.ui);
    expect(screen.getByTestId('list')).toHaveAttribute('data-part', 'root');
    expect(screen.getByTestId('section')).toHaveAttribute('data-part', 'section');
    expect(screen.getByTestId('empty')).toHaveAttribute('data-part', 'empty');
    expect(screen.getByRole('heading', { name: 'Recent' })).toHaveAttribute(
      'data-part',
      'section-label',
    );
  });

  /**
   * The family draws its own marker, because a row is a content box beside its
   * independent targets and CSS has no `display` that is both `list-item` and a
   * grid. Safari and VoiceOver drop list semantics the moment CSS removes the
   * marker, so the role restores what the layout costs.
   */
  it('writes the role that survives its own marker being drawn in CSS', () => {
    render(<List data-testid="list">{row('Photos')}</List>);

    expect(screen.getByTestId('list')).toHaveAttribute('role', 'list');
  });

  it('keeps a role the consumer wrote, because that is a decision about the page', () => {
    render(
      <List data-testid="list" role="menu">
        {row('Photos')}
      </List>,
    );

    expect(screen.getByTestId('list')).toHaveAttribute('role', 'menu');
  });

  /**
   * The reading order of a set and the mark painted beside it are two
   * questions. Every surveyed implementation answers them with one value, which
   * is why a numbered queue that paints its own badges has to give up `ol`.
   */
  it('separates the element that carries order from the mark that is painted', () => {
    const { rerender } = render(<List data-testid="list">{row('One')}</List>);
    expect(screen.getByTestId('list').tagName).toBe('UL');

    rerender(
      <List data-testid="list" ordered>
        {row('One')}
      </List>,
    );
    expect(screen.getByTestId('list').tagName).toBe('OL');
    expect(screen.getByTestId('list')).toHaveAttribute('data-marker', 'none');

    rerender(
      <List data-testid="list" marker="bullet">
        {row('One')}
      </List>,
    );
    expect(screen.getByTestId('list').tagName).toBe('UL');
    expect(screen.getByTestId('list')).toHaveAttribute('data-marker', 'bullet');
  });

  /**
   * ARIA 1.2 §5.2.6 requires `aria-busy` on a container whose required owned
   * elements have not arrived. That is the whole of `loading`: the picture is
   * the page's, and `skeleton` is what stands in for the rows.
   */
  it('marks a set that is still filling', () => {
    render(
      <List data-testid="list" loading>
        {row('Photos')}
      </List>,
    );

    expect(screen.getByTestId('list')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('list')).toHaveAttribute('data-loading', '');
  });

  /**
   * A group is an `li` holding a heading and a nested list, and the nested list
   * names itself by that heading — which is what tells a reader who lands
   * inside the group which group it is.
   */
  it('nests a group where HTML already nests one, and names it', () => {
    render(
      <List data-testid="list" ordered>
        <ListSection data-testid="section" label="Folders">
          {row('Photos')}
        </ListSection>
      </List>,
    );

    const section = screen.getByTestId('section');
    expect(section.tagName).toBe('LI');

    const nested = section.querySelector('[data-part="section-list"]');
    expect(nested?.tagName).toBe('OL');
    expect(nested).toHaveAttribute('role', 'list');
    expect(nested).toHaveAttribute(
      'aria-labelledby',
      screen.getByRole('heading', { name: 'Folders' }).id,
    );
  });

  it('sets the heading the document needs, and writes none when asked for none', () => {
    const { rerender } = render(
      <List>
        <ListSection data-testid="section" label="Folders" level="2" />
      </List>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Folders' })).toBeInTheDocument();

    rerender(
      <List>
        <ListSection data-testid="section" label="Folders" level="none" />
      </List>,
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  /** The message belongs inside the set, so the reader hears it at all. */
  it('says what an empty set holds from inside the set', () => {
    render(
      <List data-testid="list">
        <ListEmpty data-testid="empty">No matches</ListEmpty>
      </List>,
    );

    expect(screen.getByTestId('empty').tagName).toBe('LI');
    expect(screen.getByTestId('list')).toContainElement(screen.getByTestId('empty'));
  });

  it('lets an application set its lists once, and lets a list still win', () => {
    render(
      <ListDefaultsProvider marker="bullet" size="lg" variant="ruled">
        <List data-testid="inherited">{row('One')}</List>
        <List data-testid="own" variant="framed">
          {row('Two')}
        </List>
      </ListDefaultsProvider>,
    );

    expect(screen.getByTestId('inherited')).toHaveAttribute('data-variant', 'ruled');
    expect(screen.getByTestId('inherited')).toHaveAttribute('data-size', 'lg');
    expect(screen.getByTestId('inherited')).toHaveAttribute('data-marker', 'bullet');
    expect(screen.getByTestId('own')).toHaveAttribute('data-variant', 'framed');
  });

  /** The set hands rows four values, and a row that states one still wins. */
  it('hands each row what the set decided', () => {
    render(
      <List data-testid="list" inset marker="number" size="sm" variant="ruled">
        {row('One')}
        <ListItem data-testid="own" size="lg">
          <ListItemContent>
            <ListItemLabel>Two</ListItemLabel>
          </ListItemContent>
        </ListItem>
      </List>,
    );

    const inherited = screen.getByTestId('row-One');
    expect(inherited).toHaveAttribute('data-variant', 'ruled');
    expect(inherited).toHaveAttribute('data-size', 'sm');
    expect(inherited).toHaveAttribute('data-marker', 'number');
    expect(inherited).toHaveAttribute('data-inset', '');

    expect(screen.getByTestId('own')).toHaveAttribute('data-size', 'lg');
    expect(screen.getByTestId('own')).toHaveAttribute('data-variant', 'ruled');
  });

  it('renders the wiring into the element the page means', () => {
    render(
      <List render={(props) => <nav {...props} aria-label="Sections" data-testid="rendered" />}>
        {row('One')}
      </List>,
    );

    expect(screen.getByTestId('rendered').tagName).toBe('NAV');
    expect(screen.getByTestId('rendered')).toHaveAttribute('data-ui', 'list');
  });

  /**
   * The set holds no value a consumer can own, so it declares no state model.
   * Selection with roving focus is `listbox`'s and `table`'s: ARIA 1.2 does not
   * allow `aria-selected` on `listitem`.
   */
  it('declares no state model, and the contract agrees', () => {
    expect('stateModel' in contract).toBe(false);
    expect(contract.declined.selection.deferTo).toBe('listbox');
  });
});

/**
 * A phone day list: the day on the left, its balance on the right, over a
 * rule, with no band behind it.
 */
describe('a group heading with an end', () => {
  function Days({ sticky = false }: { sticky?: boolean }) {
    return (
      <List aria-label="Transactions">
        <ListSection end="−$58.40" label="Today" labelVariant="ruled" sticky={sticky}>
          <ListItem>
            <ListItemContent>
              <ListItemLabel>Mercado</ListItemLabel>
            </ListItemContent>
          </ListItem>
        </ListSection>
      </List>
    );
  }

  it('sets the name at the start and the end content after it, in the ruled variant', () => {
    render(<Days />);
    const heading = screen.getByRole('heading', { name: /Today/ });
    expect(heading).toHaveAttribute('data-part', 'section-label');
    expect(heading).toHaveAttribute('data-variant', 'ruled');
    expect(heading.querySelector('[data-part="section-end"]')).toHaveTextContent('−$58.40');
    expect(screen.getByRole('list', { name: /Today/ })).toBeInTheDocument();
  });

  it('writes the caption variant by default and keeps sticky', () => {
    render(
      <List aria-label="Recentes">
        <ListSection label="Recent" sticky>
          <ListItem>
            <ListItemContent>
              <ListItemLabel>Mercado</ListItemLabel>
            </ListItemContent>
          </ListItem>
        </ListSection>
      </List>,
    );
    const heading = screen.getByRole('heading', { name: 'Recent' });
    expect(heading).toHaveAttribute('data-variant', 'caption');
    expect(heading).toHaveAttribute('data-sticky');
    expect(heading.querySelector('[data-part="section-end"]')).toBeNull();
  });
});
