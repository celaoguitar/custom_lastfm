# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Restrições Obrigatórias

- **Escopo de arquivos:** Leia e escreva somente dentro de `c:\Users\marce\OneDrive\Documentos\custom_lastfm\`. Nunca acesse, liste, leia ou modifique arquivos fora desta pasta.
- **Git — somente leitura:** Operações de escrita no repositório são proibidas. Nunca execute `git commit`, `git push`, `git merge`, `git rebase`, `git reset`, `git stash`, `git tag`, `git rm`, `git mv` ou qualquer outro comando que altere o histórico ou o estado remoto.
- **Chaves de API:** Nunca exiba, registre em log, inclua em arquivos ou mencione chaves de API, tokens ou credenciais presentes no código ou no localStorage. Se precisar referenciar uma chave, use um placeholder como `<API_KEY>`.

## Running Locally

```bash
node local-server.js
# Serves at http://127.0.0.1:5173
# PORT env var overrides the default port
```

Sem build — Vanilla JS/CSS sem dependências ou bundler.

## Arquitetura

SPA (Single-Page Application) que busca scrobbles da Last.fm e exibe dashboards de analytics no navegador. A interface é em português (pt-BR). Todos os módulos usam ES Modules nativos do browser (`<script type="module">`).

**Fluxo principal dos dados:**

```
Last.fm API → requisitarLastfm()
           → buscarTracksNoIntervalo() (paginado)
           → enriquecerMetadadosArtistas() (gêneros, ano da banda)
           → mesclarTracks()              (dedup + salva no IndexedDB)
           → getTracksVisiveis()          (filtros aplicados, memoizado)
           → renderizarTudo()             → DOM
```

**Estado:** O array `estado.tracks` em [app/estado.js](app/estado.js) é a fonte da verdade. Índices em memória (`indicePorAno`, `indicePorMes`, `indicePorDia`) são Maps para busca O(1) por período.

**Memoização:** `getTracksVisiveis()` em [app/filtros.js](app/filtros.js) é cacheada por uma chave composta dos 8 filtros ativos. `getEstatisticasArtista()` em [app/estatisticas.js](app/estatisticas.js) é cacheada por referência do array-fonte.

**Dois estágios de carregamento:** Na primeira sincronização, todo o histórico é buscado ano a ano. Nas seguintes, apenas o ano atual (incremental). Filtros operam 100% localmente — sem chamadas à API durante filtragem.

**Pipeline de renderização:** `renderizarTudo()` é o orquestrador único. A view ativa (`seletorVisualizacao`) e o escopo (`escopoMetricas` — todos os tempos / ano / mês) controlam quais seções são visíveis.

**Persistência:** IndexedDB ("lastMaster") com stores "tracks" e "artistaMeta". localStorage como fallback e para preferências de UI.

## Módulos em app/

| Arquivo | Responsabilidade |
|---|---|
| [app/configuracao.js](app/configuracao.js) | Constantes globais, `catalogoDemo`, `METRICAS_PRINCIPAIS` |
| [app/estado.js](app/estado.js) | Objeto `estado` (fonte da verdade), `invalidarCaches()` |
| [app/banco-dados.js](app/banco-dados.js) | IndexedDB: `abrirBancoDados()`, `buscarTodosBanco()`, `salvarVariosBanco()`, `limparEEscreverBanco()` |
| [app/utilidades.js](app/utilidades.js) | Formatação de datas/números, toast, download, canvas, ranges carregados |
| [app/elementos.js](app/elementos.js) | Todas as referências ao DOM centralizadas em um único objeto `elementos` |
| [app/tracks.js](app/tracks.js) | Normalização, limpeza de remaster, identidade, merge, índices, migração |
| [app/filtros.js](app/filtros.js) | `getTracksVisiveis()` (memoizada), `getTracksPorEscopo()`, ranges de data |
| [app/estatisticas.js](app/estatisticas.js) | Agregações: artistas, faixas, álbuns, gêneros, horários, hierarquia, top mensal |
| [app/api-lastfm.js](app/api-lastfm.js) | Requisições à API: histórico completo, ano atual, metadados de artistas |
| [app/renderizacao.js](app/renderizacao.js) | Toda a camada de apresentação: `renderizarTudo()` e todas as funções `renderizar*()` |
| [app/principal.js](app/principal.js) | Bootstrap, event listeners, sync form, importação manual, demo |

## Outros arquivos

| Arquivo | Propósito |
|---|---|
| [index.html](index.html) | Layout da UI; todos os IDs que os módulos referenciam pelo DOM |
| [styles.css](styles.css) | Dark-theme glassmorphism; `@media print` para exportação PDF |
| [local-server.js](local-server.js) | Servidor HTTP mínimo para dev (sem framework) |

## Convenções de Código

- **Português em tudo:** nomes de funções, variáveis, comentários e mensagens para o usuário.
- **Sem efeitos colaterais nos módulos de dados:** `estatisticas.js` e `filtros.js` não alteram `estado` nem chamam a API.
- **Sem chamadas à API durante filtros:** `getTracksVisiveis()` opera apenas sobre dados já carregados.
- **Rebuild de dropdowns por flag:** `estado.filtrosSujos` evita reconstrução cara dos selects a cada render — só reconstrói quando `tracks` muda.

## Padrões Não Óbvios

- **Range tracking:** `marcarRangeCarregado()` em [app/utilidades.js](app/utilidades.js) registra os intervalos já buscados para evitar chamadas duplicadas à API.
- **Limpeza de remaster:** `limparNomeFaixa()` e `limparNomeAlbum()` em [app/tracks.js](app/tracks.js) removem sufixos "(2011 Remaster)" antes de agrupar — sempre passe strings da API por essas funções.
- **Canvas:** A animação de pulso (`animarPulso()`) e o gráfico de atividade (`desenharGraficoAtividade()`) usam `<canvas>` e precisam ser chamadas novamente após mudanças de layout.
- **Exportação:** PDF usa `window.print()` com CSS de impressão; XLS gera HTML de tabela em memória e dispara download via Blob.
- **Scroll performance:** `.music-group` usa `content-visibility: auto` para que o browser pule a renderização de itens fora da tela.
