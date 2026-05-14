/**
 * utilidades.js
 * Funções auxiliares puras: formatação, notificações, download e canvas.
 * Não dependem de estado nem de outros módulos da aplicação.
 */

// ─── Formatação de datas ─────────────────────────────────────────────────────

/**
 * Retorna a chave de data no formato "YYYY-MM-DD".
 * @param {number} timestamp Milissegundos desde epoch.
 * @returns {string}
 */
export function chaveData(timestamp) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Retorna a chave de mês no formato "YYYY-MM".
 * @param {number} timestamp
 * @returns {string}
 */
export function chaveMes(timestamp) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Formata uma chave "YYYY-MM-DD" como data legível em pt-BR.
 * @param {string} chave
 * @returns {string}
 */
export function formatarChaveData(chave) {
  const [ano, mes, dia] = chave.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/**
 * Formata uma chave "YYYY-MM" como mês legível em pt-BR.
 * @param {string} chave
 * @returns {string}
 */
export function formatarChaveMes(chave) {
  const [ano, mes] = chave.split("-").map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "short", year: "numeric",
  });
}

/**
 * Formata um número com separador de milhar em pt-BR.
 * @param {number} valor
 * @returns {string}
 */
export function formatarNumero(valor) {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

/**
 * Formata um timestamp como data e hora curtas em pt-BR.
 * @param {number} valor
 * @returns {string}
 */
export function formatarDataHora(valor) {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "data indisponível";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);
}

/**
 * Extrai o primeiro ano com 4 dígitos (19xx ou 20xx) de um texto livre.
 * Usado para obter o ano de formação de um artista a partir da bio da Last.fm.
 * @param {string} texto
 * @returns {string}
 */
export function extrairAno(texto) {
  const match = String(texto).match(/\b(19[0-9]{2}|20[0-9]{2})\b/);
  return match ? match[1] : "";
}

// ─── Strings ─────────────────────────────────────────────────────────────────

/**
 * Escapa caracteres HTML especiais para evitar XSS ao usar innerHTML.
 * @param {string} valor
 * @returns {string}
 */
export function escaparHtml(valor) {
  return String(valor).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[c]);
}

/**
 * Pluraliza "música / músicas" com o número formatado.
 * @param {number} quantidade
 * @returns {string}
 */
export function pluralizarMusica(quantidade) {
  return `${formatarNumero(quantidade)} ${quantidade === 1 ? "música" : "músicas"}`;
}

// ─── Interface ────────────────────────────────────────────────────────────────

/**
 * Exibe um toast temporário na tela.
 * @param {string} mensagem
 */
export function exibirNotificacao(mensagem) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = mensagem;
  toast.classList.add("is-visible");
  clearTimeout(exibirNotificacao._timer);
  exibirNotificacao._timer = setTimeout(
    () => toast.classList.remove("is-visible"),
    3200,
  );
}

/**
 * Atualiza o indicador de status de conexão.
 * @param {string} mensagem
 * @param {"info"|"success"|"error"} [tipo="info"]
 */
export function definirStatusConexao(mensagem, tipo = "info") {
  const el = document.querySelector("#connectionStatus");
  if (!el) return;
  el.textContent    = mensagem;
  el.dataset.type   = tipo;
}

/**
 * Traduz mensagens de erro da API Last.fm para pt-BR.
 * @param {unknown} erro
 * @returns {string}
 */
export function mensagemErroLastfm(erro) {
  const texto = String(erro?.message || erro || "Não foi possível conectar com a Last.fm.");
  if (/invalid api key/i.test(texto))       return "API key inválida. Confira se você copiou a chave correta no site da Last.fm.";
  if (/user not found|no user/i.test(texto)) return "Usuário não encontrado. Confira o nome da conta do Last.fm.";
  if (/failed to fetch|network/i.test(texto)) return "Não consegui acessar a Last.fm. Verifique a internet e rode o projeto por localhost.";
  return texto;
}

// ─── Arquivos ─────────────────────────────────────────────────────────────────

/**
 * Dispara o download de um arquivo no navegador.
 * @param {string} conteudo
 * @param {string} nomeArquivo
 * @param {string} tipo MIME type
 */
export function baixarArquivo(conteudo, nomeArquivo, tipo) {
  const blob = new Blob([conteudo], { type: tipo });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = nomeArquivo;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Retorna o sufixo de data atual formatado para nomes de arquivo. */
export function sufixoArquivoRelatorio() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

/**
 * Desenha um retângulo com cantos arredondados no canvas.
 * Necessário porque roundRect() ainda não tem suporte universal.
 */
export function arredondarRetangulo(ctx, x, y, largura, altura, raio) {
  const r = Math.min(raio, largura / 2, altura / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + largura, y,          x + largura, y + altura, r);
  ctx.arcTo(x + largura, y + altura, x,           y + altura, r);
  ctx.arcTo(x,           y + altura, x,           y,          r);
  ctx.arcTo(x,           y,          x + largura, y,          r);
  ctx.closePath();
}

// ─── Ranges carregados (localStorage) ────────────────────────────────────────

export function getRangesCarregados() {
  try { return new Set(JSON.parse(localStorage.getItem("lastMasterLoadedRanges") || "[]")); }
  catch { return new Set(); }
}

export function salvarRangesCarregados(ranges) {
  localStorage.setItem("lastMasterLoadedRanges", JSON.stringify([...ranges]));
}

export function marcarRangeCarregado(chave) {
  const ranges = getRangesCarregados();
  ranges.add(chave);
  salvarRangesCarregados(ranges);
}

export function rangeEstaCarregado(chave) {
  return getRangesCarregados().has(chave);
}

/**
 * Verifica se o range já está coberto por um range mais abrangente.
 * Ex.: "month:2024-03" é coberto se "year:2024" ou "history:full" existir.
 */
export function rangeEstaCoberto(chave) {
  const ranges = getRangesCarregados();
  if (ranges.has("history:full") || ranges.has(chave)) return true;
  const [tipo, valor] = String(chave).split(":");
  if (!valor) return false;
  const ano = valor.slice(0, 4);
  const mes = valor.slice(0, 7);
  if ((tipo === "month" || tipo === "day") && ranges.has(`year:${ano}`)) return true;
  if (tipo === "day" && ranges.has(`month:${mes}`)) return true;
  return false;
}
