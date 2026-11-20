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

## Novidades
- Animação de abertura (`components/AnimatedSplash.tsx`) e splash nativo escuro.
- Carrossel "Em pauta" na tela Início com notícias de filosofia, cultura e geopolítica
  (RSS, cache offline). Fontes em `constants/noticias.ts`.
- Importação de obras copia direto do arquivo original (sem cache do seletor).
- No Expo Go o leitor de PDF mostra um aviso; use development build para ler PDF.

## Apoio ao estudo
- Rádio (`components/RadioEstudo.tsx`, estações em `constants/radios.ts`): streaming via `expo-audio`, toca em segundo plano.
- Pesquisa (`components/PesquisaGoogle.tsx`): web, PDF (`filetype:pdf`) e Google Acadêmico, na aba Acervos Públicos.
- Vídeos (`components/VideosCurados.tsx`, lista em `constants/videos.ts`).
- Áudio em segundo plano e redução do APK exigem novo build (plugins `expo-audio` e `expo-build-properties` no `app.json`).

## Catálogo dinâmico (etapa 2)
- `catalogo.json` (raiz do repositório) é baixado do GitHub ao abrir o app, ao voltar a ele e a cada 30 min.
  Rádios, pílulas, vídeos, podcasts e acervos extras são salvos no SQLite (`cache_*`) e funcionam offline.
- Serviço: `services/syncCatalogo.ts`. Leitura na interface: `hooks/useCatalogo.ts`. Player único: `lib/audioGlobal.ts`.
- Para publicar novidades: edite `catalogo.json` no GitHub e aumente `versaoCatalogo`.
- `versaoMinimaApp`: apps mais antigos ignoram o catálogo e mantêm o cache.
- O repositório precisa ser público para o endereço raw.githubusercontent.com funcionar.

## Acervo dinâmico (etapa 3)
- `services/syncArtigosAcervo.ts`: 1x por dia (ao abrir o app ou entrar na aba Acervo), busca em segundo plano
  artigo em destaque + "neste dia" + 2 temas rotativos da Wikipédia PT e 6 artigos recentes do OpenAlex (sem chave de API).
- Tabela `artigos_acervo` (cache offline). Os textos clássicos continuam na tabela `artigos` e aparecem junto, abaixo dos novos.
- Sem internet, a aba Acervo mostra o que já está salvo, sem alertas.

## Segurança
- Sem segredos no código. SQL parametrizado (única interpolação: `PRAGMA user_version`, constante inteira).
- Dados externos (catálogo, RSS, APIs) validados por tipo e aceitos só com `https://` (`lib/seguranca.ts`).
- Markdown vindo da internet perde imagens remotas, links clicáveis e HTML; links abrem só se forem https.
- Permissões desnecessárias bloqueadas no `app.json` (`blockedPermissions`); sem `usesCleartextTraffic`.

## Atualizações do código (EAS Update)
- `eas.json`: perfil `preview` com canal `preview`. Publique com `eas update --channel preview --message "..."`.
- `components/AvisoAtualizacao.tsx`: baixa a atualização em segundo plano e mostra "Atualização disponível — Reiniciar agora".
- Antes do APK: `npm install`, `npx expo install --fix` e `eas update:configure` (grava o projectId da sua conta no app.json).
