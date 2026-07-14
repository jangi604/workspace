// Shared Firestore data contracts for Jangi Fiber (web admin + mobile customer app).
// Both the admin panel and the mobile app talk to Firestore directly using the
// Firebase client SDK -- this module is the single source of truth for
// collection names and document shapes so both apps stay in sync.

export const COLLECTIONS = {
  users: "users",
  packages: "packages",
  paymentRequests: "paymentRequests",
  notifications: "notifications",
  settings: "settings",
} as const;

/** Singleton settings document id under the `settings` collection. */
export const SETTINGS_DOC_ID = "app";

export type UserRole = "admin" | "customer";
export type CustomerStatus = "active" | "inactive";

/** Document shape: users/{uid} */
export interface UserProfile {
  uid: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  /** id of the currently active package purchase, if any */
  activePackageId: string | null;
  activePackageName: string | null;
  packageExpiresAt: string | null; // ISO date string
  createdAt: string; // ISO date string
}

/** Document shape: packages/{id} */
export interface InternetPackage {
  id: string;
  name: string;
  speedMbps: number;
  validityDays: number;
  price: number;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export type PaymentMethod = "jazzcash" | "easypaisa";
export type PaymentRequestStatus = "pending" | "approved" | "rejected";

/** Document shape: paymentRequests/{id} */
export interface PaymentRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  packageId: string;
  packageName: string;
  amount: number;
  method: PaymentMethod;
  /**
   * Payment proof screenshot stored inline as a compressed base64 data URI
   * (e.g. "data:image/jpeg;base64,...") -- not a Storage download URL. This
   * avoids requiring the Firebase project to be on the paid Blaze plan
   * (Cloud Storage buckets require Blaze); the image lives directly in the
   * Firestore document instead, resized/compressed client-side to stay well
   * under Firestore's 1MB document size limit.
   */
  screenshotBase64: string;
  status: PaymentRequestStatus;
  adminNote: string | null;
  createdAt: string;
  decidedAt: string | null;
}

/** Document shape: notifications/{id} */
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  /** null means broadcast to all customers */
  targetUserId: string | null;
  createdAt: string;
}

export interface PaymentMethodDetails {
  accountTitle: string;
  number: string;
}

/** Document shape: settings/app (singleton) */
export interface AppSettings {
  jazzcash: PaymentMethodDetails;
  easypaisa: PaymentMethodDetails;
  supportPhone: string;
  supportEmail: string;
  updatedAt: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  jazzcash: { accountTitle: "Sajjad Ali", number: "03012613603" },
  easypaisa: { accountTitle: "Sajjad Ali", number: "03012613603" },
  supportPhone: "03012613603",
  supportEmail: "support@jangifiber.com",
  updatedAt: new Date(0).toISOString(),
};
