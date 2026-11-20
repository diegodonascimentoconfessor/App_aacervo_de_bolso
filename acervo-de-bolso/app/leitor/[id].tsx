import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import LeitorMarkdown from '@/components/LeitorMarkdown';
import LeitorPdf from '@/components/LeitorPdf';
import { Vazio } from '@/components/ui';
import { colors } from '@/constants/theme';
import { getObra, Obra, tocarObra } from '@/database/db';

export default function Leitor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [obra, setObra] = useState<Obra | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    (async () => {
      const o = await getObra(db, Number(id));
      if (o) await tocarObra(db, o.id); // marca como "última obra aberta"
      setObra(o);
      setCarregado(true);
    })();
  }, [db, id]);

  if (!carregado) return <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />;
  if (!obra) return <Vazio texto="Obra não encontrada." />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: obra.titulo }} />
      {obra.tipo === 'pdf' ? <LeitorPdf obra={obra} /> : <LeitorMarkdown obra={obra} />}
    </View>
  );
}
