import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '@/constants/theme';
import { Artigo, listarArtigos } from '@/database/db';
import { useCatalogo } from '@/hooks/useCatalogo';
import { Botao, Card, Pill } from './ui';

const INTERVALO_MS = 12000; // tempo de cada pílula na tela
const FADE_MS = 350;

type Item = {
  key: string;
  categoria: string;
  titulo: string;
  autor: string;
  resumo: string;
  reflexao?: string; // pílulas do catálogo
  artigoId?: number; // fichamentos do Acervo local
};

function embaralhar<T>(lista: T[]): T[] {
  const r = [...lista];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export default function PilulaDoDia({ onLer }: { onLer: (id: number) => void }) {
  const db = useSQLiteContext();
  const { pilulas } = useCatalogo();
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [fila, setFila] = useState<Item[]>([]);
  const [pos, setPos] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [focado, setFocado] = useState(true);
  const opacidade = useRef(new Animated.Value(1)).current;
  const trocando = useRef(false);

  useEffect(() => {
    listarArtigos(db, null).then(setArtigos).catch(() => {});
  }, [db]);

  // Fichamentos locais + pílulas do catálogo (que se atualizam sozinhas)
  useEffect(() => {
    const itens: Item[] = [
      ...artigos.map((a) => ({
        key: `a${a.id}`,
        categoria: a.categoria,
        titulo: a.titulo,
        autor: a.autor,
        resumo: a.resumo,
        artigoId: a.id,
      })),
      ...pilulas.map((p) => ({
        key: `p${p.id}`,
        categoria: p.categoria,
        titulo: p.titulo,
        autor: p.autor,
        resumo: p.resumo,
        reflexao: p.reflexao,
      })),
    ];
    setFila(embaralhar(itens));
    setPos(0);
  }, [artigos, pilulas]);

  // Só gira enquanto a aba Início está visível
  useFocusEffect(
    useCallback(() => {
      setFocado(true);
      return () => setFocado(false);
    }, [])
  );

  const proxima = useCallback(() => {
    if (fila.length < 2 || trocando.current) return;
    trocando.current = true;
    Animated.timing(opacidade, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() => {
      setAberto(false);
      setPos((p) => (p + 1) % fila.length);
      Animated.timing(opacidade, { toValue: 1, duration: FADE_MS, useNativeDriver: true }).start(() => {
        trocando.current = false;
      });
    });
  }, [fila.length, opacidade]);

  // Troca sozinha; pausa enquanto a reflexão está aberta; qualquer troca reinicia a contagem
  useEffect(() => {
    if (!focado || aberto || fila.length < 2) return;
    const t = setTimeout(proxima, INTERVALO_MS);
    return () => clearTimeout(t);
  }, [focado, aberto, fila.length, pos, proxima]);

  const atual = fila[pos];
  if (!atual) return null;

  return (
    <Card style={{ gap: 10 }}>
      <Animated.View style={{ opacity: opacidade, gap: 10 }}>
        <Pill texto={atual.categoria} />
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{atual.titulo}</Text>
        <Text style={{ color: colors.muted }}>{atual.autor}</Text>
        <Text style={{ color: colors.text, fontSize: 16, lineHeight: 25 }}>{atual.resumo}</Text>
        {aberto && !!atual.reflexao && (
          <Text style={{ color: colors.accent, fontSize: 15, lineHeight: 23, fontStyle: 'italic' }}>
            {atual.reflexao}
          </Text>
        )}
      </Animated.View>

      {fila.length > 1 && (
        <View style={s.pontos}>
          {fila.map((it, i) => (
            <View key={it.key} style={[s.ponto, i === pos && s.pontoAtivo]} />
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
        <View style={{ flex: 1 }}>
          {atual.artigoId != null ? (
            <Botao titulo="Ler" onPress={() => onLer(atual.artigoId!)} />
          ) : atual.reflexao ? (
            <Botao titulo={aberto ? 'Fechar' : 'Refletir'} onPress={() => setAberto((v) => !v)} />
          ) : null}
        </View>
        {fila.length > 1 && (
          <View style={{ flex: 1 }}>
            <Botao titulo="Próxima" variante="secundario" onPress={proxima} />
          </View>
        )}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  pontos: { flexDirection: 'row', justifyContent: 'center', gap: 5, flexWrap: 'wrap' },
  ponto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  pontoAtivo: { width: 18, backgroundColor: colors.accent },
});
