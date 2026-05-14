/**
 * renderizacao.js
 * Toda a camada de apresentação: atualiza o DOM com os dados calculados.
 *
 * Regras:
 *  - Nenhuma função aqui chama a API nem modifica `estado.tracks`.
 *  - Funções de render são sempre disparadas por renderizarTudo() ou
 *    por eventos específicos (resize, toggle, etc.).
 *  - renderizarTudo() é o único orquestrador; chamar render* individuais
 *    diretamente só faz sentido para atualizações pontuais (ex.: meta, streak).
 */

import { IMAGEM_PADRAO, METRICAS_PRINCIPAIS }         from "./configuracao.js";
import { estado }                                      from "./estado.js";
import { elementos }                                   from "./elementos.js";
import { getTracksVisiveis, getTracksPorEscopo, getRotuloFiltroAtivo, getRotuloPeriodo } from "./filtros.js";
import {
  getEstatisticasArtista, getEstatisticasFaixa, getEstatisticasAlbum,
  getEstatisticasGenero,  getEstatisticasHorario, getEstatisticasAnoBanda,
  getMelhorDia, getMelhorAno, getMaiorRepeticao, getMelhorPorDia,
  getHierarquiaFaixas, getTopPorMes,
} from "./estatisticas.js";
import {
  escaparHtml, formatarNumero, formatarDataHora, formatarChaveData,
  formatarChaveMes, pluralizarMusica, arredondarRetangulo, definirStatusConexao,
  chaveData,
} from "./utilidades.js";

// ─── Debounce de renderizarTudo() ────────────────────────────────────────────

/**
 * Agenda renderizarTudo() com debounce de 60ms.
 * Use nos event listeners de inputs de texto para evitar render a cada tecla.
 */
export function agendarRenderizacao() {
  clearTimeout(estado.timerRenderizacao);
  estado.timerRenderizacao = setTimeout(renderizarTudo, 60);
}

// ─── Orquestrador principal ───────────────────────────────────────────────────

/**
 * Atualiza toda a interface com o estado atual dos filtros e dados.
 * Ponto de entrada único para qualquer mudança que afete a visualização.
 */
export function renderizarTudo() {
  // Reconstrói dropdowns de filtro apenas quando tracks mudaram
  if (estado.filtrosSujos) {
    popularFiltrosArtistasAlbuns();
    popularOpcoesFoco();
    estado.filtrosSujos = false;
  }

  renderizarMetricas();
  renderizarChipsAtivos();
  atualizarTagsLimite();
  renderizarListaFaixas();
  renderizarArtistas();
  renderizarAnalises();
  renderizarAlbunsArtistaSelecionado();
  renderizarMetricasSugeridas();
  renderizarMeta();
  renderizarSequencia();
  renderizarUltimaSincronizacao();
  aplicarControlesExibicao();
  desenharGraficoAtividade();
}

// ─── Filtros (dropdowns) ──────────────────────────────────────────────────────

/**
 * Reconstrói os selects de artista e álbum a partir de todas as tracks.
 * Chamado apenas quando `estado.filtrosSujos` é verdadeiro.
 */
export function popularFiltrosArtistasAlbuns() {
  const artistaSelecionado = elementos.filtroArtista.value;
  const albumSelecionado   = elementos.filtroAlbum.value;

  const artistas = [...new Set(estado.tracks.map((t) => t.artist))].sort((a, b) => a.localeCompare(b));
  elementos.filtroArtista.innerHTML = '<option value="">Todas as bandas</option>';
  artistas.forEach((artista) => {
    const opt  = document.createElement("option");
    opt.value  = artista;
    opt.textContent = artista;
    elementos.filtroArtista.append(opt);
  });
  elementos.filtroArtista.value = artistas.includes(artistaSelecionado) ? artistaSelecionado : "";

  const fontAlbuns = elementos.filtroArtista.value
    ? estado.tracks.filter((t) => t.artist === elementos.filtroArtista.value)
    : estado.tracks;
  const albuns = [...new Set(fontAlbuns.map((t) => t.album))].sort((a, b) => a.localeCompare(b));
  elementos.filtroAlbum.innerHTML = '<option value="">Todos os álbuns</option>';
  albuns.forEach((album) => {
    const opt  = document.createElement("option");
    opt.value  = album;
    opt.textContent = album;
    elementos.filtroAlbum.append(opt);
  });
  elementos.filtroAlbum.value = albuns.includes(albumSelecionado) ? albumSelecionado : "";
}

/**
 * Reconstrói a datalist de sugestões de foco com base no tipo selecionado.
 * Chamado ao trocar o tipoFoco, que requer nova lista de valores.
 */
export function popularOpcoesFoco() {
  const tipo   = elementos.tipoFoco.value;
  const valores = new Set();
  estado.tracks.forEach((t) => {
    if (tipo === "artist") valores.add(t.artist);
    if (tipo === "album")  valores.add(t.album);
    if (tipo === "track")  valores.add(`${t.name} - ${t.artist}`);
    if (tipo === "genre")  (t.genres || []).forEach((g) => valores.add(g));
  });
  elementos.opcoesFoco.innerHTML = "";
  [...valores].sort((a, b) => a.localeCompare(b)).slice(0, 80).forEach((v) => {
    const opt  = document.createElement("option");
    opt.value  = v;
    elementos.opcoesFoco.append(opt);
  });
}

// ─── Métricas ─────────────────────────────────────────────────────────────────

export function renderizarMetricas() {
  const visiveis      = getTracksPorEscopo();
  const artistas      = getEstatisticasArtista(visiveis);
  const faixas        = getEstatisticasFaixa(visiveis);
  const totalArtistas = artistas.length;
  const ultimos7Dias  = estado.tracks.filter((t) => Date.now() - t.playedAt < 7 * 24 * 60 * 60 * 1000).length;
  const melhorDia     = getMelhorDia(visiveis);
  const melhorAno     = getMelhorAno(visiveis);
  const maiorRepet    = getMaiorRepeticao(visiveis);
  const melhorFaixaDia  = getMelhorPorDia(visiveis, (t) => `${t.artist}::${t.name}`, (t) => `${t.name} - ${t.artist}`);
  const melhorArtistaDia = getMelhorPorDia(visiveis, (t) => t.artist, (t) => t.artist);
  const melhorAlbumDia  = getMelhorPorDia(visiveis, (t) => `${t.artist}::${t.album}`, (t) => `${t.album} - ${t.artist}`);

  elementos.rotuloFiltroAtivo.textContent = getRotuloFiltroAtivo();
  elementos.totalScrobbles.textContent    = formatarNumero(visiveis.length);
  elementos.deltaSrobbbles.textContent    = visiveis.length
    ? `${formatarNumero(ultimos7Dias)} nos últimos 7 dias`
    : "Conecte sua conta para começar";
  elementos.artistasUnicos.textContent    = formatarNumero(totalArtistas);
  elementos.deltaArtistas.textContent     = visiveis.length
    ? `${Math.round((totalArtistas / visiveis.length) * 100)}% de variedade`
    : "Sua variedade musical aparecerá aqui";
  elementos.minutosOuvidos.textContent    = formatarNumero(Math.round(visiveis.length * 3.5));

  if (faixas[0]) {
    elementos.faixaTopo.textContent       = faixas[0].name;
    elementos.artistaFaixaTopo.textContent = `${faixas[0].artist} - ${faixas[0].count} plays`;
    const tracksVisiveis = getTracksVisiveis();
    elementos.spotlightFaixa.textContent   = tracksVisiveis[0]?.name   || "Nenhuma faixa";
    elementos.spotlightArtista.textContent = tracksVisiveis[0]?.artist || "";
    elementos.spotlightImagem.src          = tracksVisiveis[0]?.image  || IMAGEM_PADRAO;
    elementos.spotlightImagem.alt          = `Capa de ${tracksVisiveis[0]?.name || ""}`;
  } else {
    elementos.faixaTopo.textContent        = "Sem dados ainda";
    elementos.artistaFaixaTopo.textContent = "Vamos descobrir seu replay favorito";
    elementos.spotlightFaixa.textContent   = "Nenhuma faixa carregada";
    elementos.spotlightArtista.textContent = "Conecte sua conta para carregar seus destaques";
    elementos.spotlightImagem.src          = IMAGEM_PADRAO;
    elementos.spotlightImagem.alt          = "";
  }

  elementos.melhorDia.textContent             = melhorDia ? formatarChaveData(melhorDia.key) : "Sem dados ainda";
  elementos.contadorMelhorDia.textContent     = melhorDia ? `${melhorDia.count} scrobbles` : "O dia mais intenso aparecerá aqui";
  elementos.maiorRepeticao.textContent        = maiorRepet ? maiorRepet.track.name : "Sem dados ainda";
  elementos.contadorMaiorRepeticao.textContent = maiorRepet ? `${maiorRepet.count} vezes seguidas - ${maiorRepet.track.artist}` : "Sequência sem parar da mesma música";
  elementos.melhorAno.textContent             = melhorAno ? melhorAno.key : "Sem dados ainda";
  elementos.contadorMelhorAno.textContent     = melhorAno ? `${melhorAno.count} scrobbles no ano` : "Ano com mais scrobbles";
  elementos.melhorFaixaDia.textContent        = melhorFaixaDia ? melhorFaixaDia.label : "Sem dados ainda";
  elementos.contadorMelhorFaixaDia.textContent = melhorFaixaDia ? `${melhorFaixaDia.count} vezes em ${formatarChaveData(melhorFaixaDia.day)}` : "Faixa mais repetida em um dia";
  elementos.melhorArtistaDia.textContent      = melhorArtistaDia ? melhorArtistaDia.label : "Sem dados ainda";
  elementos.contadorMelhorArtistaDia.textContent = melhorArtistaDia ? `${melhorArtistaDia.count} plays em ${formatarChaveData(melhorArtistaDia.day)}` : "Artista mais ouvido em um dia";
  elementos.melhorAlbumDia.textContent        = melhorAlbumDia ? melhorAlbumDia.label : "Sem dados ainda";
  elementos.contadorMelhorAlbumDia.textContent = melhorAlbumDia ? `${melhorAlbumDia.count} plays em ${formatarChaveData(melhorAlbumDia.day)}` : "Álbum mais ouvido em um dia";

  document.querySelectorAll(".album-art").forEach((img, i) => {
    const tracksVisiveis = getTracksVisiveis();
    img.src = tracksVisiveis[i]?.image || IMAGEM_PADRAO;
    img.alt = "";
  });
}

// ─── Lista de faixas (hierarquia) ────────────────────────────────────────────

// Guarda os dados de cada artista para renderização preguiçosa.
// WeakMap garante que as entradas são liberadas quando o elemento sai do DOM.
const _dadosArtista = new WeakMap();

function _htmlAlbums(artista) {
  return artista.albums.map((album, ai) => `
    <details class="music-group album-group" ${ai === 0 ? "open" : ""}>
      <summary class="music-summary">
        <img src="${escaparHtml(album.image || IMAGEM_PADRAO)}" alt="">
        <span class="music-title">
          <strong>${escaparHtml(album.album)}</strong>
          <small>${formatarNumero(album.tracks.length)} ${album.tracks.length === 1 ? "música agrupada" : "músicas agrupadas"}</small>
        </span>
        <span class="data-count">${pluralizarMusica(album.count)}</span>
      </summary>
      <div class="music-track-list">
        ${album.tracks.map((faixa) => `
          <div class="music-track-row">
            <span>
              <strong>${escaparHtml(faixa.name)}</strong>
              <small>Última vez: ${escaparHtml(formatarDataHora(faixa.ultimoPlay))}</small>
            </span>
            <span class="data-count">${formatarNumero(faixa.count)}x</span>
          </div>
        `).join("")}
      </div>
    </details>
  `).join("");
}

function _expandirArtista(detalhe) {
  // Não renderiza novamente se o conteúdo já foi gerado
  if (detalhe.querySelector(".music-children")) return;
  const artista = _dadosArtista.get(detalhe);
  if (!artista) return;
  const conteudo = document.createElement("div");
  conteudo.className = "music-children";
  conteudo.innerHTML = _htmlAlbums(artista);
  detalhe.append(conteudo);
}

export function renderizarListaFaixas() {
  if (!elementos.listaFaixas) return;
  const visiveis   = getTracksVisiveis();
  const hierarquia = getHierarquiaFaixas(visiveis);
  const limite     = Number(elementos.limitResultados.value);
  const linhas     = hierarquia.slice(0, limite);

  elementos.listaFaixas.innerHTML = "";
  if (elementos.contadorListaFaixas) {
    elementos.contadorListaFaixas.textContent =
      `${formatarNumero(hierarquia.length)} ${hierarquia.length === 1 ? "artista" : "artistas"} • ${pluralizarMusica(visiveis.length)}`;
  }

  if (!linhas.length) {
    elementos.listaFaixas.innerHTML = '<p class="helper">Nenhuma música encontrada nesse recorte. Ajuste os filtros ou conecte mais histórico.</p>';
    return;
  }

  linhas.forEach((artista, i) => {
    const totalFaixas = artista.albums.reduce((s, a) => s + a.tracks.length, 0);
    const detalhe     = document.createElement("details");
    detalhe.className = "music-group artist-group";
    detalhe.open      = i === 0;
    detalhe.innerHTML = `
      <summary class="music-summary">
        <span class="artist-avatar" aria-hidden="true">${escaparHtml(artista.artist.slice(0, 1).toUpperCase())}</span>
        <span class="music-title">
          <strong>${escaparHtml(artista.artist)}</strong>
          <small>${formatarNumero(artista.albums.length)} ${artista.albums.length === 1 ? "álbum" : "álbuns"} • ${formatarNumero(totalFaixas)} ${totalFaixas === 1 ? "faixa" : "faixas"} agrupadas</small>
        </span>
        <span class="data-count">${pluralizarMusica(artista.count)}</span>
      </summary>
    `;

    _dadosArtista.set(detalhe, artista);

    // Renderiza o conteúdo imediatamente apenas para o artista já aberto
    if (i === 0) _expandirArtista(detalhe);

    // Os demais só geram DOM quando o usuário abrir o grupo
    detalhe.addEventListener("toggle", () => {
      if (detalhe.open) _expandirArtista(detalhe);
    });

    elementos.listaFaixas.append(detalhe);
  });
}

// ─── Artistas ─────────────────────────────────────────────────────────────────

export function renderizarArtistas() {
  const limite   = Number(elementos.limitResultados.value);
  const artistas = getEstatisticasArtista().slice(0, limite);
  elementos.listaArtistas.innerHTML = "";

  if (!artistas.length) {
    elementos.listaArtistas.innerHTML = '<p class="helper">Nenhum artista encontrado nesse recorte. Ajuste os filtros ou conecte mais histórico.</p>';
    return;
  }

  artistas.forEach((item, i) => {
    const linha = document.createElement("div");
    linha.className = "artist-row";
    linha.innerHTML = `
      <span class="rank">${i + 1}</span>
      <span class="artist-avatar" aria-hidden="true">${escaparHtml(item.artist.slice(0, 1).toUpperCase())}</span>
      <span class="artist-name">
        <strong>${escaparHtml(item.artist)}</strong>
        <span>${item.tracks.size} faixas diferentes${item.year ? ` - desde ${escaparHtml(item.year)}` : ""}</span>
      </span>
      <span class="play-count">${item.count}</span>
    `;
    elementos.listaArtistas.append(linha);
  });
}

// ─── Análises (horário, gênero, álbuns, top mensal) ──────────────────────────

export function renderizarAnalises() {
  const visiveis  = getTracksVisiveis();
  const limite    = Number(elementos.limitResultados.value);

  renderizarTopMensal(visiveis, limite);

  renderizarListaDados(elementos.listaHorarios, getEstatisticasHorario(visiveis).slice(0, limite), (item) => ({
    titulo: item.key, detalhe: `${item.percent}% do filtro selecionado`, count: item.count,
  }));
  renderizarListaDados(elementos.listaGeneros, getEstatisticasGenero(visiveis).slice(0, limite), (item) => ({
    titulo: item.key, detalhe: "estilo associado aos artistas/faixas", count: item.count,
  }));
  renderizarListaDados(elementos.listaAnoBanda, getEstatisticasAnoBanda(visiveis).slice(0, limite), (item) => ({
    titulo: item.artist, detalhe: item.year ? `ano informado: ${item.year}` : "ano não informado pela Last.fm", count: item.count,
  }));
  renderizarListaDados(elementos.listaAlbuns, getEstatisticasAlbum(visiveis).slice(0, limite), (item) => ({
    titulo: item.album, detalhe: item.artist, count: item.count,
  }));
}

function renderizarTopMensal(visiveis, limite) {
  const linhas = getTopPorMes(visiveis).slice(0, limite);
  renderizarListaDados(elementos.listaMensalTop, linhas, (item) => ({
    titulo: item.titulo, detalhe: `${formatarChaveMes(item.mes)} - ${item.detalhe}`, count: item.count,
  }));
}

/** Renderiza uma lista genérica de dados no formato título/detalhe/contagem. */
function renderizarListaDados(alvo, linhas, mapearLinha) {
  alvo.innerHTML = "";
  if (!linhas.length) {
    alvo.innerHTML = '<p class="helper">Nada para mostrar neste recorte ainda. Experimente outro período ou conecte mais histórico.</p>';
    return;
  }
  linhas.forEach((linha) => {
    const mapeada = mapearLinha(linha);
    const div     = document.createElement("div");
    div.className = "data-row";
    div.innerHTML = `
      <span>
        <strong>${escaparHtml(String(mapeada.titulo))}</strong>
        <span>${escaparHtml(String(mapeada.detalhe))}</span>
      </span>
      <span class="data-count">${formatarNumero(mapeada.count)}</span>
    `;
    alvo.append(div);
  });
}

// ─── Álbuns do artista selecionado ───────────────────────────────────────────

export function renderizarAlbunsArtistaSelecionado() {
  const artistaSelecionado = elementos.filtroArtista.value;
  elementos.secaoAlbunsArtista.hidden = !artistaSelecionado;
  if (!artistaSelecionado) {
    elementos.listaAlbunsArtista.innerHTML = '<p class="helper">Selecione uma banda para ver os álbuns dela dentro do recorte.</p>';
    return;
  }
  const linhas = getEstatisticasAlbum(getTracksVisiveis()).slice(0, Number(elementos.limitResultados.value));
  renderizarListaDados(elementos.listaAlbunsArtista, linhas, (item) => ({
    titulo: item.album, detalhe: `${item.artist} - álbum no filtro atual`, count: item.count,
  }));
}

// ─── Métricas sugeridas ───────────────────────────────────────────────────────

export function renderizarMetricasSugeridas() {
  const visiveis    = getTracksVisiveis();
  const topHorario  = getEstatisticasHorario(visiveis)[0];
  const topGenero   = getEstatisticasGenero(visiveis)[0];
  const topAlbum    = getEstatisticasAlbum(visiveis)[0];
  const diversidade = visiveis.length
    ? Math.round((getEstatisticasArtista(visiveis).length / visiveis.length) * 100)
    : 0;

  const sugestoes = [
    { titulo: "Horário favorito",   detalhe: topHorario ? `${topHorario.key} concentra ${topHorario.percent}% do recorte` : "Conecte mais dados para descobrir" },
    { titulo: "Estilo dominante",   detalhe: topGenero  ? `${topGenero.key} aparece ${topGenero.count} vezes`              : "Tags da Last.fm aparecem após sincronizar" },
    { titulo: "Álbum do momento",   detalhe: topAlbum   ? `${topAlbum.album} - ${topAlbum.artist}`                        : "Filtre por banda para investigar álbuns" },
    { titulo: "Diversidade musical", detalhe: visiveis.length ? `${diversidade}% de artistas únicos no recorte`           : "Mostra se você repetiu ou explorou mais" },
  ];

  elementos.listaMetricasSugeridas.innerHTML = sugestoes.map((s) => `
    <article class="suggestion-card">
      <strong>${escaparHtml(s.titulo)}</strong>
      <span>${escaparHtml(s.detalhe)}</span>
    </article>
  `).join("");
}

// ─── Streak e meta semanal ────────────────────────────────────────────────────

export function renderizarSequencia() {
  if (!estado.tracks.length) {
    elementos.valorSequencia.textContent = "0 dias";
    elementos.dicaSequencia.textContent  = "Conecte ou importe para calcular";
    return;
  }
  const dias    = new Set(estado.tracks.map((t) => new Date(t.playedAt).toDateString()));
  let sequencia = 0;
  const cursor  = new Date();
  while (dias.has(cursor.toDateString())) {
    sequencia += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  elementos.valorSequencia.textContent = `${sequencia} ${sequencia === 1 ? "dia" : "dias"}`;
  elementos.dicaSequencia.textContent  = sequencia > 0 ? "com scrobbles consecutivos" : "sem scrobble registrado hoje";
}

export function renderizarMeta() {
  const meta     = Number(elementos.inputMeta.value);
  const semanal  = estado.tracks.filter((t) => Date.now() - t.playedAt < 7 * 24 * 60 * 60 * 1000).length;
  const percent  = Math.min(100, Math.round((semanal / meta) * 100));
  elementos.outputMeta.textContent = `${percent}%`;
  elementos.barraMeta.style.width  = `${percent}%`;
  elementos.textoMeta.textContent  = `${semanal} de ${meta} scrobbles nesta semana.`;
}

export function renderizarUltimaSincronizacao() {
  if (!elementos.ultimaSincLabel) return;
  const ultima = localStorage.getItem("lastMasterLastApiSync");
  elementos.ultimaSincLabel.textContent = ultima
    ? `Última atualização da API: ${formatarDataHora(ultima)}`
    : "Última atualização da API: nunca";
}

// ─── Chips de filtros ativos ──────────────────────────────────────────────────

export function renderizarChipsAtivos() {
  elementos.rotuloFiltroAtivo.dataset.clearFilter = "period";
  elementos.rotuloFiltroAtivo.innerHTML = `${escaparHtml(getRotuloPeriodo())} <span class="remove-chip" aria-hidden="true">x</span>`;
  elementos.chipsFiltroPAtivo.querySelectorAll(".active-chip").forEach((c) => c.remove());

  const chips = [];
  if (elementos.filtroArtista.value) chips.push({ key: "artistSelect", label: `Banda: ${elementos.filtroArtista.value}` });
  if (elementos.filtroAlbum.value)   chips.push({ key: "albumSelect",  label: `Álbum: ${elementos.filtroAlbum.value}` });
  if (elementos.tipoFoco.value !== "all" && elementos.valorFoco.value.trim()) {
    const rotuloFoco = elementos.tipoFoco.options[elementos.tipoFoco.selectedIndex].textContent;
    chips.push({ key: "focus", label: `${rotuloFoco}: ${elementos.valorFoco.value.trim()}` });
  }

  chips.forEach((chip) => {
    const btn = document.createElement("button");
    btn.className         = "active-chip";
    btn.type              = "button";
    btn.dataset.clearFilter = chip.key;
    btn.innerHTML         = `${escaparHtml(chip.label)} <span class="remove-chip" aria-hidden="true">x</span>`;
    elementos.chipsFiltroPAtivo.append(btn);
  });
}

// ─── Controles de exibição e tabs ─────────────────────────────────────────────

export function atualizarTagsLimite() {
  document.querySelectorAll("[data-result-limit]").forEach((btn) => {
    const ativo = btn.dataset.resultLimit === elementos.limitResultados.value;
    btn.classList.toggle("is-active", ativo);
    btn.setAttribute("aria-pressed", String(ativo));
  });
}

export function aplicarControlesExibicao() {
  const view = elementos.seletorVisualizacao.value;

  document.querySelectorAll("[data-view-tab]").forEach((tab) => {
    const ativo = tab.dataset.viewTab === view;
    tab.classList.toggle("is-active", ativo);
    tab.setAttribute("aria-selected", String(ativo));
  });
  document.querySelectorAll("[data-nav-view]").forEach((link) => {
    const ativo = link.dataset.navView === view;
    link.classList.toggle("is-active", ativo);
    ativo ? link.setAttribute("aria-current", "page") : link.removeAttribute("aria-current");
  });
  document.querySelectorAll("[data-view-panel]").forEach((painel) => {
    painel.classList.toggle("is-hidden", !painel.dataset.viewPanel.split(" ").includes(view));
  });
  document.querySelectorAll("[data-metric]").forEach((card) => {
    const toggle   = document.querySelector(`[data-metric-toggle="${card.dataset.metric}"]`);
    const principal = METRICAS_PRINCIPAIS.has(card.dataset.metric);
    card.classList.toggle("is-hidden", !toggle?.checked || (!principal && !elementos.detalhesMetricasExtras.open));
  });
  document.querySelectorAll("[data-stat]").forEach((painel) => {
    const toggle = document.querySelector(`[data-stat-toggle="${painel.dataset.stat}"]`);
    painel.classList.toggle("is-hidden", !toggle?.checked);
  });

  // Visibilidade dos filtros de período
  elementos.wrapFiltroDia.hidden = elementos.filtroPeriodo.value !== "day";
  elementos.wrapFiltroMes.hidden = elementos.filtroPeriodo.value !== "month";
  elementos.wrapFiltroAno.hidden = elementos.filtroPeriodo.value !== "year";

  // Controle do campo de foco
  elementos.valorFoco.disabled    = elementos.tipoFoco.value === "all";
  elementos.valorFoco.placeholder = elementos.tipoFoco.value === "all" ? "Sem foco aplicado" : "Digite para filtrar";
  const labelFoco = elementos.valorFoco.closest("label");
  if (labelFoco) labelFoco.hidden = elementos.tipoFoco.value === "all";

  // Estado vazio
  elementos.estadoVazio.hidden = estado.tracks.length > 0;

  // Side column
  const painelLateral = [...document.querySelectorAll(".side-column > .section-band")];
  document.querySelector(".side-column")?.classList.toggle(
    "is-hidden",
    painelLateral.every((p) => p.classList.contains("is-hidden")),
  );

  // Sincroniza controles rápidos do drawer
  document.querySelectorAll("[name='periodQuick']").forEach((input) => {
    input.checked = input.value === elementos.filtroPeriodo.value;
  });
  document.querySelectorAll("[name='focusQuick']").forEach((input) => {
    input.checked = input.value === elementos.tipoFoco.value;
  });
  if (elementos.rangeAtividadeGaveta && elementos.rangeAtividade) {
    elementos.rangeAtividadeGaveta.value = elementos.rangeAtividade.value;
  }

  // Persiste preferências de visualização
  localStorage.setItem("lastMasterView",          view);
  localStorage.setItem("lastMasterFocusType",     elementos.tipoFoco.value);
  localStorage.setItem("lastMasterFocusValue",    elementos.valorFoco.value);
  localStorage.setItem("lastMasterArtistFilter",  elementos.filtroArtista.value);
  localStorage.setItem("lastMasterAlbumFilter",   elementos.filtroAlbum.value);
  localStorage.setItem("lastMasterResultLimit",   elementos.limitResultados.value);
  localStorage.setItem("lastMasterMetricScope",   elementos.escopoMetricas.value);
  localStorage.setItem("lastMasterMoreMetrics",   String(elementos.detalhesMetricasExtras.open));
  localStorage.setItem("lastMasterMetricToggles", JSON.stringify(getEstadoToggles("[data-metric-toggle]")));
  localStorage.setItem("lastMasterStatToggles",   JSON.stringify(getEstadoToggles("[data-stat-toggle]")));
}

function getEstadoToggles(seletor) {
  return [...document.querySelectorAll(seletor)].reduce((acc, input) => {
    acc[input.dataset.metricToggle || input.dataset.statToggle] = input.checked;
    return acc;
  }, {});
}

export function restaurarEstadoToggles(seletor, salvo) {
  if (!salvo) return;
  let estado_ = {};
  try { estado_ = JSON.parse(salvo); } catch { return; }
  document.querySelectorAll(seletor).forEach((input) => {
    const chave = input.dataset.metricToggle || input.dataset.statToggle;
    if (typeof estado_[chave] === "boolean") input.checked = estado_[chave];
  });
}

// ─── Gráfico de atividade ─────────────────────────────────────────────────────

export function desenharGraficoAtividade() {
  const canvas = elementos.graficoAtividade;
  if (!canvas) return;
  const ctx    = canvas.getContext("2d");
  const ratio  = window.devicePixelRatio || 1;
  const rect   = canvas.getBoundingClientRect();
  const largura = rect.width || canvas.parentElement?.clientWidth || 720;
  canvas.width  = largura * ratio;
  canvas.height = 220 * ratio;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, largura, 220);

  const dias   = Number(elementos.rangeAtividade?.value || 30);
  const buckets = Array.from({ length: dias }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (dias - 1 - i));
    return { label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), key: d.toDateString(), count: 0 };
  });

  const indice = new Map(buckets.map((b) => [b.key, b]));
  estado.tracks.forEach((t) => {
    const bucket = indice.get(new Date(t.playedAt).toDateString());
    if (bucket) bucket.count += 1;
  });

  const max      = Math.max(1, ...buckets.map((b) => b.count));
  const gap      = dias > 120 ? 2 : 5;
  const largBarra = Math.max(2, (largura - gap * (dias - 1)) / dias);
  const altGrafico = 168;

  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.fillRect(0, 190, largura, 1);

  buckets.forEach((bucket, i) => {
    const altura = (bucket.count / max) * altGrafico;
    const x = i * (largBarra + gap);
    const y = 185 - altura;
    const grad = ctx.createLinearGradient(0, y, 0, 185);
    grad.addColorStop(0, "#ff365f");
    grad.addColorStop(1, "#19c6b7");
    ctx.fillStyle = grad;
    arredondarRetangulo(ctx, x, y, largBarra, Math.max(altura, 3), 4);
    ctx.fill();
  });

  ctx.fillStyle = "#9aa3b2";
  ctx.font      = "12px Inter, sans-serif";
  ctx.fillText(buckets[0]?.label || "", 0, 214);
  ctx.textAlign = "right";
  ctx.fillText(buckets[buckets.length - 1]?.label || "", largura, 214);
  ctx.textAlign = "left";
}

// ─── Animação do pulso ────────────────────────────────────────────────────────

export function animarPulso() {
  const canvas = elementos.canvasPulso;
  const ctx    = canvas.getContext("2d");
  const ratio  = window.devicePixelRatio || 1;
  const rect   = canvas.getBoundingClientRect();
  canvas.width  = rect.width  * ratio;
  canvas.height = rect.height * ratio;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const cx   = rect.width  / 2;
  const cy   = rect.height / 2;
  const base = Math.min(rect.width, rect.height) * 0.22;
  const qtdArtistas = Math.max(4, getEstatisticasArtista(estado.tracks).length || 8);
  const tempo = Date.now() / 900;

  const grad = ctx.createRadialGradient(cx, cy, base * 0.2, cx, cy, base * 2.8);
  grad.addColorStop(0,    "rgba(216, 59, 71, 0.34)");
  grad.addColorStop(0.58, "rgba(31, 122, 114, 0.24)");
  grad.addColorStop(1,    "rgba(8, 9, 13, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, rect.width, rect.height);

  for (let i = 0; i < qtdArtistas; i += 1) {
    const angulo = (Math.PI * 2 * i) / qtdArtistas + tempo * 0.16;
    const onda   = Math.sin(tempo + i * 0.8) * 18;
    const raio   = base + i * 8 + onda;
    ctx.beginPath();
    ctx.arc(cx, cy, raio, angulo, angulo + Math.PI * 1.15);
    ctx.strokeStyle = i % 3 === 0 ? "#ff365f" : i % 3 === 1 ? "#19c6b7" : "#f5a524";
    ctx.lineWidth   = 7;
    ctx.lineCap     = "round";
    ctx.globalAlpha = 0.78;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, base * 0.46, 0, Math.PI * 2);
  ctx.fillStyle   = "#12141c";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.lineWidth   = 1;
  ctx.stroke();

  requestAnimationFrame(animarPulso);
}

// ─── Exportações ──────────────────────────────────────────────────────────────

export function exportarPdf() {
  if (!estado.tracks.length) return;
  window.print();
}

export function exportarXls() {
  if (!estado.tracks.length) return;
  const visiveis    = getTracksVisiveis();
  const escopoTrack = getTracksPorEscopo();
  const limite      = Number(elementos.limitResultados.value);

  const artistasTop  = getEstatisticasArtista(visiveis).slice(0, limite);
  const faixasTop    = getEstatisticasFaixa(visiveis).slice(0, limite);
  const albumsTop    = getEstatisticasAlbum(visiveis).slice(0, limite);
  const melhorDia_   = getMelhorDia(escopoTrack);
  const melhorAno_   = getMelhorAno(escopoTrack);
  const maiorRepet_  = getMaiorRepeticao(escopoTrack);

  const linhasResumo = [
    ["Relatório gerado em",      formatarDataHora(Date.now())],
    ["Recorte aplicado",          getRotuloFiltroAtivo()],
    ["Última atualização da API", localStorage.getItem("lastMasterLastApiSync") ? formatarDataHora(localStorage.getItem("lastMasterLastApiSync")) : "Nunca"],
    ["Scrobbles no escopo",       escopoTrack.length],
    ["Artistas únicos",           getEstatisticasArtista(escopoTrack).length],
    ["Dia mais musical",          melhorDia_  ? `${formatarChaveData(melhorDia_.key)} (${melhorDia_.count})`            : "Sem dados"],
    ["Ano mais ouvido",           melhorAno_  ? `${melhorAno_.key} (${melhorAno_.count})`                               : "Sem dados"],
    ["Maior repetição seguida",   maiorRepet_ ? `${maiorRepet_.track.name} - ${maiorRepet_.track.artist} (${maiorRepet_.count})` : "Sem dados"],
  ];
  const linhasHistorico = [...visiveis]
    .sort((a, b) => b.playedAt - a.playedAt)
    .map((t) => [formatarDataHora(t.playedAt), t.artist, t.name, t.album, (t.genres || []).join(", "), t.artistYear || ""]);

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;color:#111827}
h1,h2{margin:0 0 12px}
table{border-collapse:collapse;margin-bottom:24px;width:100%}
th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}
th{background:#f1f5f9}
</style></head><body>
<h1>Last Master — relatório musical</h1>
<h2>Resumo</h2><table><tbody>${linhasResumo.map((r) => `<tr>${r.map((c) => `<td>${escaparHtml(String(c ?? ""))}</td>`).join("")}</tr>`).join("")}</tbody></table>
<h2>Top artistas</h2><table><thead><tr><th>Artista</th><th>Scrobbles</th><th>Faixas diferentes</th></tr></thead><tbody>${artistasTop.map((a) => `<tr><td>${escaparHtml(a.artist)}</td><td>${a.count}</td><td>${a.tracks.size}</td></tr>`).join("")}</tbody></table>
<h2>Top músicas</h2><table><thead><tr><th>Música</th><th>Artista</th><th>Scrobbles</th></tr></thead><tbody>${faixasTop.map((f) => `<tr><td>${escaparHtml(f.name)}</td><td>${escaparHtml(f.artist)}</td><td>${f.count}</td></tr>`).join("")}</tbody></table>
<h2>Top álbuns</h2><table><thead><tr><th>Álbum</th><th>Artista</th><th>Scrobbles</th></tr></thead><tbody>${albumsTop.map((a) => `<tr><td>${escaparHtml(a.album)}</td><td>${escaparHtml(a.artist)}</td><td>${a.count}</td></tr>`).join("")}</tbody></table>
<h2>Histórico filtrado</h2><table><thead><tr><th>Data e hora</th><th>Artista</th><th>Música</th><th>Álbum</th><th>Estilos</th><th>Ano da banda</th></tr></thead><tbody>${linhasHistorico.map((r) => `<tr>${r.map((c) => `<td>${escaparHtml(String(c ?? ""))}</td>`).join("")}</tr>`).join("")}</tbody></table>
</body></html>`;

  import("./utilidades.js").then(({ baixarArquivo, sufixoArquivoRelatorio }) => {
    baixarArquivo(`﻿${html}`, `last-master-relatorio-${sufixoArquivoRelatorio()}.xls`, "application/vnd.ms-excel;charset=utf-8");
  });
}

export function baixarImagemGrafico() {
  if (!elementos.graficoAtividade) return;
  desenharGraficoAtividade();
  import("./utilidades.js").then(({ sufixoArquivoRelatorio, exibirNotificacao: notif }) => {
    const link      = document.createElement("a");
    link.href       = elementos.graficoAtividade.toDataURL("image/png");
    link.download   = `last-master-grafico-${sufixoArquivoRelatorio()}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    notif("Gráfico exportado em PNG.");
  });
}
