import { useCallback, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import CategoryChips from '@/components/CategoryChips';
import ImportarObra from '@/components/ImportarObra';
import { Card, Pill, Progress, Vazio } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { listarObras, Obra, removerObra } from '@/database/db';
import { listaTags, rotuloProgresso } from '@/lib/format';

export default function Estante() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [categoria, setCategoria] = useState<string | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);

  const carregar = useCallback(() => listarObras(db, categoria).then(setObras).catch(() => {}), [db, categoria]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const confirmarRemocao = (o: Obra) =>
    Alert.alert('Remover obra?', `“${o.titulo}” e o arquivo copiado serão apagados do app.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await removerObra(db, o);
          carregar();
        },
      },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm }}>
        <ImportarObra onImportada={carregar} />
      </View>
      <CategoryChips value={categoria} onChange={setCategoria} />
      <FlatList
        data={obras}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.sm, paddingBottom: 40 }}
        ListEmptyComponent={
          <Vazio texto="Sua estante está vazia. Importe um PDF ou arquivo Markdown para ler offline." />
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => router.push({ pathname: '/leitor/[id]', params: { id: String(item.id) } })}
            onLongPress={() => confirmarRemocao(item)}
            style={{ gap: 8 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Pill texto={item.categoria} />
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>
                {item.tipo === 'pdf' ? 'PDF' : 'MD'}
              </Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{item.titulo}</Text>
            {!!item.autor && <Text style={{ color: colors.muted }}>{item.autor}</Text>}
            <Progress valor={item.progresso} />
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '600' }}>
              {rotuloProgresso(item)}
              {item.tags ? `  ·  ${listaTags(item.tags).map((t) => `#${t}`).join(' ')}` : ''}
            </Text>
          </Card>
        )}
      />
      {obras.length > 0 && (
        <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center', paddingBottom: 8 }}>
          Segure um item para removê-lo
        </Text>
      )}
    </View>
  );
}
