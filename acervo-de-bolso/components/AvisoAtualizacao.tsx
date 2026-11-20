import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { colors, radius, space } from '@/constants/theme';

/**
 * Aviso discreto de atualização (EAS Update). Só aparece quando uma nova versão do código
 * já foi baixada e está pronta; em desenvolvimento ou sem EAS Update configurado, não faz nada.
 */
export default function AvisoAtualizacao() {
  const { isUpdatePending } = Updates.useUpdates();
  const insets = useSafeAreaInsets();
  const [dispensado, setDispensado] = useState(false);
  const [reiniciando, setReiniciando] = useState(false);

  // Procura e baixa novidades em segundo plano (ao abrir e ao voltar para o app)
  const verificar = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) return;
    try {
      const r = await Updates.checkForUpdateAsync();
      if (r.isAvailable) await Updates.fetchUpdateAsync();
    } catch {
      // sem internet ou servidor indisponível: tenta de novo na próxima vez
    }
  }, []);

  useEffect(() => {
    verificar();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') verificar();
    });
    return () => sub.remove();
  }, [verificar]);

  if (!isUpdatePending || dispensado) return null;

  return (
    <View style={[s.faixa, { bottom: insets.bottom + 72 }]} pointerEvents="box-none">
      <View style={s.card}>
        <View style={{ flex: 1 }}>
          <Text style={s.titulo}>Atualização disponível</Text>
          <Text style={s.sub}>Reinicie para usar a versão mais recente.</Text>
        </View>
        <Pressable onPress={() => setDispensado(true)} hitSlop={8} style={s.depois}>
          <Text style={s.depoisTxt}>Depois</Text>
        </Pressable>
        <Pressable
          disabled={reiniciando}
          hitSlop={8}
          style={[s.botao, reiniciando && { opacity: 0.6 }]}
          onPress={async () => {
            setReiniciando(true);
            try {
              await Updates.reloadAsync();
            } catch {
              setReiniciando(false);
            }
          }}
        >
          <Text style={s.botaoTxt}>{reiniciando ? 'Reiniciando…' : 'Reiniciar agora'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  faixa: { position: 'absolute', left: space.md, right: space.md, zIndex: 50 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: space.md,
  },
  titulo: { color: colors.text, fontSize: 14, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  depois: { paddingHorizontal: 6, paddingVertical: 6 },
  depoisTxt: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  botao: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 9 },
  botaoTxt: { color: '#0D0D0D', fontSize: 13, fontWeight: '800' },
});
