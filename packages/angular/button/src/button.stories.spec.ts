import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
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
    for (const page of Object.keys(contract.scenarios) as Array<keyof typeof contract.scenarios>) {
      expect(scenarioCoverageErrors(contract.scenarios[page], storyModules[page])).toEqual([]);
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
    expect(host.querySelectorAll('.slotted-demo-scene')).toHaveLength(15);

    const appearanceMatrix = host.querySelector('[data-slotted-matrix="button"]');
    expect(appearanceMatrix).not.toBeNull();
    expect(appearanceMatrix?.querySelectorAll('button[slbutton]')).toHaveLength(15);
    for (const variant of ['accent', 'secondary', 'success', 'warning', 'danger']) {
      expect(appearanceMatrix?.querySelectorAll(`[variant="${variant}"]`)).toHaveLength(3);
    }
    for (const fill of ['solid', 'outline', 'ghost']) {
      expect(appearanceMatrix?.querySelectorAll(`[fill="${fill}"]`)).toHaveLength(5);
    }

    expect(host.querySelectorAll('[data-slotted-matrix]')).toHaveLength(2);

    const toggleStateMatrix = host.querySelector('[data-slotted-matrix="toggle-state"]');
    expect(toggleStateMatrix?.querySelectorAll('button[sltogglebutton]')).toHaveLength(30);
    expect(toggleStateMatrix?.querySelectorAll('[\\[pressed\\]="true"]')).toHaveLength(15);
    expect(toggleStateMatrix?.querySelectorAll('[\\[pressed\\]="false"]')).toHaveLength(15);
    for (const variant of ['accent', 'secondary', 'success', 'warning', 'danger']) {
      expect(toggleStateMatrix?.querySelectorAll(`[variant="${variant}"]`)).toHaveLength(6);
    }
    for (const fill of ['solid', 'outline', 'ghost']) {
      expect(toggleStateMatrix?.querySelectorAll(`[fill="${fill}"]`)).toHaveLength(10);
    }
    expect(host.querySelector('.slotted-matrix button[tone]')).toBeNull();

    const iconButtons = host.querySelectorAll('button[sliconbutton]');
    expect(iconButtons.length).toBeGreaterThan(0);
    for (const iconButton of iconButtons) {
      expect(iconButton.querySelector('ng-icon[name][aria-hidden="true"]')).not.toBeNull();
      expect(iconButton.getAttribute('aria-label')?.trim()).toBeTruthy();
    }

    expect(template).not.toMatch(/[+⌄⌘]/u);
  });

  it('demonstrates each family member with something Button alone does not show', () => {
    const template = overviewStories.Matrix.render?.({} as never, {} as never)?.template ?? '';
    const host = document.createElement('div');
    host.innerHTML = template;

    const headings = [...host.querySelectorAll('.slotted-component-lab__intro h2')].map(
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

    const links = host.querySelectorAll('a[slbuttonlink]');
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute('href')).toBeTruthy();
    }
    expect(host.querySelector('a[slbuttonlink][disabled]')).not.toBeNull();

    const sizedIconButtons = [...host.querySelectorAll('button[sliconbutton]')].map((iconButton) =>
      iconButton.getAttribute('size'),
    );
    for (const size of ['sm', 'md', 'lg']) {
      expect(sizedIconButtons).toContain(size);
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
