/**
 * storage.js — Persistência no Drive (Google Sheets + Apps Script).
 * Salva o ESTADO completo do post (modelo, formato, cor, campos ou texto) como
 * JSON na coluna "texto" da planilha. Publicar envia os PNGs para o Drive.
 */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxSTAP-r-TKvwW9pxR5-ro4Soz5A24qb4bePn7_O8VYftFWI9aVL-Ztf_qQMrx9v6Jz/exec";

let carrosselAtualId = null;

function setStatus(msg, tipo) {
  const el = document.getElementById("status-app");
  if (!el) return;
  el.textContent = msg || "";
  el.className = "status-linha" + (tipo ? " " + tipo : "");
}

function semBackend() {
  if (!APPS_SCRIPT_URL) { setStatus("Configure a URL do Apps Script em storage.js.", "erro"); return true; }
  return false;
}

/* ── Salvar ────────────────────────────────────────────────────────────────── */

async function salvarCarrossel() {
  if (semBackend()) return;
  if (!tokenAtual()) { setStatus("Entre na sua conta para salvar.", "erro"); if (typeof abrirLogin === "function") abrirLogin(); return; }
  if (typeof contagemCards === "function" && contagemCards() === 0) {
    setStatus("Nada para salvar — preencha o conteúdo primeiro.", "erro");
    return;
  }
  const sugestao = typeof nomeSugeridoAtual === "function" ? nomeSugeridoAtual() : "Post";
  const nome = window.prompt("Nome do post:", sugestao);
  if (nome === null) return;

  const texto = typeof obterEstadoJSON === "function"
    ? obterEstadoJSON()
    : document.getElementById("editor").value;

  setStatus("Salvando no Drive...");
  try {
    const resposta = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ acao: "salvar", token: tokenAtual(), id: carrosselAtualId, nome: nome.trim() || sugestao, texto })
    });
    const dados = await resposta.json();
    if (dados.ok) { carrosselAtualId = dados.id; setStatus('Salvo como "' + (nome.trim() || sugestao) + '".', "ok"); }
    else setStatus("Falha ao salvar: " + (dados.erro || "erro desconhecido"), "erro");
  } catch (erro) {
    setStatus("Falha ao salvar: " + erro.message + " (confira o passo a passo em apps-script/DIAGNOSTICO-PLANILHA.md)", "erro");
  }
}

// Sugere nome pela primeira linha significativa (modelo Notas).
function nomeSugerido(texto) {
  const linha = (texto || "").split("\n").map(l => l.trim()).find(l => l && !/^#\d+/.test(l) && !/^---/.test(l));
  const limpo = (linha || "Carrossel").replace(/[*_=#]/g, "").trim().slice(0, 50);
  return limpo || "Carrossel";
}

/* ── Publicar PNGs no Drive ──────────────────────────────────────────────────── */

async function publicarNoDrive() {
  if (semBackend()) return;
  if (typeof contagemCards !== "function" || contagemCards() === 0) { setStatus("Gere o conteúdo antes de publicar.", "erro"); return; }

  setStatus("Renderizando e enviando ao Drive... pode levar alguns segundos.");
  try {
    const imagens = await capturarCards();
    if (!imagens.length) { setStatus("Nada para publicar.", "erro"); return; }
    const nome = typeof nomeSugeridoAtual === "function" ? nomeSugeridoAtual() : "Post";
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
  if (!tokenAtual()) { if (typeof abrirLogin === "function") abrirLogin(); return; }
  document.getElementById("open-modal").style.display = "flex";
  const lista = document.getElementById("saved-list");
  lista.innerHTML = '<div class="saved-vazio">Carregando...</div>';
  try {
    const resposta = await fetch(APPS_SCRIPT_URL + "?acao=listar&token=" + encodeURIComponent(tokenAtual()));
    const dados = await resposta.json();
    if (!dados.ok || !dados.itens || dados.itens.length === 0) {
      lista.innerHTML = '<div class="saved-vazio">Nenhum post salvo ainda.</div>';
      return;
    }
    lista.innerHTML = "";
    for (const item of dados.itens) {
      const div = document.createElement("div");
      div.className = "saved-item";
      div.innerHTML = '<div class="s-info"><div class="s-nome"></div><div class="s-meta"></div></div>' +
        '<div class="s-acoes"><span class="btn-dl s-abrir">Abrir</span><span class="btn-dl s-dup">Duplicar</span></div>';
      div.querySelector(".s-nome").textContent = item.nome;
      div.querySelector(".s-meta").textContent = formatarData(item.atualizado_em);
      div.querySelector(".s-abrir").addEventListener("click", (e) => { e.stopPropagation(); abrirCarrossel(item.id, false); });
      div.querySelector(".s-dup").addEventListener("click", (e) => { e.stopPropagation(); abrirCarrossel(item.id, true); });
      lista.appendChild(div);
    }
  } catch (erro) {
    lista.innerHTML = '<div class="saved-vazio">Falha ao carregar: ' + erro.message + "</div>";
  }
}

async function abrirCarrossel(id, duplicar) {
  setStatus("Abrindo...");
  try {
    const resposta = await fetch(APPS_SCRIPT_URL + "?acao=abrir&id=" + encodeURIComponent(id) + "&token=" + encodeURIComponent(tokenAtual()));
    const dados = await resposta.json();
    if (!dados.ok || !dados.item) { setStatus("Não encontrado.", "erro"); return; }
    carrosselAtualId = duplicar ? null : dados.item.id;
    fecharBiblioteca();
    if (typeof aplicarEstadoJSON === "function") aplicarEstadoJSON(dados.item.texto || "");
    setStatus(duplicar
      ? 'Cópia de "' + dados.item.nome + '" carregada — salve para criar o novo.'
      : 'Aberto: "' + dados.item.nome + '".', "ok");
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
