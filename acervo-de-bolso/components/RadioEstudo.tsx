import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Estacao } from '@/constants/radios';
import { colors, radius, space } from '@/constants/theme';
import { parar, pausar, retomar, tocar, useAudio } from '@/lib/audioGlobal';
import { useCatalogo } from '@/hooks/useCatalogo';

export default function RadioEstudo() {
  const { radios } = useCatalogo(); // 8 estações embutidas + extras/correções do catalogo.json
  const audio = useAudio();
  const [selId, setSelId] = useState(radios[0]?.id ?? 'mec');
  const estacao: Estacao | undefined = radios.find((r) => r.id === selId) ?? radios[0];
  if (!estacao) return null;

  const daRadio = audio.atual?.tipo === 'radio' && audio.atual.id === estacao.id;
  const estado = daRadio ? audio.estado : 'parado';
  const conectando = estado === 'conectando';
  const tocando = estado === 'tocando';
  const radioAtiva =
    audio.atual?.tipo === 'radio' && (audio.estado === 'tocando' || audio.estado === 'conectando');
  const mensagem = daRadio && (estado === 'erro' || estado === 'offline') ? audio.mensagem : null;

  const iniciar = (e: Estacao) =>
    tocar({ tipo: 'radio', id: e.id, titulo: e.nome, subtitulo: 'Acervo de Bolso' }, e.urls);

  const alternar = () => {
    if (daRadio && tocando) pausar();
    else if (daRadio && estado === 'pausado') retomar();
    else iniciar(estacao);
  };

  const escolher = (e: Estacao) => {
    if (e.id === selId) return;
    setSelId(e.id);
    if (radioAtiva) iniciar(e); // troca de estação sem precisar apertar play de novo
  };

  const sub = mensagem
    ? estacao.descricao
    : tocando
      ? 'Tocando agora'
      : conectando
        ? 'Conectando…'
        : estado === 'pausado'
          ? 'Pausado'
          : estacao.descricao;

  return (
    <View style={s.card}>
      <View style={s.linha}>
        <Pressable onPress={alternar} style={s.botao} hitSlop={6}>
          {conectando ? (
            <ActivityIndicator color="#0D0D0D" />
          ) : (
            <Ionicons name={tocando ? 'pause' : 'play'} size={22} color="#0D0D0D" />
          )}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.nome} numberOfLines={1}>
            {estacao.nome}
          </Text>
          <Text style={s.sub} numberOfLines={1}>
            {sub}
          </Text>
        </View>
        <Pressable onPress={parar} style={s.parar} hitSlop={8}>
          <Ionicons name="stop" size={18} color={colors.muted} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
        {radios.map((e) => {
          const sel = e.id === selId;
          return (
            <Pressable key={e.id} onPress={() => escolher(e)} style={[s.chip, sel && s.chipAtivo]}>
              <Text style={[s.chipTxt, sel && { color: '#0D0D0D' }]}>{e.curto}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {!!mensagem && <Text style={s.erro}>{mensagem}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: 12,
  },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botao: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: { color: colors.text, fontSize: 15, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipTxt: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  erro: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
