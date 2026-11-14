import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import Markdown from 'react-native-markdown-display';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '@/constants/theme';
import { caminhoObra, Obra, salvarProgressoScroll } from '@/database/db';
import { markdownStyles } from './markdownStyles';
import { Progress } from './ui';

export default function LeitorMarkdown({ obra }: { obra: Obra }) {
  const db = useSQLiteContext();
  const [texto, setTexto] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [progresso, setProgresso] = useState(obra.progresso);
  const scrollRef = useRef<ScrollView>(null);
  const dims = useRef({ content: 0, layout: 0, restaurado: false });
  const ultimo = useRef({ y: obra.posicao_scroll, prog: obra.progresso });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    FileSystem.readAsStringAsync(caminhoObra(obra.arquivo))
      .then(setTexto)
      .catch((e) => setErro(String(e)));
  }, [obra.arquivo]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      salvarProgressoScroll(db, obra.id, ultimo.current.y, ultimo.current.prog).catch(() => {});
    };
  }, [db, obra.id]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const h = e.nativeEvent.contentSize.height;
    const l = e.nativeEvent.layoutMeasurement.height;
    const prog = h - l > 0 ? y / (h - l) : 1;
    setProgresso(prog);
    ultimo.current = { y, prog };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      salvarProgressoScroll(db, obra.id, y, prog).catch(() => {});
    }, 600);
  };

  if (erro) return <Text style={{ color: colors.danger, padding: 20 }}>Não foi possível abrir o arquivo: {erro}</Text>;
  if (texto === null) return <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        scrollEventThrottle={100}
        onScroll={onScroll}
        onLayout={(e) => (dims.current.layout = e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => {
          dims.current.content = h;
          if (!dims.current.restaurado) {
            dims.current.restaurado = true;
            if (obra.posicao_scroll > 0) scrollRef.current?.scrollTo({ y: obra.posicao_scroll, animated: false });
          }
        }}
      >
        <Markdown style={markdownStyles}>{texto}</Markdown>
      </ScrollView>
      <View style={{ padding: 12, gap: 6, backgroundColor: colors.surface }}>
        <Progress valor={progresso} />
        <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center' }}>
          {Math.round(progresso * 100)}% lido
        </Text>
      </View>
    </View>
  );
}
