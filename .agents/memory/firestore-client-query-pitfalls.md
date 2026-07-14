---
name: Firestore direct-client query pitfalls
description: Two recurring bugs in direct-Firestore-access architectures (no custom backend) — composite indexes and auth-write races.
---

## Composite index requirement
A Firestore query combining an equality `where()` filter with `orderBy()` on a
*different* field requires a composite index. Firestore does not auto-create this;
without it the query throws `FAILED_PRECONDITION` at runtime (surfaces in the UI as
a generic "failed to load" error, easy to mistake for a permissions or network bug).

**Why:** Firestore only auto-indexes each field individually; composite indexes must
be explicitly created (normally via a console link in the error, which isn't visible
in a client app's caught error object).

**How to apply:** In direct-client-Firestore apps (no backend to inspect real error
objects easily), prefer `where(field, '==', value)` alone and sort the (usually small)
result set client-side, rather than adding `orderBy` on a different field. Reserve
Firestore-side `orderBy` for queries that don't also filter on a different field.

## Auth-state-triggered query races a just-written profile doc
Pattern: `onAuthStateChanged` fires the instant `createUserWithEmailAndPassword`
resolves, which is *before* an app-level "create the user's Firestore profile doc"
step (run separately, awaited afterward) has finished. If a query keyed on the new
uid (e.g. "my profile") is `enabled` as soon as the uid appears, it can fetch and
cache a "doc doesn't exist yet" (null) result moments before the doc is actually
written — and since the query succeeded (not errored), nothing naturally triggers
a refetch later, so the UI is stuck showing blank/placeholder profile fields.

**Why:** Auth state changes and the app's own profile-doc write are two independent
async operations racing each other; React Query has no way to know the second one
matters to the first query's cache.

**How to apply:** After the registration flow's own Firestore write is confirmed
complete, explicitly invalidate the profile query for that uid
(`queryClient.invalidateQueries({ queryKey: ['my-profile', uid] })`) before
navigating away from the registration screen.
