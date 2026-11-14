import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '@/constants/theme';

type Props = {
  visible: boolean;
  titulo: string;
  onClose: () => void;
  onSalvar: () => void;
  rotuloSalvar?: string;
  children: ReactNode;
};

export default function FormModal({
  visible,
  titulo,
  onClose,
  onSalvar,
  rotuloSalvar = 'Salvar',
  children,
}: Props) {
  const topo = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 20;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[s.header, { paddingTop: topo }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={s.cancelar}>Cancelar</Text>
          </Pressable>
          <Text style={s.titulo}>{titulo}</Text>
          <Pressable onPress={onSalvar} hitSlop={12}>
            <Text style={s.salvar}>{rotuloSalvar}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titulo: { color: colors.text, fontSize: 17, fontWeight: '700' },
  cancelar: { color: colors.muted, fontSize: 16 },
  salvar: { color: colors.accent, fontSize: 16, fontWeight: '700' },
});
