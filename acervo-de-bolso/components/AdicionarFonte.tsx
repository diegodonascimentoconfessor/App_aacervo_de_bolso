import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { CATEGORIAS } from '@/constants/categorias';
import { colors } from '@/constants/theme';
import { inserirFonte } from '@/database/db';
import CategoryChips from './CategoryChips';
import FormModal from './FormModal';
import { Botao, Campo } from './ui';

export default function AdicionarFonte({ onAdicionada }: { onAdicionada: () => void }) {
  const db = useSQLiteContext();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [url, setUrl] = useState('');
  const [categoria, setCategoria] = useState<string | null>(CATEGORIAS[0]);
  const [descricao, setDescricao] = useState('');

  const abrir = () => {
    setTitulo('');
    setUrl('');
    setDescricao('');
    setCategoria(CATEGORIAS[0]);
    setAberto(true);
  };

  async function salvar() {
    let u = url.trim();
    if (!titulo.trim() || !u) return Alert.alert('Preencha título e URL.');
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    if (!/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(u)) return Alert.alert('URL inválida.');
    if (!categoria) return Alert.alert('Escolha uma categoria.');
    await inserirFonte(db, { titulo: titulo.trim(), url: u, categoria, descricao: descricao.trim() });
    setAberto(false);
    onAdicionada();
  }

  return (
    <>
      <Botao titulo="+ Adicionar Link" onPress={abrir} variante="secundario" />
      <FormModal visible={aberto} titulo="Nova fonte" onClose={() => setAberto(false)} onSalvar={salvar}>
        <Campo label="Título" value={titulo} onChangeText={setTitulo} />
        <Campo
          label="URL"
          value={url}
          onChangeText={setUrl}
          placeholder="https://…"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <View style={{ gap: 6, marginHorizontal: -20 }}>
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600', marginLeft: 20 }}>
            Categoria
          </Text>
          <CategoryChips todas={false} value={categoria} onChange={setCategoria} />
        </View>
        <Campo label="Descrição" value={descricao} onChangeText={setDescricao} multiline />
      </FormModal>
    </>
  );
}
