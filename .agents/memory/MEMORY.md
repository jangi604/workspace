# Memory Index

- [Firebase project first-time setup gotchas](firebase-project-setup.md) — Auth must be enabled once via Console UI (no API path); RN persistence is automatic in firebase JS SDK v10.10+/v11 (no `getReactNativePersistence`); Rules REST deploy script must resolve paths from repo root, not cwd.
- [Expo/Replit Android build limitation](expo-android-limitation.md) — Replit's Expo Launch only supports iOS App Store publishing; no Android APK/EAS build available in-workspace.
- [Client secret injection pattern](client-secret-env-injection.md) — generate `.env`/`.env.local` files from real secrets via a Node script run at dev/build time so raw secret values never pass through the agent's context.
- [Firestore direct-client query pitfalls](firestore-client-query-pitfalls.md) — equality filter + orderBy on a different field needs a composite index (sort client-side instead); auth-triggered queries can race a just-written doc and cache a stale null.
- [Wouter root path wildcard bug](wouter-root-wildcard-bug.md) — a `:param*` wouter route never matches bare "/", silently rendering nothing; always add an explicit `path="/"` route alongside it.
