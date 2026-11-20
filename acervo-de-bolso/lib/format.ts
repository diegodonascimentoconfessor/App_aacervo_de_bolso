import type { Obra } from '@/database/db';

export const listaTags = (tags: string) =>
  tags.split(',').map((t) => t.trim()).filter(Boolean);

export const semExtensao = (nome: string) => nome.replace(/\.[^.]+$/, '');

export function rotuloProgresso(o: Obra): string {
  if (!o.ultimo_acesso) return 'Não iniciado';
  if (o.tipo === 'pdf') {
    const p = o.pagina_atual || 1;
    return o.total_paginas > 0 ? `Página ${p} de ${o.total_paginas}` : `Página ${p}`;
  }
  return `${Math.round(o.progresso * 100)}% lido`;
}
