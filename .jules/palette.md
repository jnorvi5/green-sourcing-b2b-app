## 2024-05-24 - Error Feedback in Simple Forms
**Learning:** Found a "Join" form that silently failed on error (no visual feedback).
**Action:** Always ensure `status === 'error'` states render visible, accessible feedback (e.g., red text with `role="alert"` and `aria-invalid` on input).
