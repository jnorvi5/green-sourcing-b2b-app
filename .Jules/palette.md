## 2024-05-23 - Accessibility of Custom Dropdowns
**Learning:** Custom dropdowns (using divs) often lack basic accessibility (ARIA roles, keyboard support) and standard interaction patterns (click outside to close).
**Action:** When creating or modifying custom dropdowns, always implement `useOnClickOutside` (or equivalent), add `role="menu"`, `role="menuitem"`, `aria-haspopup`, and `aria-expanded`.

## 2024-05-23 - Click Outside Interaction Bug
**Learning:** A simple "click outside" handler on the document will fire when the trigger button is clicked, immediately closing the menu before the button's onClick toggles it back open.
**Action:** Always exclude the trigger element from the "click outside" check (e.g., using a ref for the trigger and checking `!triggerRef.current.contains(event.target)`).

## 2024-05-24 - Interactive States for Static Sites
**Learning:** Static landing pages (`.html`) often neglect `:hover` and `:focus-visible` states, making them feel unresponsive and hindering keyboard navigation.
**Action:** Always add explicit `:focus` styles (e.g., `box-shadow` or `border`) and meaningful `:hover` transitions (e.g., `transform`, `filter`) to all interactive elements, even in simple CSS.
