import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Video } from '@/constants/videos';
import { useCatalogo } from '@/hooks/useCatalogo';
import { colors, radius, space } from '@/constants/theme';
import { temInternet } from '@/lib/rede';
import { SectionTitle } from './ui';

const LARGURA = 250;

function Cartao({ v, onPress }: { v: Video; onPress: () => void }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.75 }]}>
      <View style={s.thumb}>
        {imgOk ? (
          <Image
            source={{ uri: `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg` }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImgOk(false)}
          />
        ) : (
          <Text style={s.semImg}>▶</Text>
        )}
        <View style={s.badgeCat}>
          <Text style={s.badgeCatTxt}>{v.categoria}</Text>
        </View>
        {!!v.duracao && (
          <View style={s.badgeDur}>
            <Text style={s.badgeDurTxt}>{v.duracao}</Text>
          </View>
        )}
      </View>
      <View style={{ padding: space.sm + 2, gap: 4 }}>
        <Text style={s.titulo} numberOfLines={3}>
          {v.titulo}
        </Text>
        <Text style={s.canal}>{v.canal}</Text>
      </View>
    </Pressable>
  );
}

export default function VideosSection() {
  const { videos } = useCatalogo();
  const [aviso, setAviso] = useState<string | null>(null);

  async function abrir(v: Video) {
    setAviso(null);
    if (!(await temInternet())) {
      setAviso('Sem conexão para assistir vídeos. Seus PDFs continuam disponíveis offline.');
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${v.youtubeId}`, {
        toolbarColor: colors.bg,
        controlsColor: colors.accent,
      });
    } catch {
      setAviso('Não foi possível abrir o vídeo agora.');
    }
  }

  return (
    <View style={{ gap: 10, marginTop: space.lg }}>
      <SectionTitle>Vídeos e palestras</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {videos.map((v) => (
          <Cartao key={v.id} v={v} onPress={() => abrir(v)} />
        ))}
      </ScrollView>
      {!!aviso && <Text style={{ color: colors.muted, fontSize: 12 }}>{aviso}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: LARGURA,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  thumb: {
    height: LARGURA * 0.5625,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  semImg: { color: colors.muted, fontSize: 28 },
  badgeCat: {
    position: 'absolute',
    left: 8,
    top: 8,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeCatTxt: { color: '#0D0D0D', fontSize: 10, fontWeight: '800' },
  badgeDur: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeDurTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  titulo: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  canal: { color: colors.muted, fontSize: 12 },
});
