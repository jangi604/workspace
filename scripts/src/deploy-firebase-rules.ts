// Deploys firebase-config/firestore.rules and firebase-config/storage.rules
// to the Firebase project using the Firebase Rules REST API, authenticated
// via the service account (no firebase-tools / interactive login needed).
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleAuth } from "google-auth-library";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set.");
  return JSON.parse(raw);
}

async function createRuleset(
  accessToken: string,
  projectId: string,
  fileName: string,
  content: string,
) {
  const res = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source: { files: [{ name: fileName, content }] } }),
    },
  );
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`createRuleset(${fileName}) failed: ${JSON.stringify(json)}`);
  }
  return json.name as string; // e.g. projects/{id}/rulesets/{rulesetId}
}

async function upsertRelease(
  accessToken: string,
  projectId: string,
  releaseName: string,
  rulesetName: string,
) {
  const base = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`;
  const getRes = await fetch(`${base}/${encodeURIComponent(releaseName)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (getRes.ok) {
    const patchRes = await fetch(`${base}/${encodeURIComponent(releaseName)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ release: { name: `projects/${projectId}/releases/${releaseName}`, rulesetName } }),
    });
    if (!patchRes.ok) {
      throw new Error(`update release ${releaseName} failed: ${JSON.stringify(await patchRes.json())}`);
    }
  } else {
    const postRes = await fetch(base, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: `projects/${projectId}/releases/${releaseName}`, rulesetName }),
    });
    if (!postRes.ok) {
      throw new Error(`create release ${releaseName} failed: ${JSON.stringify(await postRes.json())}`);
    }
  }
}

async function main() {
  const serviceAccount = loadServiceAccount();
  const projectId = serviceAccount.project_id as string;

  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/firebase", "https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Failed to obtain access token.");

  const firestoreRules = readFileSync(join(REPO_ROOT, "firebase-config/firestore.rules"), "utf-8");
  const storageRules = readFileSync(join(REPO_ROOT, "firebase-config/storage.rules"), "utf-8");

  const firestoreRulesetName = await createRuleset(token, projectId, "firestore.rules", firestoreRules);
  await upsertRelease(token, projectId, "cloud.firestore", firestoreRulesetName);
  console.log("Deployed Firestore rules.");

  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (storageBucket) {
    const storageRulesetName = await createRuleset(token, projectId, "storage.rules", storageRules);
    await upsertRelease(token, projectId, `firebase.storage/${storageBucket}`, storageRulesetName);
    console.log("Deployed Storage rules.");
  }

  console.log("Firebase security rules deployed successfully.");
}

main().catch((err) => {
  console.error("Rules deployment failed:", err.message ?? err);
  console.error(
    "\nIf this failed because the Firebase Management / Rules API isn't enabled, " +
      "paste firebase-config/firestore.rules and firebase-config/storage.rules manually " +
      "into the Firebase Console under Firestore > Rules and Storage > Rules.",
  );
  process.exit(1);
});
