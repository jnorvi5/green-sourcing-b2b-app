## 2024-05-23 - [Centralized Logger with PII Masking]
**Vulnerability:** Raw `console.log` calls were exposing sensitive data (emails, potential passwords) in logs, which poses a security risk if logs are aggregated or viewed by unauthorized personnel.
**Learning:** `JSON.stringify(error)` produces an empty object `{}` because `Error` properties are not enumerable. A custom serializer or safe cloning method is required to log error details correctly. Also, circular references in objects can crash the application during logging if not handled.
**Prevention:** Implemented a `Logger` utility (`lib/logger.ts`) that:
1.  Recursively masks PII fields (email, password, token, etc.).
2.  Safely handles `Error` objects by extracting message, name, and stack.
3.  Handles circular references to prevent crashes.
4.  Used this logger in `app/login/page.tsx` to secure login attempts logging.
