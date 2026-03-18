// ─── Trackly Design System ────────────────────────────────────────────────────
// Single source of truth for all colors, spacing, typography and radii.
// Import what you need: import { C, S, R, F } from '../theme';

// ─── Colors ───────────────────────────────────────────────────────────────────
export const C = {
  // Backgrounds
  bgBase:        '#0A0A0F',   // Root screen background
  bgCard:        '#13131A',   // Cards, list items
  bgElevated:    '#1E1E2E',   // Hover states, secondary surfaces
  bgInput:       '#0F0F18',   // Text inputs

  // Borders
  borderDefault: '#1E1E2E',   // Cards, containers
  borderStrong:  '#2A2A38',   // Buttons, interactive elements
  borderFocus:   '#6366F1',   // Focused inputs

  // Text
  textPrimary:   '#E2E2E8',   // Headings, main content
  textSecondary: '#888898',   // Subtitles, labels
  textMuted:     '#55556A',   // Hints, metadata, captions

  // Accents (vibrant)
  accentIndigo:  '#6366F1',   // Primary CTA, XP bar, active tabs
  accentIndigoL: '#818CF8',   // Text on indigo backgrounds
  accentGreen:   '#10B981',   // Completed habits, success states
  accentAmber:   '#F59E0B',   // Streak fire, warnings
  accentTeal:    '#14B8A6',   // Cuerpo/Físico category
  accentPink:    '#EC4899',   // Mente/Mental category
  accentRed:     '#EF4444',   // Destructive actions, logout

  // Semantic backgrounds (dark tinted)
  bgIndigo:      '#1E1E40',   // Indigo tinted surface
  bgIndigoL:     '#3D3D80',   // Indigo border/stroke
  bgGreen:       '#052E1A',   // Success surface
  bgGreenL:      '#0A4A28',   // Success border
  bgAmber:       '#2D1A05',   // Warning surface
  bgAmberL:      '#4A2E0A',   // Warning border
  bgRed:         '#1A0505',   // Danger surface
  bgRedL:        '#3D1010',   // Danger border
  bgTeal:        '#0A2420',   // Teal tinted surface
  bgPink:        '#2A0A20',   // Pink tinted surface
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const S = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const R = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  xxl:  28,
  pill: 99,
};

// ─── Font sizes ───────────────────────────────────────────────────────────────
export const F = {
  display: 32,
  h1:      26,
  h2:      22,
  h3:      18,
  h4:      17,
  body:    15,
  label:   13,
  small:   12,
  caption: 11,
};

// ─── Category config ──────────────────────────────────────────────────────────
// Used in HomeScreen and NotificationsScreen
export const CATEGORY_CONFIG = {
  cuerpo: { color: C.accentTeal, bg: C.bgTeal, label: 'Cuerpo & Físico' },
  mente:  { color: C.accentPink, bg: C.bgPink, label: 'Mente & Enfoque'  },
};

// ─── Horario config ───────────────────────────────────────────────────────────
// Used in NotificationsScreen
export const HORARIO_CONFIG = {
  mañana:     { color: C.accentAmber,  label: 'Mañana'   },
  tarde:      { color: C.accentTeal,   label: 'Tarde'    },
  noche:      { color: C.accentIndigo, label: 'Noche'    },
  cualquiera: { color: C.textMuted,    label: 'Flexible' },
};

// ─── Common StyleSheet fragments ─────────────────────────────────────────────
// Reusable style objects — spread into your StyleSheet.create({})
export const common = {
  // Safe area root
  root: {
    flex: 1,
    backgroundColor: C.bgBase,
  },

  // Section label (uppercase small caps)
  sectionLabel: {
    fontSize: F.caption,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 4,
  },

  // Card container
  card: {
    backgroundColor: C.bgCard,
    borderRadius: R.lg,
    borderWidth: 0.5,
    borderColor: C.borderDefault,
    padding: S.md,
  },

  // XP progress bar track
  xpBarBg: {
    height: 5,
    backgroundColor: C.bgElevated,
    borderRadius: R.pill,
    overflow: 'hidden',
  },

  // XP progress bar fill (apply width separately)
  xpBarFill: {
    height: '100%',
    backgroundColor: C.accentIndigo,
    borderRadius: R.pill,
  },

  // Level badge pill
  levelBadge: {
    backgroundColor: C.bgIndigo,
    borderRadius: R.pill,
    paddingHorizontal: S.sm,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: C.bgIndigoL,
  },
  levelBadgeText: {
    color: C.accentIndigoL,
    fontWeight: '700',
    fontSize: F.small,
  },

  // Avatar circle
  avatarCircle: {
    backgroundColor: C.bgIndigo,
    borderWidth: 1.5,
    borderColor: C.bgIndigoL,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Streak badge
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.bgAmber,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: R.pill,
    borderWidth: 0.5,
    borderColor: C.bgAmberL,
  },
  streakNum: {
    color: C.accentAmber,
    fontWeight: '800',
    fontSize: 15,
  },

  // Input field wrap
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.bgInput,
    borderWidth: 0.5,
    borderColor: C.borderStrong,
    borderRadius: R.lg,
    height: 54,
    paddingHorizontal: S.md,
  },

  // Chip (schedule, frequency)
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgCard,
    borderWidth: 0.5,
    borderColor: C.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: R.pill,
  },
  chipLabel: {
    fontSize: F.label,
    fontWeight: '600',
    color: C.textMuted,
  },

  // Primary CTA button
  primaryBtn: {
    height: 54,
    borderRadius: R.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.accentIndigo,
  },
  primaryBtnText: {
    fontSize: F.body,
    fontWeight: '700',
    color: '#fff',
  },

  // Danger button
  dangerBtn: {
    backgroundColor: C.bgRed,
    borderWidth: 0.5,
    borderColor: C.bgRedL,
    borderRadius: R.lg,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  dangerBtnText: {
    color: C.accentRed,
    fontWeight: '700',
    fontSize: F.body,
  },

  // Top bar (screen header)
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.md,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderDefault,
  },
  topBarTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: F.h4,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: -0.3,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: R.md,
    backgroundColor: C.bgCard,
    borderWidth: 0.5,
    borderColor: C.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state container
  emptyState: {
    borderRadius: R.xl,
    borderWidth: 0.5,
    borderColor: C.borderDefault,
    borderStyle: 'dashed',
    paddingVertical: 44,
    paddingHorizontal: 28,
    alignItems: 'center',
    backgroundColor: C.bgCard,
  },
  emptyTitle: {
    fontSize: F.body,
    fontWeight: '700',
    color: C.textSecondary,
    marginTop: 14,
  },
  emptyDesc: {
    fontSize: F.label,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },

  // Modal sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.bgCard,
    borderTopLeftRadius: R.xxl,
    borderTopRightRadius: R.xxl,
    borderWidth: 0.5,
    borderColor: C.borderStrong,
    paddingHorizontal: S.lg,
    paddingTop: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderStrong,
    alignSelf: 'center',
    marginBottom: S.md,
  },
  modalTitle: {
    fontSize: F.h3,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: -0.3,
    flex: 1,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: R.sm,
    backgroundColor: C.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Option row (profile settings)
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: S.md,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: C.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: F.body,
    fontWeight: '500',
    color: C.textPrimary,
  },

  // Divider
  divider: {
    height: 0.5,
    backgroundColor: C.borderDefault,
  },

  // Group card (settings sections)
  group: {
    backgroundColor: C.bgCard,
    borderRadius: R.lg,
    borderWidth: 0.5,
    borderColor: C.borderDefault,
    overflow: 'hidden',
    marginBottom: S.lg,
  },
};