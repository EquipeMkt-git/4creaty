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
  const sugestao = (typeof estado !== "undefined" && estado.nome)
    ? estado.nome
    : (typeof nomeSugeridoAtual === "function" ? nomeSugeridoAtual() : "Post");
  const nome = window.prompt("Nome do post:", sugestao);
  if (nome === null) return;
  if (typeof estado !== "undefined") estado.nome = nome.trim() || sugestao;

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

let _acervoItens = [];

async function abrirBiblioteca() {
  if (semBackend()) return;
  if (!tokenAtual()) { if (typeof abrirLogin === "function") abrirLogin(); return; }
  document.getElementById("open-modal").style.display = "flex";
  if (document.getElementById("home-screen")) document.getElementById("home-screen").style.display = "none";
  mostrarBiblioteca("meus");
}

async function abrirAcervo() {
  if (semBackend()) return;
  if (!tokenAtual()) { if (typeof abrirLogin === "function") abrirLogin(); return; }
  document.getElementById("open-modal").style.display = "flex";
  if (document.getElementById("home-screen")) document.getElementById("home-screen").style.display = "none";
  mostrarBiblioteca("acervo");
}

function mostrarBiblioteca(qual) {
  document.getElementById("tab-meus").classList.toggle("ativo", qual === "meus");
  document.getElementById("tab-acervo").classList.toggle("ativo", qual === "acervo");
  document.getElementById("acervo-filtro").style.display = qual === "acervo" ? "flex" : "none";
  if (qual === "acervo") carregarAcervo(); else carregarMeus();
}

async function carregarMeus() {
  const lista = document.getElementById("saved-list");
  lista.innerHTML = '<div class="saved-vazio">Carregando...</div>';
  try {
    const r = await fetch(APPS_SCRIPT_URL + "?acao=listar&token=" + encodeURIComponent(tokenAtual()));
    const d = await r.json();
    if (!d.ok || !d.itens || !d.itens.length) { lista.innerHTML = '<div class="saved-vazio">Nenhum post salvo ainda.</div>'; return; }
    lista.innerHTML = "";
    d.itens.forEach(item => {
      const div = document.createElement("div");
      div.className = "saved-item";
      div.innerHTML = '<div class="s-info"><div class="s-nome"></div><div class="s-meta"></div></div>' +
        '<div class="s-acoes"><span class="btn-dl s-abrir">Abrir</span><span class="btn-dl s-dup">Duplicar</span></div>';
      div.querySelector(".s-nome").textContent = item.nome;
      div.querySelector(".s-meta").textContent = formatarData(item.atualizado_em);
      div.querySelector(".s-abrir").addEventListener("click", (e) => { e.stopPropagation(); abrirCarrossel(item.id, false); });
      div.querySelector(".s-dup").addEventListener("click", (e) => { e.stopPropagation(); abrirCarrossel(item.id, true); });
      lista.appendChild(div);
    });
  } catch (e) { lista.innerHTML = '<div class="saved-vazio">Falha ao carregar: ' + e.message + '</div>'; }
}

async function carregarAcervo() {
  const lista = document.getElementById("saved-list");
  lista.innerHTML = '<div class="saved-vazio">Carregando...</div>';
  try {
    const r = await fetch(APPS_SCRIPT_URL + "?acao=acervo&token=" + encodeURIComponent(tokenAtual()));
    const d = await r.json();
    if (!d.ok || !d.itens || !d.itens.length) { lista.innerHTML = '<div class="saved-vazio">Acervo vazio.</div>'; document.getElementById("filtro-autor").innerHTML = ""; return; }
    _acervoItens = d.itens;
    const autores = Array.from(new Set(_acervoItens.map(i => i.autor || "Sem autor"))).sort();
    document.getElementById("filtro-autor").innerHTML = '<option value="">Todos os autores</option>' + autores.map(a => '<option>' + escaparH(a) + '</option>').join("");
    renderAcervo();
  } catch (e) { lista.innerHTML = '<div class="saved-vazio">Falha ao carregar: ' + e.message + '</div>'; }
}

function filtrarAcervo() { renderAcervo(); }

function renderAcervo() {
  const lista = document.getElementById("saved-list");
  const filtro = document.getElementById("filtro-autor").value;
  const itens = filtro ? _acervoItens.filter(i => (i.autor || "Sem autor") === filtro) : _acervoItens;
  lista.innerHTML = "";
  if (!itens.length) { lista.innerHTML = '<div class="saved-vazio">Nenhum post desse autor.</div>'; return; }
  itens.forEach(item => {
    const div = document.createElement("div");
    div.className = "saved-item";
    div.innerHTML = '<div class="s-info"><div class="s-nome"></div><div class="s-meta"></div></div>' +
      '<div class="s-acoes"><span class="btn-dl s-usar">Usar</span></div>';
    div.querySelector(".s-nome").textContent = item.nome;
    div.querySelector(".s-meta").textContent = (item.autor || "Sem autor") + " · " + formatarData(item.atualizado_em);
    div.querySelector(".s-usar").addEventListener("click", (e) => { e.stopPropagation(); usarDoAcervo(item.id); });
    lista.appendChild(div);
  });
}

function escaparH(t) { const d = document.createElement("div"); d.textContent = String(t); return d.innerHTML; }

async function abrirCarrossel(id, duplicar) {
  setStatus("Abrindo...");
  try {
    const r = await fetch(APPS_SCRIPT_URL + "?acao=abrir&id=" + encodeURIComponent(id) + "&token=" + encodeURIComponent(tokenAtual()));
    const d = await r.json();
    if (!d.ok || !d.item) { setStatus("Não encontrado.", "erro"); return; }
    carrosselAtualId = duplicar ? null : d.item.id;
    if (typeof estado !== "undefined") estado.nome = duplicar ? ("Cópia de " + d.item.nome) : d.item.nome;
    fecharBiblioteca();
    if (document.getElementById("home-screen")) document.getElementById("home-screen").style.display = "none";
    if (typeof aplicarEstadoJSON === "function") aplicarEstadoJSON(d.item.texto || "");
    setStatus(duplicar ? 'Cópia de "' + d.item.nome + '" carregada — salve para criar o novo.' : 'Aberto: "' + d.item.nome + '".', "ok");
  } catch (e) { setStatus("Falha ao abrir: " + e.message, "erro"); }
}

async function usarDoAcervo(id) {
  setStatus("Carregando do acervo...");
  try {
    const r = await fetch(APPS_SCRIPT_URL + "?acao=abrir_acervo&id=" + encodeURIComponent(id) + "&token=" + encodeURIComponent(tokenAtual()));
    const d = await r.json();
    if (!d.ok || !d.item) { setStatus("Não encontrado.", "erro"); return; }
    carrosselAtualId = null; // vira um post novo, do usuário atual
    if (typeof estado !== "undefined") estado.nome = "Cópia de " + d.item.nome;
    fecharBiblioteca();
    if (document.getElementById("home-screen")) document.getElementById("home-screen").style.display = "none";
    if (typeof aplicarEstadoJSON === "function") aplicarEstadoJSON(d.item.texto || "");
    setStatus('Do acervo: "' + d.item.nome + '" (de ' + (d.item.autor || "outro usuário") + '). Salve para adicionar aos seus.', "ok");
  } catch (e) { setStatus("Falha: " + e.message, "erro"); }
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
