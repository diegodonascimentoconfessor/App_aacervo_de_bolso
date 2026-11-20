import { useSyncExternalStore } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { temInternet } from '@/lib/rede';

/**
 * Player único para rádio e podcasts: tocar um para o outro e continuar em segundo plano.
 * Os componentes só leem o estado com useAudio() e chamam tocar/pausar/retomar/parar.
 */

export type FonteAudio = { tipo: 'radio' | 'podcast'; id: string; titulo: string; subtitulo: string };
export type Estado = 'parado' | 'conectando' | 'tocando' | 'pausado' | 'erro' | 'offline';
export type SnapshotAudio = { atual: FonteAudio | null; estado: Estado; mensagem: string | null };

const MSG_OFFLINE_RADIO = 'Sem conexão para rádio online. Seus PDFs continuam disponíveis offline.';
const MSG_OFFLINE_PODCAST = 'Sem conexão para podcasts. Seus PDFs continuam disponíveis offline.';
const MSG_FALHA_RADIO = 'Não foi possível conectar a esta estação agora. Tente outra ou volte mais tarde.';
const MSG_FALHA_PODCAST = 'Não foi possível carregar este episódio agora. Tente novamente mais tarde.';
const TEMPO_LIMITE_MS = 15000;

export const player = createAudioPlayer(null);

let snap: SnapshotAudio = { atual: null, estado: 'parado', mensagem: null };
const ouvintes = new Set<() => void>();

function definir(parcial: Partial<SnapshotAudio>) {
  snap = { ...snap, ...parcial };
  ouvintes.forEach((l) => l());
}
const assinar = (l: () => void) => {
  ouvintes.add(l);
  return () => {
    ouvintes.delete(l);
  };
};

export const useAudio = (): SnapshotAudio => useSyncExternalStore(assinar, () => snap);

let urls: string[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let preparado = false;
let geracao = 0;

function limparTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function preparar() {
  if (preparado) return;
  preparado = true;
  // Áudio continua com a tela bloqueada (precisa do plugin expo-audio com enableBackgroundPlayback)
  setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'duckOthers',
  }).catch(() => {});
  player.addListener('playbackStatusUpdate', (s) => {
    if (s.playing) {
      limparTimer();
      if (snap.estado !== 'tocando') definir({ estado: 'tocando', mensagem: null });
    } else if (s.didJustFinish) {
      try {
        player.setActiveForLockScreen(false);
      } catch {}
      definir({ estado: 'parado' });
    } else if (snap.estado === 'tocando' && !s.isBuffering) {
      definir({ estado: 'pausado' });
    }
  });
}

function falhar() {
  limparTimer();
  try {
    player.pause();
    player.setActiveForLockScreen(false);
  } catch {}
  definir({
    estado: 'erro',
    mensagem: snap.atual?.tipo === 'podcast' ? MSG_FALHA_PODCAST : MSG_FALHA_RADIO,
  });
}

function tentar(idx: number) {
  const fonte = snap.atual;
  if (!fonte) return;
  try {
    player.replace({ uri: urls[idx] });
    // No Android, sem isso o áudio para após alguns minutos em segundo plano
    player.setActiveForLockScreen(true, { title: fonte.titulo, artist: fonte.subtitulo });
    player.play();
  } catch {
    falhar();
    return;
  }
  limparTimer();
  const g = geracao;
  timer = setTimeout(() => {
    if (g !== geracao || snap.estado !== 'conectando') return;
    if (idx + 1 < urls.length) tentar(idx + 1);
    else falhar();
  }, TEMPO_LIMITE_MS);
}

export async function tocar(fonte: FonteAudio, enderecos: string[]) {
  preparar();
  geracao++;
  limparTimer();
  const g = geracao;
  urls = enderecos.filter((u) => /^https:\/\/\S+$/i.test(u)); // somente https
  definir({ atual: fonte, estado: 'conectando', mensagem: null });
  if (urls.length === 0) {
    falhar();
    return;
  }
  const online = await temInternet();
  if (g !== geracao) return;
  if (!online) {
    try {
      player.pause();
    } catch {}
    definir({ estado: 'offline', mensagem: fonte.tipo === 'radio' ? MSG_OFFLINE_RADIO : MSG_OFFLINE_PODCAST });
    return;
  }
  tentar(0);
}

export function pausar() {
  try {
    player.pause();
  } catch {}
  if (snap.estado === 'tocando') definir({ estado: 'pausado' });
}

/** Podcast pausado continua de onde parou; rádio volta ao vivo. */
export function retomar() {
  if (!snap.atual) return;
  if (snap.atual.tipo === 'podcast' && snap.estado === 'pausado') {
    try {
      player.play();
    } catch {}
    return;
  }
  tocar(snap.atual, urls);
}

export function parar() {
  geracao++;
  limparTimer();
  try {
    player.pause();
    player.setActiveForLockScreen(false);
  } catch {}
  definir({ estado: 'parado', mensagem: null });
}
