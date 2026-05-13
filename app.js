const LASTFM_API = "https://ws.audioscrobbler.com/2.0/";
const CACHE_VERSION = "period-cache-v2";
const DEFAULT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23d83b47'/%3E%3Cstop offset='0.55' stop-color='%231f7a72'/%3E%3Cstop offset='1' stop-color='%23bf7b22'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='240' height='240' fill='url(%23g)'/%3E%3Ccircle cx='120' cy='120' r='54' fill='none' stroke='rgba(255,255,255,.72)' stroke-width='18'/%3E%3Ccircle cx='120' cy='120' r='10' fill='rgba(255,255,255,.85)'/%3E%3C/svg%3E";

const demoCatalog = [
  { artist: "Sade", name: "No Ordinary Love - 2011 Remaster", album: "Love Deluxe", genres: ["soul", "smooth jazz"], artistYear: "1982" },
  { artist: "Radiohead", name: "Reckoner", album: "In Rainbows", genres: ["alternative rock", "art rock"], artistYear: "1985" },
  { artist: "Baco Exu do Blues", name: "Te Amo Desgraça", album: "Esu", genres: ["rap", "mpb"], artistYear: "2016" },
  { artist: "Mitski", name: "My Love Mine All Mine", album: "The Land Is Inhospitable and So Are We", genres: ["indie rock", "singer-songwriter"], artistYear: "2012" },
  { artist: "Fleetwood Mac", name: "Dreams - 2004 Remaster", album: "Rumours", genres: ["classic rock", "pop rock"], artistYear: "1967" },
  { artist: "Sade", name: "Kiss of Life", album: "Love Deluxe", genres: ["soul", "quiet storm"], artistYear: "1982" },
  { artist: "Jorge Ben Jor", name: "Taj Mahal", album: "Africa Brasil", genres: ["samba rock", "mpb"], artistYear: "1963" },
  { artist: "Radiohead", name: "Nude", album: "In Rainbows", genres: ["alternative rock", "art rock"], artistYear: "1985" },
  { artist: "Rosalia", name: "SAOKO", album: "MOTOMAMI", genres: ["latin pop", "flamenco pop"], artistYear: "2017" },
  { artist: "Tim Maia", name: "Azul da Cor do Mar - Remastered", album: "Tim Maia", genres: ["soul", "mpb"], artistYear: "1970" },
  { artist: "Mitski", name: "Nobody", album: "Be the Cowboy", genres: ["indie pop", "indie rock"], artistYear: "2012" },
  { artist: "Liniker", name: "Baby 95", album: "Caju", genres: ["mpb", "soul"], artistYear: "2015" },
  { artist: "Sade", name: "Smooth Operator", album: "Diamond Life", genres: ["soul", "sophisti-pop"], artistYear: "1982" },
  { artist: "Radiohead", name: "Weird Fishes / Arpeggi", album: "In Rainbows", genres: ["alternative rock", "art rock"], artistYear: "1985" },
  { artist: "Tim Maia", name: "Gostava Tanto de Você", album: "Tim Maia", genres: ["soul", "mpb"], artistYear: "1970" },
  { artist: "Jorge Ben Jor", name: "Chove Chuva", album: "Samba Esquema Novo", genres: ["samba rock", "mpb"], artistYear: "1963" },
  { artist: "Liniker", name: "Caju", album: "Caju", genres: ["mpb", "soul"], artistYear: "2015" },
  { artist: "Rosalia", name: "MOTOMAMI", album: "MOTOMAMI", genres: ["latin pop", "experimental pop"], artistYear: "2017" }
];

const demoTracks = Array.from({ length: 180 }, (_, index) => {
  const item = demoCatalog[(index * 7 + index % 5) % demoCatalog.length];
  const playedAt = new Date();
  playedAt.setDate(playedAt.getDate() - (index % 155));
  playedAt.setHours((index * 3 + 8) % 24, (index * 11) % 60, 0, 0);
  return {
    artist: item.artist,
    name: cleanTrackName(item.name),
    album: cleanAlbumName(item.album),
    playedAt: playedAt.getTime(),
    image: DEFAULT_IMAGE,
    genres: item.genres,
    artistYear: item.artistYear
  };
});

let tracks = [];
let artistsAscending = false;

const elements = {
  activityChart: document.querySelector("#activityChart"),
  activeFilterLabel: document.querySelector("#activeFilterLabel"),
  activeFilterChips: document.querySelector("#activeFilterChips"),
  advancedFilters: document.querySelector("#advancedFilters"),
  advancedFiltersButton: document.querySelector("#advancedFiltersButton"),
  analysisViewSelect: document.querySelector("#analysisViewSelect"),
  albumList: document.querySelector("#albumList"),
  albumFilterSelect: document.querySelector("#albumFilterSelect"),
  apiKeyInput: document.querySelector("#apiKeyInput"),
  artistFilterSelect: document.querySelector("#artistFilterSelect"),
  artistDelta: document.querySelector("#artistDelta"),
  artistList: document.querySelector("#artistList"),
  artistYearList: document.querySelector("#artistYearList"),
  bandAlbumList: document.querySelector("#bandAlbumList"),
  bandAlbumsSection: document.querySelector("#bandAlbumsSection"),
  bestAlbumDay: document.querySelector("#bestAlbumDay"),
  bestAlbumDayCount: document.querySelector("#bestAlbumDayCount"),
  bestArtistDay: document.querySelector("#bestArtistDay"),
  bestArtistDayCount: document.querySelector("#bestArtistDayCount"),
  bestDay: document.querySelector("#bestDay"),
  bestDayCount: document.querySelector("#bestDayCount"),
  bestTrackDay: document.querySelector("#bestTrackDay"),
  bestTrackDayCount: document.querySelector("#bestTrackDayCount"),
  dayFilter: document.querySelector("#dayFilter"),
  dayFilterWrap: document.querySelector("#dayFilterWrap"),
  downloadChartButton: document.querySelector("#downloadChartButton"),
  emptyConnectButton: document.querySelector("#emptyConnectButton"),
  emptyDemoButton: document.querySelector("#emptyDemoButton"),
  emptyState: document.querySelector("#emptyState"),
  exportPdfButton: document.querySelector("#exportPdfButton"),
  exportXlsButton: document.querySelector("#exportXlsButton"),
  focusOptions: document.querySelector("#focusOptions"),
  focusTypeSelect: document.querySelector("#focusTypeSelect"),
  focusValueInput: document.querySelector("#focusValueInput"),
  genreList: document.querySelector("#genreList"),
  goalBar: document.querySelector("#goalBar"),
  goalInput: document.querySelector("#goalInput"),
  goalOutput: document.querySelector("#goalOutput"),
  goalText: document.querySelector("#goalText"),
  hourlyList: document.querySelector("#hourlyList"),
  importButton: document.querySelector("#importButton"),
  lastSyncLabel: document.querySelector("#lastSyncLabel"),
  lastfmForm: document.querySelector("#lastfmForm"),
  loadDemoButton: document.querySelector("#loadDemoButton"),
  manualInput: document.querySelector("#manualInput"),
  minutesListened: document.querySelector("#minutesListened"),
  metricScopeSelect: document.querySelector("#metricScopeSelect"),
  modalDemoButton: document.querySelector("#modalDemoButton"),
  monthFilter: document.querySelector("#monthFilter"),
  monthFilterWrap: document.querySelector("#monthFilterWrap"),
  monthlyTopList: document.querySelector("#monthlyTopList"),
  moreMetricsDetails: document.querySelector("#moreMetricsDetails"),
  onboardingModal: document.querySelector("#onboardingModal"),
  openOnboardingButton: document.querySelector("#openOnboardingButton"),
  periodSelect: document.querySelector("#periodSelect"),
  pulseCanvas: document.querySelector("#pulseCanvas"),
  rangeSelect: document.querySelector("#rangeSelect"),
  rememberApiKeyCheckbox: document.querySelector("#rememberApiKeyCheckbox"),
  resultLimitSelect: document.querySelector("#resultLimitSelect"),
  searchFiltersButton: document.querySelector("#searchFiltersButton"),
  scrobbleDelta: document.querySelector("#scrobbleDelta"),
  sortArtistsButton: document.querySelector("#sortArtistsButton"),
  spotlightArtist: document.querySelector("#spotlightArtist"),
  spotlightImage: document.querySelector("#spotlightImage"),
  spotlightTrack: document.querySelector("#spotlightTrack"),
  streakHint: document.querySelector("#streakHint"),
  streakValue: document.querySelector("#streakValue"),
  suggestedMetricsList: document.querySelector("#suggestedMetricsList"),
  suggestedMetricsSection: document.querySelector("#suggestedMetricsSection"),
  toast: document.querySelector("#toast"),
  topTrack: document.querySelector("#topTrack"),
  topTrackArtist: document.querySelector("#topTrackArtist"),
  trackList: document.querySelector("#trackList"),
  trackListCount: document.querySelector("#trackListCount"),
  totalScrobbles: document.querySelector("#totalScrobbles"),
  uniqueArtists: document.querySelector("#uniqueArtists"),
  longestRepeat: document.querySelector("#longestRepeat"),
  longestRepeatCount: document.querySelector("#longestRepeatCount"),
  bestYear: document.querySelector("#bestYear"),
  bestYearCount: document.querySelector("#bestYearCount"),
  usernameInput: document.querySelector("#usernameInput"),
  connectHeroButton: document.querySelector("#connectHeroButton"),
  clearApiKeyButton: document.querySelector("#clearApiKeyButton"),
  clearFiltersButton: document.querySelector("#clearFiltersButton"),
  connectionStatus: document.querySelector("#connectionStatus"),
  drawerResultLimitSelect: document.querySelector("#drawerResultLimitSelect"),
  drawerRangeSelect: document.querySelector("#drawerRangeSelect"),
  yearFilter: document.querySelector("#yearFilter"),
  yearFilterWrap: document.querySelector("#yearFilterWrap")
};

const primaryMetricKeys = new Set(["scrobbles", "topTrack", "bestDay", "longestRepeat", "bestYear"]);
document.querySelector(".filter-workbench")?.after(elements.advancedFilters);

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 3200);
}

function setConnectionStatus(message, type = "info") {
  if (!elements.connectionStatus) return;
  elements.connectionStatus.textContent = message;
  elements.connectionStatus.dataset.type = type;
}

function getLastfmErrorMessage(error) {
  const message = String(error?.message || error || "Não foi possível conectar com a Last.fm.");
  if (/invalid api key/i.test(message)) return "API key inválida. Confira se você copiou a chave correta no site da Last.fm.";
  if (/user not found|no user/i.test(message)) return "Usuário não encontrado. Confira o nome da conta do Last.fm.";
  if (/failed to fetch|network/i.test(message)) return "Não consegui acessar a Last.fm. Verifique a internet e rode o projeto por localhost.";
  return message;
}

function clearSavedApiKey() {
  localStorage.removeItem("lastMasterApiKey");
  sessionStorage.removeItem("lastMasterApiKey");
  localStorage.removeItem("lastMasterLastApiSync");
  elements.apiKeyInput.value = "";
  if (elements.rememberApiKeyCheckbox) elements.rememberApiKeyCheckbox.checked = false;
  renderLastSync();
  setConnectionStatus("API key apagada deste navegador.", "success");
  showToast("API key salva removida.");
}

function getSavedCredentials() {
  return {
    username: localStorage.getItem("lastMasterUsername") || "",
    apiKey: localStorage.getItem("lastMasterApiKey") || sessionStorage.getItem("lastMasterApiKey") || ""
  };
}

function getLoadedRanges() {
  try {
    return new Set(JSON.parse(localStorage.getItem("lastMasterLoadedRanges") || "[]"));
  } catch {
    return new Set();
  }
}

function saveLoadedRanges(ranges) {
  localStorage.setItem("lastMasterLoadedRanges", JSON.stringify([...ranges]));
}

function markRangeLoaded(key) {
  const ranges = getLoadedRanges();
  ranges.add(key);
  saveLoadedRanges(ranges);
}

function isRangeLoaded(key) {
  return getLoadedRanges().has(key);
}

function isRangeCovered(key) {
  const ranges = getLoadedRanges();
  if (ranges.has("history:full")) return true;
  if (ranges.has(key)) return true;

  const [type, value] = String(key).split(":");
  if (!value) return false;

  const year = value.slice(0, 4);
  const month = value.slice(0, 7);
  if ((type === "month" || type === "day") && ranges.has(`year:${year}`)) return true;
  if (type === "day" && ranges.has(`month:${month}`)) return true;
  return false;
}

function trackIdentity(track) {
  return `${track.playedAt}-${track.artist}-${track.name}-${track.album}`;
}

function persistTracksCache() {
  try {
    localStorage.setItem("lastMasterTracks", JSON.stringify(tracks));
    return true;
  } catch {
    showToast("O cache do navegador ficou cheio. O recorte aparece agora, mas talvez não fique salvo para a próxima sessão.");
    return false;
  }
}

function mergeTracks(newTracks) {
  const map = new Map(tracks.map((track) => [trackIdentity(track), track]));
  newTracks.map(sanitizeSavedTrack).forEach((track) => {
    map.set(trackIdentity(track), track);
  });
  tracks = [...map.values()].sort((a, b) => b.playedAt - a.playedAt);
  return persistTracksCache();
}

function cleanTrackName(value) {
  return String(value || "Faixa sem título")
    .replace(/\s*[\[(][^\])]*(remaster|remastered|remasterizado|remasterizada)[^\])]*[\])]/gi, "")
    .replace(/\s*[-\u2013\u2014]\s*(\d{4}\s*)?(digital\s*)?(mono\s*)?(stereo\s*)?(version\s*)?(remaster|remastered|remasterizado|remasterizada).*$/i, "")
    .replace(/\s+\d{4}\s+(remaster|remastered|remasterizado|remasterizada).*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanAlbumName(value) {
  return String(value || "Álbum desconhecido")
    .replace(/\s*[\[(][^\])]*(remaster|remastered|remasterizado|remasterizada)[^\])]*[\])]/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizeTrack(track) {
  const artist = typeof track.artist === "string" ? track.artist : track.artist?.["#text"];
  const image = track.image?.find((item) => item.size === "extralarge")?.["#text"] || DEFAULT_IMAGE;
  return {
    artist: artist || "Artista desconhecido",
    name: cleanTrackName(track.name),
    album: cleanAlbumName(track.album?.["#text"]),
    playedAt: track.date?.uts ? Number(track.date.uts) * 1000 : Date.now(),
    image,
    genres: [],
    artistYear: ""
  };
}

function dateKey(timestamp) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthKey(timestamp) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatMonthKey(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function renderLastSync() {
  if (!elements.lastSyncLabel) return;
  const lastSync = localStorage.getItem("lastMasterLastApiSync");
  elements.lastSyncLabel.textContent = lastSync
    ? `Última atualização da API: ${formatDateTime(lastSync)}`
    : "Última atualização da API: nunca";
}

function getVisibleTracks() {
  const period = elements.periodSelect.value;
  let filtered = tracks;
  if (period === "day") {
    filtered = tracks.filter((track) => dateKey(track.playedAt) === elements.dayFilter.value);
  }
  if (period === "month") {
    filtered = tracks.filter((track) => monthKey(track.playedAt) === elements.monthFilter.value);
  }
  if (period === "year") {
    filtered = tracks.filter((track) => String(new Date(track.playedAt).getFullYear()) === elements.yearFilter.value);
  }

  if (elements.artistFilterSelect.value) {
    filtered = filtered.filter((track) => track.artist === elements.artistFilterSelect.value);
  }

  if (elements.albumFilterSelect.value) {
    filtered = filtered.filter((track) => track.album === elements.albumFilterSelect.value);
  }

  const focusType = elements.focusTypeSelect.value;
  const focusValue = elements.focusValueInput.value.trim().toLowerCase();
  if (!focusValue || focusType === "all") return filtered;

  return filtered.filter((track) => {
    if (focusType === "artist") return track.artist.toLowerCase().includes(focusValue);
    if (focusType === "album") return track.album.toLowerCase().includes(focusValue);
    if (focusType === "track") return `${track.name} - ${track.artist}`.toLowerCase().includes(focusValue);
    if (focusType === "genre") return (track.genres || []).some((genre) => genre.toLowerCase().includes(focusValue));
    return true;
  });
}

function getMetricScopeTracks() {
  let scoped = tracks;
  if (elements.metricScopeSelect.value === "month") {
    scoped = tracks.filter((track) => monthKey(track.playedAt) === elements.monthFilter.value);
  }
  if (elements.metricScopeSelect.value === "year") {
    scoped = tracks.filter((track) => String(new Date(track.playedAt).getFullYear()) === elements.yearFilter.value);
  }
  return scoped;
}

function getFilteredLabel() {
  const focusValue = elements.focusTypeSelect.value === "all" ? "" : elements.focusValueInput.value.trim();
  const suffix = focusValue ? ` + ${focusValue}` : "";
  if (elements.periodSelect.value === "day") return `${elements.dayFilter.value ? formatDateKey(elements.dayFilter.value) : "Dia"}${suffix}`;
  if (elements.periodSelect.value === "month") return `${elements.monthFilter.value ? formatMonthKey(elements.monthFilter.value) : "Mês"}${suffix}`;
  if (elements.periodSelect.value === "year") return `${elements.yearFilter.value || "Ano"}${suffix}`;
  return `Todo o histórico${suffix}`;
}

function getPeriodLabel() {
  const now = new Date();
  const currentMonth = monthKey(now.getTime());
  const currentYear = String(now.getFullYear());
  if (elements.periodSelect.value === "day") return elements.dayFilter.value ? formatDateKey(elements.dayFilter.value) : "Dia específico";
  if (elements.periodSelect.value === "month") return elements.monthFilter.value === currentMonth ? "Mês atual" : formatMonthKey(elements.monthFilter.value);
  if (elements.periodSelect.value === "year") return elements.yearFilter.value === currentYear ? "Ano atual" : elements.yearFilter.value;
  return "Todo o histórico";
}

function countBy(items, getKey, createExtra = () => ({})) {
  const map = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    if (!key) return;
    const current = map.get(key) || { key, count: 0, ...createExtra(item, key) };
    current.count += 1;
    map.set(key, current);
  });
  return [...map.values()].sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)));
}

function getArtistStats(source = getVisibleTracks()) {
  const map = new Map();
  source.forEach((track) => {
    const current = map.get(track.artist) || { artist: track.artist, count: 0, tracks: new Set(), year: track.artistYear, genres: new Set() };
    current.count += 1;
    current.tracks.add(track.name);
    if (track.artistYear) current.year = track.artistYear;
    (track.genres || []).forEach((genre) => current.genres.add(genre));
    map.set(track.artist, current);
  });
  return [...map.values()].sort((a, b) => artistsAscending ? a.count - b.count : b.count - a.count);
}

function getTrackStats(source = getVisibleTracks()) {
  return countBy(source, (track) => `${track.artist}::${track.name}`, (track) => ({ ...track }));
}

function getBestDay(source) {
  return countBy(source, (track) => dateKey(track.playedAt))[0];
}

function getBestYear(source) {
  return countBy(source, (track) => String(new Date(track.playedAt).getFullYear()))[0];
}

function getLongestRepeat(source) {
  const ordered = [...source].sort((a, b) => a.playedAt - b.playedAt);
  let best = null;
  let current = null;

  ordered.forEach((track) => {
    const key = `${track.artist}::${track.name}`;
    if (current?.key === key) {
      current.count += 1;
      current.end = track.playedAt;
    } else {
      current = { key, count: 1, track, start: track.playedAt, end: track.playedAt };
    }
    if (!best || current.count > best.count) best = { ...current };
  });

  return best;
}

function getBestByDay(source, getEntity, labelFactory) {
  return countBy(source, (track) => `${dateKey(track.playedAt)}::${getEntity(track)}`, (track) => ({
    day: dateKey(track.playedAt),
    label: labelFactory(track)
  }))[0];
}

function renderMetrics() {
  const visible = getMetricScopeTracks();
  const artistStats = getArtistStats(visible);
  const trackStats = getTrackStats(visible);
  const uniqueArtists = artistStats.length;
  const weekly = tracks.filter((track) => Date.now() - track.playedAt < 7 * 24 * 60 * 60 * 1000).length;
  const bestDay = getBestDay(visible);
  const bestYear = getBestYear(visible);
  const longestRepeat = getLongestRepeat(visible);
  const bestTrackDay = getBestByDay(visible, (track) => `${track.artist}::${track.name}`, (track) => `${track.name} - ${track.artist}`);
  const bestArtistDay = getBestByDay(visible, (track) => track.artist, (track) => track.artist);
  const bestAlbumDay = getBestByDay(visible, (track) => `${track.artist}::${track.album}`, (track) => `${track.album} - ${track.artist}`);

  elements.activeFilterLabel.textContent = getFilteredLabel();
  elements.totalScrobbles.textContent = formatNumber(visible.length);
  elements.scrobbleDelta.textContent = visible.length ? `${formatNumber(weekly)} nos últimos 7 dias` : "Conecte sua conta para começar";
  elements.uniqueArtists.textContent = formatNumber(uniqueArtists);
  elements.artistDelta.textContent = visible.length ? `${Math.round((uniqueArtists / visible.length) * 100)}% de variedade` : "Sua variedade musical aparecerá aqui";
  elements.minutesListened.textContent = formatNumber(Math.round(visible.length * 3.5));

  if (trackStats[0]) {
    elements.topTrack.textContent = trackStats[0].name;
    elements.topTrackArtist.textContent = `${trackStats[0].artist} - ${trackStats[0].count} plays`;
    elements.spotlightTrack.textContent = visible[0].name;
    elements.spotlightArtist.textContent = visible[0].artist;
    elements.spotlightImage.src = visible[0].image || DEFAULT_IMAGE;
    elements.spotlightImage.alt = `Capa de ${visible[0].name}`;
  } else {
    elements.topTrack.textContent = "Sem dados ainda";
    elements.topTrackArtist.textContent = "Vamos descobrir seu replay favorito";
    elements.spotlightTrack.textContent = "Nenhuma faixa carregada";
    elements.spotlightArtist.textContent = "Conecte sua conta para carregar seus destaques";
    elements.spotlightImage.src = DEFAULT_IMAGE;
    elements.spotlightImage.alt = "";
  }

  elements.bestDay.textContent = bestDay ? formatDateKey(bestDay.key) : "Sem dados ainda";
  elements.bestDayCount.textContent = bestDay ? `${bestDay.count} scrobbles` : "O dia mais intenso aparecerá aqui";
  elements.longestRepeat.textContent = longestRepeat ? longestRepeat.track.name : "Sem dados ainda";
  elements.longestRepeatCount.textContent = longestRepeat ? `${longestRepeat.count} vezes seguidas - ${longestRepeat.track.artist}` : "Sequência sem parar da mesma música";
  elements.bestYear.textContent = bestYear ? bestYear.key : "Sem dados ainda";
  elements.bestYearCount.textContent = bestYear ? `${bestYear.count} scrobbles no ano` : "Ano com mais scrobbles";
  elements.bestTrackDay.textContent = bestTrackDay ? bestTrackDay.label : "Sem dados ainda";
  elements.bestTrackDayCount.textContent = bestTrackDay ? `${bestTrackDay.count} vezes em ${formatDateKey(bestTrackDay.day)}` : "faixa mais repetida em um dia";
  elements.bestArtistDay.textContent = bestArtistDay ? bestArtistDay.label : "Sem dados ainda";
  elements.bestArtistDayCount.textContent = bestArtistDay ? `${bestArtistDay.count} plays em ${formatDateKey(bestArtistDay.day)}` : "artista mais ouvido em um dia";
  elements.bestAlbumDay.textContent = bestAlbumDay ? bestAlbumDay.label : "Sem dados ainda";
  elements.bestAlbumDayCount.textContent = bestAlbumDay ? `${bestAlbumDay.count} plays em ${formatDateKey(bestAlbumDay.day)}` : "álbum mais ouvido em um dia";

  document.querySelectorAll(".album-art").forEach((image, index) => {
    image.src = visible[index]?.image || DEFAULT_IMAGE;
    image.alt = "";
  });
}

function renderArtists() {
  const limit = Number(elements.resultLimitSelect.value);
  const artistStats = getArtistStats().slice(0, limit);
  elements.artistList.innerHTML = "";

  if (!artistStats.length) {
    elements.artistList.innerHTML = "<p class=\"helper\">Nenhum artista encontrado nesse recorte. Ajuste os filtros ou conecte mais histórico.</p>";
    return;
  }

  artistStats.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "artist-row";
    row.innerHTML = `
      <span class="rank">${index + 1}</span>
      <span class="artist-avatar" aria-hidden="true">${escapeHtml(item.artist.slice(0, 1).toUpperCase())}</span>
      <span class="artist-name">
        <strong>${escapeHtml(item.artist)}</strong>
        <span>${item.tracks.size} faixas diferentes${item.year ? ` - desde ${escapeHtml(item.year)}` : ""}</span>
      </span>
      <span class="play-count">${item.count}</span>
    `;
    elements.artistList.append(row);
  });
}

function renderAnalytics() {
  const visible = getVisibleTracks();
  const limit = Number(elements.resultLimitSelect.value);
  renderMonthlyTop();
  renderDataList(elements.hourlyList, getHourlyStats(visible).slice(0, limit), (item) => ({
    title: item.key,
    detail: `${item.percent}% do filtro selecionado`,
    count: item.count
  }));
  renderDataList(elements.genreList, getGenreStats(visible).slice(0, limit), (item) => ({
    title: item.key,
    detail: "estilo associado aos artistas/faixas",
    count: item.count
  }));
  renderDataList(elements.artistYearList, getArtistYearStats(visible).slice(0, limit), (item) => ({
    title: item.artist,
    detail: item.year ? `ano informado: ${item.year}` : "ano nao informado pela Last.fm",
    count: item.count
  }));
  renderDataList(elements.albumList, getAlbumStats(visible).slice(0, limit), (item) => ({
    title: item.album,
    detail: item.artist,
    count: item.count
  }));
}

function renderMonthlyTop() {
  const limit = Number(elements.resultLimitSelect.value);
  const byMonth = new Map();
  getVisibleTracks().forEach((track) => {
    const key = monthKey(track.playedAt);
    const current = byMonth.get(key) || [];
    current.push(track);
    byMonth.set(key, current);
  });

  const rows = [...byMonth.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, limit)
    .map(([month, monthTracks]) => {
      const top = getTrackStats(monthTracks)[0];
      return {
        month,
        title: top ? `${top.name} - ${top.artist}` : "-",
        detail: `${formatMonthKey(month)} - ${monthTracks.length} scrobbles no mês`,
        count: top?.count || 0
      };
    });

  renderDataList(elements.monthlyTopList, rows, (item) => ({
    title: item.title,
    detail: item.detail,
    count: item.count
  }));
}

function getHourlyStats(source) {
  const total = Math.max(1, source.length);
  return countBy(source, (track) => {
    const hour = new Date(track.playedAt).getHours();
    return `${String(hour).padStart(2, "0")}:00`;
  }).map((item) => ({ ...item, percent: Math.round((item.count / total) * 100) }));
}

function getGenreStats(source) {
  const expanded = [];
  source.forEach((track) => {
    const genres = track.genres?.length ? track.genres : ["Sem estilo"];
    genres.forEach((genre) => expanded.push({ genre }));
  });
  return countBy(expanded, (item) => item.genre);
}

function getArtistYearStats(source) {
  return getArtistStats(source).map((item) => ({
    artist: item.artist,
    year: item.year,
    count: item.count
  }));
}

function getAlbumStats(source) {
  return countBy(source, (track) => `${track.artist}::${track.album}`, (track) => ({
    artist: track.artist,
    album: track.album
  }));
}

function getTrackHierarchy(source) {
  const artists = new Map();
  source.forEach((track) => {
    const artistKey = track.artist || "Artista desconhecido";
    const albumKey = track.album || "Álbum desconhecido";
    const trackKey = track.name || "Faixa sem título";
    const artist = artists.get(artistKey) || {
      artist: artistKey,
      count: 0,
      image: track.image || DEFAULT_IMAGE,
      albums: new Map()
    };
    const album = artist.albums.get(albumKey) || {
      album: albumKey,
      artist: artistKey,
      count: 0,
      image: track.image || DEFAULT_IMAGE,
      tracks: new Map()
    };
    const song = album.tracks.get(trackKey) || {
      name: trackKey,
      artist: artistKey,
      album: albumKey,
      count: 0,
      image: track.image || DEFAULT_IMAGE,
      lastPlayedAt: track.playedAt
    };

    artist.count += 1;
    album.count += 1;
    song.count += 1;
    song.lastPlayedAt = Math.max(song.lastPlayedAt, track.playedAt);
    album.tracks.set(trackKey, song);
    artist.albums.set(albumKey, album);
    artists.set(artistKey, artist);
  });

  return [...artists.values()]
    .map((artist) => ({
      ...artist,
      albums: [...artist.albums.values()]
        .map((album) => ({
          ...album,
          tracks: [...album.tracks.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        }))
        .sort((a, b) => b.count - a.count || a.album.localeCompare(b.album))
    }))
    .sort((a, b) => b.count - a.count || a.artist.localeCompare(b.artist));
}

function pluralizeMusic(count) {
  return `${formatNumber(count)} ${count === 1 ? "música" : "músicas"}`;
}

function renderTrackList() {
  if (!elements.trackList) return;
  const visible = getVisibleTracks();
  const hierarchy = getTrackHierarchy(visible);
  const limit = Number(elements.resultLimitSelect.value);
  const rows = hierarchy.slice(0, limit);
  elements.trackList.innerHTML = "";
  if (elements.trackListCount) {
    elements.trackListCount.textContent = `${formatNumber(hierarchy.length)} ${hierarchy.length === 1 ? "artista" : "artistas"} • ${pluralizeMusic(visible.length)}`;
  }

  if (!rows.length) {
    elements.trackList.innerHTML = "<p class=\"helper\">Nenhuma música encontrada nesse recorte. Ajuste os filtros ou clique em Pesquisar para buscar dados antigos na Last.fm.</p>";
    return;
  }

  rows.forEach((artist, index) => {
    const artistDetails = document.createElement("details");
    artistDetails.className = "music-group artist-group";
    artistDetails.open = index === 0;
    artistDetails.innerHTML = `
      <summary class="music-summary">
        <span class="artist-avatar" aria-hidden="true">${escapeHtml(artist.artist.slice(0, 1).toUpperCase())}</span>
        <span class="music-title">
          <strong>${escapeHtml(artist.artist)}</strong>
          <small>${formatNumber(artist.albums.length)} ${artist.albums.length === 1 ? "álbum" : "álbuns"} • ${formatNumber(artist.albums.reduce((total, album) => total + album.tracks.length, 0))} ${artist.albums.reduce((total, album) => total + album.tracks.length, 0) === 1 ? "faixa" : "faixas"} agrupadas</small>
        </span>
        <span class="data-count">${pluralizeMusic(artist.count)}</span>
      </summary>
      <div class="music-children">
        ${artist.albums.map((album, albumIndex) => `
          <details class="music-group album-group" ${albumIndex === 0 ? "open" : ""}>
            <summary class="music-summary">
              <img src="${escapeHtml(album.image || DEFAULT_IMAGE)}" alt="">
              <span class="music-title">
                <strong>${escapeHtml(album.album)}</strong>
                <small>${formatNumber(album.tracks.length)} ${album.tracks.length === 1 ? "música agrupada" : "músicas agrupadas"}</small>
              </span>
              <span class="data-count">${pluralizeMusic(album.count)}</span>
            </summary>
            <div class="music-track-list">
              ${album.tracks.map((song) => `
                <div class="music-track-row">
                  <span>
                    <strong>${escapeHtml(song.name)}</strong>
                    <small>Última vez: ${escapeHtml(formatDateTime(song.lastPlayedAt))}</small>
                  </span>
                  <span class="data-count">${formatNumber(song.count)}x</span>
                </div>
              `).join("")}
            </div>
          </details>
        `).join("")}
      </div>
    `;
    elements.trackList.append(artistDetails);
  });
}

function renderDataList(target, rows, mapRow) {
  target.innerHTML = "";
  if (!rows.length) {
    target.innerHTML = "<p class=\"helper\">Nada para mostrar neste recorte ainda. Experimente outro período ou conecte mais histórico.</p>";
    return;
  }

  rows.forEach((row) => {
    const mapped = mapRow(row);
    const element = document.createElement("div");
    element.className = "data-row";
    element.innerHTML = `
      <span>
        <strong>${escapeHtml(String(mapped.title))}</strong>
        <span>${escapeHtml(String(mapped.detail))}</span>
      </span>
      <span class="data-count">${formatNumber(mapped.count)}</span>
    `;
    target.append(element);
  });
}

function renderActiveChips() {
  elements.activeFilterLabel.dataset.clearFilter = "period";
  elements.activeFilterLabel.innerHTML = `${escapeHtml(getPeriodLabel())} <span class="remove-chip" aria-hidden="true">x</span>`;
  elements.activeFilterChips.querySelectorAll(".active-chip").forEach((chip) => chip.remove());

  const chips = [];
  if (elements.artistFilterSelect.value) {
    chips.push({ key: "artistSelect", label: `Banda: ${elements.artistFilterSelect.value}` });
  }
  if (elements.albumFilterSelect.value) {
    chips.push({ key: "albumSelect", label: `Álbum: ${elements.albumFilterSelect.value}` });
  }
  if (elements.focusTypeSelect.value !== "all" && elements.focusValueInput.value.trim()) {
    const focusLabel = elements.focusTypeSelect.options[elements.focusTypeSelect.selectedIndex].textContent;
    chips.push({ key: "focus", label: `${focusLabel}: ${elements.focusValueInput.value.trim()}` });
  }

  chips.forEach((chip) => {
    const button = document.createElement("button");
    button.className = "active-chip";
    button.type = "button";
    button.dataset.clearFilter = chip.key;
    button.innerHTML = `${escapeHtml(chip.label)} <span class="remove-chip" aria-hidden="true">x</span>`;
    elements.activeFilterChips.append(button);
  });
}

function updateResultLimitTags() {
  document.querySelectorAll("[data-result-limit]").forEach((button) => {
    const isActive = button.dataset.resultLimit === elements.resultLimitSelect.value;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateViewTabs() {
  document.querySelectorAll("[data-view-tab]").forEach((tab) => {
    const isActive = tab.dataset.viewTab === elements.analysisViewSelect.value;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
}

function updateNavigation(view) {
  document.querySelectorAll("[data-nav-view]").forEach((link) => {
    const isActive = link.dataset.navView === view;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function syncAdvancedControls() {
  document.querySelectorAll("[name='periodQuick']").forEach((input) => {
    input.checked = input.value === elements.periodSelect.value;
  });
  document.querySelectorAll("[name='focusQuick']").forEach((input) => {
    input.checked = input.value === elements.focusTypeSelect.value;
  });
  if (elements.drawerRangeSelect && elements.rangeSelect) elements.drawerRangeSelect.value = elements.rangeSelect.value;
}

function updateFocusOptions() {
  const focusType = elements.focusTypeSelect.value;
  const values = new Set();
  tracks.forEach((track) => {
    if (focusType === "artist") values.add(track.artist);
    if (focusType === "album") values.add(track.album);
    if (focusType === "track") values.add(`${track.name} - ${track.artist}`);
    if (focusType === "genre") (track.genres || []).forEach((genre) => values.add(genre));
  });

  elements.focusOptions.innerHTML = "";
  [...values].sort((a, b) => a.localeCompare(b)).slice(0, 80).forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    elements.focusOptions.append(option);
  });
}

function populateArtistAndAlbumFilters() {
  const selectedArtist = elements.artistFilterSelect.value;
  const selectedAlbum = elements.albumFilterSelect.value;
  const artists = [...new Set(tracks.map((track) => track.artist))].sort((a, b) => a.localeCompare(b));

  elements.artistFilterSelect.innerHTML = "<option value=\"\">Todas as bandas</option>";
  artists.forEach((artist) => {
    const option = document.createElement("option");
    option.value = artist;
    option.textContent = artist;
    elements.artistFilterSelect.append(option);
  });
  elements.artistFilterSelect.value = artists.includes(selectedArtist) ? selectedArtist : "";

  const albumSource = elements.artistFilterSelect.value
    ? tracks.filter((track) => track.artist === elements.artistFilterSelect.value)
    : tracks;
  const albums = [...new Set(albumSource.map((track) => track.album))].sort((a, b) => a.localeCompare(b));

  elements.albumFilterSelect.innerHTML = "<option value=\"\">Todos os álbuns</option>";
  albums.forEach((album) => {
    const option = document.createElement("option");
    option.value = album;
    option.textContent = album;
    elements.albumFilterSelect.append(option);
  });
  elements.albumFilterSelect.value = albums.includes(selectedAlbum) ? selectedAlbum : "";
}

function renderBandAlbums() {
  const selectedArtist = elements.artistFilterSelect.value;
  elements.bandAlbumsSection.hidden = !selectedArtist;

  if (!selectedArtist) {
    elements.bandAlbumList.innerHTML = "<p class=\"helper\">Selecione uma banda para ver os álbuns dela dentro do recorte.</p>";
    return;
  }

  const rows = getAlbumStats(getVisibleTracks()).slice(0, Number(elements.resultLimitSelect.value));
  renderDataList(elements.bandAlbumList, rows, (item) => ({
    title: item.album,
    detail: `${item.artist} - álbum no filtro atual`,
    count: item.count
  }));
}

function renderSuggestedMetrics() {
  const visible = getVisibleTracks();
  const topHour = getHourlyStats(visible)[0];
  const topGenre = getGenreStats(visible)[0];
  const topAlbum = getAlbumStats(visible)[0];
  const diversity = visible.length ? Math.round((getArtistStats(visible).length / visible.length) * 100) : 0;
  const suggestions = [
    { title: "Horário favorito", detail: topHour ? `${topHour.key} concentra ${topHour.percent}% do recorte` : "Conecte mais dados para descobrir" },
    { title: "Estilo dominante", detail: topGenre ? `${topGenre.key} aparece ${topGenre.count} vezes` : "Tags da Last.fm aparecem após sincronizar" },
    { title: "Álbum do momento", detail: topAlbum ? `${topAlbum.album} - ${topAlbum.artist}` : "Filtre por banda para investigar álbuns" },
    { title: "Diversidade musical", detail: visible.length ? `${diversity}% de artistas únicos no recorte` : "Mostra se você repetiu ou explorou mais" }
  ];

  elements.suggestedMetricsList.innerHTML = suggestions.map((item) => `
    <article class="suggestion-card">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.detail)}</span>
    </article>
  `).join("");
}

function applyDisplayControls() {
  const view = elements.analysisViewSelect.value;
  updateViewTabs();
  updateNavigation(view);
  syncAdvancedControls();

  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    const views = panel.dataset.viewPanel.split(" ");
    panel.classList.toggle("is-hidden", !views.includes(view));
  });

  const showMetrics = true;
  document.querySelector(".metrics-grid").classList.toggle("is-hidden", !showMetrics);

  const showExtraMetrics = elements.moreMetricsDetails.open;
  document.querySelectorAll("[data-metric]").forEach((card) => {
    const toggle = document.querySelector(`[data-metric-toggle="${card.dataset.metric}"]`);
    const isPrimary = primaryMetricKeys.has(card.dataset.metric);
    card.classList.toggle("is-hidden", !showMetrics || !toggle?.checked || (!isPrimary && !showExtraMetrics));
  });

  document.querySelectorAll("[data-stat]").forEach((panel) => {
    const toggle = document.querySelector(`[data-stat-toggle="${panel.dataset.stat}"]`);
    panel.classList.toggle("is-hidden", !toggle?.checked);
  });

  elements.dayFilterWrap.hidden = elements.periodSelect.value !== "day";
  elements.monthFilterWrap.hidden = elements.periodSelect.value !== "month";
  elements.yearFilterWrap.hidden = elements.periodSelect.value !== "year";
  elements.focusValueInput.disabled = elements.focusTypeSelect.value === "all";
  elements.focusValueInput.placeholder = elements.focusTypeSelect.value === "all" ? "Sem foco aplicado" : "Digite para filtrar";
  const focusLabel = elements.focusValueInput.closest("label");
  if (focusLabel) focusLabel.hidden = elements.focusTypeSelect.value === "all";
  elements.emptyState.hidden = tracks.length > 0;
  elements.moreMetricsDetails.hidden = !showMetrics;

  const sidePanels = [...document.querySelectorAll(".side-column > .section-band")];
  document.querySelector(".side-column").classList.toggle("is-hidden", sidePanels.every((panel) => panel.classList.contains("is-hidden")));

  localStorage.setItem("lastMasterView", view);
  localStorage.setItem("lastMasterFocusType", elements.focusTypeSelect.value);
  localStorage.setItem("lastMasterFocusValue", elements.focusValueInput.value);
  localStorage.setItem("lastMasterArtistFilter", elements.artistFilterSelect.value);
  localStorage.setItem("lastMasterAlbumFilter", elements.albumFilterSelect.value);
  localStorage.setItem("lastMasterResultLimit", elements.resultLimitSelect.value);
  localStorage.setItem("lastMasterMetricScope", elements.metricScopeSelect.value);
  localStorage.setItem("lastMasterMoreMetrics", String(elements.moreMetricsDetails.open));
  localStorage.setItem("lastMasterMetricToggles", JSON.stringify(getToggleState("[data-metric-toggle]")));
  localStorage.setItem("lastMasterStatToggles", JSON.stringify(getToggleState("[data-stat-toggle]")));
}

function getToggleState(selector) {
  return [...document.querySelectorAll(selector)].reduce((state, input) => {
    state[input.dataset.metricToggle || input.dataset.statToggle] = input.checked;
    return state;
  }, {});
}

function restoreToggleState(selector, saved) {
  if (!saved) return;
  let state = {};
  try {
    state = JSON.parse(saved);
  } catch {
    return;
  }
  document.querySelectorAll(selector).forEach((input) => {
    const key = input.dataset.metricToggle || input.dataset.statToggle;
    if (typeof state[key] === "boolean") input.checked = state[key];
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function renderGoal() {
  const goal = Number(elements.goalInput.value);
  const weekly = tracks.filter((track) => Date.now() - track.playedAt < 7 * 24 * 60 * 60 * 1000).length;
  const percent = Math.min(100, Math.round((weekly / goal) * 100));
  elements.goalOutput.textContent = `${percent}%`;
  elements.goalBar.style.width = `${percent}%`;
  elements.goalText.textContent = `${weekly} de ${goal} scrobbles nesta semana.`;
}

function renderStreak() {
  if (!tracks.length) {
    elements.streakValue.textContent = "0 dias";
    elements.streakHint.textContent = "Conecte ou importe para calcular";
    return;
  }

  const days = new Set(tracks.map((track) => new Date(track.playedAt).toDateString()));
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  elements.streakValue.textContent = `${streak} ${streak === 1 ? "dia" : "dias"}`;
  elements.streakHint.textContent = streak > 0 ? "com scrobbles consecutivos" : "sem scrobble registrado hoje";
}

function drawActivityChart() {
  const canvas = elements.activityChart;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const chartWidth = rect.width || canvas.parentElement?.clientWidth || 720;
  canvas.width = chartWidth * ratio;
  canvas.height = 220 * ratio;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, chartWidth, 220);

  const days = Number(elements.rangeSelect?.value || 30);
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    return { label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), key: date.toDateString(), count: 0 };
  });

  tracks.forEach((track) => {
    const key = new Date(track.playedAt).toDateString();
    const bucket = buckets.find((item) => item.key === key);
    if (bucket) bucket.count += 1;
  });

  const max = Math.max(1, ...buckets.map((item) => item.count));
  const gap = days > 120 ? 2 : 5;
  const barWidth = Math.max(2, (chartWidth - gap * (days - 1)) / days);
  const chartHeight = 168;

  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.fillRect(0, 190, chartWidth, 1);

  buckets.forEach((bucket, index) => {
    const height = (bucket.count / max) * chartHeight;
    const x = index * (barWidth + gap);
    const y = 185 - height;
    const gradient = ctx.createLinearGradient(0, y, 0, 185);
    gradient.addColorStop(0, "#ff365f");
    gradient.addColorStop(1, "#19c6b7");
    ctx.fillStyle = gradient;
    roundRect(ctx, x, y, barWidth, Math.max(height, 3), 4);
    ctx.fill();
  });

  ctx.fillStyle = "#9aa3b2";
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText(buckets[0]?.label || "", 0, 214);
  ctx.textAlign = "right";
  ctx.fillText(buckets[buckets.length - 1]?.label || "", chartWidth, 214);
  ctx.textAlign = "left";
}

function getReportFileSuffix() {
  return new Date().toISOString().slice(0, 10);
}

function downloadFile(content, fileName, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadChartImage() {
  if (!elements.activityChart) return;
  drawActivityChart();
  const link = document.createElement("a");
  link.href = elements.activityChart.toDataURL("image/png");
  link.download = `last-master-grafico-${getReportFileSuffix()}.png`;
  document.body.append(link);
  link.click();
  link.remove();
  showToast("Gráfico exportado em PNG.");
}

function exportPdfReport() {
  if (!tracks.length) {
    showToast("Conecte sua conta ou importe histórico antes de gerar o PDF.");
    return;
  }
  window.print();
}

function tableRows(rows) {
  return rows.map((row) => `
    <tr>${row.map((cell) => `<td>${escapeHtml(String(cell ?? ""))}</td>`).join("")}</tr>
  `).join("");
}

function exportXlsReport() {
  if (!tracks.length) {
    showToast("Conecte sua conta ou importe histórico antes de gerar o XLS.");
    return;
  }

  const visible = getVisibleTracks();
  const metricTracks = getMetricScopeTracks();
  const artistStats = getArtistStats(visible).slice(0, Number(elements.resultLimitSelect.value));
  const trackStats = getTrackStats(visible).slice(0, Number(elements.resultLimitSelect.value));
  const albumStats = getAlbumStats(visible).slice(0, Number(elements.resultLimitSelect.value));
  const bestDay = getBestDay(metricTracks);
  const bestYear = getBestYear(metricTracks);
  const longestRepeat = getLongestRepeat(metricTracks);
  const summaryRows = [
    ["Relatório gerado em", formatDateTime(Date.now())],
    ["Recorte aplicado", getFilteredLabel()],
    ["Última atualização da API", localStorage.getItem("lastMasterLastApiSync") ? formatDateTime(localStorage.getItem("lastMasterLastApiSync")) : "Nunca"],
    ["Scrobbles no escopo", metricTracks.length],
    ["Artistas únicos", getArtistStats(metricTracks).length],
    ["Dia mais musical", bestDay ? `${formatDateKey(bestDay.key)} (${bestDay.count})` : "Sem dados"],
    ["Ano mais ouvido", bestYear ? `${bestYear.key} (${bestYear.count})` : "Sem dados"],
    ["Maior repetição seguida", longestRepeat ? `${longestRepeat.track.name} - ${longestRepeat.track.artist} (${longestRepeat.count})` : "Sem dados"]
  ];
  const historyRows = [...visible]
    .sort((a, b) => b.playedAt - a.playedAt)
    .map((track) => [
      formatDateTime(track.playedAt),
      track.artist,
      track.name,
      track.album,
      (track.genres || []).join(", "),
      track.artistYear || ""
    ]);

  const html = `<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #111827; }
          h1, h2 { margin: 0 0 12px; }
          table { border-collapse: collapse; margin-bottom: 24px; width: 100%; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background: #f1f5f9; }
        </style>
      </head>
      <body>
        <h1>Last Master - relatório musical</h1>
        <h2>Resumo</h2>
        <table>
          <tbody>${tableRows(summaryRows)}</tbody>
        </table>
        <h2>Top artistas</h2>
        <table>
          <thead><tr><th>Artista</th><th>Scrobbles</th><th>Faixas diferentes</th></tr></thead>
          <tbody>${tableRows(artistStats.map((item) => [item.artist, item.count, item.tracks.size]))}</tbody>
        </table>
        <h2>Top músicas</h2>
        <table>
          <thead><tr><th>Música</th><th>Artista</th><th>Scrobbles</th></tr></thead>
          <tbody>${tableRows(trackStats.map((item) => [item.name, item.artist, item.count]))}</tbody>
        </table>
        <h2>Top álbuns</h2>
        <table>
          <thead><tr><th>Álbum</th><th>Artista</th><th>Scrobbles</th></tr></thead>
          <tbody>${tableRows(albumStats.map((item) => [item.album, item.artist, item.count]))}</tbody>
        </table>
        <h2>Histórico filtrado</h2>
        <table>
          <thead><tr><th>Data e hora</th><th>Artista</th><th>Música</th><th>Álbum</th><th>Estilos</th><th>Ano da banda</th></tr></thead>
          <tbody>${tableRows(historyRows)}</tbody>
        </table>
      </body>
    </html>`;

  downloadFile(`\ufeff${html}`, `last-master-relatorio-${getReportFileSuffix()}.xls`, "application/vnd.ms-excel;charset=utf-8");
  showToast("Relatório XLS exportado.");
}

function drawPulse() {
  const canvas = elements.pulseCanvas;
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const base = Math.min(rect.width, rect.height) * 0.22;
  const artistCount = Math.max(4, getArtistStats(tracks).length || 8);
  const time = Date.now() / 900;

  const gradient = ctx.createRadialGradient(centerX, centerY, base * 0.2, centerX, centerY, base * 2.8);
  gradient.addColorStop(0, "rgba(216, 59, 71, 0.34)");
  gradient.addColorStop(0.58, "rgba(31, 122, 114, 0.24)");
  gradient.addColorStop(1, "rgba(8, 9, 13, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  for (let i = 0; i < artistCount; i += 1) {
    const angle = (Math.PI * 2 * i) / artistCount + time * 0.16;
    const wave = Math.sin(time + i * 0.8) * 18;
    const radius = base + i * 8 + wave;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, angle, angle + Math.PI * 1.15);
    ctx.strokeStyle = i % 3 === 0 ? "#ff365f" : i % 3 === 1 ? "#19c6b7" : "#f5a524";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.78;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(centerX, centerY, base * 0.46, 0, Math.PI * 2);
  ctx.fillStyle = "#12141c";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.lineWidth = 1;
  ctx.stroke();

  window.requestAnimationFrame(drawPulse);
}

function roundRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function renderAll() {
  populateArtistAndAlbumFilters();
  updateFocusOptions();
  renderMetrics();
  renderActiveChips();
  updateResultLimitTags();
  renderTrackList();
  renderArtists();
  renderAnalytics();
  renderBandAlbums();
  renderSuggestedMetrics();
  renderGoal();
  renderStreak();
  renderLastSync();
  applyDisplayControls();
  drawActivityChart();
}

async function requestLastfm(params, timeoutMs = 18000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${LASTFM_API}?${params.toString()}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Não foi possível acessar a Last.fm. Status ${response.status}.`);

    const data = await response.json();
    if (data.error) throw new Error(data.message || "A Last.fm retornou um erro.");
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("A Last.fm demorou demais para responder. Tente o modo rápido ou tente novamente em alguns minutos.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchCurrentYearTracks(username, apiKey) {
  const currentYear = new Date().getFullYear();
  setConnectionStatus(`Conectando com a Last.fm e carregando ${currentYear}.`, "info");
  const currentYearTracks = await fetchLastfmTracksForYear(username, apiKey, currentYear);
  return enrichTrackMetadata(currentYearTracks, apiKey, 24);
}

async function fetchLastfmTracksByYearRange(username, apiKey) {
  const registeredYear = await fetchLastfmRegisteredYear(username, apiKey);
  const currentYear = new Date().getFullYear();
  const allTracks = [];
  const seen = new Set();

  for (let year = currentYear; year >= registeredYear; year -= 1) {
    setConnectionStatus(`Buscando histórico completo: ano ${year}.`, "info");
    const yearTracks = await fetchLastfmTracksForYear(username, apiKey, year);
    yearTracks.forEach((track) => {
      const key = `${track.playedAt}-${track.artist}-${track.name}`;
      if (seen.has(key)) return;
      seen.add(key);
      allTracks.push(track);
    });
  }

  return enrichTrackMetadata(allTracks, apiKey, 35);
}

async function fetchLastfmRegisteredYear(username, apiKey) {
  const params = new URLSearchParams({
    method: "user.getinfo",
    user: username,
    api_key: apiKey,
    format: "json"
  });
  const data = await requestLastfm(params, 12000);
  const registeredUnix = Number(data.user?.registered?.unixtime);
  if (!registeredUnix) return new Date().getFullYear() - 5;
  return new Date(registeredUnix * 1000).getFullYear();
}

async function fetchLastfmTracksForYear(username, apiKey, year) {
  const from = Math.floor(new Date(year, 0, 1, 0, 0, 0).getTime() / 1000);
  const to = Math.floor(new Date(year + 1, 0, 1, 0, 0, 0).getTime() / 1000) - 1;
  return fetchLastfmTracksInRange(username, apiKey, from, to, {
    progressLabel: String(year)
  });
}

async function fetchLastfmTracksInRange(username, apiKey, from, to, options = {}) {
  const rangeTracks = [];
  const maxPages = options.maxPages ?? Number.POSITIVE_INFINITY;

  for (let page = 1; page <= maxPages; page += 1) {
    const params = new URLSearchParams({
      method: "user.getrecenttracks",
      user: username,
      api_key: apiKey,
      format: "json",
      limit: "200",
      from: String(from),
      to: String(to),
      page: String(page)
    });

    const data = await requestLastfm(params);
    const pageTracks = (data.recenttracks?.track || []).map(normalizeTrack);
    rangeTracks.push(...pageTracks);

    const totalPages = Number(data.recenttracks?.["@attr"]?.totalPages || page);
    if (options.progressLabel) {
      setConnectionStatus(`Baixando ${options.progressLabel}: página ${page} de ${formatNumber(totalPages)}.`, "info");
    }
    if (page >= totalPages || pageTracks.length === 0) break;
  }

  return rangeTracks;
}

function getMonthRange(value) {
  const [year, month] = String(value || "").split("-").map(Number);
  if (!year || !month) return null;
  return {
    from: Math.floor(new Date(year, month - 1, 1, 0, 0, 0).getTime() / 1000),
    to: Math.floor(new Date(year, month, 1, 0, 0, 0).getTime() / 1000) - 1
  };
}

function getDayRange(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  return {
    from: Math.floor(new Date(year, month - 1, day, 0, 0, 0).getTime() / 1000),
    to: Math.floor(new Date(year, month - 1, day + 1, 0, 0, 0).getTime() / 1000) - 1
  };
}

async function loadRangeOnDemand({ key, label, from, to, maxPages = Number.POSITIVE_INFINITY }) {
  if (!key || isRangeCovered(key)) return false;
  const { username, apiKey } = getSavedCredentials();
  if (!username || !apiKey) {
    showToast("Conecte sua conta para buscar dados de anos anteriores.");
    return false;
  }

  showToast(`Buscando ${label} na Last.fm...`);
  const rangeTracks = await fetchLastfmTracksInRange(username, apiKey, from, to, {
    maxPages,
    progressLabel: label
  });
  const enriched = await enrichTrackMetadata(rangeTracks, apiKey, 24);
  const persisted = mergeTracks(enriched);
  if (persisted) markRangeLoaded(key);
  return true;
}

async function loadFullHistoryOnDemand() {
  if (isRangeLoaded("history:full")) return false;
  const { username, apiKey } = getSavedCredentials();
  if (!username || !apiKey) {
    showToast("Conecte sua conta para buscar o histórico completo.");
    return false;
  }

  const registeredYear = await fetchLastfmRegisteredYear(username, apiKey);
  const currentYear = new Date().getFullYear();
  let loadedSomething = false;
  let allPersisted = true;

  for (let year = currentYear; year >= registeredYear; year -= 1) {
    const key = `year:${year}`;
    if (isRangeCovered(key)) continue;

    showToast(`Buscando histórico de ${year} na Last.fm...`);
    setConnectionStatus(`Carregando histórico completo: ${year}.`, "info");
    const yearTracks = await fetchLastfmTracksForYear(username, apiKey, year);
    const enriched = await enrichTrackMetadata(yearTracks, apiKey, 24);
    const persisted = mergeTracks(enriched);
    if (persisted) markRangeLoaded(key);
    allPersisted = allPersisted && persisted;
    loadedSomething = true;
  }

  if (allPersisted) markRangeLoaded("history:full");
  localStorage.setItem("lastMasterLastApiSync", new Date().toISOString());
  renderLastSync();
  return loadedSomething;
}

async function ensureFilterDataLoaded() {
  const jobs = new Map();
  const currentYear = new Date().getFullYear();

  const addYear = (yearValue) => {
    const year = Number(yearValue);
    if (!year || year === currentYear) return;
    const from = Math.floor(new Date(year, 0, 1, 0, 0, 0).getTime() / 1000);
    const to = Math.floor(new Date(year + 1, 0, 1, 0, 0, 0).getTime() / 1000) - 1;
    jobs.set(`year:${year}`, {
      key: `year:${year}`,
      label: `ano ${year}`,
      from,
      to
    });
  };

  const addMonth = (monthValue) => {
    if (!monthValue) return;
    const range = getMonthRange(monthValue);
    if (!range) return;
    jobs.set(`month:${monthValue}`, {
      key: `month:${monthValue}`,
      label: `mês ${formatMonthKey(monthValue)}`,
      ...range
    });
  };

  const addDay = (dayValue) => {
    if (!dayValue) return;
    const range = getDayRange(dayValue);
    if (!range) return;
    jobs.set(`day:${dayValue}`, {
      key: `day:${dayValue}`,
      label: `dia ${formatDateKey(dayValue)}`,
      ...range
    });
  };

  if (elements.periodSelect.value === "all" || elements.metricScopeSelect.value === "all") {
    return loadFullHistoryOnDemand();
  }

  if (elements.periodSelect.value === "year") addYear(elements.yearFilter.value);
  if (elements.periodSelect.value === "month") addMonth(elements.monthFilter.value);
  if (elements.periodSelect.value === "day") addDay(elements.dayFilter.value);
  if (elements.metricScopeSelect.value === "year") addYear(elements.yearFilter.value);
  if (elements.metricScopeSelect.value === "month") addMonth(elements.monthFilter.value);

  let loadedSomething = false;
  for (const job of jobs.values()) {
    loadedSomething = await loadRangeOnDemand(job) || loadedSomething;
  }
  return loadedSomething;
}

async function handleSearchFilters() {
  const originalText = elements.searchFiltersButton.textContent;
  elements.searchFiltersButton.disabled = true;
  elements.searchFiltersButton.textContent = "Pesquisando...";
  try {
    const loadedSomething = await ensureFilterDataLoaded();
    renderAll();
    showToast(loadedSomething ? "Recorte carregado e filtros aplicados." : "Filtros aplicados.");
  } catch (error) {
    const message = getLastfmErrorMessage(error);
    showToast(message);
    setConnectionStatus(message, "error");
  } finally {
    elements.searchFiltersButton.disabled = false;
    elements.searchFiltersButton.textContent = originalText || "Pesquisar";
  }
}

async function enrichTrackMetadata(source, apiKey, maxArtists = 24) {
  let cache = {};
  try {
    cache = JSON.parse(localStorage.getItem("lastMasterArtistMeta") || "{}");
  } catch {
    cache = {};
  }
  const artists = [...new Set(source.map((track) => track.artist))].slice(0, maxArtists);

  for (const artist of artists) {
    if (cache[artist]) continue;
    try {
      const params = new URLSearchParams({
        method: "artist.getinfo",
        artist,
        api_key: apiKey,
        format: "json",
        autocorrect: "1"
      });
      const data = await requestLastfm(params, 10000);
      const tags = data.artist?.tags?.tag?.slice(0, 3).map((tag) => tag.name).filter(Boolean) || [];
      cache[artist] = {
        genres: tags,
        year: data.artist?.bio?.yearformed || extractYear(data.artist?.bio?.summary || data.artist?.bio?.content || "")
      };
    } catch {
      cache[artist] = { genres: [], year: "" };
    }
  }

  localStorage.setItem("lastMasterArtistMeta", JSON.stringify(cache));
  return source.map((track) => ({
    ...track,
    genres: cache[track.artist]?.genres || track.genres || [],
    artistYear: cache[track.artist]?.year || track.artistYear || ""
  }));
}

function extractYear(text) {
  const match = String(text).match(/\b(19[0-9]{2}|20[0-9]{2})\b/);
  return match ? match[1] : "";
}

function importManualTracks() {
  const lines = elements.manualInput.value.split("\n").map((line) => line.trim()).filter(Boolean);
  const imported = lines.map((line, index) => {
    const [artistPart, trackPart, albumPart, genrePart, yearPart] = line.split(" - ");
    return {
      artist: artistPart?.trim() || "Artista desconhecido",
      name: cleanTrackName(trackPart || "Faixa sem título"),
      album: cleanAlbumName(albumPart || "Importado manualmente"),
      playedAt: Date.now() - index * 1000 * 60 * 35,
      image: DEFAULT_IMAGE,
      genres: genrePart ? genrePart.split(",").map((item) => item.trim()).filter(Boolean) : [],
      artistYear: yearPart?.trim() || ""
    };
  });

  tracks = [...imported, ...tracks].map(sanitizeSavedTrack);
  localStorage.setItem("lastMasterTracks", JSON.stringify(tracks));
  elements.manualInput.value = "";
  if (elements.onboardingModal.open) elements.onboardingModal.close();
  renderAll();
  showToast(`${imported.length} faixas importadas.`);
}

function sanitizeSavedTrack(track) {
  return {
    artist: track.artist || "Artista desconhecido",
    name: cleanTrackName(track.name),
    album: cleanAlbumName(track.album),
    playedAt: Number(track.playedAt) || Date.now(),
    image: track.image || DEFAULT_IMAGE,
    genres: Array.isArray(track.genres) ? track.genres : [],
    artistYear: track.artistYear || ""
  };
}

function setDefaultFilters() {
  const now = new Date();
  elements.dayFilter.value = dateKey(now.getTime());
  elements.monthFilter.value = monthKey(now.getTime());
  elements.yearFilter.value = String(now.getFullYear());
}

function syncPeriodInputs() {
  localStorage.setItem("lastMasterPeriod", elements.periodSelect.value);
  localStorage.setItem("lastMasterDayFilter", elements.dayFilter.value);
  localStorage.setItem("lastMasterMonthFilter", elements.monthFilter.value);
  localStorage.setItem("lastMasterYearFilter", elements.yearFilter.value);
  renderAll();
}

function resetFilters() {
  setDefaultFilters();
  elements.analysisViewSelect.value = "summary";
  elements.periodSelect.value = "month";
  elements.focusTypeSelect.value = "all";
  elements.focusValueInput.value = "";
  elements.artistFilterSelect.value = "";
  elements.albumFilterSelect.value = "";
  elements.resultLimitSelect.value = "5";
  elements.metricScopeSelect.value = "month";
  if (elements.rangeSelect) elements.rangeSelect.value = "30";
  syncPeriodInputs();
}

function setStatToggle(key, value) {
  const input = document.querySelector(`[data-stat-toggle="${key}"]`);
  if (input) input.checked = value;
}

function applyPreset(preset) {
  setDefaultFilters();
  elements.focusValueInput.value = "";
  elements.focusTypeSelect.value = "all";

  if (preset === "month") {
    elements.analysisViewSelect.value = "summary";
    elements.periodSelect.value = "month";
    elements.resultLimitSelect.value = "5";
  }
  if (preset === "artists") {
    elements.analysisViewSelect.value = "rankings";
    elements.periodSelect.value = "month";
    elements.resultLimitSelect.value = "10";
  }
  if (preset === "repeats") {
    elements.analysisViewSelect.value = "rankings";
    elements.periodSelect.value = "all";
    elements.focusTypeSelect.value = "track";
    elements.resultLimitSelect.value = "20";
  }
  if (preset === "discoveries") {
    elements.analysisViewSelect.value = "deep";
    elements.periodSelect.value = "month";
    elements.resultLimitSelect.value = "10";
    setStatToggle("genre", true);
  }
  if (preset === "nostalgia") {
    elements.analysisViewSelect.value = "deep";
    elements.periodSelect.value = "all";
    elements.resultLimitSelect.value = "10";
    setStatToggle("year", true);
    setStatToggle("monthly", true);
  }
  if (preset === "hours") {
    elements.analysisViewSelect.value = "deep";
    elements.periodSelect.value = "month";
    elements.resultLimitSelect.value = "10";
    setStatToggle("hourly", true);
  }

  syncPeriodInputs();
}

function loadSavedState() {
  setDefaultFilters();
  if (localStorage.getItem("lastMasterCacheVersion") !== CACHE_VERSION) {
    localStorage.removeItem("lastMasterLoadedRanges");
    localStorage.setItem("lastMasterCacheVersion", CACHE_VERSION);
  }
  const savedTracks = localStorage.getItem("lastMasterTracks");
  const savedUser = localStorage.getItem("lastMasterUsername");
  const savedKey = localStorage.getItem("lastMasterApiKey") || sessionStorage.getItem("lastMasterApiKey");
  const persistedKey = localStorage.getItem("lastMasterApiKey");
  const savedGoal = localStorage.getItem("lastMasterGoal");
  const savedPeriod = localStorage.getItem("lastMasterPeriod");
  const savedDay = localStorage.getItem("lastMasterDayFilter");
  const savedMonth = localStorage.getItem("lastMasterMonthFilter");
  const savedYear = localStorage.getItem("lastMasterYearFilter");
  const savedView = localStorage.getItem("lastMasterView");
  const savedFocusType = localStorage.getItem("lastMasterFocusType");
  const savedFocusValue = localStorage.getItem("lastMasterFocusValue");
  const savedArtistFilter = localStorage.getItem("lastMasterArtistFilter");
  const savedAlbumFilter = localStorage.getItem("lastMasterAlbumFilter");
  const savedResultLimit = localStorage.getItem("lastMasterResultLimit");
  const savedMetricScope = localStorage.getItem("lastMasterMetricScope");
  const savedMetricToggles = localStorage.getItem("lastMasterMetricToggles");
  const savedStatToggles = localStorage.getItem("lastMasterStatToggles");
  const savedMoreMetrics = localStorage.getItem("lastMasterMoreMetrics");

  if (savedTracks) {
    try {
      tracks = JSON.parse(savedTracks).map(sanitizeSavedTrack);
    } catch {
      tracks = [];
      localStorage.removeItem("lastMasterTracks");
    }
  } else {
    tracks = [];
  }

  populateArtistAndAlbumFilters();

  if (savedUser) elements.usernameInput.value = savedUser;
  if (savedKey) elements.apiKeyInput.value = savedKey;
  if (elements.rememberApiKeyCheckbox) elements.rememberApiKeyCheckbox.checked = Boolean(persistedKey);
  if (savedGoal) elements.goalInput.value = savedGoal;
  if (savedPeriod) elements.periodSelect.value = savedPeriod;
  if (savedDay) elements.dayFilter.value = savedDay;
  if (savedMonth) elements.monthFilter.value = savedMonth;
  if (savedYear) elements.yearFilter.value = savedYear;
  if (savedView && ["summary", "activity", "rankings", "deep"].includes(savedView)) elements.analysisViewSelect.value = savedView;
  if (savedFocusType) elements.focusTypeSelect.value = savedFocusType;
  if (savedFocusValue) elements.focusValueInput.value = savedFocusValue;
  if (savedArtistFilter) elements.artistFilterSelect.value = savedArtistFilter;
  if (savedAlbumFilter) elements.albumFilterSelect.value = savedAlbumFilter;
  if (savedResultLimit) elements.resultLimitSelect.value = savedResultLimit;
  if (savedMetricScope) elements.metricScopeSelect.value = savedMetricScope;
  if (savedMoreMetrics === "true") elements.moreMetricsDetails.open = true;
  restoreToggleState("[data-metric-toggle]", savedMetricToggles);
  restoreToggleState("[data-stat-toggle]", savedStatToggles);
  syncPeriodInputs();
}

elements.lastfmForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = elements.usernameInput.value.trim();
  const apiKey = elements.apiKeyInput.value.trim();
  if (!username || !apiKey) {
    const message = "Preencha usuário e API key para sincronizar.";
    setConnectionStatus(message, "error");
    showToast(message);
    return;
  }

  const submitButton = elements.lastfmForm.querySelector("button[type='submit']");
  const originalSubmitText = submitButton?.textContent;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Sincronizando...";
  }
  if (elements.clearApiKeyButton) elements.clearApiKeyButton.disabled = true;

  const savedUsername = localStorage.getItem("lastMasterUsername");
  const isDifferentUser = Boolean(savedUsername && savedUsername !== username);

  const currentYear = new Date().getFullYear();
  setConnectionStatus(`Conectando com a Last.fm e carregando apenas ${currentYear}.`, "info");
  showToast(`Sincronizando ano atual: ${currentYear}.`);
  try {
    const currentYearTracks = await fetchCurrentYearTracks(username, apiKey);
    if (isDifferentUser) {
      tracks = [];
      localStorage.removeItem("lastMasterTracks");
      localStorage.removeItem("lastMasterLoadedRanges");
      localStorage.removeItem("lastMasterArtistMeta");
    }
    const persisted = mergeTracks(currentYearTracks);
    localStorage.setItem("lastMasterUsername", username);
    localStorage.setItem("lastMasterApiKey", apiKey);
    if (persisted) markRangeLoaded(`year:${currentYear}`);
    localStorage.setItem("lastMasterLastApiSync", new Date().toISOString());
    renderAll();
    if (elements.onboardingModal.open) elements.onboardingModal.close();
    setConnectionStatus("", "info");
    showToast("Histórico sincronizado e nomes remaster limpos.");
  } catch (error) {
    const message = getLastfmErrorMessage(error);
    setConnectionStatus(message, "error");
    showToast(message);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalSubmitText || "Sincronizar";
    }
    if (elements.clearApiKeyButton) elements.clearApiKeyButton.disabled = false;
  }
});

function openOnboarding() {
  if (!elements.onboardingModal.open) elements.onboardingModal.showModal();
}

function loadDemo() {
  tracks = demoTracks;
  localStorage.setItem("lastMasterTracks", JSON.stringify(tracks));
  renderAll();
  if (elements.onboardingModal.open) elements.onboardingModal.close();
  showToast("Dados de demonstração carregados.");
}

elements.importButton.addEventListener("click", importManualTracks);
elements.loadDemoButton?.addEventListener("click", loadDemo);
elements.modalDemoButton?.addEventListener("click", loadDemo);
elements.emptyDemoButton?.addEventListener("click", loadDemo);
elements.openOnboardingButton.addEventListener("click", openOnboarding);
elements.connectHeroButton.addEventListener("click", openOnboarding);
elements.emptyConnectButton.addEventListener("click", openOnboarding);
elements.clearApiKeyButton?.addEventListener("click", clearSavedApiKey);
elements.downloadChartButton?.addEventListener("click", downloadChartImage);
elements.exportPdfButton?.addEventListener("click", exportPdfReport);
elements.exportXlsButton?.addEventListener("click", exportXlsReport);
elements.advancedFiltersButton.addEventListener("click", () => {
  const isHidden = elements.advancedFilters.hidden;
  elements.advancedFilters.hidden = !isHidden;
  elements.advancedFiltersButton.setAttribute("aria-expanded", String(isHidden));
});
elements.clearFiltersButton.addEventListener("click", resetFilters);
elements.activeFilterChips.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-clear-filter]");
  if (!chip) return;
  if (chip.dataset.clearFilter === "focus") {
    elements.focusTypeSelect.value = "all";
    elements.focusValueInput.value = "";
  }
  if (chip.dataset.clearFilter === "artistSelect") {
    elements.artistFilterSelect.value = "";
    elements.albumFilterSelect.value = "";
  }
  if (chip.dataset.clearFilter === "albumSelect") {
    elements.albumFilterSelect.value = "";
  }
  if (chip.dataset.clearFilter === "period") {
    elements.periodSelect.value = "all";
    syncPeriodInputs();
    return;
  }
  if (chip.dataset.clearFilter === "limit") {
    elements.resultLimitSelect.value = "5";
  }
  renderAll();
});
elements.activeFilterLabel.addEventListener("click", () => {
  elements.periodSelect.value = "all";
  syncPeriodInputs();
});
document.querySelectorAll("[data-view-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    elements.analysisViewSelect.value = tab.dataset.viewTab;
    renderAll();
  });
});
document.querySelectorAll("[data-nav-view]").forEach((link) => {
  link.addEventListener("click", () => {
    elements.analysisViewSelect.value = link.dataset.navView;
    renderAll();
  });
});
document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
});
document.querySelectorAll("[data-result-limit]").forEach((button) => {
  button.addEventListener("click", () => {
    elements.resultLimitSelect.value = button.dataset.resultLimit;
    renderAll();
  });
});
document.querySelectorAll("[name='periodQuick']").forEach((input) => {
  input.addEventListener("change", () => {
    elements.periodSelect.value = input.value;
    syncPeriodInputs();
  });
});
document.querySelectorAll("[name='focusQuick']").forEach((input) => {
  input.addEventListener("change", () => {
    elements.focusTypeSelect.value = input.value;
    elements.focusValueInput.value = "";
    renderAll();
  });
});
elements.drawerResultLimitSelect?.addEventListener("change", () => {
  elements.resultLimitSelect.value = elements.drawerResultLimitSelect.value;
  renderAll();
});
elements.drawerRangeSelect?.addEventListener("change", () => {
  if (elements.rangeSelect) elements.rangeSelect.value = elements.drawerRangeSelect.value;
  drawActivityChart();
  syncAdvancedControls();
});
elements.moreMetricsDetails.addEventListener("toggle", renderAll);
elements.rangeSelect?.addEventListener("change", drawActivityChart);
elements.searchFiltersButton.addEventListener("click", handleSearchFilters);
elements.analysisViewSelect.addEventListener("change", renderAll);
elements.periodSelect.addEventListener("change", syncPeriodInputs);
elements.dayFilter.addEventListener("change", syncPeriodInputs);
elements.monthFilter.addEventListener("change", syncPeriodInputs);
elements.yearFilter.addEventListener("change", syncPeriodInputs);
elements.artistFilterSelect.addEventListener("change", () => {
  elements.albumFilterSelect.value = "";
  renderAll();
});
elements.albumFilterSelect.addEventListener("change", renderAll);
elements.focusTypeSelect.addEventListener("change", () => {
  elements.focusValueInput.value = "";
  updateFocusOptions();
  renderAll();
});
elements.focusValueInput.addEventListener("input", renderAll);
elements.resultLimitSelect.addEventListener("change", renderAll);
elements.metricScopeSelect.addEventListener("change", renderAll);
document.querySelectorAll("[data-metric-toggle], [data-stat-toggle]").forEach((input) => {
  input.addEventListener("change", renderAll);
});
elements.goalInput.addEventListener("input", () => {
  localStorage.setItem("lastMasterGoal", elements.goalInput.value);
  renderGoal();
});
elements.sortArtistsButton.addEventListener("click", () => {
  artistsAscending = !artistsAscending;
  renderArtists();
});
window.addEventListener("resize", drawActivityChart);

loadSavedState();
drawPulse();
