import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const abas: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Início', icon: 'home-outline' },
  { name: 'acervo', title: 'Acervo', icon: 'library-outline' },
  { name: 'estante', title: 'Minha Estante', icon: 'albums-outline' },
  { name: 'fontes', title: 'Acervos Públicos', icon: 'globe-outline' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {abas.map((a) => (
        <Tabs.Screen
          key={a.name}
          name={a.name}
          options={{
            title: a.title,
            tabBarLabel: a.title === 'Acervos Públicos' ? 'Públicos' : a.title === 'Minha Estante' ? 'Estante' : a.title,
            tabBarIcon: ({ color, size }) => <Ionicons name={a.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
