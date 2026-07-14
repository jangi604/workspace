// Enables the Email/Password sign-in provider on the Firebase project's
// Identity Platform / Firebase Auth config via the Identity Toolkit Admin
// API, authenticated with the service account. This is required once per
// project -- by default a freshly created Firebase project has no sign-in
// providers enabled, which makes createUser/signIn calls fail with
// `auth/configuration-not-found`.
import { GoogleAuth } from "google-auth-library";

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set.");
  return JSON.parse(raw);
}

async function main() {
  const serviceAccount = loadServiceAccount();
  const projectId = serviceAccount.project_id as string;

  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/identitytoolkit"],
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Failed to obtain access token.");

  // A brand-new Firebase project has no Identity Platform config resource
  // at all until Authentication is initialized once. Try that first (safe
  // to call even if already initialized -- it will just no-op/error, which
  // we ignore).
  const initRes = await fetch(
    `https://identitytoolkit.googleapis.com/v2/projects/${projectId}:initializeAuth`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );
  const initJson = await initRes.json().catch(() => ({}));
  console.log("initializeAuth response:", initRes.status, JSON.stringify(initJson));

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v2/projects/${projectId}/config?updateMask=signIn.email`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        signIn: { email: { enabled: true, passwordRequired: true } },
      }),
    },
  );

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to enable email/password sign-in: ${JSON.stringify(json)}`);
  }

  console.log("Email/Password sign-in enabled for project", projectId);
  console.log(JSON.stringify(json, null, 2));
}

main().catch((err) => {
  console.error("Failed to enable Firebase Auth:", err.message ?? err);
  console.error(
    "\nIf this failed, enable it manually: Firebase Console > Authentication > Sign-in method > Email/Password > Enable.",
  );
  process.exit(1);
});
