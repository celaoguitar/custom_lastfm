/**
 * principal.js
 * Ponto de entrada da aplicação — inicialização, event listeners e bootstrap.
 *
 * Responsabilidades exclusivas deste módulo:
 *  - Carregar estado salvo (IndexedDB / localStorage) na inicialização.
 *  - Conectar todos os event listeners do DOM.
 *  - Orquestrar a sincronização com a API Last.fm.
 *  - Nenhuma lógica de renderização — isso fica em renderizacao.js.
 *  - Nenhuma lógica de cálculo — isso fica em estatisticas.js.
 */

import { VERSAO_CACHE, catalogoDemo, IMAGEM_PADRAO }       from "./configuracao.js";
import { estado }                                           from "./estado.js";
import { abrirBancoDados, buscarTodosBanco, limparEEscreverBanco } from "./banco-dados.js";
import { elementos }                                        from "./elementos.js";
import {
  chaveData, chaveMes, exibirNotificacao,
  definirStatusConexao, mensagemErroLastfm,
  marcarRangeCarregado, rangeEstaCarregado,
} from "./utilidades.js";
import {
  limparNomeFaixa, limparNomeAlbum,
  sanitizarTrackSalva, mesclarTracks,
  reconstruirIndices, identidadeTrack,
  migrarDoLocalStorage, persistirCache,
} from "./tracks.js";
import { buscarTodoHistorico, buscarAnoAtual, getCredenciaisSalvas } from "./api-lastfm.js";
import {
  renderizarTudo, agendarRenderizacao, animarPulso,
  popularFiltrosArtistasAlbuns, popularOpcoesFoco,
  restaurarEstadoToggles, desenharGraficoAtividade,
  exportarPdf, exportarXls, baixarImagemGrafico,
  renderizarMeta,
} from "./renderizacao.js";

// ─── Dados de demonstração ─────────────────────────────────────────────────────

const tracksDemo = Array.from({ length: 180 }, (_, index) => {
  const item = catalogoDemo[(index * 7 + index % 5) % catalogoDemo.length];
  const data = new Date();
  data.setDate(data.getDate() - (index % 155));
  data.setHours((index * 3 + 8) % 24, (index * 11) % 60, 0, 0);
  return {
    artist:     item.artist,
    name:       limparNomeFaixa(item.name),
    album:      limparNomeAlbum(item.album),
    playedAt:   data.getTime(),
    image:      IMAGEM_PADRAO,
    genres:     item.genres,
    artistYear: item.artistYear,
  };
});

// ─── Filtros padrão ───────────────────────────────────────────────────────────

function definirFiltrosPadrao() {
  const agora = new Date();
  elementos.filtroDia.value = chaveData(agora.getTime());
  elementos.filtroMes.value = chaveMes(agora.getTime());
  elementos.filtroAno.value = String(agora.getFullYear());
}

function sincronizarPeriodo() {
  localStorage.setItem("lastMasterPeriod",      elementos.filtroPeriodo.value);
  localStorage.setItem("lastMasterDayFilter",   elementos.filtroDia.value);
  localStorage.setItem("lastMasterMonthFilter", elementos.filtroMes.value);
  localStorage.setItem("lastMasterYearFilter",  elementos.filtroAno.value);
  renderizarTudo();
}

function resetarFiltros() {
  definirFiltrosPadrao();
  elementos.seletorVisualizacao.value = "summary";
  elementos.filtroPeriodo.value       = "month";
  elementos.tipoFoco.value            = "all";
  elementos.valorFoco.value           = "";
  elementos.filtroArtista.value       = "";
  elementos.filtroAlbum.value         = "";
  elementos.limitResultados.value     = "5";
  elementos.escopoMetricas.value      = "month";
  if (elementos.rangeAtividade) elementos.rangeAtividade.value = "30";
  sincronizarPeriodo();
}

function aplicarPreset(preset) {
  definirFiltrosPadrao();
  elementos.valorFoco.value = "";
  elementos.tipoFoco.value  = "all";

  const ativarStat = (chave) => {
    const input = document.querySelector(`[data-stat-toggle="${chave}"]`);
    if (input) input.checked = true;
  };

  if (preset === "month") {
    elementos.seletorVisualizacao.value = "summary";
    elementos.filtroPeriodo.value       = "month";
    elementos.limitResultados.value     = "5";
  }
  if (preset === "artists") {
    elementos.seletorVisualizacao.value = "rankings";
    elementos.filtroPeriodo.value       = "month";
    elementos.limitResultados.value     = "10";
  }
  if (preset === "repeats") {
    elementos.seletorVisualizacao.value = "rankings";
    elementos.filtroPeriodo.value       = "all";
    elementos.tipoFoco.value            = "track";
    elementos.limitResultados.value     = "20";
  }
  if (preset === "discoveries") {
    elementos.seletorVisualizacao.value = "deep";
    elementos.filtroPeriodo.value       = "month";
    elementos.limitResultados.value     = "10";
    ativarStat("genre");
  }
  if (preset === "nostalgia") {
    elementos.seletorVisualizacao.value = "deep";
    elementos.filtroPeriodo.value       = "all";
    elementos.limitResultados.value     = "10";
    ativarStat("year");
    ativarStat("monthly");
  }
  if (preset === "hours") {
    elementos.seletorVisualizacao.value = "deep";
    elementos.filtroPeriodo.value       = "month";
    elementos.limitResultados.value     = "10";
    ativarStat("hourly");
  }

  sincronizarPeriodo();
}

// ─── Carregamento do estado salvo ─────────────────────────────────────────────

async function carregarEstadoSalvo() {
  definirFiltrosPadrao();

  if (localStorage.getItem("lastMasterCacheVersion") !== VERSAO_CACHE) {
    localStorage.removeItem("lastMasterLoadedRanges");
    localStorage.setItem("lastMasterCacheVersion", VERSAO_CACHE);
  }

  if (estado.bancoDados) {
    const tracksBanco = await buscarTodosBanco("tracks");
    if (tracksBanco.length > 0) {
      estado.tracks = tracksBanco.map(sanitizarTrackSalva).sort((a, b) => b.playedAt - a.playedAt);
    } else {
      const migradas = await migrarDoLocalStorage();
      estado.tracks  = migradas.sort((a, b) => b.playedAt - a.playedAt);
    }
  } else {
    const savedTracks = localStorage.getItem("lastMasterTracks");
    if (savedTracks) {
      try {
        estado.tracks = JSON.parse(savedTracks).map(sanitizarTrackSalva);
      } catch {
        estado.tracks = [];
        localStorage.removeItem("lastMasterTracks");
      }
    } else {
      estado.tracks = [];
    }
  }

  reconstruirIndices();

  const { usuario, apiKey } = getCredenciaisSalvas();
  const persistedKey = localStorage.getItem("lastMasterApiKey");

  if (usuario) elementos.inputUsuario.value = usuario;
  if (apiKey)  elementos.inputApiKey.value  = apiKey;
  if (elementos.checkboxLembrarKey) {
    elementos.checkboxLembrarKey.checked = Boolean(persistedKey);
  }

  const savedGoal        = localStorage.getItem("lastMasterGoal");
  const savedPeriod      = localStorage.getItem("lastMasterPeriod");
  const savedDay         = localStorage.getItem("lastMasterDayFilter");
  const savedMonth       = localStorage.getItem("lastMasterMonthFilter");
  const savedYear        = localStorage.getItem("lastMasterYearFilter");
  const savedView        = localStorage.getItem("lastMasterView");
  const savedFocusType   = localStorage.getItem("lastMasterFocusType");
  const savedFocusValue  = localStorage.getItem("lastMasterFocusValue");
  const savedArtist      = localStorage.getItem("lastMasterArtistFilter");
  const savedAlbum       = localStorage.getItem("lastMasterAlbumFilter");
  const savedLimit       = localStorage.getItem("lastMasterResultLimit");
  const savedScope       = localStorage.getItem("lastMasterMetricScope");
  const savedMetricTogg  = localStorage.getItem("lastMasterMetricToggles");
  const savedStatTogg    = localStorage.getItem("lastMasterStatToggles");
  const savedMoreMetrics = localStorage.getItem("lastMasterMoreMetrics");

  popularFiltrosArtistasAlbuns();

  if (savedGoal)   elementos.inputMeta.value        = savedGoal;
  if (savedPeriod) elementos.filtroPeriodo.value    = savedPeriod;
  if (savedDay)    elementos.filtroDia.value        = savedDay;
  if (savedMonth)  elementos.filtroMes.value        = savedMonth;
  if (savedYear)   elementos.filtroAno.value        = savedYear;
  if (savedView && ["summary", "activity", "rankings", "deep"].includes(savedView)) {
    elementos.seletorVisualizacao.value = savedView;
  }
  if (savedFocusType)  elementos.tipoFoco.value         = savedFocusType;
  if (savedFocusValue) elementos.valorFoco.value        = savedFocusValue;
  if (savedArtist)     elementos.filtroArtista.value    = savedArtist;
  if (savedAlbum)      elementos.filtroAlbum.value      = savedAlbum;
  if (savedLimit)      elementos.limitResultados.value  = savedLimit;
  if (savedScope)      elementos.escopoMetricas.value   = savedScope;
  if (savedMoreMetrics === "true") elementos.detalhesMetricasExtras.open = true;

  restaurarEstadoToggles("[data-metric-toggle]", savedMetricTogg);
  restaurarEstadoToggles("[data-stat-toggle]",   savedStatTogg);
  sincronizarPeriodo();
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

function abrirOnboarding() {
  if (!elementos.modalOnboarding.open) elementos.modalOnboarding.showModal();
}

// ─── Demonstração ─────────────────────────────────────────────────────────────

function carregarDemo() {
  estado.tracks = tracksDemo;
  reconstruirIndices();
  if (estado.bancoDados) {
    limparEEscreverBanco("tracks", estado.tracks.map((t) => ({ ...t, _id: identidadeTrack(t) })));
  } else {
    localStorage.setItem("lastMasterTracks", JSON.stringify(estado.tracks));
  }
  renderizarTudo();
  if (elementos.modalOnboarding.open) elementos.modalOnboarding.close();
  exibirNotificacao("Dados de demonstração carregados.");
}

// ─── Importação manual ────────────────────────────────────────────────────────

function importarTracksManualmente() {
  const linhas = elementos.areaImportacao.value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const importadas = linhas.map((linha, index) => {
    const [artistaParte, faixaParte, albumParte, generoParte, anoParte] = linha.split(" - ");
    return {
      artist:     artistaParte?.trim()                                                   || "Artista desconhecido",
      name:       limparNomeFaixa(faixaParte                                             || "Faixa sem título"),
      album:      limparNomeAlbum(albumParte                                             || "Importado manualmente"),
      playedAt:   Date.now() - index * 1000 * 60 * 35,
      image:      IMAGEM_PADRAO,
      genres:     generoParte ? generoParte.split(",").map((g) => g.trim()).filter(Boolean) : [],
      artistYear: anoParte?.trim() || "",
    };
  });

  estado.tracks = [...importadas, ...estado.tracks].map(sanitizarTrackSalva);
  reconstruirIndices();
  persistirCache();
  elementos.areaImportacao.value = "";
  if (elementos.modalOnboarding.open) elementos.modalOnboarding.close();
  renderizarTudo();
  exibirNotificacao(`${importadas.length} faixas importadas.`);
}

// ─── API key ──────────────────────────────────────────────────────────────────

function limparApiKeySalva() {
  localStorage.removeItem("lastMasterApiKey");
  sessionStorage.removeItem("lastMasterApiKey");
  if (elementos.inputApiKey)         elementos.inputApiKey.value         = "";
  if (elementos.checkboxLembrarKey)  elementos.checkboxLembrarKey.checked = false;
  exibirNotificacao("API key removida.");
}

// ─── Sincronização com Last.fm ────────────────────────────────────────────────

elementos.formularioLastfm.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const usuario = elementos.inputUsuario.value.trim();
  const apiKey  = elementos.inputApiKey.value.trim();

  if (!usuario || !apiKey) {
    const msg = "Preencha usuário e API key para sincronizar.";
    definirStatusConexao(msg, "error");
    exibirNotificacao(msg);
    return;
  }

  const botaoEnviar   = elementos.formularioLastfm.querySelector("button[type='submit']");
  const textoOriginal = botaoEnviar?.textContent;
  if (botaoEnviar)                      { botaoEnviar.disabled = true; botaoEnviar.textContent = "Sincronizando..."; }
  if (elementos.botaoLimparApiKey)        elementos.botaoLimparApiKey.disabled = true;

  const usuarioSalvo       = localStorage.getItem("lastMasterUsername");
  const ehUsuarioDiferente = Boolean(usuarioSalvo && usuarioSalvo !== usuario);
  const anoAtual           = new Date().getFullYear();

  try {
    let persistido;

    if (!ehUsuarioDiferente && rangeEstaCarregado("history:full")) {
      definirStatusConexao(`Atualizando ${anoAtual}.`, "info");
      exibirNotificacao(`Atualizando ano atual: ${anoAtual}.`);
      const faixasAnoAtual = await buscarAnoAtual(usuario, apiKey);
      persistido = mesclarTracks(faixasAnoAtual);
      if (persistido) marcarRangeCarregado(`year:${anoAtual}`);
    } else {
      definirStatusConexao("Carregando histórico completo da Last.fm.", "info");
      exibirNotificacao("Sincronizando histórico completo... isso pode levar alguns minutos.");

      if (ehUsuarioDiferente) {
        estado.tracks = [];
        localStorage.removeItem("lastMasterTracks");
        localStorage.removeItem("lastMasterLoadedRanges");
        localStorage.removeItem("lastMasterArtistMeta");
        if (estado.bancoDados) {
          limparEEscreverBanco("tracks");
          limparEEscreverBanco("artistaMeta");
        }
        reconstruirIndices();
      }

      const todasFaixas = await buscarTodoHistorico(usuario, apiKey);
      persistido = mesclarTracks(todasFaixas);
      if (persistido) marcarRangeCarregado("history:full");
    }

    localStorage.setItem("lastMasterUsername",    usuario);
    localStorage.setItem("lastMasterApiKey",      apiKey);
    localStorage.setItem("lastMasterLastApiSync", new Date().toISOString());
    renderizarTudo();
    if (elementos.modalOnboarding.open) elementos.modalOnboarding.close();
    definirStatusConexao("", "info");
    exibirNotificacao("Histórico sincronizado e nomes remaster limpos.");
  } catch (erro) {
    const msg = mensagemErroLastfm(erro);
    definirStatusConexao(msg, "error");
    exibirNotificacao(msg);
  } finally {
    if (botaoEnviar)               { botaoEnviar.disabled = false; botaoEnviar.textContent = textoOriginal || "Sincronizar"; }
    if (elementos.botaoLimparApiKey) elementos.botaoLimparApiKey.disabled = false;
  }
});

// ─── Event listeners ──────────────────────────────────────────────────────────

elementos.botaoImportar.addEventListener("click", importarTracksManualmente);
elementos.botaoDemoMenu?.addEventListener("click", carregarDemo);
elementos.botaoDemoModal?.addEventListener("click", carregarDemo);
elementos.botaoDemoVazio?.addEventListener("click", carregarDemo);
elementos.botaoAbrirOnboarding.addEventListener("click", abrirOnboarding);
elementos.botaoConectarHero.addEventListener("click", abrirOnboarding);
elementos.botaoConectarVazio.addEventListener("click", abrirOnboarding);
elementos.botaoLimparApiKey?.addEventListener("click", limparApiKeySalva);
elementos.botaoBaixarGrafico?.addEventListener("click", baixarImagemGrafico);
elementos.botaoExportarPdf?.addEventListener("click", exportarPdf);
elementos.botaoExportarXls?.addEventListener("click", exportarXls);

elementos.botaoFiltrosAvancados.addEventListener("click", () => {
  const estaOculto = elementos.gaveta.hidden;
  elementos.gaveta.hidden = !estaOculto;
  elementos.botaoFiltrosAvancados.setAttribute("aria-expanded", String(estaOculto));
});

elementos.botaoLimparFiltros.addEventListener("click", resetarFiltros);

elementos.chipsFiltroPAtivo.addEventListener("click", (evento) => {
  const chip = evento.target.closest("[data-clear-filter]");
  if (!chip) return;
  if (chip.dataset.clearFilter === "focus") {
    elementos.tipoFoco.value  = "all";
    elementos.valorFoco.value = "";
  }
  if (chip.dataset.clearFilter === "artistSelect") {
    elementos.filtroArtista.value = "";
    elementos.filtroAlbum.value   = "";
  }
  if (chip.dataset.clearFilter === "albumSelect") {
    elementos.filtroAlbum.value = "";
  }
  if (chip.dataset.clearFilter === "period") {
    elementos.filtroPeriodo.value = "all";
    sincronizarPeriodo();
    return;
  }
  if (chip.dataset.clearFilter === "limit") {
    elementos.limitResultados.value = "5";
  }
  renderizarTudo();
});

elementos.rotuloFiltroAtivo.addEventListener("click", () => {
  elementos.filtroPeriodo.value = "all";
  sincronizarPeriodo();
});

document.querySelectorAll("[data-view-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    elementos.seletorVisualizacao.value = tab.dataset.viewTab;
    renderizarTudo();
  });
});

document.querySelectorAll("[data-nav-view]").forEach((link) => {
  link.addEventListener("click", () => {
    elementos.seletorVisualizacao.value = link.dataset.navView;
    renderizarTudo();
  });
});

document.querySelectorAll("[data-preset]").forEach((botao) => {
  botao.addEventListener("click", () => aplicarPreset(botao.dataset.preset));
});

document.querySelectorAll("[data-result-limit]").forEach((botao) => {
  botao.addEventListener("click", () => {
    elementos.limitResultados.value = botao.dataset.resultLimit;
    renderizarTudo();
  });
});

document.querySelectorAll("[name='periodQuick']").forEach((input) => {
  input.addEventListener("change", () => {
    elementos.filtroPeriodo.value = input.value;
    sincronizarPeriodo();
  });
});

document.querySelectorAll("[name='focusQuick']").forEach((input) => {
  input.addEventListener("change", () => {
    elementos.tipoFoco.value  = input.value;
    elementos.valorFoco.value = "";
    renderizarTudo();
  });
});

elementos.limitResultadosGaveta?.addEventListener("change", () => {
  elementos.limitResultados.value = elementos.limitResultadosGaveta.value;
  renderizarTudo();
});

elementos.rangeAtividadeGaveta?.addEventListener("change", () => {
  if (elementos.rangeAtividade) elementos.rangeAtividade.value = elementos.rangeAtividadeGaveta.value;
  desenharGraficoAtividade();
});

elementos.detalhesMetricasExtras.addEventListener("toggle", renderizarTudo);
elementos.rangeAtividade?.addEventListener("change", desenharGraficoAtividade);
elementos.seletorVisualizacao.addEventListener("change", renderizarTudo);
elementos.filtroPeriodo.addEventListener("change", sincronizarPeriodo);
elementos.filtroDia.addEventListener("change", sincronizarPeriodo);
elementos.filtroMes.addEventListener("change", sincronizarPeriodo);
elementos.filtroAno.addEventListener("change", sincronizarPeriodo);

elementos.filtroArtista.addEventListener("change", () => {
  elementos.filtroAlbum.value = "";
  popularFiltrosArtistasAlbuns();
  renderizarTudo();
});

elementos.filtroAlbum.addEventListener("change", renderizarTudo);

elementos.tipoFoco.addEventListener("change", () => {
  elementos.valorFoco.value = "";
  popularOpcoesFoco();
  renderizarTudo();
});

elementos.valorFoco.addEventListener("input", agendarRenderizacao);
elementos.limitResultados.addEventListener("change", renderizarTudo);
elementos.escopoMetricas.addEventListener("change", renderizarTudo);

document.querySelectorAll("[data-metric-toggle], [data-stat-toggle]").forEach((input) => {
  input.addEventListener("change", renderizarTudo);
});

elementos.inputMeta.addEventListener("input", () => {
  localStorage.setItem("lastMasterGoal", elementos.inputMeta.value);
  renderizarMeta();
});

elementos.botaoOrdenarArtistas.addEventListener("click", () => {
  estado.artistasEmOrdemCrescente = !estado.artistasEmOrdemCrescente;
  renderizarTudo();
});

window.addEventListener("resize", desenharGraficoAtividade);

// ─── Bootstrap ────────────────────────────────────────────────────────────────

abrirBancoDados()
  .then((db) => { estado.bancoDados = db; })
  .catch(() => {})
  .then(() => carregarEstadoSalvo())
  .catch(() => {});

animarPulso();
