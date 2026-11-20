import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { ATUALIZAR_A_CADA_MS, CATEGORIAS_NOTICIA, CategoriaNoticia, ROTACAO_MS } from '@/constants/noticias';
import { colors, fonts, radius, space } from '@/constants/theme';
import { abrirLinkSeguro } from '@/lib/seguranca';
import {
  atualizarNoticias,
  garantirTabelaNoticias,
  lerNoticias,
  Noticia,
  tempoRelativo,
} from '@/lib/rss';

const GAP = 12;
const ALTURA = 220;

function Cartao({ n, largura }: { n: Noticia; largura: number }) {
  const [imgOk, setImgOk] = useState(true);
  const temImagem = !!n.imagem && imgOk;
  return (
    <Pressable
      onPress={() => {
        abrirLinkSeguro(n.link);
      }}
      style={[s.card, { width: largura }]}
    >
      {temImagem && (
        <Image
          source={{ uri: n.imagem! }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setImgOk(false)}
        />
      )}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: temImagem ? 'rgba(13,13,13,0.66)' : 'transparent' },
        ]}
      />
      <View style={s.cardConteudo}>
        <View style={s.pill}>
          <Text style={s.pillTxt}>{n.categoria}</Text>
        </View>
        <View style={{ gap: 6 }}>
          <Text style={s.titulo} numberOfLines={temImagem || !n.resumo ? 4 : 3}>
            {n.titulo}
          </Text>
          {!temImagem && !!n.resumo && (
            <Text style={s.resumo} numberOfLines={2}>
              {n.resumo}
            </Text>
          )}
          <Text style={s.fonte}>
            {n.fonte} · {tempoRelativo(n.publicado_em)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function NoticiasCarrossel() {
  const db = useSQLiteContext();
  const { width } = useWindowDimensions();
  const largura = width - space.lg * 2;
  const passo = largura + GAP;

  const [filtro, setFiltro] = useState<CategoriaNoticia | null>(null);
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [indice, setIndice] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [offline, setOffline] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState<number | null>(null);

  const listRef = useRef<FlatList<Noticia>>(null);
  const indiceRef = useRef(0);
  const pausadoRef = useRef(false);
  const pausaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recarregar = useCallback(async () => {
    await garantirTabelaNoticias(db);
    setNoticias(await lerNoticias(db, filtro));
  }, [db, filtro]);

  const sincronizar = useCallback(async () => {
    setSincronizando(true);
    try {
      const { ok } = await atualizarNoticias(db);
      setOffline(ok === 0);
      if (ok > 0) setAtualizadoEm(Date.now());
    } catch {
      setOffline(true);
    } finally {
      setSincronizando(false);
    }
    await recarregar();
  }, [db, recarregar]);

  const sincronizarRef = useRef(sincronizar);
  sincronizarRef.current = sincronizar;

  // Mostra o cache na hora e reinicia o carrossel ao trocar o filtro
  useEffect(() => {
    recarregar();
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    indiceRef.current = 0;
    setIndice(0);
  }, [recarregar]);

  // Busca ao abrir e depois a cada 10 minutos, enquanto o app está aberto
  useEffect(() => {
    sincronizarRef.current();
    const t = setInterval(() => sincronizarRef.current(), ATUALIZAR_A_CADA_MS);
    return () => clearInterval(t);
  }, []);

  // Avanço automático
  useEffect(() => {
    if (noticias.length < 2) return;
    const t = setInterval(() => {
      if (pausadoRef.current) return;
      const prox = (indiceRef.current + 1) % noticias.length;
      listRef.current?.scrollToOffset({ offset: prox * passo, animated: true });
      indiceRef.current = prox;
      setIndice(prox);
    }, ROTACAO_MS);
    return () => clearInterval(t);
  }, [noticias.length, passo]);

  useEffect(() => () => {
    if (pausaTimer.current) clearTimeout(pausaTimer.current);
  }, []);

  const aoParar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / passo);
    indiceRef.current = i;
    setIndice(i);
    if (pausaTimer.current) clearTimeout(pausaTimer.current);
    pausaTimer.current = setTimeout(() => (pausadoRef.current = false), 5000);
  };

  const status = sincronizando
    ? 'Atualizando…'
    : offline
      ? 'Offline · mostrando as últimas salvas'
      : atualizadoEm
        ? `Atualizado ${tempoRelativo(atualizadoEm)}`
        : '';

  return (
    <View style={{ gap: 10 }}>
      <View style={s.cabecalho}>
        <Text style={s.secao}>Em pauta</Text>
        <Pressable onPress={sincronizar} hitSlop={10} disabled={sincronizando}>
          <Text style={s.status}>{status ? `${status}  ↻` : '↻'}</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[null, ...CATEGORIAS_NOTICIA].map((c) => {
          const ativo = c === filtro;
          return (
            <Pressable key={c ?? 'tudo'} onPress={() => setFiltro(c)} style={[s.chip, ativo && s.chipAtivo]}>
              <Text style={[s.chipTxt, ativo && { color: '#0D0D0D' }]}>{c ?? 'Tudo'}</Text>
            </Pressable>
          );
        })}
      </View>

      {noticias.length === 0 ? (
        <View style={[s.card, { width: largura, alignItems: 'center', justifyContent: 'center' }]}>
          {sincronizando ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={{ color: colors.muted, textAlign: 'center', padding: 20, lineHeight: 22 }}>
              Sem notícias salvas ainda. Conecte-se à internet e toque em ↻ para carregar.
            </Text>
          )}
        </View>
      ) : (
        <>
          <FlatList
            ref={listRef}
            data={noticias}
            keyExtractor={(n) => n.link}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={passo}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
            renderItem={({ item }) => <Cartao n={item} largura={largura} />}
            onScrollBeginDrag={() => (pausadoRef.current = true)}
            onMomentumScrollEnd={aoParar}
          />
          <View style={s.pontos}>
            {noticias.map((n, i) => (
              <View key={n.link} style={[s.ponto, i === indice && s.pontoAtivo]} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secao: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  status: { color: colors.muted, fontSize: 11 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipTxt: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  card: {
    height: ALTURA,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardConteudo: { flex: 1, padding: space.md + 2, justifyContent: 'space-between' },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillTxt: { color: '#0D0D0D', fontSize: 11, fontWeight: '800' },
  titulo: { color: colors.text, fontFamily: fonts.serif, fontSize: 19, fontWeight: '700', lineHeight: 25 },
  resumo: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  fonte: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  pontos: { flexDirection: 'row', justifyContent: 'center', gap: 5, flexWrap: 'wrap' },
  ponto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  pontoAtivo: { width: 18, backgroundColor: colors.accent },
});
