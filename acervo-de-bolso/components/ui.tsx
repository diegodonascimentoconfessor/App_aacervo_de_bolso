import { ReactNode } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, space } from '@/constants/theme';

export function Card({
  children,
  onPress,
  onLongPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  if (!onPress && !onLongPress) return <View style={[s.card, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [s.card, style, pressed && { opacity: 0.7 }]}
    >
      {children}
    </Pressable>
  );
}

export function Pill({ texto }: { texto: string }) {
  return (
    <View style={s.pill}>
      <Text style={s.pillTxt}>{texto}</Text>
    </View>
  );
}

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  disabled,
}: {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario';
  disabled?: boolean;
}) {
  const primario = variante === 'primario';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.botao,
        primario ? s.botaoPrimario : s.botaoSecundario,
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      <Text style={[s.botaoTxt, { color: primario ? '#0D0D0D' : colors.accent }]}>{titulo}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={s.sectionTitle}>{children}</Text>;
}

export function Progress({ valor }: { valor: number }) {
  return (
    <View style={s.progTrack}>
      <View style={[s.progFill, { width: `${Math.round(Math.min(1, Math.max(0, valor)) * 100)}%` }]} />
    </View>
  );
}

export function Vazio({ texto }: { texto: string }) {
  return (
    <View style={{ padding: space.xl, alignItems: 'center' }}>
      <Text style={{ color: colors.muted, textAlign: 'center', lineHeight: 22 }}>{texto}</Text>
    </View>
  );
}

export function Campo({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        {...props}
        style={[s.input, props.multiline && { minHeight: 90, textAlignVertical: 'top' }, props.style]}
      />
    </View>
  );
}

export const inputStyle = {
  backgroundColor: colors.surface,
  color: colors.text,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: space.md,
  paddingVertical: 12,
  fontSize: 16,
} as const;

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: 6,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillTxt: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  botao: { borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center' },
  botaoPrimario: { backgroundColor: colors.accent },
  botaoSecundario: { borderWidth: 1, borderColor: colors.accent },
  botaoTxt: { fontSize: 15, fontWeight: '700' },
  sectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: space.md,
  },
  progTrack: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  progFill: { height: 4, backgroundColor: colors.accent },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  input: { ...inputStyle },
});
