import * as WebBrowser from 'expo-web-browser';
import { colors } from '@/constants/theme';

/** Só aceita endereços https:// "limpos" (sem espaços nem caracteres de marcação). */
export const ehHttps = (u: unknown): u is string =>
  typeof u === 'string' && u.length <= 2000 && /^https:\/\/[^\s<>"']+$/i.test(u);

/** Converte http:// em https:// e valida. Retorna null se o endereço não servir. */
export function paraHttps(u: unknown): string | null {
  if (typeof u !== 'string') return null;
  const s = u.trim().replace(/^http:\/\//i, 'https://');
  return ehHttps(s) ? s : null;
}

/** Abre um link externo no navegador interno, somente se for https. Nunca lança erro. */
export async function abrirLinkSeguro(url: unknown): Promise<boolean> {
  if (!ehHttps(url)) return false;
  try {
    await WebBrowser.openBrowserAsync(url, { toolbarColor: colors.bg, controlsColor: colors.accent });
    return true;
  } catch {
    return false;
  }
}

/** Texto vindo da internet: remove imagens remotas, links clicáveis e HTML cru antes de renderizar como Markdown. */
export function limparMarkdownExterno(txt: string): string {
  return txt
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<\/?[a-z][^>]*>/gi, '');
}
