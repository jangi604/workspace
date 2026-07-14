---
name: Client secret injection pattern for Vite/Expo
description: How to get real secret values into client-side builds without the agent ever seeing them.
---

For client apps (Vite web, Expo mobile) that need public-but-sensitive config values
(e.g. Firebase client config) sourced from Replit Secrets: write a small Node script
that reads `process.env.MY_SECRET` and writes it into a git-ignored `.env`/`.env.local`
file with the framework's required prefix (`VITE_*` for Vite, `EXPO_PUBLIC_*` for Expo).
Wire that script to run before `dev`/`build` in `package.json`.

**Why:** This keeps the real secret value out of the agent's tool-call context
entirely (the script runs via ShellExec/pnpm, not via CodeExecution dynamic import
or file reads) while still making it available to the bundler at build/dev time.

**How to apply:** Use this pattern any time a client artifact needs a "secret" that
is really just public client config (API keys meant to be embedded in the bundle,
like Firebase web config). Never read the generated `.env` file's actual values back
into agent context — if you need to sanity-check a value, check structural properties
(length, prefix pattern, whitespace/quote characters) instead of printing it raw.
