import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createElement, Fragment } from 'react';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import * as buttonLinkStories from './button-link.stories';
import { REACT_BUTTON_DOCS } from './button.docs';
import * as overviewStories from './button-family.stories';
import * as buttonStories from './button.stories';
import * as iconButtonLinkStories from './icon-button-link.stories';
import * as iconButtonStories from './icon-button.stories';
import * as toggleButtonStories from './toggle-button.stories';

const storyModules = {
  overview: overviewStories,
  button: buttonStories,
  buttonLink: buttonLinkStories,
  iconButton: iconButtonStories,
  iconButtonLink: iconButtonLinkStories,
  toggleButton: toggleButtonStories,
};

describe('Button family stories', () => {
  it('covers every required scenario', () => {
    for (const page of Object.keys(contract.scenarios) as Array<keyof typeof contract.scenarios>) {
      expect(scenarioCoverageErrors(contract.scenarios[page], storyModules[page])).toEqual([]);
    }
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof contract.members>) {
      expect(apiMetadataErrors(contract.members[member], REACT_BUTTON_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  /**
   * The axes are what a consumer picks from, so the reference page has to
   * spell every value rather than say "one of the tones".
   */
  it('spells every appearance axis in the reference API', () => {
    const spelled = {
      tone: contract.axes.tone.join(' | '),
      variant: contract.axes.variant.join(' | '),
      size: contract.axes.size.join(' | '),
    };

    for (const member of Object.keys(contract.members) as Array<keyof typeof contract.members>) {
      for (const [axis, type] of Object.entries(spelled)) {
        expect(REACT_BUTTON_DOCS[member].api.find((row) => row.name === axis)?.type).toBe(type);
      }
    }
    expect(REACT_BUTTON_DOCS.iconButton.api.find((row) => row.name === 'shape')?.type).toBe(
      contract.axes.shape.join(' | '),
    );
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_BUTTON_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });

  it('makes the controlled ToggleButton adapter interactive', () => {
    render(createElement(toggleButtonStories.ToggleButtonStoryAdapter, undefined, 'Pin'));
    const button = screen.getByRole('button', { name: 'Pin' });

    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders the descriptions its accessibility stories point at', () => {
    const stories = [
      buttonStories.Accessibility,
      buttonLinkStories.Accessibility,
      iconButtonStories.Accessibility,
      toggleButtonStories.Accessibility,
    ].map((story) => story.render?.({} as never, {} as never));
    render(createElement(Fragment, undefined, ...stories));

    for (const id of ['save-help', 'delete-help', 'settings-help', 'refresh-name', 'pin-help']) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });

  it('gives the overview one section per member, plus the axes and a composition', () => {
    const overview = overviewStories.Matrix.render?.({} as never, {} as never);
    const { container } = render(createElement(Fragment, undefined, overview));
    const headings = [...container.querySelectorAll('.slotted-component-lab__intro h2')].map(
      (heading) => heading.textContent,
    );

    expect(headings).toEqual([
      'Appearance system',
      'Button',
      'ButtonLink',
      'IconButton',
      'ToggleButton',
      'Composition',
    ]);
  });

  it('shows every tone against every variant, once, in the overview matrix', () => {
    const overview = overviewStories.Matrix.render?.({} as never, {} as never);
    const { container } = render(createElement(Fragment, undefined, overview));
    const matrix = container.querySelector('[data-slotted-matrix="button"]');

    expect(matrix).not.toBeNull();
    expect(matrix?.querySelectorAll('[data-ui="button"]')).toHaveLength(
      contract.axes.tone.length * contract.axes.variant.length,
    );
    for (const tone of contract.axes.tone) {
      expect(matrix?.querySelectorAll(`[data-tone="${tone}"]`)).toHaveLength(
        contract.axes.variant.length,
      );
    }
    for (const variant of contract.axes.variant) {
      expect(matrix?.querySelectorAll(`[data-variant="${variant}"]`)).toHaveLength(
        contract.axes.tone.length,
      );
    }
    expect(container.querySelectorAll('[data-slotted-matrix]')).toHaveLength(1);
  });

  it('demonstrates each member with something Button alone does not show', () => {
    const overview = overviewStories.Matrix.render?.({} as never, {} as never);
    const { container } = render(createElement(Fragment, undefined, overview));

    const links = container.querySelectorAll('a[data-ui="button"]');
    expect(links.length).toBeGreaterThan(0);
    expect(container.querySelector('a[data-ui="button"][aria-disabled="true"]')).not.toBeNull();
    expect(container.querySelector('a[data-router-link="true"]')).not.toBeNull();

    const iconButtons = [...container.querySelectorAll('[data-ui="button"][data-shape]')];
    expect(iconButtons.length).toBeGreaterThan(0);
    for (const iconButton of iconButtons) {
      expect(iconButton.querySelector('[data-part="icon"] svg')).not.toBeNull();
      expect(iconButton.getAttribute('aria-label')?.trim()).toBeTruthy();
    }
    expect(iconButtons.map((button) => button.getAttribute('data-shape'))).toContain('circle');
    expect(container.querySelector('[data-ui="button"][data-loading]')).not.toBeNull();
    expect(container.querySelector('[data-ui="button"][data-pressed]')).not.toBeNull();
  });

  it('keeps every icon inside an icon-only control decorative', () => {
    const overview = overviewStories.Matrix.render?.({} as never, {} as never);
    const { container } = render(createElement(Fragment, undefined, overview));

    for (const icon of container.querySelectorAll('[data-part="icon"] svg')) {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('shows the densities scene at all three steps of the control scale', () => {
    const densities = overviewStories.Densities.render?.({} as never, {} as never);
    const { container } = render(createElement(Fragment, undefined, densities));

    for (const size of contract.axes.size) {
      expect(container.querySelectorAll(`[data-size="${size}"]`).length).toBeGreaterThan(0);
    }
  });

  it('exercises the toolbar in the overview as a real group of controls', () => {
    const overview = overviewStories.Matrix.render?.({} as never, {} as never);
    render(createElement(Fragment, undefined, overview));
    const toolbar = screen.getByRole('button', { name: 'Bold' }).parentElement;

    expect(toolbar).not.toBeNull();
    expect(within(toolbar as HTMLElement).getAllByRole('button')).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'More formatting' })).not.toHaveAttribute(
      'aria-pressed',
    );
  });
});
