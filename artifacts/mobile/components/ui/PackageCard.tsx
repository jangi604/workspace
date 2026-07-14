import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { InternetPackage } from '@/lib/api';

interface PackageCardProps {
  pkg: InternetPackage;
  onPress: () => void;
  isActive?: boolean;
}

export function PackageCard({ pkg, onPress, isActive }: PackageCardProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isActive ? colors.accent : colors.card,
          borderRadius: colors.radius,
          borderColor: isActive ? colors.primary : colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      {isActive && (
        <View style={[styles.activeBanner, { backgroundColor: colors.primary }]}>
          <Text style={[styles.activeBannerText, { color: colors.primaryForeground }]}>Current Plan</Text>
        </View>
      )}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: colors.successLight, borderRadius: colors.radius - 4 }]}>
          <Feather name="wifi" size={22} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.foreground }]}>{pkg.name}</Text>
          <Text style={[styles.speed, { color: colors.primary }]}>{pkg.speedMbps} Mbps</Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={[styles.price, { color: colors.foreground }]}>Rs {pkg.price.toLocaleString()}</Text>
          <Text style={[styles.validity, { color: colors.mutedForeground }]}>{pkg.validityDays} days</Text>
        </View>
      </View>
      {pkg.description ? (
        <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
          {pkg.description}
        </Text>
      ) : null}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Feather name="chevron-right" size={16} color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.primary }]}>View & Subscribe</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  activeBanner: {
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  activeBannerText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  speed: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginTop: 2,
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  validity: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    justifyContent: 'flex-end',
  },
  footerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
});
