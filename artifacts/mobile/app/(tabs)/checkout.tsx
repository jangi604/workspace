import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { usePackages, useAppSettings, useSubmitPaymentRequest } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PaymentMethod } from '@/lib/api';

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();

  const packagesQuery = usePackages();
  const settingsQuery = useAppSettings();
  const submitMutation = useSubmitPaymentRequest();

  const pkg = packagesQuery.data?.find((p) => p.id === id);

  const [method, setMethod] = useState<PaymentMethod>('jazzcash');
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const settings = settingsQuery.data;
  const accountInfo = settings ? settings[method] : null;

  async function pickScreenshot() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library to upload a payment screenshot.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setScreenshotUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow camera access to take a payment screenshot.');
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setScreenshotUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!pkg || !user || !screenshotUri) return;
    try {
      await submitMutation.mutateAsync({
        customerId: user.uid,
        customerName: profile?.fullName ?? user.displayName ?? '',
        customerEmail: user.email ?? '',
        pkg,
        method,
        screenshotUri,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Submission failed', 'Could not submit your payment request. Please try again.');
    }
  }

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  if (packagesQuery.isLoading || settingsQuery.isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading…</Text>
      </View>
    );
  }

  if (!pkg) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Feather name="package" size={32} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Package not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.link, { color: colors.primary }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={[styles.successContainer, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: insets.bottom + 40 }]}>
        <View style={[styles.successIcon, { backgroundColor: colors.successLight, borderRadius: 60 }]}>
          <Feather name="check-circle" size={52} color={colors.primary} />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>Request Submitted!</Text>
        <Text style={[styles.successSubtitle, { color: colors.mutedForeground }]}>
          Your payment request for{'\n'}
          <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>{pkg.name}</Text>
          {'\n'}has been sent for review.
        </Text>
        <View style={[styles.pendingNote, { backgroundColor: colors.warningLight, borderRadius: colors.radius }]}>
          <Feather name="info" size={15} color={colors.warning} />
          <Text style={[styles.pendingNoteText, { color: colors.warning }]}>
            Your request is pending admin approval. You will be notified once it is reviewed. This usually takes 1–24 hours.
          </Text>
        </View>
        <Button
          label="Back to Home"
          onPress={() => router.replace('/(tabs)')}
          style={{ marginTop: 8, minWidth: 200 }}
        />
        <Pressable onPress={() => router.push('/(tabs)/subscription')}>
          <Text style={[styles.link, { color: colors.primary, marginTop: 12 }]}>View my requests</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={20} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>Back</Text>
      </Pressable>

      <Text style={[styles.screenTitle, { color: colors.foreground }]}>Subscribe</Text>

      {/* Package summary */}
      <View style={[styles.pkgSummary, { backgroundColor: colors.accent, borderRadius: colors.radius, borderColor: colors.primary }]}>
        <View style={styles.pkgRow}>
          <View style={[styles.pkgIcon, { backgroundColor: colors.primary, borderRadius: colors.radius - 2 }]}>
            <Feather name="wifi" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pkgName, { color: colors.foreground }]}>{pkg.name}</Text>
            <Text style={[styles.pkgMeta, { color: colors.mutedForeground }]}>
              {pkg.speedMbps} Mbps · {pkg.validityDays} days
            </Text>
          </View>
          <Text style={[styles.pkgPrice, { color: colors.primary }]}>Rs {pkg.price.toLocaleString()}</Text>
        </View>
        {pkg.description ? (
          <Text style={[styles.pkgDesc, { color: colors.mutedForeground }]}>{pkg.description}</Text>
        ) : null}
      </View>

      {/* Step 1: Choose method */}
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>1. Choose payment method</Text>
      <View style={styles.methodRow}>
        {(['jazzcash', 'easypaisa'] as PaymentMethod[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMethod(m)}
            style={[
              styles.methodBtn,
              {
                borderColor: method === m ? colors.primary : colors.border,
                backgroundColor: method === m ? colors.accent : colors.card,
                borderRadius: colors.radius,
                flex: 1,
              },
            ]}
          >
            <Text style={[styles.methodLabel, { color: method === m ? colors.primary : colors.foreground }]}>
              {m === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'}
            </Text>
            {method === m && <Feather name="check-circle" size={16} color={colors.primary} />}
          </Pressable>
        ))}
      </View>

      {/* Step 2: Account details */}
      {accountInfo && (
        <>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>2. Send payment to</Text>
          <View style={[styles.accountCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
            <View style={styles.accountRow}>
              <Feather name="user" size={15} color={colors.mutedForeground} />
              <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>Account title</Text>
              <Text style={[styles.accountValue, { color: colors.foreground }]}>{accountInfo.accountTitle}</Text>
            </View>
            <View style={[styles.accountDivider, { backgroundColor: colors.border }]} />
            <View style={styles.accountRow}>
              <Feather name="phone" size={15} color={colors.mutedForeground} />
              <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>Number</Text>
              <Text style={[styles.accountValue, { color: colors.foreground }]}>{accountInfo.number}</Text>
            </View>
            <View style={[styles.amountBox, { backgroundColor: colors.primary, borderRadius: colors.radius - 2, marginTop: 12 }]}>
              <Text style={[styles.amountText, { color: '#fff' }]}>
                Send exactly: Rs {pkg.price.toLocaleString()}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Step 3: Screenshot */}
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>3. Upload payment screenshot</Text>
      <Text style={[styles.stepHint, { color: colors.mutedForeground }]}>
        After sending payment, take a screenshot of your transaction confirmation and upload it here.
      </Text>

      {screenshotUri ? (
        <View style={[styles.screenshotPreview, { borderColor: colors.primary, borderRadius: colors.radius }]}>
          <Image source={{ uri: screenshotUri }} style={styles.screenshotImage} resizeMode="cover" />
          <Pressable
            onPress={() => setScreenshotUri(null)}
            style={[styles.removeBtn, { backgroundColor: colors.destructive }]}
          >
            <Feather name="x" size={14} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <View style={styles.uploadRow}>
          <Pressable
            onPress={pickScreenshot}
            style={[styles.uploadBtn, { backgroundColor: colors.secondary, borderRadius: colors.radius, borderColor: colors.border }]}
          >
            <Feather name="image" size={20} color={colors.primary} />
            <Text style={[styles.uploadBtnText, { color: colors.foreground }]}>Gallery</Text>
          </Pressable>
          {Platform.OS !== 'web' && (
            <Pressable
              onPress={takePhoto}
              style={[styles.uploadBtn, { backgroundColor: colors.secondary, borderRadius: colors.radius, borderColor: colors.border }]}
            >
              <Feather name="camera" size={20} color={colors.primary} />
              <Text style={[styles.uploadBtnText, { color: colors.foreground }]}>Camera</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Submit */}
      <Button
        label={submitMutation.isPending ? 'Submitting…' : 'Submit Payment Request'}
        onPress={handleSubmit}
        loading={submitMutation.isPending}
        disabled={!screenshotUri}
        size="lg"
        style={{ marginTop: 24 }}
      />

      {!screenshotUri && (
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Please upload a payment screenshot to continue
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  link: { fontFamily: 'Inter_600SemiBold', fontSize: 14, textDecorationLine: 'underline' },
  content: { paddingHorizontal: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  screenTitle: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.5, marginBottom: 20 },
  pkgSummary: { padding: 16, borderWidth: 1.5, marginBottom: 28 },
  pkgRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pkgIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  pkgName: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  pkgMeta: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 2 },
  pkgPrice: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  pkgDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 10, lineHeight: 19 },
  stepTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 12 },
  stepHint: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginBottom: 14, marginTop: -4 },
  methodRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  methodBtn: { padding: 14, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  methodLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  accountCard: { padding: 16, borderWidth: 1, marginBottom: 24 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accountLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1 },
  accountValue: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  accountDivider: { height: 1, marginVertical: 12 },
  amountBox: { padding: 12, alignItems: 'center' },
  amountText: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  uploadRow: { flexDirection: 'row', gap: 12 },
  uploadBtn: { flex: 1, padding: 20, alignItems: 'center', gap: 8, borderWidth: 1.5 },
  uploadBtnText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  screenshotPreview: { borderWidth: 2, overflow: 'hidden', position: 'relative', height: 200, marginBottom: 4 },
  screenshotImage: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'center', marginTop: 8 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 16 },
  successIcon: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successTitle: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.5 },
  successSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24, textAlign: 'center' },
  pendingNote: { padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 4 },
  pendingNoteText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, flex: 1 },
});
