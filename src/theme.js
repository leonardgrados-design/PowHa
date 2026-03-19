// ─── Trackly Design System ────────────────────────────────────────────────────
// Import getTheme(isDark) for dynamic theming, or C for static dark defaults.

// ─── Dark palette ─────────────────────────────────────────────────────────────
const dark = {
  bgBase:        '#0A0A0F',
  bgCard:        '#13131A',
  bgElevated:    '#1E1E2E',
  bgInput:       '#0F0F18',
  borderDefault: '#1E1E2E',
  borderStrong:  '#2A2A38',
  borderFocus:   '#6366F1',
  textPrimary:   '#E2E2E8',
  textSecondary: '#888898',
  textMuted:     '#55556A',
  accentIndigo:  '#6366F1',
  accentIndigoL: '#818CF8',
  accentGreen:   '#10B981',
  accentAmber:   '#F59E0B',
  accentTeal:    '#14B8A6',
  accentPink:    '#EC4899',
  accentRed:     '#EF4444',
  bgIndigo:      '#1E1E40',
  bgIndigoL:     '#3D3D80',
  bgGreen:       '#052E1A',
  bgGreenL:      '#0A4A28',
  bgAmber:       '#2D1A05',
  bgAmberL:      '#4A2E0A',
  bgRed:         '#1A0505',
  bgRedL:        '#3D1010',
  bgTeal:        '#0A2420',
  bgPink:        '#2A0A20',
  statusBar:     'light-content',
};

// ─── Light palette ────────────────────────────────────────────────────────────
const light = {
  bgBase:        '#F8F9FA',
  bgCard:        '#FFFFFF',
  bgElevated:    '#F1F3F5',
  bgInput:       '#FFFFFF',
  borderDefault: '#E9ECEF',
  borderStrong:  '#DEE2E6',
  borderFocus:   '#6366F1',
  textPrimary:   '#1A1A2E',
  textSecondary: '#495057',
  textMuted:     '#868E96',
  accentIndigo:  '#6366F1',
  accentIndigoL: '#4F52D4',
  accentGreen:   '#0CA678',
  accentAmber:   '#F08C00',
  accentTeal:    '#0C9E8C',
  accentPink:    '#D6336C',
  accentRed:     '#E03131',
  bgIndigo:      '#EEF2FF',
  bgIndigoL:     '#C5C8F8',
  bgGreen:       '#EBFBEE',
  bgGreenL:      '#B2F2BB',
  bgAmber:       '#FFF9DB',
  bgAmberL:      '#FFE066',
  bgRed:         '#FFF5F5',
  bgRedL:        '#FFC9C9',
  bgTeal:        '#E6FCF5',
  bgPink:        '#FFF0F6',
  statusBar:     'dark-content',
};

export function getTheme(isDark) {
  return isDark ? dark : light;
}

// Static dark exports for backward compatibility
export const C = dark;

export const S = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const R = { sm: 6, md: 10, lg: 14, xl: 20, xxl: 28, pill: 99 };
export const F = {
  display: 32, h1: 26, h2: 22, h3: 18, h4: 17,
  body: 15, label: 13, small: 12, caption: 11,
};

export const CATEGORY_CONFIG = {
  cuerpo: { color: dark.accentTeal, bg: dark.bgTeal, label: 'Cuerpo & Físico' },
  mente:  { color: dark.accentPink, bg: dark.bgPink, label: 'Mente & Enfoque' },
};

export const HORARIO_CONFIG = {
  mañana:     { color: dark.accentAmber,  label: 'Mañana'   },
  tarde:      { color: dark.accentTeal,   label: 'Tarde'    },
  noche:      { color: dark.accentIndigo, label: 'Noche'    },
  cualquiera: { color: dark.textMuted,    label: 'Flexible' },
};

export const common = {
  root:           { flex: 1, backgroundColor: dark.bgBase },
  sectionLabel:   { fontSize: F.caption, fontWeight: '700', color: dark.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 4 },
  card:           { backgroundColor: dark.bgCard, borderRadius: R.lg, borderWidth: 0.5, borderColor: dark.borderDefault, padding: S.md },
  xpBarBg:        { height: 5, backgroundColor: dark.bgElevated, borderRadius: R.pill, overflow: 'hidden' },
  xpBarFill:      { height: '100%', backgroundColor: dark.accentIndigo, borderRadius: R.pill },
  levelBadge:     { backgroundColor: dark.bgIndigo, borderRadius: R.pill, paddingHorizontal: S.sm, paddingVertical: 3, borderWidth: 0.5, borderColor: dark.bgIndigoL },
  levelBadgeText: { color: dark.accentIndigoL, fontWeight: '700', fontSize: F.small },
  avatarCircle:   { backgroundColor: dark.bgIndigo, borderWidth: 1.5, borderColor: dark.bgIndigoL, alignItems: 'center', justifyContent: 'center' },
  streakBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: dark.bgAmber, paddingHorizontal: 12, paddingVertical: 7, borderRadius: R.pill, borderWidth: 0.5, borderColor: dark.bgAmberL },
  streakNum:      { color: dark.accentAmber, fontWeight: '800', fontSize: 15 },
  inputWrap:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: dark.bgInput, borderWidth: 0.5, borderColor: dark.borderStrong, borderRadius: R.lg, height: 54, paddingHorizontal: S.md },
  chip:           { flexDirection: 'row', alignItems: 'center', backgroundColor: dark.bgCard, borderWidth: 0.5, borderColor: dark.borderStrong, paddingHorizontal: 14, paddingVertical: 9, borderRadius: R.pill },
  chipLabel:      { fontSize: F.label, fontWeight: '600', color: dark.textMuted },
  primaryBtn:     { height: 54, borderRadius: R.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: dark.accentIndigo },
  primaryBtnText: { fontSize: F.body, fontWeight: '700', color: '#fff' },
  dangerBtn:      { backgroundColor: dark.bgRed, borderWidth: 0.5, borderColor: dark.bgRedL, borderRadius: R.lg, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  dangerBtnText:  { color: dark.accentRed, fontWeight: '700', fontSize: F.body },
  topBar:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.md, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: dark.borderDefault },
  topBarTitle:    { flex: 1, marginLeft: 12, fontSize: F.h4, fontWeight: '700', color: dark.textPrimary, letterSpacing: -0.3 },
  backBtn:        { width: 36, height: 36, borderRadius: R.md, backgroundColor: dark.bgCard, borderWidth: 0.5, borderColor: dark.borderStrong, alignItems: 'center', justifyContent: 'center' },
  emptyState:     { borderRadius: R.xl, borderWidth: 0.5, borderColor: dark.borderDefault, borderStyle: 'dashed', paddingVertical: 44, paddingHorizontal: 28, alignItems: 'center', backgroundColor: dark.bgCard },
  emptyTitle:     { fontSize: F.body, fontWeight: '700', color: dark.textSecondary, marginTop: 14 },
  emptyDesc:      { fontSize: F.label, color: dark.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet:     { borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, borderWidth: 0.5, borderColor: dark.borderStrong, paddingHorizontal: S.lg, paddingTop: 12 },
  modalHandle:    { width: 36, height: 4, borderRadius: 2, backgroundColor: dark.borderStrong, alignSelf: 'center', marginBottom: S.md },
  modalTitle:     { fontSize: F.h3, fontWeight: '800', color: dark.textPrimary, letterSpacing: -0.3, flex: 1 },
  modalClose:     { width: 32, height: 32, borderRadius: R.sm, backgroundColor: dark.bgElevated, alignItems: 'center', justifyContent: 'center' },
  optionRow:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: S.md },
  optionIcon:     { width: 34, height: 34, borderRadius: 9, backgroundColor: dark.bgElevated, alignItems: 'center', justifyContent: 'center' },
  optionLabel:    { flex: 1, fontSize: F.body, fontWeight: '500', color: dark.textPrimary },
  divider:        { height: 0.5, backgroundColor: dark.borderDefault },
  group:          { backgroundColor: dark.bgCard, borderRadius: R.lg, borderWidth: 0.5, borderColor: dark.borderDefault, overflow: 'hidden', marginBottom: S.lg },
};