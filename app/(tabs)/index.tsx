import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as WebBrowser from 'expo-web-browser';
import NoticiasCarrossel from '@/components/NoticiasCarrossel';
import { Botao, Card, inputStyle, Pill, Progress, SectionTitle, Vazio } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { Artigo, artigoAleatorio, buscar, Obra, Resultado, ultimaObraAberta } from '@/database/db';
import { rotuloProgresso } from '@/lib/format';

export default function Inicio() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [ultima, setUltima] = useState<Obra | null>(null);
  const [pilula, setPilula] = useState<Artigo | null>(null);
  const [termo, setTermo] = useState('');
  const [res, setRes] = useState<Resultado | null>(null);

  useFocusEffect(
    useCallback(() => {
      ultimaObraAberta(db).then(setUltima);
    }, [db])
  );

  const sortear = useCallback(async () => {
    const a = await artigoAleatorio(db, pilula?.id);
    if (a) setPilula(a);
  }, [db, pilula?.id]);

  useEffect(() => {
    artigoAleatorio(db).then((a) => a && setPilula(a));
  }, [db]);

  // Busca global com debounce
  useEffect(() => {
    if (termo.trim().length < 2) {
      setRes(null);
      return;
    }
    const t = setTimeout(() => buscar(db, termo).then(setRes), 250);
    return () => clearTimeout(t);
  }, [termo, db]);

  const abrirArtigo = (id: number) => router.push({ pathname: '/texto/[id]', params: { id: String(id) } });
  const abrirObra = (id: number) => router.push({ pathname: '/leitor/[id]', params: { id: String(id) } });
  const abrirLink = (url: string) =>
    WebBrowser.openBrowserAsync(url, { toolbarColor: colors.bg, controlsColor: colors.accent });

  const total = res ? res.artigos.length + res.obras.length + res.fontes.length : 0;

  return (
    <ScrollView
      contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <TextInput
        value={termo}
        onChangeText={setTermo}
        placeholder="Buscar por título, autor ou tag…"
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        autoCorrect={false}
        style={inputStyle}
      />

      {res ? (
        total === 0 ? (
          <Vazio texto={`Nada encontrado para “${termo.trim()}”.`} />
        ) : (
          <View style={{ gap: space.sm }}>
            {res.artigos.length > 0 && <SectionTitle>Acervo</SectionTitle>}
            {res.artigos.map((a) => (
              <Card key={`a${a.id}`} onPress={() => abrirArtigo(a.id)}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{a.titulo}</Text>
                <Text style={{ color: colors.muted }}>{a.autor}</Text>
              </Card>
            ))}
            {res.obras.length > 0 && <SectionTitle>Minha Estante</SectionTitle>}
            {res.obras.map((o) => (
              <Card key={`o${o.id}`} onPress={() => abrirObra(o.id)}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{o.titulo}</Text>
                <Text style={{ color: colors.muted }}>{o.autor || 'Autor não informado'}</Text>
              </Card>
            ))}
            {res.fontes.length > 0 && <SectionTitle>Acervos Públicos</SectionTitle>}
            {res.fontes.map((f) => (
              <Card key={`f${f.id}`} onPress={() => abrirLink(f.url)}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{f.titulo}</Text>
                <Text style={{ color: colors.muted }}>{f.categoria}</Text>
              </Card>
            ))}
          </View>
        )
      ) : (
        <>
          <NoticiasCarrossel />
          <SectionTitle>Continuar lendo</SectionTitle>
          {ultima ? (
            <Card onPress={() => abrirObra(ultima.id)} style={{ gap: 10 }}>
              <Pill texto={ultima.categoria} />
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{ultima.titulo}</Text>
              {!!ultima.autor && <Text style={{ color: colors.muted }}>{ultima.autor}</Text>}
              <Progress valor={ultima.progresso} />
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600' }}>
                {rotuloProgresso(ultima)}
              </Text>
            </Card>
          ) : (
            <Card>
              <Text style={{ color: colors.muted, lineHeight: 22 }}>
                Nenhuma leitura em andamento. Importe uma obra na aba Estante para começar.
              </Text>
            </Card>
          )}

          <SectionTitle>Pílula do dia</SectionTitle>
          {pilula && (
            <Card style={{ gap: 10 }}>
              <Pill texto={pilula.categoria} />
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{pilula.titulo}</Text>
              <Text style={{ color: colors.muted }}>{pilula.autor}</Text>
              <Text style={{ color: colors.text, fontSize: 16, lineHeight: 25 }}>{pilula.resumo}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                <View style={{ flex: 1 }}>
                  <Botao titulo="Ler" onPress={() => abrirArtigo(pilula.id)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Botao titulo="Sortear outro" variante="secundario" onPress={sortear} />
                </View>
              </View>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}
