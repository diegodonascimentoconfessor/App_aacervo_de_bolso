import { Suspense, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import AnimatedSplash from '@/components/AnimatedSplash';
import AvisoAtualizacao from '@/components/AvisoAtualizacao';
import SyncCatalogo from '@/components/SyncCatalogo';
import { colors } from '@/constants/theme';
import { initDb } from '@/database/db';

function Carregando() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export default function RootLayout() {
  const [splash, setSplash] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Suspense fallback={<Carregando />}>
        <SQLiteProvider databaseName="acervo.db" onInit={initDb} useSuspense>
          <StatusBar style="light" />
          <SyncCatalogo />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '600' },
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="texto/[id]" options={{ title: 'Texto', headerBackTitle: 'Voltar' }} />
            <Stack.Screen name="leitor/[id]" options={{ title: 'Leitor', headerBackTitle: 'Voltar' }} />
          </Stack>
        </SQLiteProvider>
      </Suspense>
      <AvisoAtualizacao />
      {splash && <AnimatedSplash onFim={() => setSplash(false)} />}
    </View>
  );
}
