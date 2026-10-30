import { createElement, type ComponentType } from 'react';
import { hydrateRoot } from 'react-dom/client';

import { exampleIdPrefix } from './react-ids';

export async function mount(element: HTMLElement, module: unknown, id: string): Promise<void> {
  const component = (module as { default: ComponentType }).default;
  hydrateRoot(element, createElement(component), { identifierPrefix: exampleIdPrefix(id) });
}
