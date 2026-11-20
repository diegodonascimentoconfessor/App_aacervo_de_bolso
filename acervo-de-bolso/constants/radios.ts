export type Estacao = {
  id: string;
  nome: string;
  curto: string; // rótulo do chip
  descricao: string;
  /** Endereços do stream, em ordem de tentativa (o player tenta o próximo se um falhar). */
  urls: string[];
};

// Estações embutidas no app (funcionam antes da primeira sincronização).
// O catalogo.json pode corrigir o endereço de qualquer uma (mesmo "id") ou adicionar novas, sem atualizar o APK.
export const ESTACOES: Estacao[] = [
  {
    id: 'mec',
    nome: 'Rádio MEC',
    curto: 'MEC',
    descricao: 'Cultura brasileira: MPB, choro e música instrumental',
    urls: ['https://radiomec-stream.ebc.com.br/ebc/radiomec/playlist.m3u8'],
  },
  {
    id: 'senado',
    nome: 'Rádio Senado',
    curto: 'Senado',
    descricao: 'Notícias, cidadania e música brasileira',
    urls: ['https://radioaovivo.senado.leg.br/fm.mp3'],
  },
  {
    id: 'foco',
    nome: 'Chill Beats · Groove Salad',
    curto: 'Foco',
    descricao: 'Batidas calmas e downtempo para concentração (SomaFM)',
    urls: ['https://ice1.somafm.com/groovesalad-128-mp3', 'https://ice2.somafm.com/groovesalad-128-mp3'],
  },
  {
    id: 'jazz',
    nome: 'Jazz Instrumental · Radio Swiss Jazz',
    curto: 'Jazz',
    descricao: 'Jazz e piano instrumental para leitura',
    urls: ['https://stream.srg-ssr.ch/m/rsj/mp3_128'],
  },
  {
    id: 'usp',
    nome: 'Rádio USP 93.7',
    curto: 'USP',
    descricao: 'Cultura, ciência e educação da Universidade de São Paulo',
    urls: ['https://flow.emm.usp.br:8008/radiousp-128.mp3'],
  },
  {
    id: 'camara',
    nome: 'Rádio Câmara',
    curto: 'Câmara',
    descricao: 'Debates, sessões do Plenário e informação pública',
    urls: ['https://stream3.camara.leg.br/radiocamara1t64'],
  },
  {
    id: 'classica',
    nome: 'Clássica · Radio Swiss Classic',
    curto: 'Clássica',
    descricao: 'Música clássica e barroca instrumental',
    urls: ['https://stream.srg-ssr.ch/m/rsc_de/mp3_128', 'https://uk2.streamingpulse.com/ssl/vcr1'],
  },
  {
    id: 'ambiente',
    nome: 'Ambiente · Drone Zone',
    curto: 'Ambiente',
    descricao: 'Atmosferas contínuas e sons ambiente para leitura (SomaFM)',
    urls: ['https://ice1.somafm.com/dronezone-128-mp3', 'https://ice2.somafm.com/dronezone-128-mp3'],
  },
];
