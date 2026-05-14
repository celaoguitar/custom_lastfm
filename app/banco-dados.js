/**
 * banco-dados.js
 * Camada de acesso ao IndexedDB.
 *
 * Centraliza toda a comunicação com o banco local do navegador.
 * Nenhum outro módulo deve abrir transações diretamente.
 *
 * Stores disponíveis:
 *  - "tracks"     → faixas salvas, chave: _id (identidadeTrack)
 *  - "artistaMeta" → metadados de artistas (gêneros, ano), chave: artist
 */

import { estado } from "./estado.js";

/**
 * Abre (ou cria) o banco IndexedDB "lastMaster".
 * Deve ser chamada uma única vez na inicialização.
 * @returns {Promise<IDBDatabase>}
 */
export function abrirBancoDados() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("lastMaster", 1);

    req.onupgradeneeded = (evento) => {
      const db = evento.target.result;
      if (!db.objectStoreNames.contains("tracks")) {
        db.createObjectStore("tracks", { keyPath: "_id" });
      }
      if (!db.objectStoreNames.contains("artistaMeta")) {
        db.createObjectStore("artistaMeta", { keyPath: "artist" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

/**
 * Lê todos os registros de um store.
 * @param {string} nomeStore
 * @returns {Promise<Array>}
 */
export function buscarTodosBanco(nomeStore) {
  if (!estado.bancoDados) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const req = estado.bancoDados
      .transaction(nomeStore, "readonly")
      .objectStore(nomeStore)
      .getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Insere ou atualiza (upsert) vários registros em um store.
 * Operação assíncrona — não bloqueia a UI.
 * @param {string} nomeStore
 * @param {Array}  itens
 */
export function salvarVariosBanco(nomeStore, itens) {
  if (!estado.bancoDados || !itens.length) return;
  const tx    = estado.bancoDados.transaction(nomeStore, "readwrite");
  const store = tx.objectStore(nomeStore);
  itens.forEach((item) => store.put(item));
}

/**
 * Apaga todos os registros do store e reescreve com os novos itens.
 * Use para sincronizações completas; prefira salvarVariosBanco() para deltas.
 * @param {string} nomeStore
 * @param {Array}  [itens=[]]
 */
export function limparEEscreverBanco(nomeStore, itens = []) {
  if (!estado.bancoDados) return;
  const tx    = estado.bancoDados.transaction(nomeStore, "readwrite");
  const store = tx.objectStore(nomeStore);
  store.clear();
  itens.forEach((item) => store.put(item));
}
