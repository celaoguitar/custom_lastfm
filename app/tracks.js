/**
 * tracks.js
 * Normalização, limpeza, identidade, mesclagem e índices de faixas.
 *
 * Fluxo principal:
 *   API → normalizarTrack() → sanitizarTrackSalva() → mesclarTracks()
 *       → reconstruirIndices() → persistirCache()
 */

import { IMAGEM_PADRAO }                                 from "./configuracao.js";
import { estado, invalidarCaches }                       from "./estado.js";
import { chaveData, chaveMes }                           from "./utilidades.js";
import { salvarVariosBanco, limparEEscreverBanco }       from "./banco-dados.js";

// ─── Limpeza de nomes ─────────────────────────────────────────────────────────

/**
 * Remove sufixos de remaster do nome de uma faixa.
 * Garante que "Reckoner - 2011 Remaster" e "Reckoner" sejam agrupados juntos.
 * @param {string} valor
 * @returns {string}
 */
export function limparNomeFaixa(valor) {
  return String(valor || "Faixa sem título")
    // "(2011 Remaster)", "[Remastered]", etc.
    .replace(/\s*[\[(][^\])]*\b(remaster(ed|izado|izada)?)\b[^\])]*[\])]/gi, "")
    // "- 2011 Remaster", "- Digital Remastered", "– Stereo Remaster" etc.
    .replace(/\s*[-–—]\s*(\d{4}\s*)?(digital\s*)?(mono\s*)?(stereo\s*)?(version\s*)?(remaster(ed|izado|izada)?)\b.*$/i, "")
    // "2011 Remaster" sem hífen
    .replace(/\s+\d{4}\s+(remaster(ed|izado|izada)?)\b.*$/i, "")
    // "Remastered 2011" ou apenas "Remastered" no final da string
    .replace(/\s+(remaster(ed|izado|izada)?)\s*(\d{4})?\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Remove sufixos de remaster do nome de um álbum.
 * @param {string} valor
 * @returns {string}
 */
export function limparNomeAlbum(valor) {
  return String(valor || "Álbum desconhecido")
    .replace(/\s*[\[(][^\])]*\b(remaster(ed|izado|izada)?)\b[^\])]*[\])]/gi, "")
    .replace(/\s*[-–—]\s*(\d{4}\s*)?(remaster(ed|izado|izada)?)\b.*$/i, "")
    .replace(/\s+(remaster(ed|izado|izada)?)\s*(\d{4})?\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ─── Normalização ─────────────────────────────────────────────────────────────

/**
 * Converte o objeto bruto retornado pela API da Last.fm no formato interno.
 * @param {Object} trackApi Objeto track da resposta da API.
 * @returns {Object}
 */
export function normalizarTrack(trackApi) {
  const artista = typeof trackApi.artist === "string"
    ? trackApi.artist
    : trackApi.artist?.["#text"];
  const imagem = trackApi.image?.find((i) => i.size === "extralarge")?.["#text"] || IMAGEM_PADRAO;
  return {
    artist:    artista || "Artista desconhecido",
    name:      limparNomeFaixa(trackApi.name),
    album:     limparNomeAlbum(trackApi.album?.["#text"]),
    playedAt:  trackApi.date?.uts ? Number(trackApi.date.uts) * 1000 : Date.now(),
    image:     imagem,
    genres:    [],
    artistYear: "",
  };
}

/**
 * Garante que um objeto de track (vindo do banco ou importação manual) tenha
 * todos os campos necessários com tipos corretos.
 * @param {Object} track
 * @returns {Object}
 */
export function sanitizarTrackSalva(track) {
  return {
    artist:    track.artist    || "Artista desconhecido",
    name:      limparNomeFaixa(track.name),
    album:     limparNomeAlbum(track.album),
    playedAt:  Number(track.playedAt) || Date.now(),
    image:     track.image     || IMAGEM_PADRAO,
    genres:    Array.isArray(track.genres) ? track.genres : [],
    artistYear: track.artistYear || "",
  };
}

// ─── Identidade ───────────────────────────────────────────────────────────────

/**
 * Gera uma chave única para uma track (usada como _id no IndexedDB).
 * Combina timestamp + artista + nome + álbum.
 * @param {Object} track
 * @returns {string}
 */
export function identidadeTrack(track) {
  return `${track.playedAt}-${track.artist}-${track.name}-${track.album}`;
}

// ─── Índices em memória ───────────────────────────────────────────────────────

/**
 * Reconstrói os índices em memória (por ano, mês e dia) a partir do array
 * global `estado.tracks`. Deve ser chamado sempre que `tracks` mudar.
 * Também invalida todos os caches derivados.
 */
export function reconstruirIndices() {
  invalidarCaches();
  estado.tracks.forEach((track) => {
    const ano = String(new Date(track.playedAt).getFullYear());
    const mes = chaveMes(track.playedAt);
    const dia = chaveData(track.playedAt);

    if (!estado.indicePorAno.has(ano)) estado.indicePorAno.set(ano, []);
    if (!estado.indicePorMes.has(mes)) estado.indicePorMes.set(mes, []);
    if (!estado.indicePorDia.has(dia)) estado.indicePorDia.set(dia, []);

    estado.indicePorAno.get(ano).push(track);
    estado.indicePorMes.get(mes).push(track);
    estado.indicePorDia.get(dia).push(track);
  });
}

// ─── Persistência ────────────────────────────────────────────────────────────

/**
 * Salva o array de tracks no IndexedDB (ou no localStorage como fallback).
 * Faz uma reescrita completa — use para importações e resets.
 * Para novas faixas da API, prefira mesclarTracks() que faz delta.
 * @returns {boolean} true se salvou com sucesso.
 */
export function persistirCache() {
  if (estado.bancoDados) {
    limparEEscreverBanco(
      "tracks",
      estado.tracks.map((t) => ({ ...t, _id: identidadeTrack(t) })),
    );
    return true;
  }
  try {
    localStorage.setItem("lastMasterTracks", JSON.stringify(estado.tracks));
    return true;
  } catch {
    return false;
  }
}

/**
 * Mescla novas faixas com as já carregadas, deduplicando por identidade.
 * Salva apenas as faixas novas no banco (delta), não o conjunto completo.
 * @param {Array} novasTracks Faixas já normalizadas/sanitizadas.
 * @returns {boolean} true se persistiu com sucesso.
 */
export function mesclarTracks(novasTracks) {
  const mapa = new Map(estado.tracks.map((t) => [identidadeTrack(t), t]));
  const sanitizadas = novasTracks.map(sanitizarTrackSalva);
  sanitizadas.forEach((t) => mapa.set(identidadeTrack(t), t));
  estado.tracks = [...mapa.values()].sort((a, b) => b.playedAt - a.playedAt);
  reconstruirIndices();

  if (estado.bancoDados) {
    salvarVariosBanco(
      "tracks",
      sanitizadas.map((t) => ({ ...t, _id: identidadeTrack(t) })),
    );
    return true;
  }
  return persistirCache();
}

// ─── Migração localStorage → IndexedDB ───────────────────────────────────────

/**
 * Migra dados antigos do localStorage para o IndexedDB, caso existam.
 * Chamado automaticamente na primeira abertura após a migração ser introduzida.
 * @returns {Promise<Array>} Faixas migradas.
 */
export async function migrarDoLocalStorage() {
  let migradas = [];
  const lsTracks = localStorage.getItem("lastMasterTracks");
  if (lsTracks) {
    try {
      migradas = JSON.parse(lsTracks).map(sanitizarTrackSalva);
      salvarVariosBanco(
        "tracks",
        migradas.map((t) => ({ ...t, _id: identidadeTrack(t) })),
      );
      localStorage.removeItem("lastMasterTracks");
    } catch { migradas = []; }
  }

  const lsMeta = localStorage.getItem("lastMasterArtistMeta");
  if (lsMeta) {
    try {
      const cache = JSON.parse(lsMeta);
      salvarVariosBanco(
        "artistaMeta",
        Object.entries(cache).map(([artist, dados]) => ({ artist, ...dados })),
      );
      localStorage.removeItem("lastMasterArtistMeta");
    } catch { /* ignora se metadados estiverem corrompidos */ }
  }

  return migradas;
}
