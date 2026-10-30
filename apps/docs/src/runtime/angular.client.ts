import { createComponent, type ApplicationRef } from '@angular/core';
import { createApplication } from '@angular/platform-browser';

import { componentOf, type AngularExampleModule } from './angular-component';

/** One application per page; every preview is a root view attached to it. */
let application: Promise<ApplicationRef> | undefined;

/**
 * The build drew the component inside its host element. The component is
 * created on that same host, which Angular empties and draws again, so the
 * preview keeps its box and gains behavior.
 */
export async function mount(element: HTMLElement, module: unknown, id: string): Promise<void> {
  const component = componentOf(module as AngularExampleModule, id);
  const hostElement = element.firstElementChild;
  if (!hostElement) throw new Error(`Angular example "${id}" has no host element`);
  application ??= createApplication();
  const app = await application;
  const ref = createComponent(component, { environmentInjector: app.injector, hostElement });
  app.attachView(ref.hostView);
  ref.changeDetectorRef.detectChanges();
}
