## 2024-05-23 - Accessibility in Auth Forms
**Learning:** Found custom checkbox implementation (`opacity-0` or `hidden`) that breaks keyboard navigation and screen reader access. Also common to miss `aria-label` on icon-only buttons like password toggles.
**Action:** Replace `hidden` with `sr-only` class (or equivalent styles) for inputs to maintain accessibility while hiding visually. Always check icon-only buttons for `aria-label`.

## 2024-05-24 - Form Label Association
**Learning:** Inputs in dynamic forms (like `useFieldArray`) often miss proper label association because unique IDs aren't automatically generated. Screen readers fail to announce the label when focusing these inputs.
**Action:** Always generate a unique `id` (e.g., combining field name and index) for dynamic inputs and explicitly link them with `htmlFor` on the label.
## 2024-05-24 - Error Feedback in Simple Forms
**Learning:** Found a "Join" form that silently failed on error (no visual feedback).
**Action:** Always ensure `status === 'error'` states render visible, accessible feedback (e.g., red text with `role="alert"` and `aria-invalid` on input).
