/**
 * elementos.js
 * Referências a todos os elementos do DOM usados pela aplicação.
 *
 * Centralizar aqui evita chamadas repetidas a querySelector espalhadas pelo
 * código e facilita localizar o elemento pelo ID sem abrir o HTML.
 */

const el = (id) => document.querySelector(`#${id}`);

export const elementos = {
  // ─── Gráficos e canvas ─────────────────────────────────────────────────
  graficoAtividade:      el("activityChart"),
  canvasPulso:           el("pulseCanvas"),

  // ─── Filtros de período ────────────────────────────────────────────────
  filtroPeriodo:         el("periodSelect"),
  filtroDia:             el("dayFilter"),
  filtroMes:             el("monthFilter"),
  filtroAno:             el("yearFilter"),
  wrapFiltroDia:         el("dayFilterWrap"),
  wrapFiltroMes:         el("monthFilterWrap"),
  wrapFiltroAno:         el("yearFilterWrap"),

  // ─── Filtros de conteúdo ───────────────────────────────────────────────
  filtroArtista:         el("artistFilterSelect"),
  filtroAlbum:           el("albumFilterSelect"),
  tipoFoco:              el("focusTypeSelect"),
  valorFoco:             el("focusValueInput"),
  opcoesFoco:            el("focusOptions"),

  // ─── Visualização e escopo ─────────────────────────────────────────────
  seletorVisualizacao:   el("analysisViewSelect"),
  escopoMetricas:        el("metricScopeSelect"),
  limitResultados:       el("resultLimitSelect"),
  limitResultadosGaveta: el("drawerResultLimitSelect"),
  rangeAtividade:        el("rangeSelect"),
  rangeAtividadeGaveta:  el("drawerRangeSelect"),

  // ─── Métricas principais ───────────────────────────────────────────────
  totalScrobbles:        el("totalScrobbles"),
  deltaSrobbbles:        el("scrobbleDelta"),
  artistasUnicos:        el("uniqueArtists"),
  deltaArtistas:         el("artistDelta"),
  minutosOuvidos:        el("minutesListened"),
  faixaTopo:             el("topTrack"),
  artistaFaixaTopo:      el("topTrackArtist"),
  melhorDia:             el("bestDay"),
  contadorMelhorDia:     el("bestDayCount"),
  maiorRepeticao:        el("longestRepeat"),
  contadorMaiorRepeticao: el("longestRepeatCount"),
  melhorAno:             el("bestYear"),
  contadorMelhorAno:     el("bestYearCount"),
  melhorFaixaDia:        el("bestTrackDay"),
  contadorMelhorFaixaDia: el("bestTrackDayCount"),
  melhorArtistaDia:      el("bestArtistDay"),
  contadorMelhorArtistaDia: el("bestArtistDayCount"),
  melhorAlbumDia:        el("bestAlbumDay"),
  contadorMelhorAlbumDia: el("bestAlbumDayCount"),

  // ─── Spotlight (faixa em destaque) ────────────────────────────────────
  spotlightFaixa:        el("spotlightTrack"),
  spotlightArtista:      el("spotlightArtist"),
  spotlightImagem:       el("spotlightImage"),

  // ─── Listas de conteúdo ────────────────────────────────────────────────
  listaFaixas:           el("trackList"),
  contadorListaFaixas:   el("trackListCount"),
  listaArtistas:         el("artistList"),
  listaAlbuns:           el("albumList"),
  listaGeneros:          el("genreList"),
  listaHorarios:         el("hourlyList"),
  listaAnoBanda:         el("artistYearList"),
  listaMensalTop:        el("monthlyTopList"),
  listaAlbunsArtista:    el("bandAlbumList"),
  secaoAlbunsArtista:    el("bandAlbumsSection"),

  // ─── Chips de filtro ativo ─────────────────────────────────────────────
  rotuloFiltroAtivo:     el("activeFilterLabel"),
  chipsFiltroPAtivo:     el("activeFilterChips"),

  // ─── Meta / semana ─────────────────────────────────────────────────────
  inputMeta:             el("goalInput"),
  outputMeta:            el("goalOutput"),
  barraMeta:             el("goalBar"),
  textoMeta:             el("goalText"),

  // ─── Sequência (streak) ────────────────────────────────────────────────
  valorSequencia:        el("streakValue"),
  dicaSequencia:         el("streakHint"),

  // ─── Métricas sugeridas ────────────────────────────────────────────────
  secaoMetricasSugeridas: el("suggestedMetricsSection"),
  listaMetricasSugeridas: el("suggestedMetricsList"),

  // ─── Controles de conta ────────────────────────────────────────────────
  formularioLastfm:      el("lastfmForm"),
  inputUsuario:          el("usernameInput"),
  inputApiKey:           el("apiKeyInput"),
  checkboxLembrarKey:    el("rememberApiKeyCheckbox"),
  botaoLimparApiKey:     el("clearApiKeyButton"),
  statusConexao:         el("connectionStatus"),
  ultimaSincLabel:       el("lastSyncLabel"),

  // ─── Onboarding / modal ────────────────────────────────────────────────
  modalOnboarding:       el("onboardingModal"),
  botaoAbrirOnboarding:  el("openOnboardingButton"),
  botaoConectarHero:     el("connectHeroButton"),
  botaoConectarVazio:    el("emptyConnectButton"),
  botaoDemoVazio:        el("emptyDemoButton"),
  botaoDemoModal:        el("modalDemoButton"),
  botaoDemoMenu:         el("loadDemoButton"),
  estadoVazio:           el("emptyState"),

  // ─── Importação manual ─────────────────────────────────────────────────
  areaImportacao:        el("manualInput"),
  botaoImportar:         el("importButton"),

  // ─── Filtros avançados ─────────────────────────────────────────────────
  botaoFiltrosAvancados: el("advancedFiltersButton"),
  gaveta:                el("advancedFilters"),
  botaoLimparFiltros:    el("clearFiltersButton"),

  // ─── Botões de exportação ──────────────────────────────────────────────
  botaoExportarPdf:      el("exportPdfButton"),
  botaoExportarXls:      el("exportXlsButton"),
  botaoBaixarGrafico:    el("downloadChartButton"),

  // ─── Ordenação e métricas extras ──────────────────────────────────────
  botaoOrdenarArtistas:  el("sortArtistsButton"),
  detalhesMetricasExtras: el("moreMetricsDetails"),

  // ─── Notificação (toast) ───────────────────────────────────────────────
  toast:                 el("toast"),
};
