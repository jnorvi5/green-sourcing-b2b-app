## 2024-05-23 - Accessibility in Auth Forms
**Learning:** Found custom checkbox implementation (`opacity-0` or `hidden`) that breaks keyboard navigation and screen reader access. Also common to miss `aria-label` on icon-only buttons like password toggles.
**Action:** Replace `hidden` with `sr-only` class (or equivalent styles) for inputs to maintain accessibility while hiding visually. Always check icon-only buttons for `aria-label`.
