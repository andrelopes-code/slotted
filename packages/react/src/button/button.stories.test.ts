import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createElement, Fragment } from 'react';

import contract from '../../../../specs/components/button/contract.json';
import {
  apiMetadataErrors,
  BUTTON_FAMILY_SCENARIOS,
  scenarioCoverageErrors,
} from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_BUTTON_DOCS } from './button.docs';
import * as overviewStories from './button-family.stories';
import * as buttonStories from './button.stories';
import * as buttonLinkStories from './button-link.stories';
import * as iconButtonStories from './icon-button.stories';
import * as toggleButtonStories from './toggle-button.stories';
import * as buttonGroupStories from './button-group.stories';
import { ToggleButtonStoryAdapter } from './toggle-button.stories';

const storyModules = {
  overview: overviewStories,
  button: buttonStories,
  buttonLink: buttonLinkStories,
  iconButton: iconButtonStories,
  toggleButton: toggleButtonStories,
  buttonGroup: buttonGroupStories,
};

describe('Button family stories', () => {
  it('covers every required scenario', () => {
    for (const page of Object.keys(BUTTON_FAMILY_SCENARIOS) as Array<
      keyof typeof BUTTON_FAMILY_SCENARIOS
    >) {
      expect(scenarioCoverageErrors(BUTTON_FAMILY_SCENARIOS[page], storyModules[page])).toEqual([]);
    }
  });

  it('documents each public component API', () => {
    for (const page of Object.keys(contract.members) as Array<keyof typeof contract.members>) {
      expect(apiMetadataErrors(contract.members[page], REACT_BUTTON_DOCS[page].api)).toEqual([]);
    }
  });

  it('spells every appearance axis in the reference API', () => {
    const variantType = 'accent | secondary | success | warning | danger';
    const fillType = 'solid | outline | ghost';
    for (const page of ['button', 'buttonLink', 'iconButton', 'toggleButton'] as const) {
      expect(REACT_BUTTON_DOCS[page].api.find((row) => row.name === 'variant')?.type).toBe(
        variantType,
      );
      expect(REACT_BUTTON_DOCS[page].api.find((row) => row.name === 'fill')?.type).toBe(fillType);
    }
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_BUTTON_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });

  it('makes the controlled ToggleButton story adapter interactive', () => {
    render(createElement(ToggleButtonStoryAdapter, undefined, 'Pin'));

    const button = screen.getByRole('button', { name: 'Pin' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders descriptions referenced by accessibility stories', () => {
    const buttonLink = buttonLinkStories.Accessibility.render?.({} as never, {} as never);
    const toggleButton = toggleButtonStories.Accessibility.render?.({} as never, {} as never);
    render(createElement(Fragment, undefined, buttonLink, toggleButton));

    for (const id of ['settings-help', 'pin-help']) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });

  it('renders the overview as a structured lab with real icons and no empty icon controls', () => {
    const overview = overviewStories.Matrix.render?.({} as never, {} as never);
    const { container } = render(createElement(Fragment, undefined, overview));

    expect(container.querySelectorAll('.slotted-component-lab__section')).toHaveLength(6);
    expect(container.querySelectorAll('.slotted-demo-scene')).toHaveLength(11);

    const componentMatrices = {
      button: 'button',
      'button-link': 'button-link',
      'icon-button': 'icon-button',
      'toggle-button': 'toggle-button',
    } as const;
    for (const [matrixName, componentName] of Object.entries(componentMatrices)) {
      const matrix = container.querySelector(`[data-slotted-matrix="${matrixName}"]`);
      expect(matrix).not.toBeNull();
      expect(matrix?.querySelectorAll(`[data-slotted-component="${componentName}"]`)).toHaveLength(
        15,
      );
      for (const variant of ['accent', 'secondary', 'success', 'warning', 'danger']) {
        expect(matrix?.querySelectorAll(`[data-variant="${variant}"]`)).toHaveLength(3);
      }
      for (const fill of ['solid', 'outline', 'ghost']) {
        expect(matrix?.querySelectorAll(`[data-fill="${fill}"]`)).toHaveLength(5);
      }
    }

    const toggleStateMatrix = container.querySelector('[data-slotted-matrix="toggle-state"]');
    expect(
      toggleStateMatrix?.querySelectorAll('[data-slotted-component="toggle-button"]'),
    ).toHaveLength(10);
    expect(toggleStateMatrix?.querySelectorAll('[aria-pressed="true"]')).toHaveLength(5);
    expect(container.querySelector('.slotted-matrix button[data-tone]')).toBeNull();

    const iconButtons = container.querySelectorAll('[data-slotted-component="icon-button"]');
    expect(iconButtons.length).toBeGreaterThan(0);
    for (const iconButton of iconButtons) {
      expect(iconButton.querySelector('svg.lucide[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('exposes every IconButton appearance axis in its playground', () => {
    const meta = iconButtonStories.default;

    expect(meta.args).toMatchObject({
      disabled: false,
      fill: 'ghost',
      loading: false,
      size: 'md',
      variant: 'secondary',
    });
    expect(meta.argTypes?.variant).toMatchObject({
      options: ['accent', 'secondary', 'success', 'warning', 'danger'],
    });
    expect(meta.argTypes?.fill).toMatchObject({ options: ['solid', 'outline', 'ghost'] });
  });

  it('renders split actions as one coherent control with matching segments', () => {
    const splitAction = buttonGroupStories.SplitAction.render?.({} as never, {} as never);
    const { container } = render(createElement(Fragment, undefined, splitAction));
    const group = screen.getByRole('group', { name: 'Publish actions' });
    const buttons = within(group).getAllByRole('button');

    expect(group).toHaveClass('slotted-split-action');
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button).toHaveAttribute('data-size', 'md');
      expect(button).toHaveAttribute('data-variant', 'accent');
      expect(button).toHaveAttribute('data-fill', 'solid');
    }
    expect(container.querySelector('svg.lucide-chevron-down')).not.toBeNull();
  });
});
