import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureToggle?: boolean;
}

export function Input({ label, error, secureToggle, style, ...props }: InputProps) {
  const colors = useColors();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      ) : null}
      <View style={[
        styles.inputRow,
        {
          borderColor: error ? colors.destructive : colors.border,
          backgroundColor: colors.card,
          borderRadius: colors.radius,
        },
      ]}>
        <TextInput
          {...props}
          secureTextEntry={secureToggle ? !showPassword : props.secureTextEntry}
          style={[
            styles.input,
            { color: colors.foreground },
            style,
          ]}
          placeholderTextColor={colors.mutedForeground}
        />
        {secureToggle ? (
          <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    paddingVertical: 12,
  },
  eyeBtn: {
    paddingLeft: 8,
    paddingVertical: 8,
  },
  error: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
});
