/** Verifica se há internet de verdade (sem dependências). Retorna em até `timeoutMs`. */
export async function temInternet(timeoutMs = 4000): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch('https://www.gstatic.com/generate_204', { signal: ctrl.signal });
    return r.status === 204 || r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}
