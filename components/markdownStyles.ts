import { StyleSheet } from 'react-native';
import { colors, fonts } from '@/constants/theme';

export const markdownStyles = StyleSheet.create({
  body: { color: colors.text, fontFamily: fonts.serif, fontSize: 17, lineHeight: 28 },
  heading1: { color: colors.text, fontSize: 28, fontWeight: '700', marginTop: 8, marginBottom: 12, lineHeight: 36 },
  heading2: { color: colors.accent, fontSize: 21, fontWeight: '700', marginTop: 22, marginBottom: 8 },
  heading3: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 6 },
  strong: { color: colors.text, fontWeight: '700' },
  em: { fontStyle: 'italic' },
  link: { color: colors.accent },
  bullet_list: { marginVertical: 6 },
  ordered_list: { marginVertical: 6 },
  list_item: { marginVertical: 3 },
  blockquote: {
    backgroundColor: colors.surface,
    borderLeftColor: colors.accent,
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 10,
  },
  code_inline: { backgroundColor: colors.surfaceAlt, color: colors.accent, borderRadius: 4, paddingHorizontal: 4 },
  code_block: { backgroundColor: colors.surface, color: colors.text, padding: 12, borderRadius: 8 },
  fence: { backgroundColor: colors.surface, color: colors.text, padding: 12, borderRadius: 8 },
  hr: { backgroundColor: colors.border, height: 1, marginVertical: 16 },
});
