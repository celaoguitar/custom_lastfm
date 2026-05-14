/**
 * filtros.js
 * Lógica de filtragem das faixas por período e demais critérios.
 *
 * getTracksVisiveis() é a função central: usa índices em memória para
 * buscas rápidas e memoiza o resultado enquanto os filtros não mudam.
 */

import { estado }                                        from "./estado.js";
import { elementos }                                     from "./elementos.js";
import { chaveData, chaveMes, formatarChaveData, formatarChaveMes } from "./utilidades.js";

// ─── Tracks filtradas (com cache) ─────────────────────────────────────────────

/**
 * Retorna as faixas do período e critérios atualmente selecionados.
 * Resultado é memoizado: chamadas consecutivas com os mesmos filtros
 * retornam o mesmo array sem recalcular.
 * @returns {Array}
 */
export function getTracksVisiveis() {
  const chaveAtual = [
    elementos.filtroPeriodo.value,
    elementos.filtroDia.value,
    elementos.filtroMes.value,
    elementos.filtroAno.value,
    elementos.filtroArtista.value,
    elementos.filtroAlbum.value,
    elementos.tipoFoco.value,
    elementos.valorFoco.value,
  ].join("|");

  if (estado.chaveVisiveisCache === chaveAtual) return estado.tracksVisiveisCache;

  // Busca por período usando índice O(1) quando possível
  let filtradas;
  const periodo = elementos.filtroPeriodo.value;
  if (periodo === "day")   filtradas = estado.indicePorDia.get(elementos.filtroDia.value) || [];
  else if (periodo === "month") filtradas = estado.indicePorMes.get(elementos.filtroMes.value) || [];
  else if (periodo === "year")  filtradas = estado.indicePorAno.get(elementos.filtroAno.value) || [];
  else filtradas = estado.tracks;

  // Filtro por artista
  if (elementos.filtroArtista.value) {
    const artista = elementos.filtroArtista.value;
    filtradas = filtradas.filter((t) => t.artist === artista);
  }

  // Filtro por álbum
  if (elementos.filtroAlbum.value) {
    const album = elementos.filtroAlbum.value;
    filtradas = filtradas.filter((t) => t.album === album);
  }

  // Filtro de foco (texto livre em artista / álbum / faixa / estilo)
  const tipoFoco  = elementos.tipoFoco.value;
  const valorFoco = elementos.valorFoco.value.trim().toLowerCase();
  if (valorFoco && tipoFoco !== "all") {
    filtradas = filtradas.filter((t) => {
      if (tipoFoco === "artist") return t.artist.toLowerCase().includes(valorFoco);
      if (tipoFoco === "album")  return t.album.toLowerCase().includes(valorFoco);
      if (tipoFoco === "track")  return `${t.name} - ${t.artist}`.toLowerCase().includes(valorFoco);
      if (tipoFoco === "genre")  return (t.genres || []).some((g) => g.toLowerCase().includes(valorFoco));
      return true;
    });
  }

  estado.chaveVisiveisCache  = chaveAtual;
  estado.tracksVisiveisCache = filtradas;
  return filtradas;
}

/**
 * Retorna as faixas para o escopo das métricas principais (seletor "Escopo").
 * Independente do filtro de período — é controlado pelo metricScopeSelect.
 * @returns {Array}
 */
export function getTracksPorEscopo() {
  const escopo = elementos.escopoMetricas.value;
  if (escopo === "month") return estado.indicePorMes.get(elementos.filtroMes.value) || [];
  if (escopo === "year")  return estado.indicePorAno.get(elementos.filtroAno.value) || [];
  return estado.tracks;
}

// ─── Labels de período ────────────────────────────────────────────────────────

/**
 * Retorna o rótulo do filtro ativo para exibição nos chips.
 * @returns {string}
 */
export function getRotuloFiltroAtivo() {
  const foco = elementos.tipoFoco.value === "all" ? "" : elementos.valorFoco.value.trim();
  const sufixo = foco ? ` + ${foco}` : "";
  const periodo = elementos.filtroPeriodo.value;
  if (periodo === "day")   return `${elementos.filtroDia.value ? formatarChaveData(elementos.filtroDia.value) : "Dia"}${sufixo}`;
  if (periodo === "month") return `${elementos.filtroMes.value ? formatarChaveMes(elementos.filtroMes.value) : "Mês"}${sufixo}`;
  if (periodo === "year")  return `${elementos.filtroAno.value || "Ano"}${sufixo}`;
  return `Todo o histórico${sufixo}`;
}

/**
 * Retorna o rótulo simplificado do período para a sidebar e navegação.
 * @returns {string}
 */
export function getRotuloPeriodo() {
  const agora       = new Date();
  const mesAtual    = chaveMes(agora.getTime());
  const anoAtual    = String(agora.getFullYear());
  const periodo     = elementos.filtroPeriodo.value;
  if (periodo === "day")   return elementos.filtroDia.value ? formatarChaveData(elementos.filtroDia.value) : "Dia específico";
  if (periodo === "month") return elementos.filtroMes.value === mesAtual ? "Mês atual" : formatarChaveMes(elementos.filtroMes.value);
  if (periodo === "year")  return elementos.filtroAno.value === anoAtual ? "Ano atual" : elementos.filtroAno.value;
  return "Todo o histórico";
}

// ─── Ranges de datas ──────────────────────────────────────────────────────────

/**
 * Converte uma chave "YYYY-MM" nos timestamps Unix de início e fim do mês.
 * @param {string} valor
 * @returns {{from: number, to: number}|null}
 */
export function getRangeDoMes(valor) {
  const [ano, mes] = String(valor || "").split("-").map(Number);
  if (!ano || !mes) return null;
  return {
    from: Math.floor(new Date(ano, mes - 1, 1, 0, 0, 0).getTime() / 1000),
    to:   Math.floor(new Date(ano, mes,     1, 0, 0, 0).getTime() / 1000) - 1,
  };
}

/**
 * Converte uma chave "YYYY-MM-DD" nos timestamps Unix de início e fim do dia.
 * @param {string} valor
 * @returns {{from: number, to: number}|null}
 */
export function getRangeDoDia(valor) {
  const [ano, mes, dia] = String(valor || "").split("-").map(Number);
  if (!ano || !mes || !dia) return null;
  return {
    from: Math.floor(new Date(ano, mes - 1, dia,     0, 0, 0).getTime() / 1000),
    to:   Math.floor(new Date(ano, mes - 1, dia + 1, 0, 0, 0).getTime() / 1000) - 1,
  };
}
