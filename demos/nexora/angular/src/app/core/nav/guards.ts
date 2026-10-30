import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';

import { PreferencesStore } from '../session/preferences.store';
import { SessionStore } from '../session/session.store';

export const sessionReady: CanMatchFn = async () => {
  const store = inject(SessionStore);
  if (store.status() === 'idle') await store.load();
  return store.status() === 'unauthenticated' ? inject(Router).createUrlTree(['/sign-in']) : true;
};

export const signedOut: CanMatchFn = async () => {
  const store = inject(SessionStore);
  if (store.status() === 'idle') await store.load();
  return store.status() === 'ready'
    ? inject(Router).createUrlTree([inject(PreferencesStore).preferences().startRoute])
    : true;
};
