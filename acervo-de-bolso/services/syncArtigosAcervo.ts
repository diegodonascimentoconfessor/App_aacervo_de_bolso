import type { SQLiteDatabase } from 'expo-sqlite';
import { getArtigo, salvarNotaMargem } from '@/database/db';
import { limparMarkdownExterno } from '@/lib/seguranca';

/**
 * Artigos dinâmicos da aba Acervo.
 * - Os textos clássicos embutidos continuam na tabela `artigos` (intocada, com as notas de margem).
 * - Os artigos do dia (Wikipédia PT + OpenAlex) ficam na tabela `artigos_acervo`, salvos para uso offline.
 * - Uma vez por dia, em segundo plano, sem chave de API e sem alertas se estiver sem internet.
 */

/* ---------- Tipos ---------- */

export type ItemAcervo = {
  /** Usado na rota /texto/[id]: "12" = texto clássico; "d34" = artigo dinâmico. */
  chave: string;
  origem: 'fixo' | 'dinamico';
  titulo: string;
  autor: string;
  categoria: string;
  tags: string;
  resumo: string;
  nota_margem: string;
};

export type ArtigoLeitura = {
  chave: string;
  titulo: string;
  autor: string;
  categoria: string;
  conteudo_md: string;
  nota_margem: string;
  url_externa: string | null;
};

type NovoArtigo = {
  chave: string; // identificador único para evitar duplicatas
  categoria: string;
  titulo: string;
  autor: string;
  resumo: string;
  conteudo: string;
  tags: string[];
  url: string | null;
};

/* ---------- Tabelas ---------- */

export async function garantirTabelasAcervo(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS artigos_acervo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chave TEXT NOT NULL UNIQUE,
      categoria TEXT NOT NULL,
      titulo TEXT NOT NULL,
      autor TEXT NOT NULL DEFAULT '',
      resumo TEXT NOT NULL DEFAULT '',
      conteudo_completo TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      url_externa TEXT,
      data_sincronizacao TEXT NOT NULL,
      criado_em INTEGER NOT NULL,
      fixo INTEGER NOT NULL DEFAULT 0,
      nota_margem TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_artigos_acervo_cat ON artigos_acervo(categoria, criado_em DESC);
    CREATE TABLE IF NOT EXISTS acervo_sync_meta (chave TEXT PRIMARY KEY, valor TEXT NOT NULL);
  `);
}

async function lerMeta(db: SQLiteDatabase, chave: string) {
  const r = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM acervo_sync_meta WHERE chave = ?', [chave]);
  return r?.valor ?? null;
}
const gravarMeta = (db: SQLiteDatabase, chave: string, valor: string) =>
  db.runAsync('INSERT OR REPLACE INTO acervo_sync_meta (chave, valor) VALUES (?, ?)', [chave, valor]);

/* ---------- Leitura unificada (dinâmicos do dia + clássicos base) ---------- */

export async function listarAcervo(db: SQLiteDatabase, categoria: string | null): Promise<ItemAcervo[]> {
  await garantirTabelasAcervo(db);
  const [din, fix] = await Promise.all([
    categoria
      ? db.getAllAsync<any>(
          'SELECT id, titulo, autor, categoria, tags, resumo, nota_margem FROM artigos_acervo WHERE categoria = ? ORDER BY criado_em DESC LIMIT 120',
          [categoria]
        )
      : db.getAllAsync<any>(
          'SELECT id, titulo, autor, categoria, tags, resumo, nota_margem FROM artigos_acervo ORDER BY criado_em DESC LIMIT 120'
        ),
    categoria
      ? db.getAllAsync<any>(
          'SELECT id, titulo, autor, categoria, tags, resumo, nota_margem FROM artigos WHERE categoria = ? ORDER BY titulo',
          [categoria]
        )
      : db.getAllAsync<any>('SELECT id, titulo, autor, categoria, tags, resumo, nota_margem FROM artigos ORDER BY titulo'),
  ]);
  return [
    ...din.map((a): ItemAcervo => ({ ...a, chave: `d${a.id}`, origem: 'dinamico' })),
    ...fix.map((a): ItemAcervo => ({ ...a, chave: String(a.id), origem: 'fixo' })),
  ];
}

export async function lerArtigoAcervo(db: SQLiteDatabase, chave: string): Promise<ArtigoLeitura | null> {
  if (chave.startsWith('d')) {
    await garantirTabelasAcervo(db);
    const a = await db.getFirstAsync<any>('SELECT * FROM artigos_acervo WHERE id = ?', [Number(chave.slice(1))]);
    if (!a) return null;
    return {
      chave,
      titulo: a.titulo,
      autor: a.autor,
      categoria: a.categoria,
      conteudo_md: a.conteudo_completo || a.resumo,
      nota_margem: a.nota_margem,
      url_externa: a.url_externa,
    };
  }
  const a = await getArtigo(db, Number(chave));
  if (!a) return null;
  return {
    chave,
    titulo: a.titulo,
    autor: a.autor,
    categoria: a.categoria,
    conteudo_md: a.conteudo_md,
    nota_margem: a.nota_margem,
    url_externa: null,
  };
}

export async function salvarNotaAcervo(db: SQLiteDatabase, chave: string, nota: string) {
  if (chave.startsWith('d')) {
    await db.runAsync('UPDATE artigos_acervo SET nota_margem = ? WHERE id = ?', [nota, Number(chave.slice(1))]);
  } else {
    await salvarNotaMargem(db, Number(chave), nota);
  }
}

/* ---------- Utilidades ---------- */

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const diaDoAno = (d: Date) =>
  Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000);

async function baixarJson(url: string, ms = 9000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json', 'Api-User-Agent': 'AcervoDeBolso/1.0 (app pessoal de estudo)' },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

const corta = (s: unknown, n: number) => {
  const t = (typeof s === 'string' ? s : s == null ? '' : String(s)).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
};
const urlHttps = (u: unknown) => (typeof u === 'string' && /^https:\/\/\S+$/i.test(u) ? u : null);

// Mantém a taxonomia fixa do app: todo artigo cai em uma das 5 categorias.
function classificar(texto: string, padrao: string): string {
  const t = texto.toLowerCase();
  if (/platão|aristótel|sócrates|estoic|epicur|pré-socr|filosofia antiga|filosofia grega|helenismo/.test(t))
    return 'Filosofia Grega & Clássica';
  if (/filosof|ontolog|epistem|metafísic|existencialis|fenomenolog|nietzsche|kant|descartes|foucault|sartre|hermenêutic/.test(t))
    return 'Filosofia Moderna & Pós-Moderna';
  if (/geopol|relações internacionais|nações unidas|otan|diplomac|soberania|sanções|blocos econ|política externa|fronteira/.test(t))
    return 'Geopolítica';
  if (/computa|informátic|software|internet|algoritm|inteligência artificial|criptograf|linguagem de programação|blockchain|cibern/.test(t))
    return 'Tecnologia & Computação';
  return padrao;
}

// Texto simples da Wikipédia -> Markdown (títulos "== X ==" viram "## X") e sem seções de rodapé.
function paraMarkdown(txt: string, limite = 7000): string {
  const corte = txt.search(/^==+\s*(Ver também|Referências|Ligações externas|Notas|Bibliografia|Notas e referências|Leitura adicional)\s*==+\s*$/im);
  let t = corte > 200 ? txt.slice(0, corte) : txt;
  t = t.replace(/^=+\s*(.+?)\s*=+\s*$/gm, '## $1').replace(/\n{3,}/g, '\n\n').trim();
  if (t.length > limite) {
    const ate = t.lastIndexOf('\n\n', limite);
    t = t.slice(0, ate > limite * 0.6 ? ate : limite).trimEnd() + '…';
  }
  return t;
}

async function textoCompletoWikipedia(titulo: string): Promise<string | null> {
  try {
    const j = await baixarJson(
      `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&format=json&formatversion=2&origin=*&titles=${encodeURIComponent(titulo)}`
    );
    const t = j?.query?.pages?.[0]?.extract;
    return typeof t === 'string' && t.length > 200 ? paraMarkdown(t) : null;
  } catch {
    return null;
  }
}

/* ---------- Fonte 1: Wikipédia PT (artigo em destaque + "neste dia") ---------- */

async function buscarWikipediaDestaque(hoje: Date): Promise<NovoArtigo[]> {
  const ontem = new Date(hoje.getTime() - 86400000);
  let j: any = null;
  let erro: unknown = null;
  for (const d of [hoje, ontem]) {
    try {
      j = await baixarJson(
        `https://pt.wikipedia.org/api/rest_v1/feed/featured/${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
      );
      break;
    } catch (e) {
      erro = e;
    }
  }
  if (!j) throw erro ?? new Error('feed indisponível');

  const saida: NovoArtigo[] = [];

  const tfa = j.tfa;
  if (tfa && (tfa.extract || tfa.description)) {
    const titulo: string = tfa.titles?.normalized ?? tfa.normalizedtitle ?? String(tfa.title ?? '').replace(/_/g, ' ');
    if (titulo) {
      const resumo = corta(tfa.extract ?? tfa.description, 320);
      const completo = (await textoCompletoWikipedia(titulo)) ?? (tfa.extract as string) ?? resumo;
      saida.push({
        chave: `wiki:tfa:${titulo}`,
        categoria: classificar(`${titulo} ${tfa.description ?? ''} ${resumo}`, 'História'),
        titulo,
        autor: 'Wikipédia · Artigo em destaque do dia',
        resumo,
        conteudo: `# ${titulo}\n\n${completo}`,
        tags: ['wikipédia', 'destaque do dia'],
        url: urlHttps(tfa.content_urls?.desktop?.page),
      });
    }
  }

  const eventos: any[] = Array.isArray(j.onthisday) ? j.onthisday.filter((e: any) => e?.text) : [];
  eventos.slice(0, 3).forEach((e, i) => {
    const ano = e.year != null ? String(e.year) : '';
    const paginas: any[] = Array.isArray(e.pages) ? e.pages.slice(0, 2) : [];
    const detalhes = paginas
      .filter((p) => p?.extract)
      .map((p) => `**${p.titles?.normalized ?? String(p.title ?? '').replace(/_/g, ' ')}** — ${corta(p.extract, 500)}`)
      .join('\n\n');
    saida.push({
      chave: `wiki:otd:${iso(hoje)}:${i}`,
      categoria: classificar(`${e.text} ${detalhes}`, 'História'),
      titulo: corta(ano ? `Neste dia, ${ano}: ${e.text}` : String(e.text), 110),
      autor: 'Wikipédia · Neste dia na história',
      resumo: corta(e.text, 320),
      conteudo: `# Neste dia${ano ? `, ${ano}` : ''}\n\n${e.text}${detalhes ? `\n\n## Para entender melhor\n\n${detalhes}` : ''}`,
      tags: ['wikipédia', 'neste dia', ano].filter(Boolean),
      url: urlHttps(paginas[0]?.content_urls?.desktop?.page),
    });
  });

  return saida;
}

/* ---------- Fonte 2: rotação diária de temas (Wikipédia PT) ---------- */

const GREGA = 'Filosofia Grega & Clássica';
const MODERNA = 'Filosofia Moderna & Pós-Moderna';
const TEMAS: { tema: string; categoria: string }[] = [
  { tema: 'Sócrates', categoria: GREGA }, { tema: 'Platão', categoria: GREGA }, { tema: 'Aristóteles', categoria: GREGA },
  { tema: 'Estoicismo', categoria: GREGA }, { tema: 'Epicurismo', categoria: GREGA }, { tema: 'Heráclito', categoria: GREGA },
  { tema: 'Parmênides', categoria: GREGA }, { tema: 'Pitágoras', categoria: GREGA }, { tema: 'Filosofia_antiga', categoria: GREGA },
  { tema: 'René_Descartes', categoria: MODERNA }, { tema: 'Immanuel_Kant', categoria: MODERNA }, { tema: 'Friedrich_Nietzsche', categoria: MODERNA },
  { tema: 'Michel_Foucault', categoria: MODERNA }, { tema: 'Jean-Paul_Sartre', categoria: MODERNA }, { tema: 'Hannah_Arendt', categoria: MODERNA },
  { tema: 'Baruch_Spinoza', categoria: MODERNA }, { tema: 'David_Hume', categoria: MODERNA }, { tema: 'Existencialismo', categoria: MODERNA },
  { tema: 'Fenomenologia', categoria: MODERNA }, { tema: 'Pós-modernidade', categoria: MODERNA }, { tema: 'Iluminismo', categoria: MODERNA },
  { tema: 'Revolução_Francesa', categoria: 'História' }, { tema: 'Revolução_Industrial', categoria: 'História' }, { tema: 'Império_Romano', categoria: 'História' },
  { tema: 'Idade_Média', categoria: 'História' }, { tema: 'Renascimento', categoria: 'História' }, { tema: 'Primeira_Guerra_Mundial', categoria: 'História' },
  { tema: 'Segunda_Guerra_Mundial', categoria: 'História' }, { tema: 'Queda_do_Muro_de_Berlim', categoria: 'História' }, { tema: 'Revolução_Russa', categoria: 'História' },
  { tema: 'Império_Bizantino', categoria: 'História' }, { tema: 'Grécia_Antiga', categoria: 'História' },
  { tema: 'Geopolítica', categoria: 'Geopolítica' }, { tema: 'Guerra_Fria', categoria: 'Geopolítica' }, { tema: 'Nações_Unidas', categoria: 'Geopolítica' },
  { tema: 'OTAN', categoria: 'Geopolítica' }, { tema: 'União_Europeia', categoria: 'Geopolítica' }, { tema: 'BRICS', categoria: 'Geopolítica' },
  { tema: 'Mercosul', categoria: 'Geopolítica' }, { tema: 'Halford_Mackinder', categoria: 'Geopolítica' }, { tema: 'Relações_internacionais', categoria: 'Geopolítica' },
  { tema: 'Oriente_Médio', categoria: 'Geopolítica' },
  { tema: 'Inteligência_artificial', categoria: 'Tecnologia & Computação' }, { tema: 'Aprendizado_de_máquina', categoria: 'Tecnologia & Computação' },
  { tema: 'Internet', categoria: 'Tecnologia & Computação' }, { tema: 'Criptografia', categoria: 'Tecnologia & Computação' },
  { tema: 'Computação_quântica', categoria: 'Tecnologia & Computação' }, { tema: 'Algoritmo', categoria: 'Tecnologia & Computação' },
  { tema: 'Alan_Turing', categoria: 'Tecnologia & Computação' }, { tema: 'Sistema_operacional', categoria: 'Tecnologia & Computação' },
  { tema: 'Segurança_da_informação', categoria: 'Tecnologia & Computação' }, { tema: 'Banco_de_dados', categoria: 'Tecnologia & Computação' },
];

async function buscarTemasDoDia(hoje: Date): Promise<NovoArtigo[]> {
  const dia = diaDoAno(hoje);
  const indices = [dia % TEMAS.length, (dia + Math.floor(TEMAS.length / 2)) % TEMAS.length]; // dois temas de áreas diferentes por dia
  const res = await Promise.allSettled(
    indices.map(async (i): Promise<NovoArtigo | null> => {
      const { tema, categoria } = TEMAS[i];
      const s = await baixarJson(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(tema)}`);
      if (!s?.extract || s.type === 'disambiguation') return null;
      const titulo: string = s.titles?.normalized ?? String(s.title ?? tema).replace(/_/g, ' ');
      const completo = (await textoCompletoWikipedia(titulo)) ?? s.extract;
      return {
        chave: `wiki:tema:${tema}`,
        categoria,
        titulo,
        autor: 'Wikipédia · Tema do dia',
        resumo: corta(s.extract, 320),
        conteudo: `# ${titulo}\n\n${completo}`,
        tags: ['wikipédia', 'tema do dia', corta(String(s.description ?? ''), 40).toLowerCase()].filter(Boolean),
        url: urlHttps(s.content_urls?.desktop?.page),
      };
    })
  );
  if (res.every((r) => r.status === 'rejected')) throw new Error('temas indisponíveis');
  return res.flatMap((r) => (r.status === 'fulfilled' && r.value ? [r.value] : []));
}

/* ---------- Fonte 3: OpenAlex (artigos acadêmicos recentes) ---------- */

function reconstruirResumo(inv: Record<string, number[]> | null | undefined): string {
  if (!inv) return '';
  const palavras: string[] = [];
  for (const [palavra, posicoes] of Object.entries(inv)) for (const p of posicoes) palavras[p] = palavra;
  return palavras.filter(Boolean).join(' ');
}

async function buscarOpenAlex(hoje: Date): Promise<NovoArtigo[]> {
  const j = await baixarJson(
    `https://api.openalex.org/works?search=philosophy+OR+geopolitics&filter=has_abstract:true,to_publication_date:${iso(hoje)}&sort=publication_date:desc&per-page=6`
  );
  const saida: NovoArtigo[] = [];
  for (const w of Array.isArray(j?.results) ? j.results : []) {
    const titulo = corta(String(w?.title ?? w?.display_name ?? ''), 200);
    const resumo = reconstruirResumo(w?.abstract_inverted_index);
    const id = typeof w?.id === 'string' ? w.id.split('/').pop() : '';
    if (!titulo || !resumo || !id) continue;

    const autores: string[] = (Array.isArray(w.authorships) ? w.authorships : [])
      .map((a: any) => a?.author?.display_name)
      .filter(Boolean);
    const autor = autores.length === 0 ? 'Autor não informado' : autores.slice(0, 3).join(', ') + (autores.length > 3 ? ' et al.' : '');

    const topicos: string[] = (Array.isArray(w.topics) && w.topics.length ? w.topics : Array.isArray(w.concepts) ? w.concepts : [])
      .map((t: any) => String(t?.display_name ?? '').toLowerCase())
      .filter(Boolean)
      .slice(0, 4);

    const padrao = /philosoph/i.test(`${titulo} ${topicos.join(' ')}`) ? MODERNA : 'Geopolítica';
    const url = urlHttps(w?.primary_location?.landing_page_url) ?? urlHttps(w?.doi) ?? urlHttps(w?.id);
    const data = typeof w.publication_date === 'string' ? w.publication_date : '';

    saida.push({
      chave: `oa:${id}`,
      categoria: classificar(`${titulo} ${topicos.join(' ')}`, padrao),
      titulo,
      autor,
      resumo: corta(resumo, 320),
      conteudo: `# ${titulo}\n\n**Autores:** ${autor}${data ? `  \n**Publicado em:** ${data}` : ''}\n\n## Resumo\n\n${resumo}\n\n> Artigo científico indexado pelo OpenAlex (resumo em geral no idioma original).`,
      tags: topicos.length ? topicos : ['openalex'],
      url,
    });
  }
  return saida;
}

/* ---------- Sincronização diária ---------- */

const ouvintes = new Set<() => void>();
/** A tela do Acervo se inscreve para recarregar a lista quando chegarem artigos novos. */
export const aoMudarAcervo = (cb: () => void) => {
  ouvintes.add(cb);
  return () => {
    ouvintes.delete(cb);
  };
};

export type ResultadoAcervo = 'atualizado' | 'ja-sincronizado' | 'sem-novidade' | 'offline';

let emAndamento = false;

/** Silenciosa: nunca lança erro e nunca bloqueia a interface. Roda no máximo uma vez por dia com sucesso. */
export async function sincronizarArtigosAcervo(db: SQLiteDatabase, forcar = false): Promise<ResultadoAcervo> {
  if (emAndamento) return 'ja-sincronizado';
  emAndamento = true;
  try {
    await garantirTabelasAcervo(db);
    const agora = new Date();
    const hoje = iso(agora);
    if (!forcar) {
      if ((await lerMeta(db, 'ultima_sync')) === hoje) return 'ja-sincronizado';
      const tentativa = Number((await lerMeta(db, 'ultima_tentativa')) ?? 0);
      if (Date.now() - tentativa < 10 * 60 * 1000) return 'ja-sincronizado'; // evita insistir sem internet
    }
    await gravarMeta(db, 'ultima_tentativa', String(Date.now()));

    const res = await Promise.allSettled([buscarWikipediaDestaque(agora), buscarTemasDoDia(agora), buscarOpenAlex(agora)]);
    const ok = res.filter((r): r is PromiseFulfilledResult<NovoArtigo[]> => r.status === 'fulfilled');
    if (ok.length === 0) return 'offline'; // sem internet (ou APIs fora do ar): mantém o que já está salvo

    const novos = ok.flatMap((r) => r.value);
    let inseridos = 0;
    const base = Date.now();
    await db.withTransactionAsync(async () => {
      for (let i = 0; i < novos.length; i++) {
        const a = novos[i];
        const r = await db.runAsync(
          `INSERT OR IGNORE INTO artigos_acervo
             (chave, categoria, titulo, autor, resumo, conteudo_completo, tags, url_externa, data_sincronizacao, criado_em, fixo)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [a.chave, a.categoria, a.titulo, a.autor, a.resumo, limparMarkdownExterno(a.conteudo), a.tags.join(', '), a.url, hoje, base + (novos.length - i)]
        );
        inseridos += r.changes;
      }
      // Mantém só os 300 mais recentes (nunca apaga os que têm nota de margem)
      await db.runAsync(
        `DELETE FROM artigos_acervo WHERE nota_margem = '' AND id NOT IN
           (SELECT id FROM artigos_acervo ORDER BY criado_em DESC LIMIT 300)`
      );
    });

    await gravarMeta(db, 'ultima_sync', hoje);
    if (inseridos > 0) {
      ouvintes.forEach((cb) => cb());
      return 'atualizado';
    }
    return 'sem-novidade';
  } catch {
    return 'offline';
  } finally {
    emAndamento = false;
  }
}
