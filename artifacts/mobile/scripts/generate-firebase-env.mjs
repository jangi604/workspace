// Generates artifacts/mobile/.env with EXPO_PUBLIC_FIREBASE_* values read
// from the real Replit secrets at build/dev time. Expo automatically loads
// vars prefixed with EXPO_PUBLIC_ from a .env file -- no extra config
// needed. This keeps the actual secret values out of source and out of the
// agent's context.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REQUIRED_VARS = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required Firebase env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const lines = REQUIRED_VARS.map((key) => `EXPO_PUBLIC_${key}=${process.env[key]}`);

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', '.env');
writeFileSync(outPath, lines.join('\n') + '\n');
console.log(`Wrote ${outPath}`);
