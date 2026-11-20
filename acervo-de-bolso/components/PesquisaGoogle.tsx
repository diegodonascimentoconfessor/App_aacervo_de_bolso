import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { colors, radius, space } from '@/constants/theme';
import { temInternet } from '@/lib/rede';
import { Botao } from './ui';

type Modo = 'web' | 'pdf' | 'scholar';

const MODOS: { id: Modo; rotulo: string; dica: string }[] = [
  { id: 'web', rotulo: 'Web geral', dica: 'Pesquisa normal no Google.' },
  {
    id: 'pdf',
    rotulo: 'Baixar PDF',
    dica: 'Procura arquivos PDF. Baixe e use “+ Importar Obra” na Estante para ler offline.',
  },
  { id: 'scholar', rotulo: 'Acadêmico', dica: 'Artigos e trabalhos científicos no Google Acadêmico.' },
];

function montarUrl(modo: Modo, termo: string) {
  const q = termo.trim();
  if (modo === 'pdf') return `https://www.google.com/search?q=${encodeURIComponent(`${q} filetype:pdf`)}`;
  if (modo === 'scholar') return `https://scholar.google.com/scholar?q=${encodeURIComponent(q)}`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

export default function PesquisaGoogle() {
  const [termo, setTermo] = useState('');
  const [modo, setModo] = useState<Modo>('web');
  const [aviso, setAviso] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function pesquisar() {
    if (!termo.trim() || buscando) return;
    setAviso(null);
    setBuscando(true);
    try {
      if (!(await temInternet())) {
        setAviso('Sem conexão para pesquisar. Seus PDFs e notas locais continuam disponíveis.');
        return;
      }
      await WebBrowser.openBrowserAsync(montarUrl(modo, termo), {
        toolbarColor: colors.bg,
        controlsColor: colors.accent,
      });
    } catch {
      setAviso('Não foi possível abrir o navegador agora.');
    } finally {
      setBuscando(false);
    }
  }

  return (
    <View style={s.card}>
      <Text style={s.titulo}>Pesquisar na web</Text>
      <TextInput
        value={termo}
        onChangeText={setTermo}
        onSubmitEditing={pesquisar}
        returnKeyType="search"
        placeholder="Ex.: ética a nicômaco, geopolítica do Ártico…"
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        autoCorrect={false}
        style={s.input}
      />
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {MODOS.map((m) => {
          const ativo = m.id === modo;
          return (
            <Pressable key={m.id} onPress={() => setModo(m.id)} style={[s.chip, ativo && s.chipAtivo]}>
              <Text style={[s.chipTxt, ativo && { color: '#0D0D0D' }]}>{m.rotulo}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={s.dica}>{MODOS.find((m) => m.id === modo)?.dica}</Text>
      <Botao titulo={buscando ? 'Abrindo…' : 'Pesquisar'} onPress={pesquisar} disabled={!termo.trim() || buscando} />
      {!!aviso && <Text style={s.dica}>{aviso}</Text>}
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
    gap: 10,
  },
  titulo: { color: colors.text, fontSize: 16, fontWeight: '700' },
  input: {
    backgroundColor: colors.bg,
    color: colors.text,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: 15,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipTxt: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  dica: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
