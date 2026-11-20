import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { sincronizarArtigosAcervo } from '@/services/syncArtigosAcervo';
import { sincronizarCatalogo } from '@/services/syncCatalogo';

const INTERVALO_MS = 30 * 60 * 1000;

/** Sem interface: busca o catalogo.json em segundo plano (ao abrir, ao voltar ao app e a cada 30 min). */
export default function SyncCatalogo() {
  const db = useSQLiteContext();
  useEffect(() => {
    const rodar = () => {
      sincronizarCatalogo(db).catch(() => {});
      sincronizarArtigosAcervo(db).catch(() => {}); // no máximo 1x por dia
    };
    const inicio = setTimeout(rodar, 1500); // deixa a tela aparecer primeiro
    const intervalo = setInterval(rodar, INTERVALO_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') rodar();
    });
    return () => {
      clearTimeout(inicio);
      clearInterval(intervalo);
      sub.remove();
    };
  }, [db]);
  return null;
}
