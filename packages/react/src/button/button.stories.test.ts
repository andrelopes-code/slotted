import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
});
