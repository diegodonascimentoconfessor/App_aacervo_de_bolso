import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';

export default function AnimatedSplash({ onFim }: { onFim: () => void }) {
  const linha = useRef(new Animated.Value(0)).current;
  const t1 = useRef(new Animated.Value(0)).current;
  const t2 = useRef(new Animated.Value(0)).current;
  const saida = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const entrada = (v: Animated.Value) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });

    Animated.sequence([
      Animated.timing(linha, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.stagger(250, [entrada(t1), entrada(t2)]),
      Animated.delay(900),
      Animated.timing(saida, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onFim();
    });
  }, []);

  const sobe = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, s.tela, { opacity: saida }]}>
      <View style={s.centro}>
        <Animated.View style={[s.linha, { transform: [{ scaleX: linha }] }]} />
        <Animated.Text style={[s.titulo, sobe(t1)]}>Acervo</Animated.Text>
        <Animated.Text style={[s.subtitulo, sobe(t2)]}>de Bolso</Animated.Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  tela: { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', zIndex: 99 },
  centro: { alignItems: 'center' },
  linha: { width: 64, height: 3, borderRadius: 2, backgroundColor: colors.accent, marginBottom: 22 },
  titulo: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtitulo: {
    color: colors.accent,
    fontFamily: fonts.serif,
    fontSize: 24,
    fontStyle: 'italic',
    marginTop: 2,
    letterSpacing: 4,
  },
});