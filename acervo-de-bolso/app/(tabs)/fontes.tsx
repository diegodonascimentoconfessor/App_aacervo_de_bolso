import { useCallback, useState } from 'react';
import { Alert, SectionList, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as WebBrowser from 'expo-web-browser';
import AdicionarFonte from '@/components/AdicionarFonte';
import PesquisaGoogle from '@/components/PesquisaGoogle';
import PodcastsSection from '@/components/PodcastsSection';
import VideosSection from '@/components/VideosSection';
import { useCatalogo } from '@/hooks/useCatalogo';
import { Card } from '@/components/ui';
import { CATEGORIAS } from '@/constants/categorias';
import { colors, space } from '@/constants/theme';
import { Fonte, listarFontes, removerFonte } from '@/database/db';

export default function Fontes() {
  const db = useSQLiteContext();
  const [fontes, setFontes] = useState<Fonte[]>([]);
  const { links } = useCatalogo(); // acervos extras vindos do catalogo.json

  const carregar = useCallback(() => listarFontes(db).then(setFontes).catch(() => {}), [db]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const extras: Fonte[] = links.map((l, i) => ({
    id: -(i + 1),
    titulo: l.titulo,
    url: l.url,
    categoria: l.categoria,
    descricao: l.descricao,
    personalizada: 0,
  }));
  const todas = [...fontes, ...extras];
  const categorias: string[] = [...CATEGORIAS, ...[...new Set(todas.map((f) => f.categoria))].filter((c) => !(CATEGORIAS as readonly string[]).includes(c))];
  const secoes = categorias
    .map((c) => ({ title: c, data: todas.filter((f) => f.categoria === c) }))
    .filter((s) => s.data.length > 0);

  const abrir = (url: string) =>
    WebBrowser.openBrowserAsync(url, { toolbarColor: colors.bg, controlsColor: colors.accent });

  const remover = (f: Fonte) => {
    if (!f.personalizada) return; // fontes do seed não são removíveis
    Alert.alert('Remover link?', f.titulo, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await removerFonte(db, f.id);
          carregar();
        },
      },
    ]);
  };

  return (
    <SectionList
      sections={secoes}
      keyExtractor={(f) => String(f.id)}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ padding: space.lg, gap: space.sm, paddingBottom: 40 }}
      ListHeaderComponent={
        <View style={{ gap: 6, marginBottom: space.sm }}>
          <View style={{ marginBottom: space.sm }}>
            <PesquisaGoogle />
          </View>
          <AdicionarFonte onAdicionada={carregar} />
          <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center' }}>
            Abrir links requer internet. Segure um link adicionado por você para removê-lo.
          </Text>
        </View>
      }
      ListFooterComponent={
        <>
          <PodcastsSection />
          <VideosSection />
        </>
      }
      renderSectionHeader={({ section }) => (
        <Text
          style={{
            color: colors.accent,
            fontSize: 13,
            fontWeight: '700',
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginTop: space.md,
            marginBottom: 4,
          }}
        >
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => (
        <Card onPress={() => abrir(item.url)} onLongPress={() => remover(item)} style={{ marginBottom: space.sm }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>
            {item.titulo}
            {item.personalizada ? '  ★' : ''}
          </Text>
          {!!item.descricao && <Text style={{ color: colors.muted, lineHeight: 20 }}>{item.descricao}</Text>}
          <Text style={{ color: colors.accent, fontSize: 12 }} numberOfLines={1}>
            {item.url}
          </Text>
        </Card>
      )}
    />
  );
}
