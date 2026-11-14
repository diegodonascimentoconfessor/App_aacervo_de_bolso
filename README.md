# Acervo de Bolso

App pessoal **offline-first** para leitura, estudo e consulta de obras densas.
React Native + Expo (Expo Router, TypeScript) + `expo-sqlite`.

## Rodando

```bash
npm install
npx expo install --fix      # alinha todas as versões ao SDK instalado
```

O leitor de PDF (`react-native-pdf`) usa módulos nativos, então o app roda em
**development build**, não no Expo Go:

```bash
# Opção A – local (precisa de Android Studio / SDK)
npx expo run:android

# Opção B – nuvem, gera um APK de desenvolvimento
npm i -g eas-cli && eas login
eas build --profile development --platform android
# instale o APK e depois:
npx expo start --dev-client
```

> Leitura de Markdown, banco, busca, notas e links funcionam em qualquer ambiente;
> só o leitor de PDF exige o build nativo (no Expo Go aparece um aviso).

## Estrutura

```
app/
  _layout.tsx          SQLiteProvider (initDb + seed) e Stack
  (tabs)/
    _layout.tsx        4 abas (Bottom Tabs)
    index.tsx          Início: Continuar lendo, Pílula do dia, busca global
    acervo.tsx         Fichamentos em Markdown + filtro por categoria
    estante.tsx        Obras importadas (PDF/MD)
    fontes.tsx         Acervos públicos + adicionar link
  texto/[id].tsx       Detalhe do fichamento + Nota de Margem
  leitor/[id].tsx      Leitor integrado (salva progresso)
components/            ui, CategoryChips, FormModal, ImportarObra,
                       AdicionarFonte, LeitorPdf, LeitorMarkdown
database/db.ts         Schema, migração por user_version, queries
database/seed.ts       3 fichamentos + 7 acervos públicos
constants/             theme (cores) e categorias fixas
```

## Notas técnicas

- Arquivos importados são copiados para `documentDirectory/obras/`; o banco guarda
  só o nome do arquivo (o caminho absoluto pode mudar no iOS entre atualizações).
- Usei `expo-file-system/legacy` (API `documentDirectory`, `copyAsync`…), que é a
  que você pediu. Se quiser migrar para a API nova (`File`, `Directory`, `Paths`),
  só `ImportarObra.tsx`, `LeitorMarkdown.tsx` e `db.ts` mudam.
- Progresso: PDF salva página/total; Markdown salva a posição de rolagem e o %.
  Ambos gravam com debounce e de novo ao sair do leitor.
- Novas migrações: incremente `DB_VERSION` em `database/db.ts` e adicione
  `if (atual < 2) { ... }` em `initDb`.
