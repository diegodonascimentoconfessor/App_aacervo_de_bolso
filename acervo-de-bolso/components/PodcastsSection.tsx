import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space } from '@/constants/theme';
import { useCatalogo } from '@/hooks/useCatalogo';
import { pausar, retomar, tocar, useAudio } from '@/lib/audioGlobal';
import { PodcastCat } from '@/services/syncCatalogo';
import { SectionTitle } from './ui';

function Episodio({ p }: { p: PodcastCat }) {
  const audio = useAudio();
  const meu = audio.atual?.tipo === 'podcast' && audio.atual.id === p.id;
  const estado = meu ? audio.estado : 'parado';
  const tocando = estado === 'tocando';
  const conectando = estado === 'conectando';

  const alternar = () => {
    if (meu && tocando) pausar();
    else if (meu && estado === 'pausado') retomar();
    else tocar({ tipo: 'podcast', id: p.id, titulo: p.titulo, subtitulo: p.programa || 'Podcast' }, [p.audioUrl]);
  };

  return (
    <View style={[s.card, meu && (tocando || conectando) && { borderColor: colors.accent }]}>
      <Pressable onPress={alternar} style={s.botao} hitSlop={6}>
        {conectando ? (
          <ActivityIndicator color="#0D0D0D" />
        ) : (
          <Ionicons name={tocando ? 'pause' : 'play'} size={20} color="#0D0D0D" />
        )}
      </Pressable>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.titulo} numberOfLines={2}>
          {p.titulo}
        </Text>
        <Text style={s.meta} numberOfLines={1}>
          {[p.programa, p.categoria, p.duracao].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </View>
  );
}

export default function PodcastsSection() {
  const { podcasts } = useCatalogo();
  const audio = useAudio();
  if (podcasts.length === 0) return null; // aparece sozinha quando o catálogo trouxer episódios

  const aviso = audio.atual?.tipo === 'podcast' && (audio.estado === 'erro' || audio.estado === 'offline') ? audio.mensagem : null;

  return (
    <View style={{ gap: 10, marginTop: space.lg }}>
      <SectionTitle>Podcasts</SectionTitle>
      {podcasts.slice(0, 12).map((p) => (
        <Episodio key={p.id} p={p} />
      ))}
      {!!aviso && <Text style={s.meta}>{aviso}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  botao: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  meta: { color: colors.muted, fontSize: 12 },
});
