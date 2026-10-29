// Feature accents, taken from the app's tokens (src/core/theme/tokens.ts):
// `brand` for screens before any context (auth), the context colors for
// context-wide features, a module's own color for module features.

export type AccentKey = 'brand' | 'school' | 'student' | 'organization' | 'students';

interface Accent {
  from: string;
  via: string;
  to: string;
  /** Text on the dark page (kicker, active step). */
  label: string;
  /** 16% tint behind chips and the active row. */
  fill: string;
  glow: string;
  /** Text on the gradient. */
  fg: string;
}

export const accents: Record<AccentKey, Accent> = {
  brand: {
    from: '#DC2626',
    via: '#EA580C',
    to: '#F59E0B',
    label: '#FDBA74',
    fill: 'rgba(234,88,12,0.16)',
    glow: 'rgba(234,88,12,0.22)',
    fg: '#FFFFFF',
  },
  school: {
    from: '#DC2626',
    via: '#9F1239',
    to: '#4C0519',
    label: '#FF8F8F',
    fill: 'rgba(239,68,68,0.16)',
    glow: 'rgba(239,68,68,0.22)',
    fg: '#FFFFFF',
  },
  student: {
    from: '#3F5AE0',
    via: '#2B3DB0',
    to: '#17205E',
    label: '#9DB0FF',
    fill: 'rgba(79,107,240,0.16)',
    glow: 'rgba(79,107,240,0.26)',
    fg: '#FFFFFF',
  },
  // Module accent of Students (moduleAccents.students).
  students: {
    from: '#FB923C',
    via: '#EA580C',
    to: '#C2410C',
    label: '#FB923C',
    fill: 'rgba(251,146,60,0.16)',
    glow: 'rgba(251,146,60,0.22)',
    fg: '#1B0A02',
  },
  organization: {
    from: '#FBBF24',
    via: '#F59E0B',
    to: '#D97706',
    label: '#FBBF24',
    fill: 'rgba(245,158,11,0.16)',
    glow: 'rgba(245,158,11,0.22)',
    fg: '#1B1203',
  },
};

/** CSS variables of an accent, set on the element that owns it. */
export const accentStyle = (key: string | undefined) => {
  const a = accents[(key as AccentKey) ?? 'brand'] ?? accents.brand;
  return {
    '--accent-from': a.from,
    '--accent-via': a.via,
    '--accent-to': a.to,
    '--accent-label': a.label,
    '--accent-fill': a.fill,
    '--accent-glow': a.glow,
    '--accent-fg': a.fg,
  };
};
