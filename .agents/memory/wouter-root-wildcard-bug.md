---
name: Wouter root path wildcard bug
description: A wouter Switch with only a ":param*" catch-all route silently renders nothing at the bare root path "/", with zero console errors -- easy to misdiagnose as a backend/auth/build issue.
---

## The bug
`<Route path="/:rest*" component={X} />` compiles (via `regexparam`) to a pattern
like `/^\/([^/]+?)\/?$/i`, which requires **at least one path segment**. It does
**not** match the bare root `"/"`. If a `<Switch>` only has an explicit route for
one specific path (e.g. `/login`) plus this wildcard as the fallback, visiting `/`
matches nothing, and `Switch` renders nothing at all -- not even a loading spinner
inside the wildcard's own component, because that component never mounts.

**Symptom:** a totally blank page at the site root with genuinely zero console
errors, zero failed network requests, and a valid, unmodified HTML/JS bundle --
because there's nothing wrong with the bundle or the backend, the router simply
never rendered anything for that URL. Very easy to misdiagnose as a Firebase/auth
initialization hang, a build/env-injection failure, or a deployment health issue,
since none of those symptoms show up either.

**How to apply:** whenever a `Switch`/router config relies on a `:param*`
catch-all as the "everything else" route, add an explicit `path="/"` route
alongside it for the same component. Verify by testing the bare root path
specifically (not just named sub-routes) after any router change, ideally against
the real production build/domain, since a dev-only smoke test of named routes
(e.g. `/login`) won't catch this.
