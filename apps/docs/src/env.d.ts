declare namespace App {
  interface Locals {
    /** Set by `FamilyPage.astro`: the family the page documents; its route has no `family` param. */
    family?: string;
    /** Set by `FamilyPage.astro`: the server markup of one of the page's own examples. */
    renderExample?: (id: string) => Promise<string>;
  }
}
