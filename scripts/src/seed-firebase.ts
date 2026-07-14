// One-time / idempotent seed script for the Jangi Fiber Firebase project.
//
// Creates the initial Super Admin account (Firebase Auth + Firestore user
// doc with role "admin"), and seeds default app settings (JazzCash /
// EasyPaisa payment details) and a starter set of internet packages if none
// exist yet. Safe to re-run -- every step checks for existing data first.
import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const SUPER_ADMIN_EMAIL = "admin@jangifiber.com";
const SUPER_ADMIN_PASSWORD = "JangiFiber@2026";

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set.");
  }
  return JSON.parse(raw);
}

async function main() {
  const serviceAccount = loadServiceAccount();

  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
  }

  const auth = getAuth();
  const db = getFirestore();

  // --- Super admin ---
  let adminUid: string;
  try {
    const existing = await auth.getUserByEmail(SUPER_ADMIN_EMAIL);
    adminUid = existing.uid;
    console.log(`Super admin already exists (uid=${adminUid}).`);
  } catch {
    const created = await auth.createUser({
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      displayName: "Jangi Fiber Admin",
      emailVerified: true,
    });
    adminUid = created.uid;
    console.log(`Created super admin (uid=${adminUid}).`);
  }

  await db.collection("users").doc(adminUid).set(
    {
      uid: adminUid,
      role: "admin",
      fullName: "Jangi Fiber Admin",
      email: SUPER_ADMIN_EMAIL,
      phone: "03012613603",
      status: "active",
      activePackageId: null,
      activePackageName: null,
      packageExpiresAt: null,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  // --- Default settings ---
  const settingsRef = db.collection("settings").doc("app");
  const settingsSnap = await settingsRef.get();
  if (!settingsSnap.exists) {
    await settingsRef.set({
      jazzcash: { accountTitle: "Sajjad Ali", number: "03012613603" },
      easypaisa: { accountTitle: "Sajjad Ali", number: "03012613603" },
      supportPhone: "03012613603",
      supportEmail: "support@jangifiber.com",
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log("Seeded default app settings.");
  } else {
    console.log("App settings already exist, skipping.");
  }

  // --- Default packages ---
  const packagesSnap = await db.collection("packages").limit(1).get();
  if (packagesSnap.empty) {
    const starterPackages = [
      {
        name: "Starter 10 Mbps",
        speedMbps: 10,
        validityDays: 30,
        price: 1500,
        description: "Great for browsing and social media on a couple of devices.",
        isActive: true,
      },
      {
        name: "Home 25 Mbps",
        speedMbps: 25,
        validityDays: 30,
        price: 2500,
        description: "Smooth HD streaming and video calls for the whole family.",
        isActive: true,
      },
      {
        name: "Fiber Pro 50 Mbps",
        speedMbps: 50,
        validityDays: 30,
        price: 3800,
        description: "High-speed fiber for gaming, 4K streaming, and remote work.",
        isActive: true,
      },
      {
        name: "Fiber Ultra 100 Mbps",
        speedMbps: 100,
        validityDays: 30,
        price: 5500,
        description: "Our fastest tier for power users and multi-device households.",
        isActive: true,
      },
    ];

    for (const pkg of starterPackages) {
      await db.collection("packages").add({
        ...pkg,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    console.log(`Seeded ${starterPackages.length} starter packages.`);
  } else {
    console.log("Packages already exist, skipping.");
  }

  console.log("\nSuper admin login:");
  console.log(`  email:    ${SUPER_ADMIN_EMAIL}`);
  console.log(`  password: ${SUPER_ADMIN_PASSWORD}`);
  console.log("Change this password after first login.");

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
