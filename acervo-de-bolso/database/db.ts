import type { SQLiteDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { ARTIGOS_SEED, FONTES_SEED } from './seed';

/* ---------- Tipos ---------- */

export type Artigo = {
  id: number;
  titulo: string;
  autor: string;
  categoria: string;
  tags: string;
  resumo: string;
  conteudo_md: string;
  nota_margem: string;
  criado_em: number;
};

export type Obra = {
  id: number;
  titulo: string;
  autor: string;
  categoria: string;
  tags: string;
  arquivo: string; // nome do arquivo dentro de documentDirectory/obras/
  tipo: 'pdf' | 'md';
  pagina_atual: number;
  total_paginas: number;
  posicao_scroll: number;
  progresso: number; // 0..1
  ultimo_acesso: number | null;
  criado_em: number;
};

export type Fonte = {
  id: number;
  titulo: string;
  url: string;
  categoria: string;
  descricao: string;
  personalizada: number; // 1 = adicionada pelo usuário
};

/* ---------- Arquivos ---------- */

// Guardamos só o NOME do arquivo no banco: o caminho absoluto do container
// pode mudar entre atualizações (principalmente no iOS).
export const DIR_OBRAS = `${FileSystem.documentDirectory ?? ''}obras/`;
export const caminhoObra = (arquivo: string) => DIR_OBRAS + arquivo;

export async function garantirDiretorioObras() {
  const info = await FileSystem.getInfoAsync(DIR_OBRAS);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR_OBRAS, { intermediates: true });
}

/* ---------- Inicialização + seed ---------- */

const DB_VERSION = 1;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS artigos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  autor TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '',
  resumo TEXT NOT NULL DEFAULT '',
  conteudo_md TEXT NOT NULL,
  nota_margem TEXT NOT NULL DEFAULT '',
  criado_em INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS obras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  autor TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '',
  arquivo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('pdf','md')),
  pagina_atual INTEGER NOT NULL DEFAULT 1,
  total_paginas INTEGER NOT NULL DEFAULT 0,
  posicao_scroll REAL NOT NULL DEFAULT 0,
  progresso REAL NOT NULL DEFAULT 0,
  ultimo_acesso INTEGER,
  criado_em INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS fontes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  url TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  personalizada INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_artigos_categoria ON artigos(categoria);
CREATE INDEX IF NOT EXISTS idx_obras_categoria ON obras(categoria);
CREATE INDEX IF NOT EXISTS idx_obras_acesso ON obras(ultimo_acesso);
CREATE INDEX IF NOT EXISTS idx_fontes_categoria ON fontes(categoria);
`;

/** Usada em <SQLiteProvider onInit={initDb}>. Cria o schema e popula o seed na 1ª execução. */
export async function initDb(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const atual = row?.user_version ?? 0;
  if (atual >= DB_VERSION) return;

  if (atual < 1) {
    const agora = Date.now();
    await db.withTransactionAsync(async () => {
      await db.execAsync(SCHEMA);
      for (const a of ARTIGOS_SEED) {
        await db.runAsync(
          `INSERT INTO artigos (titulo, autor, categoria, tags, resumo, conteudo_md, criado_em)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [a.titulo, a.autor, a.categoria, a.tags, a.resumo, a.conteudo_md, agora]
        );
      }
      for (const f of FONTES_SEED) {
        await db.runAsync(
          `INSERT INTO fontes (titulo, url, categoria, descricao, personalizada) VALUES (?, ?, ?, ?, 0)`,
          [f.titulo, f.url, f.categoria, f.descricao]
        );
      }
    });
  }
  // Próximas migrações: if (atual < 2) { ... }
  // PRAGMA não aceita parâmetros; DB_VERSION é uma constante inteira definida no código
  if (!Number.isInteger(DB_VERSION)) throw new Error('DB_VERSION inválida');
  await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
}

/* ---------- Artigos ---------- */

export function listarArtigos(db: SQLiteDatabase, categoria: string | null) {
  return categoria
    ? db.getAllAsync<Artigo>('SELECT * FROM artigos WHERE categoria = ? ORDER BY titulo', [categoria])
    : db.getAllAsync<Artigo>('SELECT * FROM artigos ORDER BY titulo');
}

export function getArtigo(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Artigo>('SELECT * FROM artigos WHERE id = ?', [id]);
}

export function artigoAleatorio(db: SQLiteDatabase, excluirId?: number) {
  return excluirId
    ? db.getFirstAsync<Artigo>('SELECT * FROM artigos WHERE id != ? ORDER BY RANDOM() LIMIT 1', [excluirId])
    : db.getFirstAsync<Artigo>('SELECT * FROM artigos ORDER BY RANDOM() LIMIT 1');
}

export async function salvarNotaMargem(db: SQLiteDatabase, id: number, nota: string) {
  await db.runAsync('UPDATE artigos SET nota_margem = ? WHERE id = ?', [nota, id]);
}

/* ---------- Obras (estante) ---------- */

export function listarObras(db: SQLiteDatabase, categoria: string | null) {
  return categoria
    ? db.getAllAsync<Obra>('SELECT * FROM obras WHERE categoria = ? ORDER BY criado_em DESC', [categoria])
    : db.getAllAsync<Obra>('SELECT * FROM obras ORDER BY criado_em DESC');
}

export function getObra(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Obra>('SELECT * FROM obras WHERE id = ?', [id]);
}

export function ultimaObraAberta(db: SQLiteDatabase) {
  return db.getFirstAsync<Obra>(
    'SELECT * FROM obras WHERE ultimo_acesso IS NOT NULL ORDER BY ultimo_acesso DESC LIMIT 1'
  );
}

export async function inserirObra(
  db: SQLiteDatabase,
  o: Pick<Obra, 'titulo' | 'autor' | 'categoria' | 'tags' | 'arquivo' | 'tipo'>
) {
  const r = await db.runAsync(
    `INSERT INTO obras (titulo, autor, categoria, tags, arquivo, tipo, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [o.titulo, o.autor, o.categoria, o.tags, o.arquivo, o.tipo, Date.now()]
  );
  return r.lastInsertRowId;
}

export async function tocarObra(db: SQLiteDatabase, id: number) {
  await db.runAsync('UPDATE obras SET ultimo_acesso = ? WHERE id = ?', [Date.now(), id]);
}

export async function salvarProgressoPdf(db: SQLiteDatabase, id: number, pagina: number, total: number) {
  const progresso = total > 0 ? Math.min(1, pagina / total) : 0;
  await db.runAsync(
    'UPDATE obras SET pagina_atual = ?, total_paginas = ?, progresso = ?, ultimo_acesso = ? WHERE id = ?',
    [pagina, total, progresso, Date.now(), id]
  );
}

export async function salvarProgressoScroll(db: SQLiteDatabase, id: number, y: number, progresso: number) {
  await db.runAsync(
    'UPDATE obras SET posicao_scroll = ?, progresso = ?, ultimo_acesso = ? WHERE id = ?',
    [y, Math.min(1, Math.max(0, progresso)), Date.now(), id]
  );
}

export async function removerObra(db: SQLiteDatabase, obra: Obra) {
  await FileSystem.deleteAsync(caminhoObra(obra.arquivo), { idempotent: true });
  await db.runAsync('DELETE FROM obras WHERE id = ?', [obra.id]);
}

/* ---------- Fontes públicas ---------- */

export function listarFontes(db: SQLiteDatabase) {
  return db.getAllAsync<Fonte>('SELECT * FROM fontes ORDER BY categoria, personalizada, titulo');
}

export async function inserirFonte(
  db: SQLiteDatabase,
  f: Pick<Fonte, 'titulo' | 'url' | 'categoria' | 'descricao'>
) {
  await db.runAsync(
    'INSERT INTO fontes (titulo, url, categoria, descricao, personalizada) VALUES (?, ?, ?, ?, 1)',
    [f.titulo, f.url, f.categoria, f.descricao]
  );
}

export async function removerFonte(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM fontes WHERE id = ? AND personalizada = 1', [id]);
}

/* ---------- Busca global ---------- */

export type Resultado = { artigos: Artigo[]; obras: Obra[]; fontes: Fonte[] };

export async function buscar(db: SQLiteDatabase, termo: string): Promise<Resultado> {
  const q = `%${termo.trim()}%`;
  const [artigos, obras, fontes] = await Promise.all([
    db.getAllAsync<Artigo>(
      'SELECT * FROM artigos WHERE titulo LIKE ? OR autor LIKE ? OR tags LIKE ? ORDER BY titulo',
      [q, q, q]
    ),
    db.getAllAsync<Obra>(
      'SELECT * FROM obras WHERE titulo LIKE ? OR autor LIKE ? OR tags LIKE ? ORDER BY titulo',
      [q, q, q]
    ),
    db.getAllAsync<Fonte>(
      'SELECT * FROM fontes WHERE titulo LIKE ? OR descricao LIKE ? OR categoria LIKE ? ORDER BY titulo',
      [q, q, q]
    ),
  ]);
  return { artigos, obras, fontes };
}
