/**
 * auth.js — Sessão e login/cadastro (uso interno).
 * A sessão (token) fica em localStorage. O gerador funciona sem login;
 * só Salvar/Abrir exigem estar logado, para separar os posts por usuário.
 */

const SESSAO_KEY = "4creaty-sessao";

function sessao() {
  try { return JSON.parse(localStorage.getItem(SESSAO_KEY)) || null; } catch (e) { return null; }
}
function tokenAtual() { const s = sessao(); return s && s.token ? s.token : ""; }
function setSessao(s) {
  if (s) localStorage.setItem(SESSAO_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSAO_KEY);
  atualizarConta();
}

function escapaTxt(t) { const d = document.createElement("div"); d.textContent = String(t); return d.innerHTML; }

function atualizarConta() {
  const area = document.getElementById("conta-area");
  if (!area) return;
  const s = sessao();
  area.innerHTML = s
    ? '<span class="conta-nome">' + escapaTxt(s.nome) + '</span><button class="btn-secondary" onclick="sair()">Sair</button>'
    : '<button class="btn-secondary" onclick="abrirLogin()">Entrar</button>';
}

/* ── Modal ───────────────────────────────────────────────────────────────── */

function abrirLogin() { document.getElementById("auth-modal").style.display = "flex"; mostrarAba("login"); statusAuth(""); }
function fecharLogin(ev) { if (!ev || ev.target === document.getElementById("auth-modal")) document.getElementById("auth-modal").style.display = "none"; }

function mostrarAba(qual) {
  document.getElementById("aba-login").style.display = qual === "login" ? "block" : "none";
  document.getElementById("aba-cadastro").style.display = qual === "cadastro" ? "block" : "none";
  document.getElementById("tab-login").classList.toggle("ativo", qual === "login");
  document.getElementById("tab-cadastro").classList.toggle("ativo", qual === "cadastro");
}

function statusAuth(msg, tipo) {
  const el = document.getElementById("auth-status");
  if (el) { el.textContent = msg || ""; el.className = "status-linha" + (tipo ? " " + tipo : ""); }
}

/* ── Ações ───────────────────────────────────────────────────────────────── */

async function entrar() {
  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;
  if (!email || !senha) { statusAuth("Preencha e-mail e senha.", "erro"); return; }
  statusAuth("Entrando...");
  try {
    const r = await fetch(APPS_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ acao: "login", email, senha }) });
    const d = await r.json();
    if (d.ok) { setSessao({ token: d.token, nome: d.user.nome, email: d.user.email }); fecharLogin(); if (typeof statusApp === "function") statusApp("Bem-vindo, " + d.user.nome + ".", "ok"); }
    else statusAuth("Falha: " + (d.erro || "erro"), "erro");
  } catch (e) { statusAuth("Falha ao entrar: " + e.message, "erro"); }
}

async function cadastrar() {
  const nome = document.getElementById("cad-nome").value.trim();
  const email = document.getElementById("cad-email").value.trim();
  const senha = document.getElementById("cad-senha").value;
  if (!nome || !email || senha.length < 4) { statusAuth("Nome, e-mail e senha (mín. 4 caracteres).", "erro"); return; }
  statusAuth("Criando conta...");
  try {
    const r = await fetch(APPS_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ acao: "registrar", nome, email, senha }) });
    const d = await r.json();
    if (d.ok) { setSessao({ token: d.token, nome: d.user.nome, email: d.user.email }); fecharLogin(); if (typeof statusApp === "function") statusApp("Conta criada. Bem-vindo, " + d.user.nome + ".", "ok"); }
    else statusAuth("Falha: " + (d.erro || "erro"), "erro");
  } catch (e) { statusAuth("Falha ao cadastrar: " + e.message, "erro"); }
}

function sair() { setSessao(null); if (typeof statusApp === "function") statusApp("Você saiu.", "ok"); }

document.addEventListener("DOMContentLoaded", atualizarConta);
