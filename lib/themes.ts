export type ThemePreset = {
  id: string
  name: string
  emoji: string
  primary: string   // hex – buttons, progress bar, clue card header, active UI
  accent: string    // hex – voucher discount text, location hint border/bg tint
  bgFrom: string    // hex – page gradient start
  bgMid: string     // hex – page gradient mid
  bgTo: string      // hex – page gradient end
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'EASTER',
    name: 'Easter',
    emoji: '🐣',
    primary: '#2d5a27',
    accent: '#f4b942',
    bgFrom: '#f0fdf4',
    bgMid: '#fefce8',
    bgTo: '#fff7ed',
  },
  {
    id: 'CHRISTMAS',
    name: 'Christmas',
    emoji: '🎄',
    primary: '#b91c1c',
    accent: '#ca8a04',
    bgFrom: '#fef2f2',
    bgMid: '#f0fdf4',
    bgTo: '#fef2f2',
  },
  {
    id: 'SPRING',
    name: 'Spring',
    emoji: '🌸',
    primary: '#be185d',
    accent: '#7c3aed',
    bgFrom: '#fdf2f8',
    bgMid: '#f5f3ff',
    bgTo: '#fdf4ff',
  },
  {
    id: 'CORPORATE',
    name: 'Corporate',
    emoji: '💼',
    primary: '#1e3a5f',
    accent: '#475569',
    bgFrom: '#eff6ff',
    bgMid: '#f8fafc',
    bgTo: '#eff6ff',
  },
  {
    id: 'TROPICAL',
    name: 'Tropical',
    emoji: '🌴',
    primary: '#0f766e',
    accent: '#b45309',
    bgFrom: '#f0fdfa',
    bgMid: '#fff7ed',
    bgTo: '#fefce8',
  },
  {
    id: 'HALLOWEEN',
    name: 'Halloween',
    emoji: '🎃',
    primary: '#c2410c',
    accent: '#7e22ce',
    bgFrom: '#fff7ed',
    bgMid: '#faf5ff',
    bgTo: '#fff7ed',
  },
  {
    id: 'CUSTOM',
    name: 'Custom',
    emoji: '🎨',
    primary: '#1a1a1a',
    accent: '#6b7280',
    bgFrom: '#f9fafb',
    bgMid: '#f3f4f6',
    bgTo: '#f9fafb',
  },
]

/** Resolve the effective theme for a hunt, merging preset with any colour overrides. */
export function resolveTheme(hunt: {
  themePreset?: string | null
  themePrimaryColor?: string | null
  themeAccentColor?: string | null
}): ThemePreset {
  const base =
    THEME_PRESETS.find((t) => t.id === (hunt.themePreset ?? 'EASTER')) ??
    THEME_PRESETS[0]
  return {
    ...base,
    primary: hunt.themePrimaryColor ?? base.primary,
    accent: hunt.themeAccentColor ?? base.accent,
  }
}

/** Convert a hex colour to an rgba string with given opacity (0–1). */
export function hexWithOpacity(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
