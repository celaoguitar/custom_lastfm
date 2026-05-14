/**
 * estado.js
 * Estado global mutável da aplicação.
 *
 * Todos os módulos que precisam ler ou modificar o estado importam este objeto.
 * Usar um único objeto central facilita rastrear quem altera o quê.
 *
 * Regras:
 *  - Nunca modifique `estado` diretamente no HTML ou em scripts externos.
 *  - Prefira as funções auxiliares deste módulo quando precisar resetar ou
 *    reconstruir partes do estado.
 */

export const estado = {
  /** Array principal com todas as faixas carregadas (fonte da verdade). */
  tracks: [],

  /** Instância do IndexedDB. Null até a abertura completar. */
  bancoDados: null,

  /** Indica se o usuário prefere ordenação crescente na lista de artistas. */
  artistasEmOrdemCrescente: false,

  // --- Índices de acesso rápido (reconstruídos por reconstruirIndices()) ---
  indicePorAno: new Map(),   // "2024" → [track, ...]
  indicePorMes: new Map(),   // "2024-03" → [track, ...]
  indicePorDia: new Map(),   // "2024-03-15" → [track, ...]

  // --- Cache de getTracksVisiveis() ---
  chaveVisiveisCache: null,
  tracksVisiveisCache: null,

  // --- Cache de getEstatisticasArtista() ---
  fonteCacheEstatisticasArtista: null,
  dadosCacheEstatisticasArtista: null,

  /**
   * Flag que indica quando os dropdowns de filtro precisam ser reconstruídos.
   * É marcado como `true` sempre que `tracks` muda; volta a `false` após renderizar.
   */
  filtrosSujos: true,

  /** Timer do debounce de renderizarTudo(). */
  timerRenderizacao: null,
};

/** Limpa todos os índices e invalida os caches derivados. */
export function invalidarCaches() {
  estado.indicePorAno  = new Map();
  estado.indicePorMes  = new Map();
  estado.indicePorDia  = new Map();
  estado.chaveVisiveisCache          = null;
  estado.tracksVisiveisCache         = null;
  estado.fonteCacheEstatisticasArtista = null;
  estado.dadosCacheEstatisticasArtista = null;
  estado.filtrosSujos = true;
}
