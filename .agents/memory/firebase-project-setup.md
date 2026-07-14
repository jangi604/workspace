---
name: Firebase project first-time setup gotchas
description: Steps and API limitations when bootstrapping a brand-new Firebase project programmatically (Auth, Rules, RN persistence).
---

## Enabling Authentication on a brand-new Firebase project
A freshly created Firebase project has no Identity Platform config resource at all
until Authentication has been opened at least once in the Firebase Console. Calling
the Identity Toolkit Admin API (`identitytoolkit.googleapis.com/v2/projects/{id}/config`
PATCH, or the `:initializeAuth` method) against such a project fails with
`404 CONFIGURATION_NOT_FOUND`, even with a valid service-account OAuth token that has
Firebase Admin / Editor roles.

**Why:** This is a one-time project-level initialization gate that only the Console UI
triggers (clicking into Authentication -> "Get started"). There is no known public API
to perform this initialization from scratch.

**How to apply:** If `enable email/password sign-in` via API fails with
`CONFIGURATION_NOT_FOUND`, don't keep retrying the API — ask the user to do it once
manually: Firebase Console > Authentication > Get started > Sign-in method >
enable Email/Password. After that one-time step, the same PATCH API call works fine
for future changes.

## React Native auth persistence in firebase JS SDK v10.10+/v11
`getReactNativePersistence` is not exported by `firebase/auth` in firebase JS SDK
v11.x (confirmed on 11.10.0) — importing it is a TS/runtime error. Persistence for
React Native is now automatic: just call `initializeAuth(app)` (or even `getAuth(app)`)
without a `persistence` option, and it detects `@react-native-async-storage/async-storage`
and RN globals itself.

**Why:** Firebase SDK changelog moved to automatic RN detection around v10.10;
older tutorials/blog posts still reference the old explicit-persistence API.

**How to apply:** When wiring Firebase Auth in an Expo/RN app, use
`initializeAuth(firebaseApp)` plain, keep `@react-native-async-storage/async-storage`
as a dependency (it's still needed transitively), but don't import
`getReactNativePersistence`.

## Firebase Rules REST deploy script pathing
When deploying Firestore/Storage rules via the Firebase Rules REST API
(`firebaserules.googleapis.com`) from a workspace subpackage script (e.g.
`scripts/src/deploy-firebase-rules.ts` run via `pnpm --filter`), the process cwd is
the subpackage dir, not the repo root — resolve rule file paths relative to
`import.meta.url`/`__dirname` up to the repo root, not `process.cwd()`.

## Storage rules release creation
Creating a Storage rules release via
`projects/{project}/releases` with `name: "firebase.storage/{bucket}"` can fail with
`400 INVALID_ARGUMENT` for buckets using the newer `*.firebasestorage.app` naming
scheme. If this happens, fall back to instructing the user to paste
`storage.rules` manually into Firebase Console > Storage > Rules — Firestore rules
deploy via the same API generally succeed fine, so only Storage tends to need the
manual fallback.
