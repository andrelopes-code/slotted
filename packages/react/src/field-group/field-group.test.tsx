import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/field-group/contract.json';
import { Field, FieldControl, FieldDefaultsProvider, FieldLabel } from '../field';
import { TextField } from '../text-field';
import {
  FieldGroup,
  FieldGroupContent,
  FieldGroupDescription,
  FieldGroupError,
  FieldGroupLegend,
} from './index';

describe('FieldGroup', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(
      <FieldGroup data-testid="group">
        <FieldGroupLegend>Billing address</FieldGroupLegend>
        <FieldGroupContent data-testid="content" />
      </FieldGroup>,
    );

    const group = screen.getByTestId('group');
    expect(group.tagName).toBe('FIELDSET');
    expect(group).toHaveAttribute('data-ui', 'field-group');
    expect(group).toHaveAttribute('data-part', 'root');
    expect(screen.getByText('Billing address')).toHaveAttribute('data-part', 'legend');
    expect(screen.getByTestId('content')).toHaveAttribute('data-part', 'content');
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    render(<FieldGroup data-testid="group" />);

    const group = screen.getByTestId('group');
    const { defaults } = contract.members.fieldGroup;
    expect(group).toHaveAttribute('data-size', defaults.size);
    expect(group).toHaveAttribute('data-orientation', defaults.orientation);
    expect(group).toHaveAttribute('data-necessity', defaults.necessity);
    for (const state of ['data-disabled', 'data-invalid', 'data-required', 'data-readonly']) {
      expect(group).not.toHaveAttribute(state);
    }
  });

  /**
   * The `group` role and the accessible name arrive from the platform, which is
   * the technique the APG's naming practice calls for under its Rule 3. No ARIA
   * is written for either.
   */
  it('takes its role and its name from the platform', () => {
    render(
      <FieldGroup>
        <FieldGroupLegend>Nacionalidade</FieldGroupLegend>
      </FieldGroup>,
    );

    expect(screen.getByRole('group', { name: 'Nacionalidade' })).toBeInTheDocument();
  });

  /**
   * GOV.UK's error-message-with-legend example puts the hint and the error ids
   * on the `fieldset` itself, so a reader entering any control in the group
   * hears both once from the element that names them.
   */
  it('describes the whole set from the element that names it', () => {
    render(
      <FieldGroup data-testid="group" id="nationality">
        <FieldGroupLegend>Nacionalidade</FieldGroupLegend>
        <FieldGroupDescription>Marque todas as que se aplicam.</FieldGroupDescription>
        <FieldGroupError>Choose at least one.</FieldGroupError>
      </FieldGroup>,
    );

    expect(screen.getByTestId('group')).toHaveAttribute(
      'aria-describedby',
      'nationality-description nationality-error',
    );
    expect(screen.getByText('Marque todas as que se aplicam.').closest('p')).toHaveAttribute(
      'id',
      'nationality-description',
    );
  });

  it('merges the group’s description after a value the consumer wrote', () => {
    render(
      <FieldGroup aria-describedby="tour-step" data-testid="group" id="nationality">
        <FieldGroupDescription>Marque todas as que se aplicam.</FieldGroupDescription>
      </FieldGroup>,
    );

    expect(screen.getByTestId('group')).toHaveAttribute(
      'aria-describedby',
      'tour-step nationality-description',
    );
  });

  /**
   * The platform disables the controls. The family writes `data-disabled` and
   * provides `disabled` to its fields as well, because a label is not a control
   * and nothing in the fieldset's own attribute reaches it.
   */
  it('disables its controls through the platform and its labels through the field', () => {
    render(
      <FieldGroup data-testid="group" disabled>
        <FieldGroupContent>
          <Field data-testid="field">
            <FieldControl data-testid="control" />
          </Field>
        </FieldGroupContent>
      </FieldGroup>,
    );

    expect(screen.getByTestId('group')).toBeDisabled();
    expect(screen.getByTestId('group')).toHaveAttribute('data-disabled');
    expect(screen.getByTestId('field')).toHaveAttribute('data-disabled');
    expect(screen.getByTestId('control')).toBeDisabled();
  });

  /**
   * A compact section is one attribute rather than one per field, and a field
   * that states its own still wins. Among the surveyed implementations only
   * Angular Material has application-wide defaults, and only for Angular.
   */
  it('provides for the fields inside it, and yields to a field that states its own', () => {
    render(
      <FieldGroup labelPlacement="side" size="sm">
        <FieldGroupContent>
          <Field data-testid="inherited" />
          <Field data-testid="own" size="lg" />
        </FieldGroupContent>
      </FieldGroup>,
    );

    expect(screen.getByTestId('inherited')).toHaveAttribute('data-size', 'sm');
    expect(screen.getByTestId('inherited')).toHaveAttribute('data-label-placement', 'side');
    expect(screen.getByTestId('own')).toHaveAttribute('data-size', 'lg');
  });

  /**
   * `required` is a fact about one value and a section cannot know it, so the
   * group draws the marker on its own legend and provides nothing to the
   * fields.
   */
  it('marks its own name as necessary without marking every field in it', () => {
    render(
      <FieldGroup required>
        <FieldGroupLegend>Nacionalidade</FieldGroupLegend>
        <FieldGroupContent>
          <Field data-testid="field">
            <FieldLabel>Brasileira</FieldLabel>
          </Field>
        </FieldGroupContent>
      </FieldGroup>,
    );

    expect(screen.getByText('*')).toHaveAttribute('data-part', 'mark');
    expect(screen.getByTestId('field')).not.toHaveAttribute('data-required');
  });

  /**
   * A section is a topic rather than a question: its legend says nothing about
   * necessity, and its fields keep the style the application set.
   */
  it('says nothing about the necessity of a section and leaves its fields the application’s style', () => {
    render(
      <FieldDefaultsProvider necessity="optional">
        <FieldGroup kind="section">
          <FieldGroupLegend>Value</FieldGroupLegend>
          <FieldGroupContent>
            <Field>
              <FieldLabel>Note</FieldLabel>
              <TextField />
            </Field>
          </FieldGroupContent>
        </FieldGroup>
      </FieldDefaultsProvider>,
    );

    expect(screen.getByRole('group', { name: 'Value' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Note (optional)' })).toBeInTheDocument();
  });

  it('separates the necessity word from the legend in the accessible name', () => {
    render(
      <FieldGroup necessity="optional">
        <FieldGroupLegend>Value</FieldGroupLegend>
      </FieldGroup>,
    );

    expect(screen.getByRole('group', { name: 'Value (optional)' })).toBeInTheDocument();
  });

  it('says the set’s necessity in words when the application asks for words', () => {
    render(
      <FieldGroup messages={{ required: '(required)' }} required necessity="words">
        <FieldGroupLegend>Nationality</FieldGroupLegend>
      </FieldGroup>,
    );

    expect(screen.getByText('(required)')).not.toHaveAttribute('aria-hidden');
  });

  it('speaks through the message family in the two tones the contract names', () => {
    render(
      <FieldGroup id="nationality">
        <FieldGroupDescription data-testid="description">Marque todas.</FieldGroupDescription>
        <FieldGroupError data-testid="error">Choose at least one.</FieldGroupError>
      </FieldGroup>,
    );

    expect(screen.getByTestId('description')).toHaveAttribute('data-ui', contract.messageFamily);
    expect(screen.getByTestId('description')).toHaveAttribute(
      'data-tone',
      contract.messageTones.description,
    );
    expect(screen.getByTestId('error')).toHaveAttribute('data-tone', contract.messageTones.error);
  });

  it('renders every part into another element on request', () => {
    render(
      <FieldGroup data-testid="group">
        <FieldGroupLegend render={(props) => <legend {...props} data-testid="legend" />}>
          <h2>What is your nationality?</h2>
        </FieldGroupLegend>
        <FieldGroupContent render={(props) => <ul {...props} data-testid="content" />} />
      </FieldGroup>,
    );

    expect(screen.getByTestId('content').tagName).toBe('UL');
    expect(screen.getByTestId('legend').querySelector('h2')).toBeInTheDocument();
  });
});

/**
 * The server renders once and runs no effect, so a description or an error
 * the group learned only by registration would be missing from its markup,
 * and hydration would keep that markup.
 */
describe('FieldGroup on the server', () => {
  const parse = (html: string) => {
    const host = document.createElement('div');
    host.innerHTML = html;
    return host.querySelector('fieldset') as HTMLFieldSetElement;
  };

  it('is described by the description and the error written in it', () => {
    const fieldset = parse(
      renderToString(
        <FieldGroup id="terms">
          <FieldGroupLegend>Payment term</FieldGroupLegend>
          <FieldGroupDescription>Applies to all invoices.</FieldGroupDescription>
          <FieldGroupError>Escolha um prazo.</FieldGroupError>
          <FieldGroupContent>
            <Field>
              <FieldLabel>Dias</FieldLabel>
              <FieldControl />
            </Field>
          </FieldGroupContent>
        </FieldGroup>,
      ),
    );

    expect(fieldset).toHaveAttribute('aria-describedby', 'terms-description terms-error');
  });

  it('is not described by an empty error, nor by a nested group’s messages', () => {
    const fieldset = parse(
      renderToString(
        <FieldGroup id="outer">
          <FieldGroupLegend>Delivery</FieldGroupLegend>
          <FieldGroupError reserve>{''}</FieldGroupError>
          <FieldGroup id="inner">
            <FieldGroupLegend>Window</FieldGroupLegend>
            <FieldGroupDescription>From 8 AM to 6 PM.</FieldGroupDescription>
          </FieldGroup>
        </FieldGroup>,
      ),
    );

    expect(fieldset).not.toHaveAttribute('aria-describedby');
  });
});
