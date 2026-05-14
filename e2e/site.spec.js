import { test, expect } from "@playwright/test";

// Helpers
async function carregarDemo(page) {
  await page.goto("/");
  await page.waitForFunction(() => document.querySelector("#totalScrobbles") !== null);
  await page.locator("#loadDemoButton").click();
  await expect(page.locator("#totalScrobbles")).not.toHaveText("0", { timeout: 10_000 });
}

// ─── Carregamento inicial ─────────────────────────────────────────────────────

test("página carrega sem erros de console", async ({ page }) => {
  const erros = [];
  page.on("console", (msg) => { if (msg.type() === "error") erros.push(msg.text()); });
  page.on("pageerror", (err) => erros.push(err.message));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(erros, `Erros: ${erros.join(" | ")}`).toHaveLength(0);
});

test("título está correto", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Last Master/i);
});

test("todos os módulos JS carregam sem 404", async ({ page }) => {
  const falhas = [];
  page.on("response", (r) => { if (r.url().includes(".js") && r.status() === 404) falhas.push(r.url()); });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(falhas, `Módulos 404: ${falhas.join(", ")}`).toHaveLength(0);
});

// ─── Modo demonstração ────────────────────────────────────────────────────────

test("modo demo carrega e exibe scrobbles", async ({ page }) => {
  await carregarDemo(page);
  const texto = await page.locator("#totalScrobbles").textContent();
  expect(Number(texto.replace(/\D/g, ""))).toBeGreaterThan(0);
});

test("modo demo exibe artistas na lista", async ({ page }) => {
  await carregarDemo(page);
  await expect(page.locator(".artist-row").first()).toBeVisible();
});

// ─── Navegação entre views ────────────────────────────────────────────────────

test("navegação entre abas funciona", async ({ page }) => {
  await carregarDemo(page);
  for (const aba of ["rankings", "deep", "summary"]) {
    await page.locator(`[data-nav-view="${aba}"]`).click();
    await expect(page.locator(`[data-view-panel*="${aba}"]`).first()).not.toHaveClass(/is-hidden/);
  }
});

// ─── Filtros de período ───────────────────────────────────────────────────────

test("filtro por período aplica sem travar", async ({ page }) => {
  await carregarDemo(page);
  for (const periodo of ["month", "year", "all"]) {
    await page.locator("#periodSelect").selectOption(periodo);
    await expect(page.locator("#totalScrobbles")).toBeVisible();
  }
});

test("limpar filtros reseta para mês", async ({ page }) => {
  await carregarDemo(page);
  await page.locator("#periodSelect").selectOption("year");
  await page.locator("#clearFiltersButton").click();
  await expect(page.locator("#periodSelect")).toHaveValue("month");
});

// ─── Lista de faixas (lazy render) ───────────────────────────────────────────

test("primeiro artista começa aberto com álbuns", async ({ page }) => {
  await carregarDemo(page);
  await page.locator(`[data-nav-view="summary"]`).click();
  const primeiroArtista = page.locator(".artist-group[open]").first();
  await expect(primeiroArtista).toBeVisible();
  await expect(primeiroArtista.locator(".album-group").first()).toBeVisible();
});

test("artista colapsado expande ao clicar e carrega álbuns", async ({ page }) => {
  await carregarDemo(page);
  await page.locator(`[data-nav-view="summary"]`).click();
  await page.waitForSelector(".artist-group:nth-child(2)");
  const segundo = page.locator(".artist-group").nth(1);
  await expect(segundo).not.toHaveAttribute("open", "");
  await segundo.locator(".music-summary").click();
  await expect(segundo.locator(".album-group").first()).toBeVisible();
});

// ─── Scroll performance ───────────────────────────────────────────────────────

test("scroll até o final e de volta não trava a página", async ({ page }) => {
  await carregarDemo(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await expect(page.locator("#totalScrobbles")).toBeVisible();
});

// ─── Exportações ──────────────────────────────────────────────────────────────

test("botões de exportação estão habilitados com dados", async ({ page }) => {
  await carregarDemo(page);
  await expect(page.locator("#exportPdfButton")).toBeEnabled();
  await expect(page.locator("#exportXlsButton")).toBeEnabled();
});
