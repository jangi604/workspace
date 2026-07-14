import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPaymentRequests } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PaymentRequest } from '@/lib/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function PaymentRequestRow({ req }: { req: PaymentRequest }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.reqCard,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.reqHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.reqPackage, { color: colors.foreground }]}>{req.packageName}</Text>
          <Text style={[styles.reqMeta, { color: colors.mutedForeground }]}>
            {req.method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} · {formatDate(req.createdAt)}
          </Text>
        </View>
        <View style={styles.reqRight}>
          <Text style={[styles.reqAmount, { color: colors.foreground }]}>Rs {req.amount.toLocaleString()}</Text>
          <StatusBadge status={req.status} />
        </View>
      </View>
      {req.adminNote && req.status === 'rejected' ? (
        <View style={[styles.noteBox, { backgroundColor: colors.destructiveLight, borderRadius: colors.radius - 4 }]}>
          <Feather name="info" size={13} color={colors.destructive} />
          <Text style={[styles.noteText, { color: colors.destructive }]}>{req.adminNote}</Text>
        </View>
      ) : null}
      {req.status === 'pending' ? (
        <View style={[styles.pendingBox, { backgroundColor: colors.warningLight, borderRadius: colors.radius - 4 }]}>
          <Feather name="clock" size={13} color={colors.warning} />
          <Text style={[styles.noteText, { color: colors.warning }]}>Awaiting admin approval</Text>
        </View>
      ) : null}
    </View>
  );
}

function getDaysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function SubscriptionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const reqQuery = useMyPaymentRequests(user?.uid);
  const daysRemaining = getDaysRemaining(profile?.packageExpiresAt ?? null);
  const hasActive = !!(profile?.activePackageId && profile?.status === 'active');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={reqQuery.isRefetching}
          onRefresh={reqQuery.refetch}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>My Subscription</Text>

      {/* Current plan */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Current Plan</Text>
        {hasActive ? (
          <>
            <View style={styles.planRow}>
              <View style={[styles.planIcon, { backgroundColor: colors.successLight, borderRadius: colors.radius - 4 }]}>
                <Feather name="wifi" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planName, { color: colors.foreground }]}>{profile?.activePackageName}</Text>
                <StatusBadge
                  status={
                    daysRemaining !== null && daysRemaining <= 3
                      ? 'expiring'
                      : profile?.status === 'active'
                      ? 'active'
                      : 'inactive'
                  }
                />
              </View>
            </View>
            <View style={[styles.planDetails, { borderTopColor: colors.border }]}>
              <View style={styles.planDetail}>
                <Feather name="calendar" size={14} color={colors.mutedForeground} />
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Expires</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>
                  {profile?.packageExpiresAt ? formatDate(profile.packageExpiresAt) : '—'}
                </Text>
              </View>
              <View style={styles.planDetail}>
                <Feather name="clock" size={14} color={colors.mutedForeground} />
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Days remaining</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>
                  {daysRemaining !== null ? `${daysRemaining} days` : '—'}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.noPlan}>
            <Feather name="wifi-off" size={24} color={colors.mutedForeground} />
            <Text style={[styles.noPlanText, { color: colors.mutedForeground }]}>No active subscription</Text>
          </View>
        )}
      </View>

      {/* Payment requests */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment History</Text>

      {reqQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading history…</Text>
        </View>
      ) : reqQuery.isError ? (
        <View style={[styles.errorCard, { backgroundColor: colors.destructiveLight, borderRadius: colors.radius }]}>
          <Feather name="alert-circle" size={18} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>Failed to load payment history.</Text>
          <Pressable onPress={() => reqQuery.refetch()}>
            <Text style={[styles.retryText, { color: colors.destructive }]}>Retry</Text>
          </Pressable>
        </View>
      ) : reqQuery.data?.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="credit-card" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No payment requests yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Subscribe to a package to see your payment history here.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {reqQuery.data?.map((req) => <PaymentRequestRow key={req.id} req={req} />)}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.5, marginBottom: 20 },
  sectionCard: { padding: 16, borderWidth: 1, marginBottom: 28 },
  sectionLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  planIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  planName: { fontFamily: 'Inter_600SemiBold', fontSize: 17, marginBottom: 6 },
  planDetails: { borderTopWidth: 1, paddingTop: 14, gap: 10 },
  planDetail: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1 },
  detailValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  noPlan: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  noPlanText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.3, marginBottom: 14 },
  reqCard: { padding: 14, borderWidth: 1 },
  reqHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  reqPackage: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginBottom: 3 },
  reqMeta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  reqRight: { alignItems: 'flex-end', gap: 6 },
  reqAmount: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, marginTop: 10 },
  pendingBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, marginTop: 10 },
  noteText: { fontFamily: 'Inter_400Regular', fontSize: 12, flex: 1, lineHeight: 18 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  errorCard: { padding: 16, alignItems: 'center', gap: 8 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 14, textAlign: 'center' },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, textDecorationLine: 'underline' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 19, maxWidth: 260 },
});
