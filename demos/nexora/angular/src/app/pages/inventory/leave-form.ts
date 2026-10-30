import type { Location } from '@angular/common';
import type { ActivatedRoute, Router } from '@angular/router';

/**
 * A form that is a query parameter leaves the history the way it came: the
 * entry that opened it is popped, so the back gesture after a save does not
 * land on the same record twice. A form opened from a pasted link has no entry
 * to pop, and is replaced by the record instead.
 */
export function leaveForm(
  router: Router,
  route: ActivatedRoute,
  location: Location,
  queryParams: Record<string, string> = {},
): void {
  const previous = router.lastSuccessfulNavigation()?.previousNavigation?.finalUrl?.toString();
  const here = router.url.split('?')[0];
  if (previous !== undefined && previous.split('?')[0] === here) location.back();
  else void router.navigate([], { relativeTo: route, queryParams, replaceUrl: true });
}
