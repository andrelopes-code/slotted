export function stateAttribute(active: boolean) {
  return active ? '' : null;
}

export function blockActivation(event: Event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();
}
