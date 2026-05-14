/**
 * configuracao.js
 * Constantes globais, imagem padrão e catálogo de demonstração.
 * Altere aqui para ajustar comportamentos centrais da aplicação.
 */

export const URL_API_LASTFM = "https://ws.audioscrobbler.com/2.0/";
export const VERSAO_CACHE = "period-cache-v2";

export const IMAGEM_PADRAO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23d83b47'/%3E%3Cstop offset='0.55' stop-color='%231f7a72'/%3E%3Cstop offset='1' stop-color='%23bf7b22'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='240' height='240' fill='url(%23g)'/%3E%3Ccircle cx='120' cy='120' r='54' fill='none' stroke='rgba(255,255,255,.72)' stroke-width='18'/%3E%3Ccircle cx='120' cy='120' r='10' fill='rgba(255,255,255,.85)'/%3E%3C/svg%3E";

/** Métricas que aparecem sem precisar expandir "Ver mais". */
export const METRICAS_PRINCIPAIS = new Set([
  "scrobbles", "topTrack", "bestDay", "longestRepeat", "bestYear",
]);

/** Catálogo fixo usado no modo demonstração. */
export const catalogoDemo = [
  { artist: "Sade",          name: "No Ordinary Love - 2011 Remaster",  album: "Love Deluxe",                                       genres: ["soul", "smooth jazz"],           artistYear: "1982" },
  { artist: "Radiohead",     name: "Reckoner",                           album: "In Rainbows",                                       genres: ["alternative rock", "art rock"],  artistYear: "1985" },
  { artist: "Baco Exu do Blues", name: "Te Amo Desgraça",               album: "Esu",                                               genres: ["rap", "mpb"],                    artistYear: "2016" },
  { artist: "Mitski",        name: "My Love Mine All Mine",              album: "The Land Is Inhospitable and So Are We",            genres: ["indie rock", "singer-songwriter"], artistYear: "2012" },
  { artist: "Fleetwood Mac", name: "Dreams - 2004 Remaster",            album: "Rumours",                                           genres: ["classic rock", "pop rock"],      artistYear: "1967" },
  { artist: "Sade",          name: "Kiss of Life",                      album: "Love Deluxe",                                       genres: ["soul", "quiet storm"],           artistYear: "1982" },
  { artist: "Jorge Ben Jor", name: "Taj Mahal",                         album: "Africa Brasil",                                     genres: ["samba rock", "mpb"],             artistYear: "1963" },
  { artist: "Radiohead",     name: "Nude",                              album: "In Rainbows",                                       genres: ["alternative rock", "art rock"],  artistYear: "1985" },
  { artist: "Rosalia",       name: "SAOKO",                             album: "MOTOMAMI",                                          genres: ["latin pop", "flamenco pop"],     artistYear: "2017" },
  { artist: "Tim Maia",      name: "Azul da Cor do Mar - Remastered",   album: "Tim Maia",                                          genres: ["soul", "mpb"],                   artistYear: "1970" },
  { artist: "Mitski",        name: "Nobody",                            album: "Be the Cowboy",                                     genres: ["indie pop", "indie rock"],       artistYear: "2012" },
  { artist: "Liniker",       name: "Baby 95",                           album: "Caju",                                              genres: ["mpb", "soul"],                   artistYear: "2015" },
  { artist: "Sade",          name: "Smooth Operator",                   album: "Diamond Life",                                      genres: ["soul", "sophisti-pop"],          artistYear: "1982" },
  { artist: "Radiohead",     name: "Weird Fishes / Arpeggi",            album: "In Rainbows",                                       genres: ["alternative rock", "art rock"],  artistYear: "1985" },
  { artist: "Tim Maia",      name: "Gostava Tanto de Você",             album: "Tim Maia",                                          genres: ["soul", "mpb"],                   artistYear: "1970" },
  { artist: "Jorge Ben Jor", name: "Chove Chuva",                      album: "Samba Esquema Novo",                                genres: ["samba rock", "mpb"],             artistYear: "1963" },
  { artist: "Liniker",       name: "Caju",                              album: "Caju",                                              genres: ["mpb", "soul"],                   artistYear: "2015" },
  { artist: "Rosalia",       name: "MOTOMAMI",                          album: "MOTOMAMI",                                          genres: ["latin pop", "experimental pop"], artistYear: "2017" },
];
