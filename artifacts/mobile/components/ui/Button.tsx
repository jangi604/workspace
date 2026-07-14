import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const colors = useColors();

  const bgColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'destructive'
      ? colors.destructive
      : variant === 'secondary'
      ? colors.secondary
      : 'transparent';

  const fgColor =
    variant === 'primary'
      ? colors.primaryForeground
      : variant === 'destructive'
      ? colors.destructiveForeground
      : variant === 'secondary'
      ? colors.secondaryForeground
      : colors.primary;

  const paddingV = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColor,
          borderRadius: colors.radius,
          paddingVertical: paddingV,
          opacity: pressed ? 0.82 : disabled || loading ? 0.5 : 1,
          borderWidth: variant === 'ghost' ? 0 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fgColor} size="small" />
      ) : (
        <Text style={[styles.label, { color: fgColor, fontSize }, textStyle]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minHeight: 44,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
});
