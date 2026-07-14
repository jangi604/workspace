import React from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { useMyNotifications } from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppNotification } from '@/lib/api';

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}

function NotificationRow({ notif }: { notif: AppNotification }) {
  const colors = useColors();
  const isBroadcast = notif.targetUserId === null;

  return (
    <View
      style={[
        styles.notifCard,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: isBroadcast ? colors.accent : colors.secondary, borderRadius: colors.radius - 4 }]}>
        <Feather
          name={isBroadcast ? 'bell' : 'user'}
          size={16}
          color={isBroadcast ? colors.primary : colors.mutedForeground}
        />
      </View>
      <View style={styles.notifBody}>
        <View style={styles.notifTopRow}>
          <Text style={[styles.notifTitle, { color: colors.foreground }]} numberOfLines={1}>{notif.title}</Text>
          <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>{timeAgo(notif.createdAt)}</Text>
        </View>
        <Text style={[styles.notifText, { color: colors.mutedForeground }]}>{notif.body}</Text>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { notifications, loading } = useMyNotifications(user?.uid);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Notifications</Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading…</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondary, borderRadius: 50 }]}>
            <Feather name="bell-off" size={28} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No notifications yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            You&apos;ll see updates about your subscription and announcements here.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {notifications.map((n) => (
            <NotificationRow key={n.id} notif={n} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.5, marginBottom: 20 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 21, maxWidth: 270 },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12, borderWidth: 1 },
  iconBox: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  notifBody: { flex: 1 },
  notifTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, flex: 1, marginRight: 8 },
  notifTime: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  notifText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
});
