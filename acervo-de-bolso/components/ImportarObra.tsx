import { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useSQLiteContext } from 'expo-sqlite';
import { CATEGORIAS } from '@/constants/categorias';
import { colors } from '@/constants/theme';
import { DIR_OBRAS, garantirDiretorioObras, inserirObra } from '@/database/db';
import { semExtensao } from '@/lib/format';
import CategoryChips from './CategoryChips';
import FormModal from './FormModal';
import { Botao, Campo } from './ui';

type Rascunho = { uri: string; nomeOriginal: string; tipo: 'pdf' | 'md' };

function detectarTipo(nome: string): 'pdf' | 'md' | null {
  const n = nome.toLowerCase();
  if (n.endsWith('.pdf')) return 'pdf';
  if (n.endsWith('.md') || n.endsWith('.markdown') || n.endsWith('.txt')) return 'md';
  return null;
}

export default function ImportarObra({ onImportada }: { onImportada: () => void }) {
  const db = useSQLiteContext();
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [categoria, setCategoria] = useState<string | null>(CATEGORIAS[0]);
  const [tags, setTags] = useState('');
  const [salvando, setSalvando] = useState(false);
  const salvandoRef = useRef(false);

  const fechar = () => {
    if (salvandoRef.current) return;
    setRascunho(null);
  };

  async function escolher() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Android reporta .md de formas inconsistentes; validamos pela extensão
        copyToCacheDirectory: false,
        multiple: false,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      const tipo = detectarTipo(asset.name);
      if (!tipo) {
        Alert.alert('Formato não suportado', 'Escolha um arquivo .pdf, .md ou .txt.');
        return;
      }
      setTitulo(semExtensao(asset.name).replace(/[_-]+/g, ' ').trim());
      setAutor('');
      setTags('');
      setCategoria(CATEGORIAS[0]);
      setRascunho({ uri: asset.uri, nomeOriginal: asset.name, tipo });
    } catch {
      Alert.alert('Não foi possível selecionar', 'Tente escolher o arquivo novamente.');
    }
  }

  async function salvar() {
    if (!rascunho || salvandoRef.current) return;
    if (!titulo.trim()) return Alert.alert('Informe o título da obra.');
    if (!categoria) return Alert.alert('Escolha uma categoria.');
    salvandoRef.current = true;
    setSalvando(true);
    try {
      await garantirDiretorioObras();
      const seguro = rascunho.nomeOriginal.replace(/[^a-zA-Z0-9._-]/g, '_');
      const arquivo = `${Date.now()}_${seguro}`;
      const destino = DIR_OBRAS + arquivo;
      try {
        await FileSystem.copyAsync({ from: rascunho.uri, to: destino });
      } catch {
        // plano B: lê em base64 e grava (funciona com content://)
        const b64 = await FileSystem.readAsStringAsync(rascunho.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await FileSystem.writeAsStringAsync(destino, b64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
      await inserirObra(db, {
        titulo: titulo.trim(),
        autor: autor.trim(),
        categoria,
        tags: tags.trim(),
        arquivo,
        tipo: rascunho.tipo,
      });
      setRascunho(null);
      onImportada();
    } catch {
      Alert.alert('Não foi possível importar', 'Verifique se o arquivo está acessível e tente novamente.');
    } finally {
      salvandoRef.current = false;
      setSalvando(false);
    }
  }

  return (
    <>
      <Botao titulo="+ Importar Obra (PDF / Markdown)" onPress={escolher} />
      <FormModal
        visible={!!rascunho}
        titulo="Nova obra"
        onClose={fechar}
        onSalvar={salvar}
        rotuloSalvar={salvando ? 'Salvando…' : 'Importar'}
      >
        <Text style={{ color: colors.muted }}>
          Arquivo: {rascunho?.nomeOriginal} ({rascunho?.tipo === 'pdf' ? 'PDF' : 'Markdown/Texto'})
        </Text>
        <Campo label="Título" value={titulo} onChangeText={setTitulo} />
        <Campo label="Autor" value={autor} onChangeText={setAutor} placeholder="Opcional" />
        <View style={{ gap: 6, marginHorizontal: -20 }}>
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600', marginLeft: 20 }}>
            Categoria
          </Text>
          <CategoryChips todas={false} value={categoria} onChange={setCategoria} />
        </View>
        <Campo
          label="Tags (separadas por vírgula)"
          value={tags}
          onChangeText={setTags}
          placeholder="ex.: ética, aristóteles"
          autoCapitalize="none"
        />
      </FormModal>
    </>
  );
}
