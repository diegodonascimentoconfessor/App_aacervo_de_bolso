import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import Markdown from 'react-native-markdown-display';
import { markdownStyles } from '@/components/markdownStyles';
import { Botao, inputStyle, Pill } from '@/components/ui';
import { colors } from '@/constants/theme';
import { abrirLinkSeguro } from '@/lib/seguranca';
import { ArtigoLeitura, lerArtigoAcervo, salvarNotaAcervo } from '@/services/syncArtigosAcervo';

export default function Texto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [artigo, setArtigo] = useState<ArtigoLeitura | null>(null);
  const [nota, setNota] = useState('');
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    lerArtigoAcervo(db, String(id))
      .then((a) => {
        setArtigo(a);
        setNota(a?.nota_margem ?? '');
      })
      .catch(() => setArtigo(null));
  }, [db, id]);

  if (!artigo) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        <Pill texto={artigo.categoria} />
        <Text style={{ color: colors.muted, marginTop: 8 }}>{artigo.autor}</Text>
        <Markdown
          style={markdownStyles}
          onLinkPress={(url) => {
            abrirLinkSeguro(url);
            return false;
          }}
        >
          {artigo.conteudo_md}
        </Markdown>

        {!!artigo.url_externa && (
          <View style={{ marginTop: 16 }}>
            <Botao
              titulo="Ler fonte original"
              variante="secundario"
              onPress={() => {
                abrirLinkSeguro(artigo.url_externa);
              }}
            />
          </View>
        )}

        <View style={{ marginTop: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 }}>
          <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '700' }}>Nota de Margem</Text>
          <TextInput
            value={nota}
            onChangeText={(t) => {
              setNota(t);
              setSalvo(false);
            }}
            placeholder="Escreva sua anotação pessoal sobre este texto…"
            placeholderTextColor={colors.muted}
            selectionColor={colors.accent}
            multiline
            style={[inputStyle, { minHeight: 120, textAlignVertical: 'top', lineHeight: 22 }]}
          />
          <Botao
            titulo={salvo ? 'Nota salva ✓' : 'Salvar nota'}
            onPress={async () => {
              await salvarNotaAcervo(db, artigo.chave, nota.trim());
              setSalvo(true);
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
