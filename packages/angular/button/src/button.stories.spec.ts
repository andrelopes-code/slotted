import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import {
  apiMetadataErrors,
  BUTTON_FAMILY_SCENARIOS,
  scenarioCoverageErrors,
} from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_BUTTON_DOCS } from './button.docs';
import * as overviewStories from './button-family.stories';
import * as buttonStories from './button.stories';
import * as buttonLinkStories from './button-link.stories';
import * as iconButtonStories from './icon-button.stories';
import * as toggleButtonStories from './toggle-button.stories';
import * as buttonGroupStories from './button-group.stories';

const storyModules = {
  overview: overviewStories,
  button: buttonStories,
  buttonLink: buttonLinkStories,
  iconButton: iconButtonStories,
  toggleButton: toggleButtonStories,
  buttonGroup: buttonGroupStories,
};

describe('Angular Button family stories', () => {
  it('covers every required scenario', () => {
    for (const page of Object.keys(BUTTON_FAMILY_SCENARIOS) as Array<
      keyof typeof BUTTON_FAMILY_SCENARIOS
    >) {
      expect(scenarioCoverageErrors(BUTTON_FAMILY_SCENARIOS[page], storyModules[page])).toEqual([]);
    }
  });

  it('documents each public component API', () => {
    for (const page of Object.keys(contract.members) as Array<keyof typeof contract.members>) {
      expect(apiMetadataErrors(contract.members[page], ANGULAR_BUTTON_DOCS[page].api)).toEqual([]);
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_BUTTON_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });

  it('uses resolvable descriptions in accessibility templates', () => {
    const templates = [
      buttonStories.Accessibility.render?.({} as never, {} as never)?.template,
      buttonLinkStories.Accessibility.render?.({} as never, {} as never)?.template,
      toggleButtonStories.Accessibility.render?.({} as never, {} as never)?.template,
    ].join('\n');

    for (const id of ['save-help', 'settings-help', 'pin-help']) {
      expect(templates).toContain(`id="${id}"`);
    }
  });

  it('renders the overview as a structured lab with real icons and no empty icon controls', () => {
    const template = overviewStories.Matrix.render?.({} as never, {} as never)?.template ?? '';
    const host = document.createElement('div');
    host.innerHTML = template;

    expect(host.querySelectorAll('.slotted-component-lab__section')).toHaveLength(3);
    expect(host.querySelectorAll('.slotted-demo-scene')).toHaveLength(6);

    const iconButtons = host.querySelectorAll('button[sliconbutton]');
    expect(iconButtons.length).toBeGreaterThan(0);
    for (const iconButton of iconButtons) {
      expect(iconButton.querySelector('.slotted-demo-icon[data-icon]')).not.toBeNull();
    }

    expect(template).not.toMatch(/[+⌄⌘]/u);
  });

  it('renders split actions as one coherent control with matching segments', () => {
    const template = buttonGroupStories.SplitAction.render?.({} as never, {} as never)?.template;
    const host = document.createElement('div');
    host.innerHTML = template ?? '';

    const group = host.querySelector('[slbuttongroup]');
    const buttons = group?.querySelectorAll('button') ?? [];
    expect(group?.classList.contains('slotted-split-action')).toBe(true);
    expect(group?.getAttribute('aria-label')).toBe('Publish actions');
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button.getAttribute('size')).toBe('md');
      expect(button.getAttribute('tone')).toBe('accent');
      expect(button.getAttribute('variant')).toBe('solid');
    }
    expect(group?.querySelector(".slotted-demo-icon[data-icon='chevron-down']")).not.toBeNull();
  });
});
