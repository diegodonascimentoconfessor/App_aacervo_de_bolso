export type ArtigoSeed = {
  titulo: string;
  autor: string;
  categoria: string;
  tags: string;
  resumo: string;
  conteudo_md: string;
};

export type FonteSeed = {
  titulo: string;
  url: string;
  categoria: string;
  descricao: string;
};

export const ARTIGOS_SEED: ArtigoSeed[] = [
  {
    titulo: 'A Alegoria da Caverna',
    autor: 'Platão',
    categoria: 'Filosofia Grega & Clássica',
    tags: 'platão, república, epistemologia, teoria das ideias',
    resumo:
      'Prisioneiros acorrentados confundem sombras com a realidade. A ascensão ao mundo exterior é a imagem do caminho da alma até o conhecimento verdadeiro.',
    conteudo_md: `# A Alegoria da Caverna

**Fonte:** *A República*, Livro VII · **Autor:** Platão (c. 380 a.C.)

## Ideia central

Platão descreve prisioneiros que, desde a infância, vivem acorrentados numa caverna, de costas para a entrada. Atrás deles arde um fogo; entre o fogo e os prisioneiros passam objetos carregados por pessoas. Tudo o que os prisioneiros veem são as **sombras** projetadas na parede, e é isso que tomam por realidade.

## As etapas

1. **Sombras** — o mundo das opiniões e das aparências (*doxa*).
2. **Libertação** — um prisioneiro é solto e se volta para o fogo; a luz ofende os olhos e o novo ponto de vista desorienta.
3. **Ascensão** — arrastado para fora, ele vê primeiro os reflexos, depois as coisas em si e, por fim, o **Sol**.
4. **Retorno** — ao voltar para libertar os outros, é ridicularizado e rejeitado.

## Leitura filosófica

- O Sol representa a **Ideia do Bem**, fonte da verdade e da inteligibilidade.
- A passagem da caverna ao exterior é a imagem da **educação** como conversão da alma (*periagogé*), e não como simples transmissão de informação.
- O mundo sensível é cópia imperfeita do mundo inteligível das Ideias.
- Há uma dimensão política: quem viu a verdade tem o dever de voltar à cidade, mesmo correndo risco.

## Pontos de atenção

- A alegoria condensa a **teoria das Ideias**, a **epistemologia** (linha dividida) e a **ética** da *República* em uma única imagem.
- É comum ler a morte de Sócrates como pano de fundo da cena do retorno.

## Para aprofundar

Ler em sequência a *linha dividida* (Livro VI) e o *Mito de Er* (Livro X).`,
  },
  {
    titulo: 'A Condição Pós-Moderna e o fim das metanarrativas',
    autor: 'Jean-François Lyotard',
    categoria: 'Filosofia Moderna & Pós-Moderna',
    tags: 'lyotard, pós-modernidade, metanarrativas, saber, performatividade',
    resumo:
      'Para Lyotard, a pós-modernidade se define pela descrença nas grandes narrativas de legitimação do saber e pela pluralidade de jogos de linguagem.',
    conteudo_md: `# A Condição Pós-Moderna

**Obra:** *A Condição Pós-Moderna* (1979) · **Autor:** Jean-François Lyotard

## Contexto

Lyotard escreve um relatório sobre o estado do **saber** nas sociedades mais desenvolvidas, a pedido do governo de Quebec. O texto acaba se tornando referência para o debate sobre a pós-modernidade.

## Tese principal

A pós-modernidade é caracterizada pela **incredulidade em relação às metanarrativas**: grandes relatos que davam sentido e legitimidade ao conhecimento e à história, como o progresso do Iluminismo, a emancipação do proletariado ou a dialética do Espírito.

## Conceitos-chave

- **Metanarrativa** — discurso totalizante que legitima instituições, práticas e o próprio saber científico.
- **Jogos de linguagem** — herança de Wittgenstein: cada tipo de discurso tem regras próprias, sem um metadiscurso que os unifique.
- **Performatividade** — o saber passa a ser avaliado por sua eficácia (input/output), e não por sua verdade ou por seu valor emancipatório.
- **Paralogia** — a busca de instabilidades e dissensos como motor da inovação, em vez do consenso.

## Computadores e mercado do saber

O conhecimento vira informação traduzível em linguagem de máquina e passa a ser produzido para ser **vendido e consumido**. O Estado e as empresas disputam o controle desses fluxos.

## Críticas frequentes

- Habermas contesta que a razão comunicativa ainda sustenta um projeto inacabado da modernidade.
- Há quem aponte contradição: afirmar o fim das metanarrativas seria já uma metanarrativa.

## Para aprofundar

Comparar com Foucault (saber-poder) e Baudrillard (simulacros).`,
  },
  {
    titulo: 'O Pivô Geográfico da História e a teoria do Heartland',
    autor: 'Halford Mackinder',
    categoria: 'Geopolítica',
    tags: 'mackinder, heartland, eurásia, poder terrestre, poder marítimo',
    resumo:
      'Mackinder propõe que o interior da Eurásia é a área-pivô do poder mundial: quem a controlasse teria vantagem decisiva sobre as potências marítimas.',
    conteudo_md: `# O Pivô Geográfico da História

**Texto:** *The Geographical Pivot of History* (1904) · **Autor:** Halford J. Mackinder, geógrafo britânico

## Contexto

Mackinder fala à Royal Geographical Society no fim da chamada **era colombiana**, quando o mapa-múndi já estava praticamente todo explorado e dividido. Dali em diante, argumenta, cada conflito local reverbera no sistema global.

## A proposta

- A **área-pivô** é o vasto interior da Eurásia, de difícil acesso para a marinha e, com as **ferrovias**, cada vez mais integrável pelo poder terrestre.
- Em volta dela fica o **crescente interno** (Europa Central, Oriente Médio, Índia, China), e mais além o **crescente externo** (Grã-Bretanha, Japão, Américas, Austrália).
- A revolução nos transportes terrestres enfraqueceria a vantagem histórica do poder marítimo.

## Desenvolvimento posterior

Em *Democratic Ideals and Reality* (1919), Mackinder rebatiza a área-pivô como **Heartland** e resume a ideia numa cadeia de comando: controlar a Europa Oriental leva ao controle do Heartland, deste à **Ilha-Mundo** (Eurásia + África) e, por fim, ao domínio mundial.

## Influência

- Inspirou a escola alemã de **Geopolítica** (Haushofer) e, em oposição, a estratégia de **contenção** na Guerra Fria.
- Contrasta com Mahan (poder marítimo) e Spykman (*Rimland*).

## Limites

- Subestima o poder aéreo, nuclear e cibernético.
- Tem forte viés determinista geográfico.`,
  },
];

export const FONTES_SEED: FonteSeed[] = [
  {
    titulo: 'Stanford Encyclopedia of Philosophy',
    url: 'https://plato.stanford.edu',
    categoria: 'Filosofia Grega & Clássica',
    descricao: 'Enciclopédia acadêmica de acesso aberto, com verbetes revisados por especialistas.',
  },
  {
    titulo: 'Project Gutenberg',
    url: 'https://www.gutenberg.org',
    categoria: 'Filosofia Moderna & Pós-Moderna',
    descricao: 'Biblioteca de obras em domínio público, com muitos clássicos da filosofia moderna.',
  },
  {
    titulo: 'Domínio Público (MEC)',
    url: 'http://www.dominiopublico.gov.br',
    categoria: 'História',
    descricao: 'Biblioteca digital do Ministério da Educação com obras, teses e documentos em português.',
  },
  {
    titulo: 'Internet Archive',
    url: 'https://archive.org',
    categoria: 'História',
    descricao: 'Acervo de livros, periódicos e documentos históricos digitalizados.',
  },
  {
    titulo: 'FUNAG',
    url: 'https://www.gov.br/funag/pt-br',
    categoria: 'Geopolítica',
    descricao: 'Fundação Alexandre de Gusmão: publicações sobre relações internacionais e política externa.',
  },
  {
    titulo: 'SciELO',
    url: 'https://www.scielo.org',
    categoria: 'Geopolítica',
    descricao: 'Biblioteca eletrônica de periódicos científicos de acesso aberto.',
  },
  {
    titulo: 'arXiv',
    url: 'https://arxiv.org',
    categoria: 'Tecnologia & Computação',
    descricao: 'Repositório aberto de preprints em computação, matemática e física.',
  },
];
