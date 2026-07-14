// Admin-panel data access layer for Jangi Fiber.
//
// This app talks to Firestore/Firebase Auth/Storage directly (no custom REST
// backend) using Firebase's client SDK, gated by Firestore security rules
// that check the caller's uid against the `admins` collection.
//
// Every function here is a thin, typed wrapper -- UI components should call
// these instead of touching `firebase/firestore` directly, and should use
// the paired React Query hooks (`useXyz`) for reads.
import { useQuery, useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { useEffect, useState } from 'react';
import { db, auth, storage } from './firebase';
import {
  COLLECTIONS,
  SETTINGS_DOC_ID,
  DEFAULT_APP_SETTINGS,
  type UserProfile,
  type InternetPackage,
  type PaymentRequest,
  type AppNotification,
  type AppSettings,
} from '@workspace/firebase-shared';

// ---------- helpers ----------

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

export function useAdminProfile(uid: string | undefined) {
  return useQuery({
    queryKey: ['admin-profile', uid],
    queryFn: async () => {
      const snap = await getDoc(doc(db, COLLECTIONS.users, uid!));
      if (!snap.exists()) return null;
      return snap.data() as UserProfile;
    },
    enabled: !!uid,
  });
}

export async function adminSignIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, COLLECTIONS.users, cred.user.uid));
  if (!snap.exists() || (snap.data() as UserProfile).role !== 'admin') {
    await firebaseSignOut(auth);
    throw new Error('This account does not have admin access.');
  }
  return cred.user;
}

export async function adminSignOut() {
  await firebaseSignOut(auth);
}

// ---------- dashboard ----------

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [usersSnap, paymentsSnap, packagesSnap] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.users), where('role', '==', 'customer'))),
        getDocs(collection(db, COLLECTIONS.paymentRequests)),
        getDocs(collection(db, COLLECTIONS.packages)),
      ]);

      const customers = usersSnap.docs.map((d) => d.data() as UserProfile);
      const payments = paymentsSnap.docs.map((d) => d.data() as PaymentRequest);
      const packages = packagesSnap.docs.map((d) => d.data() as InternetPackage);

      const totalCustomers = customers.length;
      const activeCustomers = customers.filter((c) => c.status === 'active').length;
      const pendingPayments = payments.filter((p) => p.status === 'pending').length;

      const now = new Date();
      const monthlyRevenue = payments
        .filter((p) => {
          if (p.status !== 'approved' || !p.decidedAt) return false;
          const d = new Date(p.decidedAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const packageStats = packages.map((pkg) => ({
        packageId: pkg.id,
        packageName: pkg.name,
        activeSubscribers: customers.filter((c) => c.activePackageId === pkg.id).length,
      }));

      return { totalCustomers, activeCustomers, pendingPayments, monthlyRevenue, packageStats };
    },
  });
}

// ---------- packages ----------

export function usePackages() {
  return useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, COLLECTIONS.packages), orderBy('createdAt', 'desc')));
      return snap.docs.map((d) => ({ ...(d.data() as InternetPackage), id: d.id }));
    },
  });
}

export function useCreatePackage(options?: UseMutationOptions<string, Error, Omit<InternetPackage, 'id' | 'createdAt'>>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      const ref = await addDoc(collection(db, COLLECTIONS.packages), {
        ...input,
        createdAt: serverTimestamp(),
      });
      return ref.id;
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InternetPackage> }) => {
      await updateDoc(doc(db, COLLECTIONS.packages, id), data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['packages'] }),
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, COLLECTIONS.packages, id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['packages'] }),
  });
}

// ---------- customers ----------

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      // Avoid combining an equality filter with orderBy on a different field --
      // that requires a composite Firestore index that doesn't exist by
      // default. Sort client-side instead.
      const snap = await getDocs(query(collection(db, COLLECTIONS.users), where('role', '==', 'customer')));
      return snap.docs
        .map((d) => ({ ...(d.data() as UserProfile), uid: d.id, createdAt: toIso(d.data().createdAt) }))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid, data }: { uid: string; data: Partial<UserProfile> }) => {
      await updateDoc(doc(db, COLLECTIONS.users, uid), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (uid: string) => {
      await deleteDoc(doc(db, COLLECTIONS.users, uid));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
}

// ---------- payment requests ----------

export function usePaymentRequests() {
  return useQuery({
    queryKey: ['payment-requests'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, COLLECTIONS.paymentRequests), orderBy('createdAt', 'desc')));
      return snap.docs.map((d) => ({ ...(d.data() as PaymentRequest), id: d.id, createdAt: toIso(d.data().createdAt) }));
    },
  });
}

export function useDecidePaymentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      request,
      decision,
      adminNote,
    }: {
      request: PaymentRequest;
      decision: 'approved' | 'rejected';
      adminNote?: string;
    }) => {
      await updateDoc(doc(db, COLLECTIONS.paymentRequests, request.id), {
        status: decision,
        adminNote: adminNote ?? null,
        decidedAt: serverTimestamp(),
      });

      if (decision === 'approved') {
        const pkgSnap = await getDoc(doc(db, COLLECTIONS.packages, request.packageId));
        const pkg = pkgSnap.data() as InternetPackage | undefined;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (pkg?.validityDays ?? 30));

        await updateDoc(doc(db, COLLECTIONS.users, request.customerId), {
          activePackageId: request.packageId,
          activePackageName: request.packageName,
          packageExpiresAt: expiresAt.toISOString(),
          status: 'active',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// ---------- notifications ----------

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, COLLECTIONS.notifications), orderBy('createdAt', 'desc')));
      return snap.docs.map((d) => ({ ...(d.data() as AppNotification), id: d.id, createdAt: toIso(d.data().createdAt) }));
    },
  });
}

export function useSendNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; body: string; targetUserId: string | null }) => {
      await addDoc(collection(db, COLLECTIONS.notifications), {
        ...input,
        createdAt: serverTimestamp(),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// ---------- settings ----------

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

export function useUpdateAppSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<AppSettings>) => {
      await setDoc(
        doc(db, COLLECTIONS.settings, SETTINGS_DOC_ID),
        { ...data, updatedAt: serverTimestamp() },
        { merge: true },
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-settings'] }),
  });
}

// ---------- storage (payment screenshots, shared type re-export for convenience) ----------

export async function uploadPaymentScreenshot(file: File, customerId: string): Promise<string> {
  const path = `payment-screenshots/${customerId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export type { UserProfile, InternetPackage, PaymentRequest, AppNotification, AppSettings };
