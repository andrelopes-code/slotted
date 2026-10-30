import { useState } from 'react';
import { Switch } from '@slotted/react/switch';

/** Stands in for the request that stores the setting. */
const saveSetting = (on: boolean) =>
  new Promise<boolean>((resolve) => setTimeout(() => resolve(on), 2500));

export default function SwitchLoading() {
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);

  const change = async (next: boolean) => {
    setSaving(true);
    setSyncing(await saveSetting(next));
    setSaving(false);
  };

  return (
    <Switch
      checked={syncing}
      labelPlacement="start"
      loading={saving}
      messages={{ loading: 'Saving order sync' }}
      onCheckedChange={change}
      description="Imports new Shopify orders every five minutes."
    >
      Order sync
    </Switch>
  );
}
