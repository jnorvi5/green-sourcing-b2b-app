## 2024-05-23 - Accessibility of Custom Dropdowns
**Learning:** Custom dropdowns (using divs) often lack basic accessibility (ARIA roles, keyboard support) and standard interaction patterns (click outside to close).
**Action:** When creating or modifying custom dropdowns, always implement `useOnClickOutside` (or equivalent), add `role="menu"`, `role="menuitem"`, `aria-haspopup`, and `aria-expanded`.

## 2024-05-23 - Click Outside Interaction Bug
**Learning:** A simple "click outside" handler on the document will fire when the trigger button is clicked, immediately closing the menu before the button's onClick toggles it back open.
**Action:** Always exclude the trigger element from the "click outside" check (e.g., using a ref for the trigger and checking `!triggerRef.current.contains(event.target)`).

## 2025-05-21 - Autocomplete Accessibility
**Learning:** Custom autocomplete components often miss critical ARIA roles (`combobox`, `listbox`, `option`) and keyboard navigation support (Up/Down arrows), making them unusable for screen reader and keyboard-only users.
**Action:** Always implement the ARIA combobox pattern and full keyboard navigation for any custom autocomplete/typeahead component.
