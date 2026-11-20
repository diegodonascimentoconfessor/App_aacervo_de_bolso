import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { ESTACOES, Estacao } from '@/constants/radios';
import { Video, VIDEOS } from '@/constants/videos';
import { aoMudarCatalogo, CatalogoLocal, lerCatalogo } from '@/services/syncCatalogo';

const VAZIO: CatalogoLocal = { radios: [], pilulas: [], videos: [], podcasts: [], links: [], versao: 0 };

/**
 * Lê o cache do SQLite na hora (sem rede) e recarrega sozinho quando a sincronização trouxer novidades.
 * Rádios e vídeos embutidos no app são mesclados com os do catálogo (o catálogo vence em caso de mesmo id).
 */
export function useCatalogo() {
  const db = useSQLiteContext();
  const [cat, setCat] = useState<CatalogoLocal>(VAZIO);

  const carregar = useCallback(() => {
    lerCatalogo(db).then(setCat).catch(() => {});
  }, [db]);

  useEffect(() => {
    carregar();
    return aoMudarCatalogo(carregar);
  }, [carregar]);

  const radios = useMemo<Estacao[]>(() => {
    const mapa = new Map<string, Estacao>(ESTACOES.map((e) => [e.id, e]));
    for (const r of cat.radios) {
      const base = mapa.get(r.id);
      mapa.set(r.id, {
        id: r.id,
        nome: r.nomeCompleto,
        curto: r.nomeCurto,
        descricao: r.categoria || base?.descricao || '',
        urls: [r.streamUrl, ...(base?.urls.filter((u) => u !== r.streamUrl) ?? [])],
      });
    }
    return [...mapa.values()];
  }, [cat.radios]);

  const videos = useMemo<Video[]>(() => {
    const mapa = new Map<string, Video>(VIDEOS.map((v) => [v.youtubeId, v]));
    for (const v of cat.videos) {
      mapa.set(v.youtubeId, {
        id: v.id,
        titulo: v.titulo,
        canal: v.canal,
        categoria: v.categoria,
        duracao: v.duracao ?? undefined,
        youtubeId: v.youtubeId,
      });
    }
    return [...mapa.values()];
  }, [cat.videos]);

  return { radios, videos, podcasts: cat.podcasts, pilulas: cat.pilulas, links: cat.links, versao: cat.versao };
}
