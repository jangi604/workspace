// Customer-facing data access layer for Jangi Fiber (Expo app).
//
// Talks to Firebase Auth/Firestore/Storage directly via the client SDK --
// no custom REST backend. Firestore security rules (see
// firebase-config/firestore.rules at the repo root) restrict customers to
// their own user doc and their own payment requests.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { useEffect, useState } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import { db, auth } from './firebase';
import {
  COLLECTIONS,
  SETTINGS_DOC_ID,
  DEFAULT_APP_SETTINGS,
  type UserProfile,
  type InternetPackage,
  type PaymentRequest,
  type PaymentMethod,
  type AppNotification,
  type AppSettings,
} from '@workspace/firebase-shared';

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

// ---------- auth ----------

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}

export function useMyProfile(uid: string | undefined) {
  return useQuery({
    queryKey: ['my-profile', uid],
    queryFn: async () => {
      const snap = await getDoc(doc(db, COLLECTIONS.users, uid!));
      if (!snap.exists()) return null;
      return { ...(snap.data() as UserProfile), uid: uid! };
    },
    enabled: !!uid,
  });
}

export async function registerCustomer(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}) {
  const cred = await createUserWithEmailAndPassword(auth, input.email, input.password);
  await updateProfile(cred.user, { displayName: input.fullName });

  const profile: UserProfile = {
    uid: cred.user.uid,
    role: 'customer',
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    status: 'inactive',
    activePackageId: null,
    activePackageName: null,
    packageExpiresAt: null,
    createdAt: new Date().toISOString(),
  };

  await updateDoc(doc(db, COLLECTIONS.users, cred.user.uid), profile as unknown as Record<string, unknown>).catch(
    async () => {
      // Doc doesn't exist yet on first create -- use setDoc semantics via addDoc alt path.
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, COLLECTIONS.users, cred.user.uid), {
        ...profile,
        createdAt: serverTimestamp(),
      });
    },
  );

  return cred.user;
}

export async function customerSignIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function customerSignOut() {
  await firebaseSignOut(auth);
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid, data }: { uid: string; data: Partial<Pick<UserProfile, 'fullName' | 'phone'>> }) => {
      await updateDoc(doc(db, COLLECTIONS.users, uid), data);
    },
    onSuccess: (_, { uid }) => queryClient.invalidateQueries({ queryKey: ['my-profile', uid] }),
  });
}

// ---------- packages ----------

export function usePackages() {
  return useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      // Avoid combining an equality filter with orderBy on a different field --
      // that requires a composite Firestore index. Sort client-side instead
      // (package lists are small).
      const snap = await getDocs(query(collection(db, COLLECTIONS.packages), where('isActive', '==', true)));
      return snap.docs
        .map((d) => ({ ...(d.data() as InternetPackage), id: d.id }))
        .sort((a: InternetPackage, b: InternetPackage) => a.price - b.price);
    },
  });
}

// ---------- payment requests ----------

export function useMyPaymentRequests(customerId: string | undefined) {
  return useQuery({
    queryKey: ['my-payment-requests', customerId],
    queryFn: async () => {
      // Same reasoning as usePackages: sort client-side to avoid needing a
      // composite index for equality + orderBy on different fields.
      const snap = await getDocs(
        query(collection(db, COLLECTIONS.paymentRequests), where('customerId', '==', customerId)),
      );
      return snap.docs
        .map((d) => ({ ...(d.data() as PaymentRequest), id: d.id, createdAt: toIso(d.data().createdAt) }))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
    enabled: !!customerId,
  });
}

// Firebase Storage requires the project to be on the paid Blaze plan, so
// payment screenshots are instead resized/compressed client-side and stored
// inline in Firestore as a base64 data URI. Resizing to a max width of 900px
// at 50% JPEG quality keeps the resulting string comfortably under
// Firestore's 1MB per-document limit while remaining legible for review.
export async function uploadPaymentScreenshot(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 900 } }],
    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!result.base64) {
    throw new Error('Failed to process the payment screenshot. Please try a different image.');
  }
  return `data:image/jpeg;base64,${result.base64}`;
}

export function useSubmitPaymentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      customerId: string;
      customerName: string;
      customerEmail: string;
      pkg: InternetPackage;
      method: PaymentMethod;
      screenshotUri: string;
    }) => {
      const screenshotBase64 = await uploadPaymentScreenshot(input.screenshotUri);
      await addDoc(collection(db, COLLECTIONS.paymentRequests), {
        customerId: input.customerId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        packageId: input.pkg.id,
        packageName: input.pkg.name,
        amount: input.pkg.price,
        method: input.method,
        screenshotBase64,
        status: 'pending',
        adminNote: null,
        createdAt: serverTimestamp(),
        decidedAt: null,
      });
    },
    onSuccess: (_, { customerId }) =>
      queryClient.invalidateQueries({ queryKey: ['my-payment-requests', customerId] }),
  });
}

// ---------- notifications ----------

export function useMyNotifications(customerId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    const q = query(collection(db, COLLECTIONS.notifications), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({
        ...(d.data() as AppNotification),
        id: d.id,
        createdAt: toIso(d.data().createdAt),
      }));
      setNotifications(all.filter((n) => n.targetUserId === null || n.targetUserId === customerId));
      setLoading(false);
    });
    return unsub;
  }, [customerId]);

  return { notifications, loading };
}

// ---------- settings (payment account details) ----------

export function useAppSettings() {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const snap = await getDoc(doc(db, COLLECTIONS.settings, SETTINGS_DOC_ID));
      if (!snap.exists()) return DEFAULT_APP_SETTINGS;
      return snap.data() as AppSettings;
    },
  });
}

export type { UserProfile, InternetPackage, PaymentRequest, PaymentMethod, AppNotification, AppSettings };
