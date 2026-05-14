
import { getEstatisticasArtista, getEstatisticasHorario } from "./estatisticas.js";
import Chart from "chart.js/auto";

let chartArtista = null;
let chartHorario = null;

// ─── Top Artistas ─────────────────────────────────────────────────────────────

export function renderizarGraficoArtistas(canvasId, topN = 10) {
  const dados  = getEstatisticasArtista().slice(0, topN);
  const labels = dados.map(d => d.artist);
  const values = dados.map(d => d.count);
  const maxVal = values.length ? Math.max(...values) : 1;
  const total  = getEstatisticasArtista().reduce((a, b) => a + b.count, 0);

  const cores = values.map((v, i) => {
    if (i === 0)          return "#534AB7";
    if (v / maxVal > 0.75) return "#7F77DD";
    if (v / maxVal > 0.5)  return "#AFA9EC";
    return "#CECBF6";
  });

  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  const wrapper = canvas.parentElement;
  if (wrapper){
  wrapper.style.height = (dados.length * 40 + 80) + "px";
    }
  if (chartArtista) chartArtista.destroy();

  chartArtista = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: cores,
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: tooltipItem => {
              const d   = dados[tooltipItem.dataIndex];
              const pct = Math.round(ctx.parsed.x / total * 100);
              return [
                ` ${ctx.parsed.x.toLocaleString("pt-BR")} scrobbles (${pct}%)`,
                ` ${d.tracks?.size || 0} faixas únicas`,
              ];
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(136,135,128,0.12)" },
          ticks: {
            color: "#888780",
            font: { size: 11 },
            callback: v => v >= 1000 ? (v / 1000).toFixed(1) + "k" : v,
          },
          beginAtZero: true,
        },
        y: {
          grid: { display: false },
          ticks: { color: "#444441", font: { size: 12 } },
        }
      }
    }
  });
}

// ─── Horário ──────────────────────────────────────────────────────────────────

export function renderizarGraficoHorario(canvasId) {
  const dados  = getEstatisticasHorario();
  const total  = dados.reduce((a, b) => a + b.count, 0) || 1;
  const labels = dados.map(d => d.key.replace(":00", "h"));
  const values = dados.map(d => d.count);

  const periodos = [
    { horas: [0,1,2,3,4,5],       cor: "#7F77DD" },
    { horas: [6,7,8,9,10,11],     cor: "#1D9E75" },
    { horas: [12,13,14,15,16,17], cor: "#EF9F27" },
    { horas: [18,19,20,21,22,23], cor: "#D85A30" },
  ];

  const cores = dados.map((d) => {
    const hora = parseInt(d.key);
    return periodos.find(p => p.horas.includes(hora))?.cor ?? "#888780";
  });

  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  if (chartHorario) chartHorario.destroy();

  chartHorario = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: cores,
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} scrobbles (${Math.round(ctx.parsed.y / total * 100)}%)`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#888780",
            font: { size: 11 },
            autoSkip: false,
            maxRotation: 45,
            callback: (_, i) => i % 3 === 0 ? labels[i] : "",
          }
        },
        y: {
          grid: { color: "rgba(136,135,128,0.12)" },
          ticks: { color: "#888780", font: { size: 11 } },
          beginAtZero: true,
        }
      }
    }
  }); 
}

export function atualizarInterfaceGrafica(elementos) {
    const canvasArtista = document.getElementById("graficoArtistasCanvas");
    const canvasHorario = document.getElementById("graficoHorarioCanvas");

    if (canvasArtista) {
        renderizarGraficoArtistas("graficoArtistasCanvas", parseInt(elementos.limitResultados.value));
    }
    
    if (canvasHorario) {
        renderizarGraficoHorario("graficoHorarioCanvas");
    }
}

