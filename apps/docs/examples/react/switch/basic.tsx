import { Switch } from '@slotted/react/switch';

export default function SwitchBasic() {
  return (
    <Switch
      defaultChecked
      labelPlacement="start"
      name="lowStockAlerts"
      description="Email the buyer when a product falls below its reorder point."
    >
      Low-stock alerts
    </Switch>
  );
}
