/**
 * Jangi Fiber – green & white brand palette.
 * Mirrors the admin web panel's design tokens.
 */

const colors = {
  light: {
    // Legacy aliases
    text: '#0f172a',
    tint: '#16a34a',

    // Core surfaces
    background: '#f8fafc',
    foreground: '#0f172a',

    // Cards / elevated surfaces
    card: '#ffffff',
    cardForeground: '#0f172a',

    // Primary – brand green
    primary: '#16a34a',
    primaryForeground: '#ffffff',

    // Secondary
    secondary: '#f1f5f9',
    secondaryForeground: '#1e293b',

    // Muted
    muted: '#f1f5f9',
    mutedForeground: '#64748b',

    // Accent
    accent: '#dcfce7',
    accentForeground: '#166534',

    // Success / active
    success: '#16a34a',
    successForeground: '#ffffff',
    successLight: '#dcfce7',

    // Warning
    warning: '#f59e0b',
    warningForeground: '#ffffff',
    warningLight: '#fef3c7',

    // Destructive
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    destructiveLight: '#fee2e2',

    // Borders and inputs
    border: '#e2e8f0',
    input: '#e2e8f0',
  },

  dark: {
    text: '#f8fafc',
    tint: '#22c55e',

    background: '#0f172a',
    foreground: '#f8fafc',

    card: '#1e293b',
    cardForeground: '#f8fafc',

    primary: '#22c55e',
    primaryForeground: '#0f172a',

    secondary: '#1e293b',
    secondaryForeground: '#f1f5f9',

    muted: '#1e293b',
    mutedForeground: '#94a3b8',

    accent: '#166534',
    accentForeground: '#dcfce7',

    success: '#22c55e',
    successForeground: '#0f172a',
    successLight: '#166534',

    warning: '#f59e0b',
    warningForeground: '#0f172a',
    warningLight: '#78350f',

    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    destructiveLight: '#7f1d1d',

    border: '#334155',
    input: '#334155',
  },

  radius: 12,
};

export default colors;
