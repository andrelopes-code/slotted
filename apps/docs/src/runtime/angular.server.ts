import { enableProdMode, reflectComponentType, type Type } from '@angular/core';
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';

/* The build renders as the browser bundle runs, without development checks. */
if (import.meta.env.PROD) enableProdMode();

/**
 * The example rendered as the only content of a document's body, and returned
 * as that body's markup: the host element and what the component drew in it.
 */
export async function renderAngular(component: Type<unknown>, id: string): Promise<string> {
  const selector = reflectComponentType(component)?.selector;
  if (!selector) throw new Error(`Angular example "${id}" is not a component`);
  const html = await renderApplication(
    (context: BootstrapContext) =>
      bootstrapApplication(component, { providers: [provideServerRendering()] }, context),
    {
      document: `<!doctype html><html><head></head><body><${selector}></${selector}></body></html>`,
    },
  );
  const body = /<body[^>]*>([\s\S]*)<\/body>/.exec(html)?.[1];
  if (body === undefined) throw new Error(`Angular example "${id}" rendered no body`);
  return body.trim();
}
