export type SchemeChoice = 'system' | 'light' | 'dark' | 'high-contrast';

const KEY = 'docs-scheme';

export function readSchemeChoice(): SchemeChoice {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'high-contrast') return stored;
  } catch {
    /* Storage blocked: the system decides. */
  }
  return 'system';
}

function systemScheme(): 'light' | 'dark' {
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** The page-wide scheme: the reader's choice, else the system's. */
export function applySchemeChoice(choice: SchemeChoice): void {
  try {
    if (choice === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {
    /* Storage blocked: the choice lasts for this page. */
  }
  document.documentElement.setAttribute(
    'data-slotted-scheme',
    choice === 'system' ? systemScheme() : choice,
  );
}
