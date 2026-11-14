import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '@/constants/theme';
import { caminhoObra, Obra, salvarProgressoPdf } from '@/database/db';
import { Progress } from './ui';

const noExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// No Expo Go o módulo nativo não existe: nem tentamos carregar.
let Pdf: any = null;
if (!noExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Pdf = require('react-native-pdf').default;
  } catch {
    Pdf = null;
  }
}

export default function LeitorPdf({ obra }: { obra: Obra }) {
  const db = useSQLiteContext();
  const inicial = obra.pagina_atual || 1; // constante: não força "pulos" de página
  const [pagina, setPagina] = useState(inicial);
  const [total, setTotal] = useState(obra.total_paginas);
  const ultimo = useRef({ p: inicial, t: obra.total_paginas });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const agendarSalvar = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      salvarProgressoPdf(db, obra.id, ultimo.current.p, ultimo.current.t).catch(() => {});
    }, 600);
  };

  // Ao sair do leitor, grava imediatamente a última página vista
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      salvarProgressoPdf(db, obra.id, ultimo.current.p, ultimo.current.t).catch(() => {});
    };
  }, [db, obra.id]);

  if (!Pdf) {
    return (
      <View style={s.aviso}>
        <Text style={s.avisoTitulo}>Leitor de PDF indisponível</Text>
        <Text style={s.avisoTxt}>
          O leitor de PDF usa módulos nativos e não roda no Expo Go. Gere um development build
          (veja o README: npx expo run:android ou EAS Build) e abra o app por ele.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Pdf
        source={{ uri: caminhoObra(obra.arquivo), cache: false }}
        page={inicial}
        style={{ flex: 1, backgroundColor: colors.bg }}
        onLoadComplete={(n: number) => {
          setTotal(n);
          ultimo.current.t = n;
          agendarSalvar();
        }}
        onPageChanged={(p: number, n: number) => {
          setPagina(p);
          setTotal(n);
          ultimo.current = { p, t: n };
          agendarSalvar();
        }}
        onError={(e: unknown) => console.warn('Erro no PDF', e)}
      />
      <View style={s.rodape}>
        <Text style={s.rodapeTxt}>
          Página {pagina}
          {total > 0 ? ` de ${total}` : ''}
        </Text>
        <Progress valor={total > 0 ? pagina / total : 0} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  rodape: { padding: 12, gap: 8, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  rodapeTxt: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  aviso: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center', gap: 10 },
  avisoTitulo: { color: colors.text, fontSize: 18, fontWeight: '700' },
  avisoTxt: { color: colors.muted, fontSize: 15, lineHeight: 22 },
});
