import type { SQLiteDatabase } from 'expo-sqlite';
import {
  CATEGORIAS_NOTICIA,
  CategoriaNoticia,
  Feed,
  FEEDS,
  POR_CATEGORIA,
} from '@/constants/noticias';

export type Noticia = {
  link: string;
  titulo: string;
  resumo: string;
  imagem: string | null;
  fonte: string;
  categoria: CategoriaNoticia;
  publicado_em: number;
};

/* ---------- Parser RSS/Atom (sem dependências) ---------- */

const ENTIDADES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  hellip: '…', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
};

const decodificar = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTIDADES[n.toLowerCase()] ?? m);

const semCdata = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

function pegarTag(xml: string, nome: string): string {
  const m = xml.match(new RegExp(`<${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</${nome}>`, 'i'));
  return m ? semCdata(m[1]).trim() : '';
}

const textoLimpo = (html: string) =>
  decodificar(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function pegarImagem(bloco: string): string | null {
  const decodificado = decodificar(semCdata(bloco));
  const candidatos = [
    bloco.match(/<media:(?:thumbnail|content)[^>]*\burl=["']([^"']+)["']/i)?.[1],
    bloco.match(/<enclosure[^>]*\burl=["']([^"']+)["'][^>]*type=["']image/i)?.[1],
    bloco.match(/<enclosure[^>]*type=["']image[^"']*["'][^>]*\burl=["']([^"']+)["']/i)?.[1],
    decodificado.match(/<img[^>]*\bsrc=["']([^"']+)["']/i)?.[1],
  ];
  const url = candidatos.find(Boolean);
  if (!url) return null;
  const limpa = decodificar(url).replace(/^http:\/\//i, 'https://'); // Android bloqueia http puro
  return /^https:\/\//i.test(limpa) ? limpa : null;
}

function pegarLink(bloco: string): string {
  const texto = pegarTag(bloco, 'link');
  if (/^https?:\/\//i.test(texto)) return texto;
  const atom = bloco.match(/<link[^>]*\bhref=["']([^"']+)["']/i)?.[1];
  if (atom) return decodificar(atom);
  const guid = pegarTag(bloco, 'guid');
  return /^https?:\/\//i.test(guid) ? guid : '';
}

function interpretar(xml: string, feed: Feed): Noticia[] {
  const blocos =
    xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  const agora = Date.now();
  const saida: Noticia[] = [];
  for (const b of blocos.slice(0, 8)) {
    const titulo = textoLimpo(pegarTag(b, 'title'));
    const link = pegarLink(b).replace(/^http:\/\//i, 'https://');
    if (!titulo || !link) continue;
    const bruto = pegarTag(b, 'description') || pegarTag(b, 'summary') || pegarTag(b, 'content:encoded');
    let resumo = textoLimpo(bruto);
    if (resumo.length > 180) resumo = resumo.slice(0, 177).trimEnd() + '…';
    const data = Date.parse(
      pegarTag(b, 'pubDate') || pegarTag(b, 'published') || pegarTag(b, 'updated') || pegarTag(b, 'dc:date')
    );
    saida.push({
      link,
      titulo,
      resumo,
      imagem: pegarImagem(b),
      fonte: feed.nome,
      categoria: feed.categoria,
      publicado_em: Number.isNaN(data) ? agora : Math.min(data, agora),
    });
  }
  return saida;
}

async function baixarFeed(feed: Feed): Promise<Noticia[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(feed.url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return interpretar(await r.text(), feed);
  } finally {
    clearTimeout(t);
  }
}

/* ---------- Cache offline no SQLite ---------- */

export async function garantirTabelaNoticias(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS noticias_cache (
      link TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      resumo TEXT NOT NULL DEFAULT '',
      imagem TEXT,
      fonte TEXT NOT NULL,
      categoria TEXT NOT NULL,
      publicado_em INTEGER NOT NULL,
      buscado_em INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_noticias_cat ON noticias_cache(categoria, publicado_em DESC);
  `);
}

/** Lê as notícias salvas, intercalando as categorias (ou só a categoria escolhida). */
export async function lerNoticias(db: SQLiteDatabase, categoria: CategoriaNoticia | null) {
  const cats = categoria ? [categoria] : CATEGORIAS_NOTICIA;
  const listas = await Promise.all(
    cats.map((c) =>
      db.getAllAsync<Noticia>(
        `SELECT link, titulo, resumo, imagem, fonte, categoria, publicado_em
           FROM noticias_cache WHERE categoria = ? ORDER BY publicado_em DESC LIMIT ?`,
        [c, POR_CATEGORIA]
      )
    )
  );
  const saida: Noticia[] = [];
  for (let i = 0; i < POR_CATEGORIA; i++) for (const l of listas) if (l[i]) saida.push(l[i]);
  return saida;
}

/** Busca todos os feeds em paralelo e salva. Retorna quantos feeds responderam. */
export async function atualizarNoticias(db: SQLiteDatabase) {
  await garantirTabelaNoticias(db);
  const resultados = await Promise.allSettled(FEEDS.map(baixarFeed));
  const agora = Date.now();
  let ok = 0;
  await db.withTransactionAsync(async () => {
    for (const r of resultados) {
      if (r.status !== 'fulfilled') continue;
      ok++;
      for (const n of r.value) {
        await db.runAsync(
          `INSERT OR REPLACE INTO noticias_cache
             (link, titulo, resumo, imagem, fonte, categoria, publicado_em, buscado_em)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [n.link, n.titulo, n.resumo, n.imagem, n.fonte, n.categoria, n.publicado_em, agora]
        );
      }
    }
    await db.runAsync('DELETE FROM noticias_cache WHERE publicado_em < ?', [agora - 14 * 86400000]);
  });
  return { ok, total: FEEDS.length };
}

export function tempoRelativo(ts: number): string {
  const min = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (min < 2) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.round(h / 24)} d`;
}
