// Reads the Firebase project config from Replit secrets (already present in
// process.env for this process) and writes them into a local .env file using
// the VITE_ prefix so Vite exposes them to client code via import.meta.env.
// This file is regenerated on every dev/build run and is gitignored -- it
// never contains anything that isn't already a Replit-managed secret value
// available to this very process.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const required = [
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_APP_ID",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `Missing required Firebase env vars: ${missing.join(", ")}. ` +
      "Set them as Replit secrets before running dev/build.",
  );
  process.exit(1);
}

const lines = required.map(
  (key) => `VITE_${key}=${JSON.stringify(process.env[key]).slice(1, -1)}`,
);

writeFileSync(join(__dirname, "..", ".env.local"), lines.join("\n") + "\n");
