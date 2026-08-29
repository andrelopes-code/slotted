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

  it('spells every member tone union in the reference API', () => {
    const toneType = 'neutral | accent | success | warning | danger';
    for (const page of ['buttonLink', 'iconButton', 'toggleButton'] as const) {
      expect(REACT_BUTTON_DOCS[page].api.find((row) => row.name === 'tone')?.type).toBe(toneType);
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

    expect(container.querySelectorAll('.slotted-component-lab__section')).toHaveLength(3);
    expect(container.querySelectorAll('.slotted-demo-scene')).toHaveLength(6);

    const iconButtons = container.querySelectorAll('[data-slotted-component="icon-button"]');
    expect(iconButtons.length).toBeGreaterThan(0);
    for (const iconButton of iconButtons) {
      expect(iconButton.querySelector('.slotted-demo-icon[data-icon]')).not.toBeNull();
    }
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
      expect(button).toHaveAttribute('data-tone', 'accent');
      expect(button).toHaveAttribute('data-variant', 'solid');
    }
    expect(container.querySelector(".slotted-demo-icon[data-icon='chevron-down']")).not.toBeNull();
  });
});
