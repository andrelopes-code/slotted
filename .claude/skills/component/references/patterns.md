# Sourcing an accessibility pattern

Never write “checked against APG” from memory. Produce an itemized comparison that another reader can audit.

1. Find the component's current pattern on the official WAI-ARIA Authoring Practices site at `https://www.w3.org/WAI/ARIA/apg/patterns/`. If no direct pattern exists, record that fact and identify the closest official platform or APG guidance.
2. Record the exact source URL and page title in the working assessment.
3. Transcribe the pattern's keyboard interaction table into a checklist. Include every key, precondition, effect, focus destination, optional interaction, and orientation-specific difference.
4. List the required roles, accessible-name mechanism, ARIA properties and states, state transitions, ownership relationships, focus model, and disabled behaviour.
5. Prefer a native HTML element or behaviour when it already supplies the required semantics. Note which requirements the platform satisfies and which remain the component's responsibility.
6. Check every item against `specs/components/<family>/contract.json`, the React implementation, and the Angular implementation. Mark each item pass, fail, not applicable, or deliberate departure, with a file path or test as evidence.
7. Add or update contract and framework tests for observable requirements. Follow test-first development for new behaviour.
8. Write every deliberate departure and its cost. For example, Slotted Switch uses a `button`, not a checkbox: document the semantic, forms, and interaction consequences rather than hiding the difference.

A link without the extracted keyboard and attribute lists is not evidence. A complete comparison can reveal that the library intentionally differs; it may not silently omit the cost.
