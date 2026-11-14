import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { CATEGORIAS } from '@/constants/categorias';
import { colors } from '@/constants/theme';

type Props = {
  value: string | null;
  onChange: (c: string | null) => void;
  /** Mostra o chip "Todas" (filtros). Em formulários, deixe false. */
  todas?: boolean;
};

export default function CategoryChips({ value, onChange, todas = true }: Props) {
  const itens: (string | null)[] = todas ? [null, ...CATEGORIAS] : [...CATEGORIAS];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={s.row}
    >
      {itens.map((c) => {
        const ativo = c === value;
        return (
          <Pressable
            key={c ?? 'todas'}
            onPress={() => onChange(c)}
            style={[s.chip, ativo && s.chipAtivo]}
          >
            <Text style={[s.txt, ativo && s.txtAtivo]}>{c ?? 'Todas'}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { backgroundColor: colors.accent, borderColor: colors.accent },
  txt: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  txtAtivo: { color: '#0D0D0D' },
});
