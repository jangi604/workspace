import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { usePackages } from '@/lib/api';
import { PackageCard } from '@/components/ui/PackageCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getDaysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function getSubscriptionBadge(
  status: string,
  daysRemaining: number | null,
): 'active' | 'inactive' | 'expiring' {
  if (status !== 'active') return 'inactive';
  if (daysRemaining !== null && daysRemaining <= 3) return 'expiring';
  return 'active';
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const packagesQuery = usePackages();

  const daysRemaining = getDaysRemaining(profile?.packageExpiresAt ?? null);
  const hasActivePlan = !!(profile?.activePackageId && profile.status === 'active');
  const subscriptionBadge = getSubscriptionBadge(profile?.status ?? 'inactive', daysRemaining);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={packagesQuery.isRefetching}
          onRefresh={packagesQuery.refetch}
          tintColor={colors.primary}
        />
      }
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <View>
          <Text style={[styles.greetLabel, { color: colors.mutedForeground }]}>Good day,</Text>
          <Text style={[styles.greetName, { color: colors.foreground }]}>
            {profile?.fullName?.split(' ')[0] ?? 'Customer'}
          </Text>
        </View>
        <View style={[styles.wifiIcon, { backgroundColor: colors.accent, borderRadius: colors.radius }]}>
          <Feather name="wifi" size={22} color={colors.primary} />
        </View>
      </View>

      {/* Active plan card */}
      {hasActivePlan ? (
        <View
          style={[
            styles.planCard,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius + 4,
              marginBottom: 28,
            },
          ]}
        >
          <View style={styles.planCardTop}>
            <View>
              <Text style={[styles.planLabel, { color: 'rgba(255,255,255,0.75)' }]}>Current Plan</Text>
              <Text style={[styles.planName, { color: '#ffffff' }]}>{profile?.activePackageName}</Text>
            </View>
            <StatusBadge status={subscriptionBadge} />
          </View>
          <View style={[styles.planDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
          <View style={styles.planCardBottom}>
            <View style={styles.planStat}>
              <Feather name="calendar" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={[styles.planStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>Expires</Text>
              <Text style={[styles.planStatValue, { color: '#ffffff' }]}>
                {profile?.packageExpiresAt
                  ? new Date(profile.packageExpiresAt).toLocaleDateString('en-PK', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </Text>
            </View>
            <View style={styles.planStat}>
              <Feather name="clock" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={[styles.planStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>Days left</Text>
              <Text style={[styles.planStatValue, { color: '#ffffff' }]}>
                {daysRemaining !== null ? `${daysRemaining}` : '—'}
              </Text>
            </View>
          </View>
          {subscriptionBadge === 'expiring' && (
            <View style={[styles.expiryWarning, { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: colors.radius - 2 }]}>
              <Feather name="alert-triangle" size={13} color="#fef08a" />
              <Text style={styles.expiryWarningText}>Your plan expires soon — renew to stay connected</Text>
            </View>
          )}
        </View>
      ) : (
        <View
          style={[
            styles.noPlanCard,
            {
              backgroundColor: colors.card,
              borderRadius: colors.radius + 4,
              borderColor: colors.border,
              marginBottom: 28,
            },
          ]}
        >
          <Feather name="wifi-off" size={28} color={colors.mutedForeground} />
          <Text style={[styles.noPlanTitle, { color: colors.foreground }]}>No active subscription</Text>
          <Text style={[styles.noPlanText, { color: colors.mutedForeground }]}>
            Choose a package below to get started
          </Text>
        </View>
      )}

      {/* Packages section */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {hasActivePlan ? 'All Packages' : 'Available Packages'}
      </Text>

      {packagesQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading packages…</Text>
        </View>
      ) : packagesQuery.isError ? (
        <View style={[styles.errorCard, { backgroundColor: colors.destructiveLight, borderRadius: colors.radius }]}>
          <Feather name="alert-circle" size={20} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            Failed to load packages.
          </Text>
          <Pressable onPress={() => packagesQuery.refetch()}>
            <Text style={[styles.retryText, { color: colors.destructive }]}>Tap to retry</Text>
          </Pressable>
        </View>
      ) : packagesQuery.data?.length === 0 ? (
        <View style={styles.centered}>
          <Feather name="package" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No packages available right now
          </Text>
        </View>
      ) : (
        packagesQuery.data?.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            isActive={pkg.id === profile?.activePackageId}
            onPress={() => router.push({ pathname: '/(tabs)/checkout', params: { id: pkg.id } })}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 2 },
  greetName: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.4 },
  wifiIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  planCard: { padding: 20 },
  planCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  planLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, letterSpacing: 0.3, marginBottom: 4, textTransform: 'uppercase' },
  planName: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  planDivider: { height: 1, marginBottom: 16 },
  planCardBottom: { flexDirection: 'row', gap: 24 },
  planStat: { gap: 4 },
  planStatLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  planStatValue: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  expiryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    marginTop: 12,
  },
  expiryWarningText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#fef08a', flex: 1 },
  noPlanCard: { padding: 24, alignItems: 'center', gap: 8, borderWidth: 1.5 },
  noPlanTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginTop: 4 },
  noPlanText: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 19 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.3, marginBottom: 16 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  errorCard: { padding: 16, alignItems: 'center', gap: 8 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 14, textAlign: 'center' },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, textDecorationLine: 'underline' },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center' },
});
