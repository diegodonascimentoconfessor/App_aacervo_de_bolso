import Constants from 'expo-constants';
import type { SQLiteDatabase } from 'expo-sqlite';
import { decodificar, pegarTag, textoLimpo } from '@/lib/rss';

export const CATALOGO_URL =
  'https://raw.githubusercontent.com/diegodonascimentoconfessor/App_aacervo_de_bolso/main/catalogo.json';

/* ---------- Tipos ---------- */

export type RadioCat = { id: string; nomeCurto: string; nomeCompleto: string; categoria: string; streamUrl: string };
export type PilulaCat = { id: string; categoria: string; titulo: string; autor: string; resumo: string; reflexao: string };
export type VideoCat = { id: string; titulo: string; canal: string; categoria: string; duracao: string | null; youtubeId: string };
export type PodcastCat = { id: string; titulo: string; programa: string; categoria: string; duracao: string | null; audioUrl: string };
export type LinkCat = { id: string; categoria: string; titulo: string; descricao: string; url: string };
export type CatalogoLocal = {
  radios: RadioCat[];
  pilulas: PilulaCat[];
  videos: VideoCat[];
  podcasts: PodcastCat[];
  links: LinkCat[];
  versao: number;
};

type Feeds = {
  youtube: { channelId: string; canal: string; categoria: string }[];
  podcasts: { url: string; programa: string; categoria: string }[];
};
type CatalogoRemoto = Omit<CatalogoLocal, 'versao'> & { versao: number; versaoMinima: string; feeds: Feeds };

/* ---------- Validação (o JSON vem da internet: nada é confiado) ---------- */

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const idValido = (v: unknown) => (typeof v === 'string' && /^[\w.:-]{1,64}$/.test(v) ? v : '');
const urlHttps = (v: unknown) => {
  const s = texto(v, 500);
  return /^https:\/\/\S+$/i.test(s) ? s : '';
};
const urlAudio = (v: unknown) => {
  const s = texto(v, 600);
  return /^https:\/\/\S+$/i.test(s) ? s : ''; // somente https
};
const lista = (v: unknown, max: number): any[] => (Array.isArray(v) ? v.slice(0, max) : []);

function sanitizar(j: any): CatalogoRemoto | null {
  if (!j || typeof j !== 'object' || !Number.isFinite(j.versaoCatalogo)) return null;

  const radios: RadioCat[] = [];
  for (const r of lista(j.radios, 30)) {
    const x = {
      id: idValido(r?.id),
      nomeCurto: texto(r?.nomeCurto, 14),
      nomeCompleto: texto(r?.nomeCompleto, 60),
      categoria: texto(r?.categoria, 30),
      streamUrl: urlAudio(r?.streamUrl),
    };
    if (x.id && x.nomeCurto && x.streamUrl) radios.push({ ...x, nomeCompleto: x.nomeCompleto || x.nomeCurto });
  }

  const pilulas: PilulaCat[] = [];
  for (const p of lista(j.pilulasDoDia, 200)) {
    const x = {
      id: idValido(p?.id),
      categoria: texto(p?.categoria, 40),
      titulo: texto(p?.titulo, 120),
      autor: texto(p?.autor, 80),
      resumo: texto(p?.resumo, 300),
      reflexao: texto(p?.reflexao, 700),
    };
    if (x.id && x.titulo && x.resumo) pilulas.push(x);
  }

  const videos: VideoCat[] = [];
  for (const v of lista(j.videos, 100)) {
    const youtubeId = typeof v?.youtubeId === 'string' && /^[\w-]{11}$/.test(v.youtubeId) ? v.youtubeId : '';
    const titulo = texto(v?.titulo, 140);
    if (!youtubeId || !titulo) continue;
    videos.push({
      id: idValido(v?.id) || `yt:${youtubeId}`,
      titulo,
      canal: texto(v?.canal, 60),
      categoria: texto(v?.categoria, 30),
      duracao: texto(v?.duracao, 12) || null,
      youtubeId,
    });
  }

  const podcasts: PodcastCat[] = [];
  for (const p of lista(j.podcasts, 100)) {
    const audioUrl = urlAudio(p?.audioUrl);
    const titulo = texto(p?.titulo, 140);
    const id = idValido(p?.id);
    if (!audioUrl || !titulo || !id) continue;
    podcasts.push({
      id,
      titulo,
      programa: texto(p?.programa, 60),
      categoria: texto(p?.categoria, 30),
      duracao: texto(p?.duracao, 12) || null,
      audioUrl,
    });
  }

  const links: LinkCat[] = [];
  for (const l of lista(j.linksPublicos, 100)) {
    const url = urlHttps(l?.url);
    const titulo = texto(l?.titulo, 80);
    const id = idValido(l?.id);
    if (!url || !titulo || !id) continue;
    links.push({ id, categoria: texto(l?.categoria, 40) || 'História', titulo, descricao: texto(l?.descricao, 200), url });
  }

  const feeds: Feeds = { youtube: [], podcasts: [] };
  for (const f of lista(j.feedsYoutube, 10)) {
    if (typeof f?.channelId === 'string' && /^UC[\w-]{22}$/.test(f.channelId)) {
      feeds.youtube.push({ channelId: f.channelId, canal: texto(f?.canal, 60), categoria: texto(f?.categoria, 30) });
    }
  }
  for (const f of lista(j.feedsPodcast, 10)) {
    const url = urlHttps(f?.url);
    if (url) feeds.podcasts.push({ url, programa: texto(f?.programa, 60), categoria: texto(f?.categoria, 30) });
  }

  return {
    versao: j.versaoCatalogo,
    versaoMinima: texto(j.versaoMinimaApp, 20) || '0.0.0',
    radios,
    pilulas,
    videos,
    podcasts,
    links,
    feeds,
  };
}

export function compararVersoes(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

/* ---------- Tabelas no SQLite ---------- */

export async function garantirTabelasCatalogo(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cache_radios (
      id TEXT PRIMARY KEY, nome_curto TEXT NOT NULL, nome_completo TEXT NOT NULL,
      categoria TEXT NOT NULL DEFAULT '', stream_url TEXT NOT NULL, ordem INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS cache_pilulas (
      id TEXT PRIMARY KEY, categoria TEXT NOT NULL DEFAULT '', titulo TEXT NOT NULL,
      autor TEXT NOT NULL DEFAULT '', resumo TEXT NOT NULL, reflexao TEXT NOT NULL DEFAULT '', ordem INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS cache_videos (
      id TEXT PRIMARY KEY, titulo TEXT NOT NULL, canal TEXT NOT NULL DEFAULT '', categoria TEXT NOT NULL DEFAULT '',
      duracao TEXT, youtube_id TEXT NOT NULL, origem TEXT NOT NULL DEFAULT 'catalogo', ordem INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS cache_podcasts (
      id TEXT PRIMARY KEY, titulo TEXT NOT NULL, programa TEXT NOT NULL DEFAULT '', categoria TEXT NOT NULL DEFAULT '',
      duracao TEXT, audio_url TEXT NOT NULL, origem TEXT NOT NULL DEFAULT 'catalogo', ordem INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS cache_links (
      id TEXT PRIMARY KEY, categoria TEXT NOT NULL DEFAULT '', titulo TEXT NOT NULL,
      descricao TEXT NOT NULL DEFAULT '', url TEXT NOT NULL, ordem INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS catalogo_meta (chave TEXT PRIMARY KEY, valor TEXT NOT NULL);
  `);
}

async function lerMeta(db: SQLiteDatabase, chave: string) {
  const r = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM catalogo_meta WHERE chave = ?', [chave]);
  return r?.valor ?? null;
}
const gravarMeta = (db: SQLiteDatabase, chave: string, valor: string) =>
  db.runAsync('INSERT OR REPLACE INTO catalogo_meta (chave, valor) VALUES (?, ?)', [chave, valor]);

/** Leitura instantânea do que já está salvo (usada na abertura do app, sem rede). */
export async function lerCatalogo(db: SQLiteDatabase): Promise<CatalogoLocal> {
  await garantirTabelasCatalogo(db);
  const [radios, pilulas, videos, podcasts, links, versao] = await Promise.all([
    db.getAllAsync<any>('SELECT * FROM cache_radios ORDER BY ordem'),
    db.getAllAsync<any>('SELECT * FROM cache_pilulas ORDER BY ordem'),
    db.getAllAsync<any>('SELECT * FROM cache_videos ORDER BY ordem'),
    db.getAllAsync<any>('SELECT * FROM cache_podcasts ORDER BY ordem'),
    db.getAllAsync<any>('SELECT * FROM cache_links ORDER BY ordem'),
    lerMeta(db, 'versao'),
  ]);
  return {
    versao: Number(versao ?? 0),
    radios: radios.map((r) => ({
      id: r.id, nomeCurto: r.nome_curto, nomeCompleto: r.nome_completo, categoria: r.categoria, streamUrl: r.stream_url,
    })),
    pilulas: pilulas.map((p) => ({
      id: p.id, categoria: p.categoria, titulo: p.titulo, autor: p.autor, resumo: p.resumo, reflexao: p.reflexao,
    })),
    videos: videos.map((v) => ({
      id: v.id, titulo: v.titulo, canal: v.canal, categoria: v.categoria, duracao: v.duracao, youtubeId: v.youtube_id,
    })),
    podcasts: podcasts.map((p) => ({
      id: p.id, titulo: p.titulo, programa: p.programa, categoria: p.categoria, duracao: p.duracao, audioUrl: p.audio_url,
    })),
    links: links.map((l) => ({ id: l.id, categoria: l.categoria, titulo: l.titulo, descricao: l.descricao, url: l.url })),
  };
}

/* ---------- Aplicar catalogo.json ---------- */

async function aplicar(db: SQLiteDatabase, c: CatalogoRemoto) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM cache_radios');
    await db.runAsync('DELETE FROM cache_pilulas');
    await db.runAsync('DELETE FROM cache_links');
    await db.runAsync("DELETE FROM cache_videos WHERE origem = 'catalogo'");
    await db.runAsync("DELETE FROM cache_podcasts WHERE origem = 'catalogo'");
    let i = 0;
    for (const r of c.radios)
      await db.runAsync(
        'INSERT OR REPLACE INTO cache_radios (id, nome_curto, nome_completo, categoria, stream_url, ordem) VALUES (?,?,?,?,?,?)',
        [r.id, r.nomeCurto, r.nomeCompleto, r.categoria, r.streamUrl, i++]
      );
    i = 0;
    for (const p of c.pilulas)
      await db.runAsync(
        'INSERT OR REPLACE INTO cache_pilulas (id, categoria, titulo, autor, resumo, reflexao, ordem) VALUES (?,?,?,?,?,?,?)',
        [p.id, p.categoria, p.titulo, p.autor, p.resumo, p.reflexao, i++]
      );
    i = 0;
    for (const v of c.videos)
      await db.runAsync(
        "INSERT OR REPLACE INTO cache_videos (id, titulo, canal, categoria, duracao, youtube_id, origem, ordem) VALUES (?,?,?,?,?,?,'catalogo',?)",
        [v.id, v.titulo, v.canal, v.categoria, v.duracao, v.youtubeId, i++]
      );
    i = 0;
    for (const p of c.podcasts)
      await db.runAsync(
        "INSERT OR REPLACE INTO cache_podcasts (id, titulo, programa, categoria, duracao, audio_url, origem, ordem) VALUES (?,?,?,?,?,?,'catalogo',?)",
        [p.id, p.titulo, p.programa, p.categoria, p.duracao, p.audioUrl, i++]
      );
    i = 0;
    for (const l of c.links)
      await db.runAsync(
        'INSERT OR REPLACE INTO cache_links (id, categoria, titulo, descricao, url, ordem) VALUES (?,?,?,?,?,?)',
        [l.id, l.categoria, l.titulo, l.descricao, l.url, i++]
      );
    await gravarMeta(db, 'versao', String(c.versao));
  });
}

/* ---------- Feeds RSS (vídeos do YouTube e podcasts) ---------- */

async function baixarTexto(url: string, ms = 9000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(t);
  }
}

const hashCurto = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
};

function formatarDuracao(bruto: string): string | null {
  if (!bruto) return null;
  const partes = bruto.split(':').map((n) => parseInt(n, 10));
  if (partes.some((n) => Number.isNaN(n))) return null;
  const seg = partes.length === 1 ? partes[0] : partes.reduce((acc, n) => acc * 60 + n, 0);
  return seg > 0 ? `${Math.max(1, Math.round(seg / 60))} min` : null;
}

function interpretarYoutube(xml: string, f: Feeds['youtube'][number]): VideoCat[] {
  const saida: VideoCat[] = [];
  for (const b of (xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? []).slice(0, 6)) {
    const vid = pegarTag(b, 'yt:videoId');
    const titulo = textoLimpo(pegarTag(b, 'title')).slice(0, 140);
    if (/^[\w-]{11}$/.test(vid) && titulo) {
      saida.push({ id: `rss:${vid}`, titulo, canal: f.canal, categoria: f.categoria, duracao: null, youtubeId: vid });
    }
  }
  return saida;
}

function interpretarPodcast(xml: string, f: Feeds['podcasts'][number]): PodcastCat[] {
  const saida: PodcastCat[] = [];
  for (const b of (xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? []).slice(0, 5)) {
    const titulo = textoLimpo(pegarTag(b, 'title')).slice(0, 140);
    const enc = b.match(/<enclosure[^>]*\burl=["']([^"']+)["']/i)?.[1];
    const audio = enc ? decodificar(enc).replace(/^http:\/\//i, 'https://') : ''; // tenta https
    if (!titulo || !/^https:\/\/\S+$/i.test(audio)) continue;
    saida.push({
      id: `rss:${hashCurto(pegarTag(b, 'guid') || audio)}`,
      titulo,
      programa: f.programa,
      categoria: f.categoria,
      duracao: formatarDuracao(pegarTag(b, 'itunes:duration')),
      audioUrl: audio,
    });
  }
  return saida;
}

/** Atualiza os episódios/vídeos vindos de RSS. Só apaga os antigos se TODOS os feeds responderam. */
async function atualizarRss(db: SQLiteDatabase, feeds: Feeds): Promise<boolean> {
  let mudou = false;

  if (feeds.youtube.length > 0) {
    const res = await Promise.allSettled(
      feeds.youtube.map((f) =>
        baixarTexto(`https://www.youtube.com/feeds/videos.xml?channel_id=${f.channelId}`).then((x) => interpretarYoutube(x, f))
      )
    );
    const ok = res.filter((r): r is PromiseFulfilledResult<VideoCat[]> => r.status === 'fulfilled');
    if (ok.length > 0) {
      const existentes = new Set(
        (await db.getAllAsync<{ youtube_id: string }>("SELECT youtube_id FROM cache_videos WHERE origem = 'catalogo'")).map(
          (r) => r.youtube_id
        )
      );
      await db.withTransactionAsync(async () => {
        if (ok.length === res.length) await db.runAsync("DELETE FROM cache_videos WHERE origem = 'rss'");
        let i = 1000;
        for (const r of ok)
          for (const v of r.value) {
            if (existentes.has(v.youtubeId)) continue;
            await db.runAsync(
              "INSERT OR REPLACE INTO cache_videos (id, titulo, canal, categoria, duracao, youtube_id, origem, ordem) VALUES (?,?,?,?,?,?,'rss',?)",
              [v.id, v.titulo, v.canal, v.categoria, v.duracao, v.youtubeId, i++]
            );
          }
      });
      mudou = true;
    }
  }

  if (feeds.podcasts.length > 0) {
    const res = await Promise.allSettled(
      feeds.podcasts.map((f) => baixarTexto(f.url).then((x) => interpretarPodcast(x, f)))
    );
    const ok = res.filter((r): r is PromiseFulfilledResult<PodcastCat[]> => r.status === 'fulfilled');
    if (ok.length > 0) {
      await db.withTransactionAsync(async () => {
        if (ok.length === res.length) await db.runAsync("DELETE FROM cache_podcasts WHERE origem = 'rss'");
        let i = 1000;
        for (const r of ok)
          for (const p of r.value)
            await db.runAsync(
              "INSERT OR REPLACE INTO cache_podcasts (id, titulo, programa, categoria, duracao, audio_url, origem, ordem) VALUES (?,?,?,?,?,?,'rss',?)",
              [p.id, p.titulo, p.programa, p.categoria, p.duracao, p.audioUrl, i++]
            );
      });
      mudou = true;
    }
  }
  return mudou;
}

/* ---------- Sincronização ---------- */

const ouvintes = new Set<() => void>();
/** A interface se inscreve aqui para recarregar quando o cache mudar. */
export const aoMudarCatalogo = (cb: () => void) => {
  ouvintes.add(cb);
  return () => {
    ouvintes.delete(cb);
  };
};
const notificar = () => ouvintes.forEach((cb) => cb());

export type ResultadoSync = 'atualizado' | 'sem-novidade' | 'offline' | 'app-antigo' | 'erro';

let emAndamento = false;
let ultimaExecucao = 0;

/** Silenciosa: nunca lança erro e nunca bloqueia a interface. */
export async function sincronizarCatalogo(db: SQLiteDatabase): Promise<ResultadoSync> {
  if (emAndamento || Date.now() - ultimaExecucao < 120000) return 'sem-novidade';
  emAndamento = true;
  try {
    await garantirTabelasCatalogo(db);

    let bruto: string;
    try {
      bruto = await baixarTexto(CATALOGO_URL, 8000);
    } catch {
      return 'offline';
    }
    ultimaExecucao = Date.now();

    let json: unknown;
    try {
      json = JSON.parse(bruto);
    } catch {
      return 'erro'; // ex.: 404 (repositório privado ou arquivo ausente)
    }
    const c = sanitizar(json);
    if (!c) return 'erro';

    const versaoApp = Constants.expoConfig?.version ?? '0.0.0';
    if (compararVersoes(versaoApp, c.versaoMinima) < 0) return 'app-antigo'; // catálogo exige app mais novo

    let mudou = false;
    const local = Number((await lerMeta(db, 'versao')) ?? 0);
    if (c.versao !== local) {
      await aplicar(db, c);
      mudou = true;
    }
    if (await atualizarRss(db, c.feeds)) mudou = true;

    if (mudou) notificar();
    return mudou ? 'atualizado' : 'sem-novidade';
  } catch {
    return 'erro';
  } finally {
    emAndamento = false;
  }
}
