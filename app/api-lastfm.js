/**
 * api-lastfm.js
 * Toda a comunicação com a API pública da Last.fm.
 *
 * Regras:
 *  - Nenhum módulo externo deve chamar fetch() diretamente.
 *  - Dados da API sempre passam por normalizarTrack() antes de sair daqui.
 *  - Metadados de artistas (gêneros, ano) são enriquecidos e cacheados no banco.
 */

import { URL_API_LASTFM }                         from "./configuracao.js";
import { estado }                                 from "./estado.js";
import { buscarTodosBanco, salvarVariosBanco }     from "./banco-dados.js";
import { normalizarTrack }                        from "./tracks.js";
import { extrairAno, definirStatusConexao, formatarNumero } from "./utilidades.js";

// ─── Requisição base ──────────────────────────────────────────────────────────

/**
 * Faz uma requisição à API da Last.fm com timeout e tradução de erros.
 * @param {URLSearchParams} params
 * @param {number}          [timeoutMs=18000]
 * @returns {Promise<Object>}
 */
export async function requisitarLastfm(params, timeoutMs = 18000) {
  const controller = new AbortController();
  const timeout    = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resposta = await fetch(`${URL_API_LASTFM}?${params.toString()}`, {
      signal: controller.signal,
    });
    if (!resposta.ok) throw new Error(`Não foi possível acessar a Last.fm. Status ${resposta.status}.`);
    const dados = await resposta.json();
    if (dados.error) throw new Error(dados.message || "A Last.fm retornou um erro.");
    return dados;
  } catch (erro) {
    if (erro.name === "AbortError") {
      throw new Error("A Last.fm demorou demais para responder. Tente novamente em alguns minutos.");
    }
    throw erro;
  } finally {
    window.clearTimeout(timeout);
  }
}

// ─── Busca de histórico ───────────────────────────────────────────────────────

/**
 * Busca todas as faixas de um intervalo de timestamps Unix.
 * Percorre todas as páginas automaticamente.
 * @param {string} usuario
 * @param {string} apiKey
 * @param {number} from  Timestamp Unix (segundos) de início.
 * @param {number} to    Timestamp Unix (segundos) de fim.
 * @param {Object} [opcoes]
 * @param {string} [opcoes.rotuloProgresso] Texto exibido no status durante o carregamento.
 * @param {number} [opcoes.maxPaginas=Infinity]
 * @returns {Promise<Array>}
 */
export async function buscarTracksNoIntervalo(usuario, apiKey, from, to, opcoes = {}) {
  const faixas    = [];
  const maxPaginas = opcoes.maxPaginas ?? Number.POSITIVE_INFINITY;

  for (let pagina = 1; pagina <= maxPaginas; pagina += 1) {
    const params = new URLSearchParams({
      method: "user.getrecenttracks",
      user:   usuario,
      api_key: apiKey,
      format: "json",
      limit:  "200",
      from:   String(from),
      to:     String(to),
      page:   String(pagina),
    });

    const dados = await requisitarLastfm(params);
    const faixasPagina = (dados.recenttracks?.track || []).map(normalizarTrack);
    faixas.push(...faixasPagina);

    const totalPaginas = Number(dados.recenttracks?.["@attr"]?.totalPages || pagina);
    if (opcoes.rotuloProgresso) {
      definirStatusConexao(
        `Baixando ${opcoes.rotuloProgresso}: página ${pagina} de ${formatarNumero(totalPaginas)}.`,
        "info",
      );
    }
    if (pagina >= totalPaginas || faixasPagina.length === 0) break;
  }

  return faixas;
}

/**
 * Busca todas as faixas de um ano completo.
 * @param {string} usuario
 * @param {string} apiKey
 * @param {number} ano
 * @returns {Promise<Array>}
 */
export async function buscarTracksDoAno(usuario, apiKey, ano) {
  const from = Math.floor(new Date(ano,     0, 1, 0, 0, 0).getTime() / 1000);
  const to   = Math.floor(new Date(ano + 1, 0, 1, 0, 0, 0).getTime() / 1000) - 1;
  return buscarTracksNoIntervalo(usuario, apiKey, from, to, {
    rotuloProgresso: String(ano),
  });
}

/**
 * Busca o ano de registro do usuário na Last.fm.
 * @param {string} usuario
 * @param {string} apiKey
 * @returns {Promise<number>}
 */
export async function buscarAnoRegistroUsuario(usuario, apiKey) {
  const params = new URLSearchParams({
    method: "user.getinfo",
    user:    usuario,
    api_key: apiKey,
    format:  "json",
  });
  const dados = await requisitarLastfm(params, 12000);
  const unix  = Number(dados.user?.registered?.unixtime);
  if (!unix) return new Date().getFullYear() - 5;
  return new Date(unix * 1000).getFullYear();
}

/**
 * Busca todo o histórico do usuário, ano a ano desde o registro.
 * Esta é a operação de sincronização completa — pode levar vários minutos.
 * @param {string} usuario
 * @param {string} apiKey
 * @returns {Promise<Array>} Faixas normalizadas e com metadados.
 */
export async function buscarTodoHistorico(usuario, apiKey) {
  const anoRegistro = await buscarAnoRegistroUsuario(usuario, apiKey);
  const anoAtual    = new Date().getFullYear();
  const todasFaixas = [];
  const vistas      = new Set();

  for (let ano = anoAtual; ano >= anoRegistro; ano -= 1) {
    definirStatusConexao(`Buscando histórico completo: ano ${ano}.`, "info");
    const faixasDoAno = await buscarTracksDoAno(usuario, apiKey, ano);
    faixasDoAno.forEach((t) => {
      const chave = `${t.playedAt}-${t.artist}-${t.name}`;
      if (vistas.has(chave)) return;
      vistas.add(chave);
      todasFaixas.push(t);
    });
  }

  return enriquecerMetadadosArtistas(todasFaixas, apiKey, 35);
}

/**
 * Busca e enriquece apenas o ano atual (sincronização rápida/incremental).
 * @param {string} usuario
 * @param {string} apiKey
 * @returns {Promise<Array>}
 */
export async function buscarAnoAtual(usuario, apiKey) {
  const anoAtual = new Date().getFullYear();
  definirStatusConexao(`Conectando com a Last.fm e carregando ${anoAtual}.`, "info");
  const faixas = await buscarTracksDoAno(usuario, apiKey, anoAtual);
  return enriquecerMetadadosArtistas(faixas, apiKey, 24);
}

// ─── Metadados de artistas ────────────────────────────────────────────────────

/**
 * Enriquece as faixas com gêneros e ano de formação dos artistas.
 * Usa cache no banco para evitar chamadas repetidas à API.
 * Limita a `maxArtistas` novos artistas por chamada.
 * @param {Array}  faixas
 * @param {string} apiKey
 * @param {number} [maxArtistas=24]
 * @returns {Promise<Array>}
 */
export async function enriquecerMetadadosArtistas(faixas, apiKey, maxArtistas = 24) {
  // Carrega cache do banco (ou localStorage como fallback)
  let cache = {};
  if (estado.bancoDados) {
    const registros = await buscarTodosBanco("artistaMeta");
    cache = Object.fromEntries(registros.map((r) => [r.artist, { genres: r.genres, year: r.year }]));
  } else {
    try { cache = JSON.parse(localStorage.getItem("lastMasterArtistMeta") || "{}"); }
    catch { cache = {}; }
  }

  const artistas  = [...new Set(faixas.map((t) => t.artist))].slice(0, maxArtistas);
  const novosMeta = [];

  for (const artista of artistas) {
    if (cache[artista]) continue;
    try {
      const params = new URLSearchParams({
        method:      "artist.getinfo",
        artist:       artista,
        api_key:      apiKey,
        format:       "json",
        autocorrect: "1",
      });
      const dados  = await requisitarLastfm(params, 10000);
      const tags   = dados.artist?.tags?.tag?.slice(0, 3).map((t) => t.name).filter(Boolean) || [];
      cache[artista] = {
        genres: tags,
        year:   dados.artist?.bio?.yearformed
                || extrairAno(dados.artist?.bio?.summary || dados.artist?.bio?.content || ""),
      };
    } catch {
      cache[artista] = { genres: [], year: "" };
    }
    novosMeta.push({ artist: artista, ...cache[artista] });
  }

  // Persiste os metadados novos
  if (estado.bancoDados) {
    salvarVariosBanco("artistaMeta", novosMeta);
  } else if (novosMeta.length) {
    localStorage.setItem("lastMasterArtistMeta", JSON.stringify(cache));
  }

  return faixas.map((t) => ({
    ...t,
    genres:     cache[t.artist]?.genres  || t.genres     || [],
    artistYear: cache[t.artist]?.year    || t.artistYear || "",
  }));
}

// ─── Credenciais salvas ───────────────────────────────────────────────────────

/** @returns {{usuario: string, apiKey: string}} */
export function getCredenciaisSalvas() {
  return {
    usuario: localStorage.getItem("lastMasterUsername") || "",
    apiKey:  localStorage.getItem("lastMasterApiKey") || sessionStorage.getItem("lastMasterApiKey") || "",
  };
}
