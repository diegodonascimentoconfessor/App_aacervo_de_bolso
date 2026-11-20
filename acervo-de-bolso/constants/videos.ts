export type Video = {
  id: string;
  titulo: string;
  canal: string;
  categoria: string;
  duracao?: string;
  youtubeId: string;
};

// Para adicionar vídeos: copie o ID que aparece depois de "watch?v=" no link do YouTube.
export const VIDEOS: Video[] = [
  {
    id: 'v1',
    titulo: 'O Mito da Caverna e a natureza da realidade (Crash Course Philosophy #4)',
    canal: 'CrashCourse',
    categoria: 'Filosofia',
    duracao: '9 min',
    youtubeId: 'IV-8YsyghbU',
  },
  {
    id: 'v2',
    titulo: 'The Agricultural Revolution (Crash Course World History #1)',
    canal: 'CrashCourse',
    categoria: 'História',
    duracao: '11 min',
    youtubeId: 'Yocja_N5s1I',
  },
  {
    id: 'v3',
    titulo: 'USA vs USSR Fight! The Cold War (Crash Course World History #39)',
    canal: 'CrashCourse',
    categoria: 'Geopolítica',
    duracao: '12 min',
    youtubeId: 'y9HjvHZfCUI',
  },
  {
    id: 'v4',
    titulo: 'Early Computing (Crash Course Computer Science #1)',
    canal: 'CrashCourse',
    categoria: 'Tecnologia',
    duracao: '12 min',
    youtubeId: 'O5nskjZ_GoI',
  },
];
