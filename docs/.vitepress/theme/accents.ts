// Feature accents, taken from the app's tokens (src/core/theme/tokens.ts):
// `brand` for screens before any context (auth), the context colors for
// context-wide features, a module's own color for module features.

export type AccentKey = 'brand' | 'school' | 'student' | 'organization' | 'students' | 'payments'
  | 'attendance' | 'grading' | 'orders' | 'products' | 'events' | 'trainings' | 'tags' | 'notebook' | 'threed';

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
  // Module accent of Payments (moduleAccents.payments).
  payments: {
    from: '#059669',
    via: '#047857',
    to: '#065F46',
    label: '#4ADE9F',
    fill: 'rgba(74,222,159,0.16)',
    glow: 'rgba(74,222,159,0.22)',
    fg: '#FFFFFF',
  },
  // Module accents (moduleAccents in the app tokens).
  attendance: {
    from: '#2563EB',
    via: '#2563EB',
    to: '#1E40AF',
    label: '#8DB8FF',
    fill: 'rgba(141,184,255,0.16)',
    glow: 'rgba(141,184,255,0.22)',
    fg: '#FFFFFF',
  },
  grading: {
    from: '#64748B',
    via: '#64748B',
    to: '#334155',
    label: '#CBD5E1',
    fill: 'rgba(203,213,225,0.16)',
    glow: 'rgba(203,213,225,0.22)',
    fg: '#FFFFFF',
  },
  orders: {
    from: '#7C3AED',
    via: '#7C3AED',
    to: '#5B21B6',
    label: '#C4AEFF',
    fill: 'rgba(196,174,255,0.16)',
    glow: 'rgba(196,174,255,0.22)',
    fg: '#FFFFFF',
  },
  products: {
    from: '#DB2777',
    via: '#DB2777',
    to: '#9D174D',
    label: '#F9A8D4',
    fill: 'rgba(249,168,212,0.16)',
    glow: 'rgba(249,168,212,0.22)',
    fg: '#FFFFFF',
  },
  events: {
    from: '#FBBF24',
    via: '#FBBF24',
    to: '#D97706',
    label: '#F5B53D',
    fill: 'rgba(245,181,61,0.16)',
    glow: 'rgba(245,181,61,0.22)',
    fg: '#1B1203',
  },
  trainings: {
    from: '#2DD4BF',
    via: '#2DD4BF',
    to: '#0F766E',
    label: '#5EEAD4',
    fill: 'rgba(94,234,212,0.16)',
    glow: 'rgba(94,234,212,0.22)',
    fg: '#04201C',
  },
  tags: {
    from: '#FB7185',
    via: '#FB7185',
    to: '#E11D48',
    label: '#FDA4AF',
    fill: 'rgba(251,113,133,0.16)',
    glow: 'rgba(251,113,133,0.22)',
    fg: '#FFFFFF',
  },
  notebook: {
    from: '#22D3EE',
    via: '#22D3EE',
    to: '#0891B2',
    label: '#67E8F9',
    fill: 'rgba(103,232,249,0.16)',
    glow: 'rgba(103,232,249,0.22)',
    fg: '#03202A',
  },
  threed: {
    from: '#A3E635',
    via: '#A3E635',
    to: '#65A30D',
    label: '#BEF264',
    fill: 'rgba(190,242,100,0.16)',
    glow: 'rgba(190,242,100,0.22)',
    fg: '#142003',
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
