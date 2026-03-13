/** Brand color constants — mirrors the CSS custom properties in index.css.
 * Use these in JS contexts (Recharts, react-pdf) where Tailwind classes aren't available. */
export const colors = {
  purple: '#9663B0',
  purpleLight: '#EDE0F5',
  purpleDark: '#6A3D84',
  gold: '#C7B25F',
  goldLight: '#F5EFD6',
  goldDark: '#8C7A35',
  warmGray: '#6B6570',
  warmGrayLt: '#F2F0F3',
  textDark: '#2A2030',
  cardBorder: '#E0DCE5',
  white: '#FFFFFF',
} as const;

/** Chart color for each giving category — used in Recharts */
export const categoryChartColors = {
  jewish: colors.purple,
  education: colors.gold,
  arts: colors.warmGray,
} as const;
