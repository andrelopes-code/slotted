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

    expect(host.querySelectorAll('.slotted-component-lab__section')).toHaveLength(6);
    expect(host.querySelectorAll('.slotted-demo-scene')).toHaveLength(11);

    const componentMatrices = ['button', 'button-link', 'icon-button', 'toggle-button'];
    for (const matrixName of componentMatrices) {
      const matrix = host.querySelector(`[data-slotted-matrix="${matrixName}"]`);
      expect(matrix).not.toBeNull();
      expect(matrix?.querySelectorAll('button, a')).toHaveLength(15);
      for (const variant of ['accent', 'secondary', 'success', 'warning', 'danger']) {
        expect(matrix?.querySelectorAll(`[variant="${variant}"]`)).toHaveLength(3);
      }
      for (const fill of ['solid', 'outline', 'ghost']) {
        expect(matrix?.querySelectorAll(`[fill="${fill}"]`)).toHaveLength(5);
      }
    }

    const toggleStateMatrix = host.querySelector('[data-slotted-matrix="toggle-state"]');
    expect(toggleStateMatrix?.querySelectorAll('button[sltogglebutton]')).toHaveLength(10);
    expect(toggleStateMatrix?.querySelectorAll('[\\[pressed\\]="true"]')).toHaveLength(5);
    expect(host.querySelector('.slotted-matrix button[tone]')).toBeNull();

    const iconButtons = host.querySelectorAll('button[sliconbutton]');
    expect(iconButtons.length).toBeGreaterThan(0);
    for (const iconButton of iconButtons) {
      expect(iconButton.querySelector('ng-icon[name][aria-hidden="true"]')).not.toBeNull();
    }

    expect(template).not.toMatch(/[+⌄⌘]/u);
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
    expect(meta.argTypes?.['variant']).toMatchObject({
      options: ['accent', 'secondary', 'success', 'warning', 'danger'],
    });
    expect(meta.argTypes?.['fill']).toMatchObject({ options: ['solid', 'outline', 'ghost'] });
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
      expect(button.getAttribute('variant')).toBe('accent');
      expect(button.getAttribute('fill')).toBe('solid');
    }
    expect(group?.querySelector('ng-icon[name="lucideChevronDown"]')).not.toBeNull();
  });
});
