import { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import CategoryChips from '@/components/CategoryChips';
import { Card, Pill, Vazio } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { listaTags } from '@/lib/format';
import { aoMudarAcervo, ItemAcervo, listarAcervo, sincronizarArtigosAcervo } from '@/services/syncArtigosAcervo';

export default function Acervo() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [categoria, setCategoria] = useState<string | null>(null);
  const [artigos, setArtigos] = useState<ItemAcervo[]>([]);

  const carregar = useCallback(() => {
    listarAcervo(db, categoria).then(setArtigos).catch(() => {});
  }, [db, categoria]);

  // Mostra na hora o que já está salvo e, ao entrar na aba, tenta a sincronização diária em segundo plano
  useFocusEffect(
    useCallback(() => {
      carregar();
      sincronizarArtigosAcervo(db).catch(() => {});
    }, [db, carregar])
  );

  // Quando chegarem artigos novos, a lista atualiza sozinha
  useEffect(() => aoMudarAcervo(carregar), [carregar]);

  return (
    <View style={{ flex: 1 }}>
      <CategoryChips value={categoria} onChange={setCategoria} />
      <FlatList
        data={artigos}
        keyExtractor={(a) => a.chave}
        contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.sm, paddingBottom: 40 }}
        ListEmptyComponent={<Vazio texto="Nenhum texto nesta categoria ainda." />}
        renderItem={({ item }) => (
          <Card
            onPress={() => router.push({ pathname: '/texto/[id]', params: { id: item.chave } })}
            style={{ gap: 8 }}
          >
            <Pill texto={item.categoria} />
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{item.titulo}</Text>
            <Text style={{ color: colors.muted }}>{item.autor}</Text>
            <Text style={{ color: colors.text, opacity: 0.85, lineHeight: 22 }} numberOfLines={3}>
              {item.resumo}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {listaTags(item.tags).map((t) => `#${t}`).join('  ')}
              {item.nota_margem ? '  ·  ✎ com nota' : ''}
            </Text>
          </Card>
        )}
      />
    </View>
  );
}
