import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateMyProfile, customerSignOut, useAppSettings } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, profile, profileLoading } = useAuth();
  const updateMutation = useUpdateMyProfile();
  const settingsQuery = useAppSettings();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? '');
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  async function handleSave() {
    if (!user) return;
    if (!fullName.trim()) {
      Alert.alert('Validation', 'Full name cannot be empty.');
      return;
    }
    try {
      await updateMutation.mutateAsync({ uid: user.uid, data: { fullName: fullName.trim(), phone: phone.trim() } });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    }
  }

  function handleCancel() {
    setFullName(profile?.fullName ?? '');
    setPhone(profile?.phone ?? '');
    setEditing(false);
  }

  async function handleSignOut() {
    // React Native's Alert.alert renders as a native OS dialog on iOS/Android,
    // but on web (Expo web preview) RN Web doesn't reliably render an
    // interactive multi-button alert -- use window.confirm there instead.
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to sign out?')) {
        await customerSignOut();
        router.replace('/(auth)/login');
      }
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await customerSignOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  if (profileLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const settings = settingsQuery.data;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Profile</Text>

        {/* Avatar / brand */}
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primary, borderRadius: 48 }]}>
            <Text style={[styles.avatarInitial, { color: colors.primaryForeground }]}>
              {(profile?.fullName ?? user?.displayName ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.avatarName, { color: colors.foreground }]}>
              {profile?.fullName ?? user?.displayName ?? 'Customer'}
            </Text>
            <Text style={[styles.avatarEmail, { color: colors.mutedForeground }]}>
              {user?.email}
            </Text>
          </View>
        </View>

        {saveSuccess && (
          <View style={[styles.successBanner, { backgroundColor: colors.successLight, borderRadius: colors.radius }]}>
            <Feather name="check-circle" size={15} color={colors.success} />
            <Text style={[styles.successText, { color: colors.success }]}>Profile updated successfully</Text>
          </View>
        )}

        {/* Profile form */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Personal Information</Text>
            {!editing && (
              <Pressable onPress={() => setEditing(true)} style={styles.editBtn}>
                <Feather name="edit-2" size={15} color={colors.primary} />
                <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit</Text>
              </Pressable>
            )}
          </View>

          {editing ? (
            <View style={{ gap: 14 }}>
              <Input
                label="Full name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                autoCapitalize="words"
              />
              <Input
                label="Phone number"
                value={phone}
                onChangeText={setPhone}
                placeholder="03XX-XXXXXXX"
                keyboardType="phone-pad"
              />
              <Input
                label="Email address"
                value={user?.email ?? ''}
                editable={false}
                style={{ opacity: 0.6 }}
              />
              <View style={styles.actionRow}>
                <Button label="Cancel" onPress={handleCancel} variant="secondary" style={{ flex: 1 }} />
                <Button
                  label="Save"
                  onPress={handleSave}
                  loading={updateMutation.isPending}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <View style={{ gap: 0 }}>
              <InfoRow icon="user" label="Full name" value={profile?.fullName ?? '—'} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <InfoRow icon="phone" label="Phone" value={profile?.phone ?? '—'} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <InfoRow icon="mail" label="Email" value={user?.email ?? '—'} />
            </View>
          )}
        </View>

        {/* Support info */}
        {settings && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Support</Text>
            <InfoRow icon="phone-call" label="Phone" value={settings.supportPhone} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <InfoRow icon="mail" label="Email" value={settings.supportEmail} />
          </View>
        )}

        {/* Sign out */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.signOutBtn,
            {
              backgroundColor: colors.destructiveLight,
              borderRadius: colors.radius,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.infoRow}>
      <Feather name={icon as any} size={15} color={colors.mutedForeground} />
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.5, marginBottom: 24 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatar: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: 'Inter_700Bold', fontSize: 28 },
  avatarName: { fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 3 },
  avatarEmail: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginBottom: 16 },
  successText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  section: { padding: 16, borderWidth: 1, marginBottom: 16, gap: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  editBtnText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  infoLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, width: 80 },
  infoValue: { fontFamily: 'Inter_500Medium', fontSize: 14, flex: 1, textAlign: 'right' },
  divider: { height: 1 },
  actionRow: { flexDirection: 'row', gap: 12 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, marginTop: 8 },
  signOutText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
