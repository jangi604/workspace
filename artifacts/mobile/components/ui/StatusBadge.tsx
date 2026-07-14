import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type BadgeVariant = 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'expiring';

interface StatusBadgeProps {
  status: BadgeVariant;
  label?: string;
}

const LABELS: Record<BadgeVariant, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  expiring: 'Expiring Soon',
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const colors = useColors();

  const bg =
    status === 'active' || status === 'approved'
      ? colors.successLight
      : status === 'pending' || status === 'expiring'
      ? colors.warningLight
      : colors.destructiveLight;

  const fg =
    status === 'active' || status === 'approved'
      ? colors.success
      : status === 'pending' || status === 'expiring'
      ? colors.warning
      : colors.destructive;

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderRadius: 100 }]}>
      <Text style={[styles.text, { color: fg }]}>{label ?? LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
