import type { ReactNode } from 'react';

interface ButtonContentLayerProps {
  children: ReactNode;
  leading?: ReactNode;
  loading: boolean;
  loadingIndicator?: ReactNode;
  loadingText?: ReactNode;
  trailing?: ReactNode;
}

function DefaultLoadingIndicator() {
  return <span className="slotted-button__spinner" />;
}

export function ButtonContentLayer({
  children,
  leading,
  loading,
  loadingIndicator,
  loadingText,
  trailing,
}: ButtonContentLayerProps) {
  const replacesAccessibleLabel = loading && loadingText !== undefined;

  return (
    <>
      <span
        aria-hidden={replacesAccessibleLabel || undefined}
        className="slotted-button__content"
        data-loading-hidden={loading ? '' : undefined}
      >
        {leading === undefined ? null : <span data-part="leading">{leading}</span>}
        <span data-part="label">{children}</span>
        {trailing === undefined ? null : <span data-part="trailing">{trailing}</span>}
      </span>
      {loading ? (
        <span className="slotted-button__loading">
          <span aria-hidden="true" data-part="loading-indicator">
            {loadingIndicator ?? <DefaultLoadingIndicator />}
          </span>
          {loadingText === undefined ? null : <span>{loadingText}</span>}
        </span>
      ) : null}
    </>
  );
}
