/**
 * storage.js — Persistência no Drive (Google Sheets + Apps Script).
 * Um registro = um carrossel (nome, autor, data, texto). Publicar envia os PNGs
 * para uma pasta compartilhada no Drive.
 */

// URL /exec do Web App publicado (conta 4blue).
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxSTAP-r-TKvwW9pxR5-ro4Soz5A24qb4bePn7_O8VYftFWI9aVL-Ztf_qQMrx9v6Jz/exec";

let carrosselAtualId = null;

function setStatus(msg, tipo) {
  const el = document.getElementById("status-app");
  if (!el) return;
  el.textContent = msg || "";
  el.className = "status-linha" + (tipo ? " " + tipo : "");
}

function semBackend() {
  if (!APPS_SCRIPT_URL) {
    setStatus("Configure a URL do Apps Script em storage.js para usar o Drive.", "erro");
    return true;
  }
  return false;
}

/* ── Salvar ────────────────────────────────────────────────────────────────── */

async function salvarCarrossel() {
  if (semBackend()) return;
  const texto = document.getElementById("editor").value.trim();
  if (!texto) { setStatus("Nada para salvar — o editor está vazio.", "erro"); return; }

  const sugestao = nomeSugerido(texto);
  const nome = window.prompt("Nome do carrossel:", sugestao);
  if (nome === null) return;

  setStatus("Salvando no Drive...");
  try {
    const resposta = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ acao: "salvar", id: carrosselAtualId, nome: nome.trim() || sugestao, autor: "", texto })
    });
    const dados = await resposta.json();
    if (dados.ok) {
      carrosselAtualId = dados.id;
      setStatus('Salvo como "' + (nome.trim() || sugestao) + '".', "ok");
    } else {
      setStatus("Falha ao salvar: " + (dados.erro || "erro desconhecido"), "erro");
    }
  } catch (erro) {
    setStatus("Falha ao salvar: " + erro.message, "erro");
  }
}

function nomeSugerido(texto) {
  const linha = texto.split("\n").map(l => l.trim())
    .find(l => l && !/^#\d+/.test(l) && !/^---/.test(l));
  const limpo = (linha || "Carrossel").replace(/[*_=#]/g, "").trim().slice(0, 50);
  return limpo || "Carrossel";
}

/* ── Publicar PNGs no Drive ──────────────────────────────────────────────────── */

async function publicarNoDrive() {
  if (semBackend()) return;
  if (!Array.isArray(currentSlides) || currentSlides.length === 0) {
    setStatus("Gere o carrossel antes de publicar no Drive.", "erro");
    return;
  }

  setStatus("Renderizando os cards e enviando ao Drive... pode levar alguns segundos.");
  try {
    const imagens = [];
    for (let i = 0; i < currentSlides.length; i++) {
      const el = document.getElementById("card-" + i);
      if (!el) continue;
      const bg = currentSlides[i].theme === "blue" ? "#1B2D5B" : "#ffffff";
      const canvas = await html2canvas(el, { scale: 4, useCORS: true, backgroundColor: bg, width: el.offsetWidth, height: el.offsetHeight });
      imagens.push({ card: i + 1, dataUrl: canvas.toDataURL("image/png") });
    }

    const nome = nomeSugerido(document.getElementById("editor").value.trim());
    const resposta = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ acao: "publicar_png", id: carrosselAtualId, nome, imagens })
    });
    const dados = await resposta.json();
    if (dados.ok) {
      const el = document.getElementById("status-app");
      el.className = "status-linha ok";
      el.innerHTML = dados.quantidade + " card(s) no Drive. " +
        '<a href="' + dados.pasta + '" target="_blank" rel="noopener">Abrir pasta</a>';
    } else {
      setStatus("Falha ao publicar: " + (dados.erro || "erro desconhecido"), "erro");
    }
  } catch (erro) {
    setStatus("Falha ao publicar: " + erro.message, "erro");
  }
}

/* ── Abrir (biblioteca) ──────────────────────────────────────────────────────── */

async function abrirBiblioteca() {
  if (semBackend()) return;
  document.getElementById("open-modal").style.display = "flex";
  const lista = document.getElementById("saved-list");
  lista.innerHTML = '<div class="saved-vazio">Carregando...</div>';
  try {
    const resposta = await fetch(APPS_SCRIPT_URL + "?acao=listar");
    const dados = await resposta.json();
    if (!dados.ok || !dados.itens || dados.itens.length === 0) {
      lista.innerHTML = '<div class="saved-vazio">Nenhum carrossel salvo ainda.</div>';
      return;
    }
    lista.innerHTML = "";
    for (const item of dados.itens) {
      const div = document.createElement("div");
      div.className = "saved-item";
      div.innerHTML = '<div><div class="s-nome"></div><div class="s-meta"></div></div><span class="btn-dl" style="width:auto">Abrir</span>';
      div.querySelector(".s-nome").textContent = item.nome;
      div.querySelector(".s-meta").textContent = formatarData(item.atualizado_em);
      div.addEventListener("click", () => abrirCarrossel(item.id));
      lista.appendChild(div);
    }
  } catch (erro) {
    lista.innerHTML = '<div class="saved-vazio">Falha ao carregar: ' + erro.message + "</div>";
  }
}

async function abrirCarrossel(id) {
  setStatus("Abrindo...");
  try {
    const resposta = await fetch(APPS_SCRIPT_URL + "?acao=abrir&id=" + encodeURIComponent(id));
    const dados = await resposta.json();
    if (!dados.ok || !dados.item) { setStatus("Não encontrado.", "erro"); return; }
    document.getElementById("editor").value = dados.item.texto || "";
    carrosselAtualId = dados.item.id;
    fecharBiblioteca();
    if (typeof renderFromEditor === "function") renderFromEditor(true);
    setStatus('Aberto: "' + dados.item.nome + '".', "ok");
  } catch (erro) {
    setStatus("Falha ao abrir: " + erro.message, "erro");
  }
}

function fecharBiblioteca(event) {
  if (!event || event.target === document.getElementById("open-modal")) {
    document.getElementById("open-modal").style.display = "none";
  }
}

function formatarData(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
