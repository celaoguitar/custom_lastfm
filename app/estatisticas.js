/**
 * estatisticas.js
 * Funções de agregação e cálculo de rankings.
 *
 * Todas as funções recebem um array de tracks como entrada e retornam
 * dados processados — sem efeitos colaterais no estado global.
 */

import { estado }                  from "./estado.js";
import { getTracksVisiveis }       from "./filtros.js";
import { chaveData, chaveMes }     from "./utilidades.js";

// ─── Agregação genérica ───────────────────────────────────────────────────────

/**
 * Agrupa um array de itens por uma chave, conta ocorrências e ordena
 * do mais para o menos frequente.
 * @param {Array}    itens
 * @param {Function} getChave      Extrai a chave de agrupamento de cada item.
 * @param {Function} [criarExtra]  Adiciona campos extras na primeira ocorrência.
 * @returns {Array}
 */
export function contarPor(itens, getChave, criarExtra = () => ({})) {
  const mapa = new Map();
  itens.forEach((item) => {
    const chave = getChave(item);
    if (!chave) return;
    const atual = mapa.get(chave) || { key: chave, count: 0, ...criarExtra(item, chave) };
    atual.count += 1;
    mapa.set(chave, atual);
  });
  return [...mapa.values()].sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)));
}

// ─── Artistas ─────────────────────────────────────────────────────────────────

/**
 * Retorna estatísticas por artista (scrobbles, faixas únicas, gêneros, ano).
 * Memoiza o resultado enquanto a fonte não mudar (mesmo objeto de referência).
 * @param {Array} [fonte=getTracksVisiveis()]
 * @returns {Array}
 */
export function getEstatisticasArtista(fonte = getTracksVisiveis()) {
  if (fonte !== estado.fonteCacheEstatisticasArtista) {
    const mapa = new Map();
    fonte.forEach((track) => {
      const atual = mapa.get(track.artist) || {
        artist: track.artist, count: 0, tracks: new Set(), year: track.artistYear, genres: new Set(),
      };
      atual.count += 1;
      atual.tracks.add(track.name);
      if (track.artistYear) atual.year = track.artistYear;
      (track.genres || []).forEach((g) => atual.genres.add(g));
      mapa.set(track.artist, atual);
    });
    estado.dadosCacheEstatisticasArtista  = [...mapa.values()];
    estado.fonteCacheEstatisticasArtista  = fonte;
  }
  return [...estado.dadosCacheEstatisticasArtista].sort((a, b) =>
    estado.artistasEmOrdemCrescente ? a.count - b.count : b.count - a.count,
  );
}

// ─── Faixas ───────────────────────────────────────────────────────────────────

/**
 * Retorna contagem de plays por faixa (artist::name como chave).
 * @param {Array} [fonte=getTracksVisiveis()]
 * @returns {Array}
 */
export function getEstatisticasFaixa(fonte = getTracksVisiveis()) {
  return contarPor(
    fonte,
    (t) => `${t.artist}::${t.name}`,
    (t) => ({ ...t }),
  );
}

// ─── Álbuns ───────────────────────────────────────────────────────────────────

/**
 * @param {Array} [fonte=getTracksVisiveis()]
 * @returns {Array}
 */
export function getEstatisticasAlbum(fonte = getTracksVisiveis()) {
  return contarPor(
    fonte,
    (t) => `${t.artist}::${t.album}`,
    (t) => ({ artist: t.artist, album: t.album }),
  );
}

// ─── Gêneros ─────────────────────────────────────────────────────────────────

/**
 * Expande os arrays de gêneros e conta frequência.
 * @param {Array} [fonte=getTracksVisiveis()]
 * @returns {Array}
 */
export function getEstatisticasGenero(fonte = getTracksVisiveis()) {
  const expandidas = [];
  fonte.forEach((t) => {
    const generos = t.genres?.length ? t.genres : ["Sem estilo"];
    generos.forEach((g) => expandidas.push({ genre: g }));
  });
  return contarPor(expandidas, (i) => i.genre);
}

// ─── Horários ────────────────────────────────────────────────────────────────

/**
 * Conta scrobbles por hora do dia, incluindo percentual em relação ao total.
 * @param {Array} [fonte=getTracksVisiveis()]
 * @returns {Array}
 */
export function getEstatisticasHorario(fonte = getTracksVisiveis()) {
  const total = Math.max(1, fonte.length);
  return contarPor(fonte, (t) => {
    const hora = new Date(t.playedAt).getHours();
    return `${String(hora).padStart(2, "0")}:00`;
  }).map((item) => ({ ...item, percent: Math.round((item.count / total) * 100) }));
}

// ─── Ano da banda ─────────────────────────────────────────────────────────────

/**
 * @param {Array} [fonte=getTracksVisiveis()]
 * @returns {Array}
 */
export function getEstatisticasAnoBanda(fonte = getTracksVisiveis()) {
  return getEstatisticasArtista(fonte).map((item) => ({
    artist: item.artist, year: item.year, count: item.count,
  }));
}

// ─── Melhores de período ──────────────────────────────────────────────────────

/** @param {Array} fonte */
export function getMelhorDia(fonte) {
  return contarPor(fonte, (t) => chaveData(t.playedAt))[0];
}

/** @param {Array} fonte */
export function getMelhorAno(fonte) {
  return contarPor(fonte, (t) => String(new Date(t.playedAt).getFullYear()))[0];
}

/**
 * Encontra a maior sequência de plays consecutivos da mesma faixa.
 * @param {Array} fonte
 * @returns {Object|null}
 */
export function getMaiorRepeticao(fonte) {
  const ordenadas = [...fonte].sort((a, b) => a.playedAt - b.playedAt);
  let melhor  = null;
  let atual   = null;

  ordenadas.forEach((track) => {
    const chave = `${track.artist}::${track.name}`;
    if (atual?.key === chave) {
      atual.count += 1;
      atual.end = track.playedAt;
    } else {
      atual = { key: chave, count: 1, track, start: track.playedAt, end: track.playedAt };
    }
    if (!melhor || atual.count > melhor.count) melhor = { ...atual };
  });

  return melhor;
}

/**
 * Retorna o item com mais plays de uma entidade (artista, álbum, faixa) em um único dia.
 * @param {Array}    fonte
 * @param {Function} getEntidade  Extrai o identificador da entidade.
 * @param {Function} getRotulo    Extrai o rótulo legível.
 * @returns {Object|undefined}
 */
export function getMelhorPorDia(fonte, getEntidade, getRotulo) {
  return contarPor(
    fonte,
    (t) => `${chaveData(t.playedAt)}::${getEntidade(t)}`,
    (t) => ({ day: chaveData(t.playedAt), label: getRotulo(t) }),
  )[0];
}

// ─── Hierarquia artista → álbum → faixa ──────────────────────────────────────

/**
 * Agrupa as faixas na hierarquia artista → álbum → faixa para o componente
 * de lista expandível. Retorna artistas ordenados por plays decrescentes.
 * @param {Array} fonte
 * @returns {Array}
 */
export function getHierarquiaFaixas(fonte) {
  const artistas = new Map();

  fonte.forEach((track) => {
    const chaveArtista = track.artist || "Artista desconhecido";
    const chaveAlbum   = track.album  || "Álbum desconhecido";
    const chaveFaixa   = track.name   || "Faixa sem título";

    const artista = artistas.get(chaveArtista) || {
      artist: chaveArtista, count: 0, image: track.image, albums: new Map(),
    };
    const album = artista.albums.get(chaveAlbum) || {
      album: chaveAlbum, artist: chaveArtista, count: 0, image: track.image, tracks: new Map(),
    };
    const faixa = album.tracks.get(chaveFaixa) || {
      name: chaveFaixa, artist: chaveArtista, album: chaveAlbum,
      count: 0, image: track.image, ultimoPlay: track.playedAt,
    };

    artista.count += 1;
    album.count   += 1;
    faixa.count   += 1;
    faixa.ultimoPlay = Math.max(faixa.ultimoPlay, track.playedAt);

    album.tracks.set(chaveFaixa, faixa);
    artista.albums.set(chaveAlbum, album);
    artistas.set(chaveArtista, artista);
  });

  return [...artistas.values()]
    .map((artista) => ({
      ...artista,
      albums: [...artista.albums.values()]
        .map((album) => ({
          ...album,
          tracks: [...album.tracks.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
        }))
        .sort((a, b) => b.count - a.count || a.album.localeCompare(b.album)),
    }))
    .sort((a, b) => b.count - a.count || a.artist.localeCompare(b.artist));
}

// ─── Top por mês ─────────────────────────────────────────────────────────────

/**
 * Agrupa as tracks visíveis por mês e retorna a faixa mais ouvida de cada mês.
 * @param {Array} tracksVisiveis
 * @returns {Array}
 */
export function getTopPorMes(tracksVisiveis) {
  const porMes = new Map();
  tracksVisiveis.forEach((track) => {
    const chave    = chaveMes(track.playedAt);
    const lista    = porMes.get(chave) || [];
    lista.push(track);
    porMes.set(chave, lista);
  });

  return [...porMes.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([mes, faixasDoMes]) => {
      const topo = getEstatisticasFaixa(faixasDoMes)[0];
      return {
        mes,
        titulo: topo ? `${topo.name} - ${topo.artist}` : "-",
        detalhe: `${faixasDoMes.length} scrobbles no mês`,
        count: topo?.count || 0,
      };
    });
}
