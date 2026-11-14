import { useMemo } from 'react';

import { useLocale } from '../i18n';
import { useSparklineDefaults } from './sparkline-defaults';

/** How a number is written: the consumer's function, else `Intl.NumberFormat` in the locale in force. */
export function useSparklineFormat(
  valueFormatter: ((value: number) => string) | undefined,
  formatOptions: Intl.NumberFormatOptions | undefined,
  locale: string | undefined,
) {
  const defaults = useSparklineDefaults();
  const appLocale = useLocale();
  const resolvedLocale = locale ?? appLocale;
  const options = formatOptions ?? defaults.formatOptions;

  return useMemo(() => {
    if (valueFormatter) return valueFormatter;
    const formatter = new Intl.NumberFormat(resolvedLocale, options);

    return (value: number) => formatter.format(value);
  }, [valueFormatter, resolvedLocale, options]);
}
