"use strict";

/*
 * 4creaty · lógica do formulário
 * Fonte da verdade: modelos/*.json (campos, limites, colunas do CSV).
 * Regras: validação rígida na origem; nunca cortar texto silenciosamente;
 * CSV gerado no navegador (modo sem back-end); envio ao Apps Script é opcional.
 */

// URL do Web App do Google Apps Script (F3) — guia em apps-script/INSTALACAO.md.
// Vazio = botão de envio oculto e busca de imagens desativada (URL colada à mão).
const CONFIG = { apps_script_url: "" };

const estado = {
  paletas: {},        // token -> { nome, clima, hex: { primaria, fundo, texto } }
  catalogo: {},       // id -> modelo (modelos/<id>.json)
  ordem: [],          // ordem dos modelos no manifesto
  selecionados: [],   // ids marcados, na ordem do manifesto
  paleta: "",         // token escolhido
  creditos: {}        // id do campo de imagem -> crédito do autor (atribuição)
};

document.addEventListener("DOMContentLoaded", iniciar);

async function iniciar() {
  try {
    const paletas = await lerJson("assets/paletas.json");
    estado.paletas = paletas.paletas;

    const indice = await lerJson("modelos/index.json");
    estado.ordem = indice.modelos;
    for (const id of indice.modelos) {
      estado.catalogo[id] = await lerJson("modelos/" + id + ".json");
    }
    renderizarModelos();
    document.getElementById("btn_csv").addEventListener("click", gerarCsvs);
    prepararEnvio();
  } catch (erro) {
    mostrarErroGlobal(
      "Não foi possível carregar o catálogo. Sirva o site por HTTP " +
      "(ex.: python -m http.server) — abrir o index.html direto do disco não funciona. Detalhe: " + erro.message
    );
  }
}

async function lerJson(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error("falha ao ler " + url);
  return resposta.json();
}

function mostrarErroGlobal(mensagem) {
  const el = document.getElementById("erro_global");
  el.textContent = mensagem;
  el.classList.remove("oculto");
}

/* ── Passo 1 · Modelos ─────────────────────────────────────────── */

function renderizarModelos() {
  const lista = document.getElementById("lista_modelos");
  lista.innerHTML = "";
  for (const id of estado.ordem) {
    const modelo = estado.catalogo[id];
    const rotulo = document.createElement("label");
    rotulo.className = "modelo-opcao";
    rotulo.innerHTML =
      '<input type="checkbox" value="' + id + '">' +
      '<span><span class="m-nome">' + escaparHtml(modelo.nome) + "</span><br>" +
      '<span class="m-meta">' + escaparHtml(modelo.descricao) + " · " +
      modelo.paginas + (modelo.paginas > 1 ? " páginas" : " página") + "</span></span>";
    rotulo.querySelector("input").addEventListener("change", aoMudarModelos);
    lista.appendChild(rotulo);
  }
}

function aoMudarModelos() {
  const marcados = [...document.querySelectorAll('#lista_modelos input:checked')].map(i => i.value);
  estado.selecionados = estado.ordem.filter(id => marcados.includes(id));
  document.querySelectorAll(".modelo-opcao").forEach(op => {
    op.classList.toggle("ativo", op.querySelector("input").checked);
  });
  renderizarPaletas();
  renderizarCampos();
  validar();
}

/* ── Passo 2 · Direção de arte ─────────────────────────────────── */

function paletasDisponiveis() {
  if (estado.selecionados.length === 0) return [];
  // Interseção das paletas permitidas pelos modelos escolhidos.
  let tokens = Object.keys(estado.paletas);
  for (const id of estado.selecionados) {
    const permitidas = estado.catalogo[id].paletas_permitidas || tokens;
    tokens = tokens.filter(t => permitidas.includes(t));
  }
  return tokens;
}

function renderizarPaletas() {
  const area = document.getElementById("area_paletas");
  area.innerHTML = "";
  const tokens = paletasDisponiveis();
  if (tokens.length === 0) {
    area.innerHTML = '<p class="vazio">Selecione um modelo para ver as paletas compatíveis.</p>';
    estado.paleta = "";
    return;
  }
  if (!tokens.includes(estado.paleta)) estado.paleta = "";
  for (const token of tokens) {
    const p = estado.paletas[token];
    const rotulo = document.createElement("label");
    rotulo.className = "paleta-opcao" + (estado.paleta === token ? " ativo" : "");
    rotulo.innerHTML =
      '<input type="radio" name="paleta" value="' + token + '"' + (estado.paleta === token ? " checked" : "") + ">" +
      '<span class="amostras">' +
        '<span class="amostra" style="background:' + p.hex.primaria + '"></span>' +
        '<span class="amostra" style="background:' + p.hex.fundo + '"></span>' +
        '<span class="amostra" style="background:' + p.hex.texto + '"></span>' +
      "</span>" +
      '<span><span class="p-nome">' + escaparHtml(p.nome) + '</span><br><span class="p-clima">' + escaparHtml(p.clima) + "</span></span>";
    rotulo.querySelector("input").addEventListener("change", () => {
      estado.paleta = token;
      document.querySelectorAll(".paleta-opcao").forEach(op =>
        op.classList.toggle("ativo", op.querySelector("input").checked));
      validar();
    });
    area.appendChild(rotulo);
  }
}

/* ── Passo 3 · Conteúdo (campos mesclados) ─────────────────────── */

// Mescla os campos dos modelos escolhidos: mesmo id → limite mais restrito.
function camposMesclados() {
  const mapa = new Map();
  for (const id of estado.selecionados) {
    for (const campo of estado.catalogo[id].campos) {
      if (mapa.has(campo.id)) {
        const atual = mapa.get(campo.id);
        atual.limite = Math.min(atual.limite, campo.limite);
        atual.obrigatorio = atual.obrigatorio || campo.obrigatorio;
        atual.modelos.push(id);
      } else {
        mapa.set(campo.id, { ...campo, modelos: [id] });
      }
    }
  }
  return [...mapa.values()].sort((a, b) => a.pagina - b.pagina);
}

function renderizarCampos() {
  const area = document.getElementById("area_campos");
  // Preserva o que já foi digitado ao marcar/desmarcar modelos.
  const anteriores = {};
  area.querySelectorAll("input, textarea").forEach(el => { anteriores[el.id] = el.value; });
  area.innerHTML = "";
  const campos = camposMesclados();
  if (campos.length === 0) {
    area.innerHTML = '<p class="vazio">Selecione ao menos um modelo para gerar os campos.</p>';
    return;
  }
  let paginaAtual = null;
  for (const campo of campos) {
    if (campo.pagina !== paginaAtual) {
      paginaAtual = campo.pagina;
      const titulo = document.createElement("p");
      titulo.className = "pagina-titulo";
      titulo.textContent = "Página " + paginaAtual;
      area.appendChild(titulo);
    }
    area.appendChild(campo.tipo === "imagem" ? construirCampoImagem(campo) : construirCampoTexto(campo));
  }
  // Restaura valores e recalcula contadores (limites podem ter mudado na mesclagem).
  for (const id in anteriores) {
    const el = document.getElementById(id);
    if (el) el.value = anteriores[id];
  }
  for (const campo of campos) {
    if (campo.tipo === "imagem") atualizarContadorImagem(campo.id);
    else atualizarContador(campo.id);
  }
}

function construirCampoTexto(campo) {
  const bloco = document.createElement("div");
  bloco.className = "campo";
  bloco.dataset.limite = campo.limite;
  bloco.dataset.obrigatorio = campo.obrigatorio;
  const varios = campo.modelos.length > 1 ? '<span class="limite-origem">limite do modelo mais restrito</span>' : "";
  bloco.innerHTML =
    '<div class="campo-topo"><label for="f_' + campo.id + '">' + escaparHtml(campo.rotulo) +
    (campo.obrigatorio ? ' <span class="obrig">*</span>' : "") + varios + "</label>" +
    '<span class="contador" id="c_' + campo.id + '">0/' + campo.limite + "</span></div>" +
    (campo.limite > 80
      ? '<textarea id="f_' + campo.id + '" rows="3"></textarea>'
      : '<input type="text" id="f_' + campo.id + '">') +
    '<p class="campo-msg" id="m_' + campo.id + '"></p>';
  bloco.querySelector("#f_" + campo.id).addEventListener("input", () => {
    atualizarContador(campo.id);
    validar();
  });
  return bloco;
}

// Campo de imagem: palavra-chave + busca via proxy (3 opções) ou URL colada à mão.
function construirCampoImagem(campo) {
  const bloco = document.createElement("div");
  bloco.className = "campo";
  bloco.dataset.limite = campo.limite;
  bloco.dataset.obrigatorio = campo.obrigatorio;
  bloco.dataset.imagem = "1";
  const comBusca = Boolean(CONFIG.apps_script_url);
  bloco.innerHTML =
    '<div class="campo-topo"><label for="f_' + campo.id + '_kw">' + escaparHtml(campo.rotulo) +
    (campo.obrigatorio ? ' <span class="obrig">*</span>' : "") + "</label>" +
    '<span class="contador" id="c_' + campo.id + '">0/' + campo.limite + "</span></div>" +
    '<div class="busca-imagem">' +
      '<input type="text" id="f_' + campo.id + '_kw" placeholder="ex.: business finance desk">' +
      (comBusca ? '<button type="button" class="btn-buscar" id="b_' + campo.id + '">Buscar 3 opções</button>' : "") +
    "</div>" +
    '<div class="galeria" id="g_' + campo.id + '"></div>' +
    '<div class="campo-sub"><label for="f_' + campo.id + '_url">' +
    (comBusca ? "URL da imagem escolhida (preenchida ao clicar numa opção; pode colar outra)" :
                "URL da imagem (cole aqui — a busca com 3 opções ativa após publicar o Apps Script)") + "</label>" +
    '<input type="url" id="f_' + campo.id + '_url" placeholder="https://images.unsplash.com/..."></div>' +
    '<p class="campo-msg" id="m_' + campo.id + '"></p>';
  bloco.querySelector("#f_" + campo.id + "_kw").addEventListener("input", () => {
    atualizarContadorImagem(campo.id);
    validar();
  });
  bloco.querySelector("#f_" + campo.id + "_url").addEventListener("input", validar);
  if (comBusca) {
    bloco.querySelector("#b_" + campo.id).addEventListener("click", () => buscarImagens(campo.id, campo.limite));
  }
  return bloco;
}

// Consulta o proxy do Apps Script e exibe 3 opções; o usuário escolhe (docs/06).
async function buscarImagens(id, limite) {
  const termo = document.getElementById("f_" + id + "_kw").value.trim();
  const galeria = document.getElementById("g_" + id);
  if (!termo) { galeria.innerHTML = '<p class="aviso-busca">Digite a palavra-chave (em inglês) antes de buscar.</p>'; return; }
  if (termo.length > limite) { galeria.innerHTML = '<p class="aviso-busca">Palavra-chave acima do limite.</p>'; return; }
  galeria.innerHTML = '<p class="aviso-busca">Buscando...</p>';
  try {
    const resposta = await fetch(CONFIG.apps_script_url + "?acao=imagens&q=" + encodeURIComponent(termo) + "&n=3");
    const dados = await resposta.json();
    if (!dados.ok || !dados.imagens || dados.imagens.length === 0) {
      galeria.innerHTML = '<p class="aviso-busca">' +
        escaparHtml((dados.erros || ["nenhum resultado"]).join("; ")) + "</p>";
      return;
    }
    galeria.innerHTML = "";
    for (const img of dados.imagens) {
      const figura = document.createElement("figure");
      figura.className = "opcao-img";
      figura.innerHTML = '<img src="' + escaparHtml(img.thumb) + '" alt="opção de imagem" loading="lazy">' +
        "<figcaption>" + escaparHtml(img.credito) + "</figcaption>";
      figura.addEventListener("click", () => {
        document.getElementById("f_" + id + "_url").value = img.url;
        estado.creditos[id] = img.credito;
        galeria.querySelectorAll(".opcao-img").forEach(o => o.classList.remove("ativo"));
        figura.classList.add("ativo");
        validar();
      });
      galeria.appendChild(figura);
    }
  } catch (erro) {
    galeria.innerHTML = '<p class="aviso-busca">Falha na busca: ' + escaparHtml(erro.message) + "</p>";
  }
}

/* ── Validação (Guardião de Limites) ───────────────────────────── */

function atualizarContador(id) {
  const entrada = document.getElementById("f_" + id);
  const contador = document.getElementById("c_" + id);
  const mensagem = document.getElementById("m_" + id);
  const bloco = entrada.closest(".campo");
  const limite = Number(bloco.dataset.limite);
  const usado = entrada.value.length;
  contador.textContent = usado + "/" + limite;
  contador.className = "contador" + (usado > limite ? " erro" : usado >= limite * 0.9 ? " aviso" : "");
  bloco.classList.toggle("invalido", usado > limite);
  mensagem.textContent = usado > limite ? "Reduza " + (usado - limite) + (usado - limite === 1 ? " caractere." : " caracteres.") : "";
}

function atualizarContadorImagem(id) {
  const entrada = document.getElementById("f_" + id + "_kw");
  const contador = document.getElementById("c_" + id);
  const bloco = entrada.closest(".campo");
  const limite = Number(bloco.dataset.limite);
  const usado = entrada.value.length;
  contador.textContent = usado + "/" + limite;
  contador.className = "contador" + (usado > limite ? " erro" : "");
  bloco.classList.toggle("invalido", usado > limite);
  document.getElementById("m_" + id).textContent =
    usado > limite ? "Reduza " + (usado - limite) + " caracteres." : "";
}

// Retorna a lista de pendências; vazia = pronto para gerar.
function pendencias() {
  const problemas = [];
  if (estado.selecionados.length === 0) problemas.push("escolha um modelo");
  if (estado.selecionados.length > 0 && !estado.paleta) problemas.push("escolha a paleta");
  for (const campo of camposMesclados()) {
    if (campo.tipo === "imagem") {
      const kw = document.getElementById("f_" + campo.id + "_kw");
      const url = document.getElementById("f_" + campo.id + "_url");
      if (!kw || !url) continue;
      if (kw.value.length > campo.limite) problemas.push("palavra-chave acima do limite");
      if (url.value && !/^https:\/\//.test(url.value)) problemas.push("URL de imagem inválida (use https)");
      if (campo.obrigatorio && !url.value) problemas.push("imagem obrigatória sem URL");
    } else {
      const entrada = document.getElementById("f_" + campo.id);
      if (!entrada) continue;
      if (entrada.value.length > campo.limite) problemas.push("campo acima do limite");
      if (campo.obrigatorio && entrada.value.trim() === "") problemas.push("campo obrigatório vazio");
    }
  }
  return problemas;
}

function validar() {
  const problemas = pendencias();
  const status = document.getElementById("status_form");
  const pronto = problemas.length === 0 && estado.selecionados.length > 0;
  document.getElementById("btn_csv").disabled = !pronto;
  const btnEnviar = document.getElementById("btn_enviar");
  if (btnEnviar) btnEnviar.disabled = !pronto;
  if (estado.selecionados.length === 0) {
    status.textContent = "Selecione um modelo para começar.";
    status.className = "status";
  } else if (pronto) {
    status.textContent = "Tudo validado — pronto para gerar.";
    status.className = "status ok";
  } else {
    const unicos = [...new Set(problemas)];
    status.textContent = "Pendências: " + unicos.join("; ") + ".";
    status.className = "status erro";
  }
}

/* ── Geração do CSV (contrato em docs/03 e docs/04) ────────────── */

function valorDaColuna(coluna) {
  if (coluna.startsWith("hex_")) {
    const p = estado.paletas[estado.paleta];
    return p ? (p.hex[coluna.slice(4)] || "") : "";
  }
  // Colunas de imagem terminam em _url e o input correspondente tem o mesmo id.
  const el = document.getElementById("f_" + coluna);
  return el ? el.value.trim() : "";
}

function escaparCsv(valor) {
  return '"' + String(valor).replace(/"/g, '""') + '"';
}

function gerarCsvs() {
  if (pendencias().length > 0) return; // dupla checagem — o botão já estaria travado
  const data = new Date().toISOString().slice(0, 10);
  for (const id of estado.selecionados) {
    const modelo = estado.catalogo[id];
    const colunas = modelo.csv.colunas;
    const linhas = [
      colunas.join(","),
      colunas.map(c => escaparCsv(valorDaColuna(c))).join(",")
    ];
    // BOM (﻿) garante acentuação correta ao abrir no Excel; o Canva ignora.
    baixarArquivo(data + "-" + id + ".csv", "﻿" + linhas.join("\r\n"));
  }
  const status = document.getElementById("status_form");
  status.textContent = "CSV gerado (" + estado.selecionados.length + " arquivo" +
    (estado.selecionados.length > 1 ? "s" : "") + "). Agora: Canva > Apps > Criar em Massa.";
  status.className = "status ok";
}

function baixarArquivo(nome, conteudo) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

/* ── Envio opcional ao Apps Script (F3) ────────────────────────── */

function prepararEnvio() {
  const botao = document.getElementById("btn_enviar");
  if (!CONFIG.apps_script_url) return; // sem back-end configurado, o botão fica oculto
  botao.classList.remove("oculto");
  botao.addEventListener("click", enviarParaPlanilha);
}

function montarPayload() {
  const campos = {};
  const imagens = {};
  for (const campo of camposMesclados()) {
    if (campo.tipo === "imagem") {
      imagens[campo.id + "_url"] = document.getElementById("f_" + campo.id + "_url").value.trim();
      imagens[campo.id + "_keyword"] = document.getElementById("f_" + campo.id + "_kw").value.trim();
      imagens[campo.id + "_credito"] = estado.creditos[campo.id] || "";
    } else {
      campos[campo.id] = document.getElementById("f_" + campo.id).value;
    }
  }
  return {
    modelos: estado.selecionados,
    paleta: estado.paleta,
    campos: campos,
    imagens: imagens,
    autor: document.getElementById("autor").value.trim(),
    criado_em: new Date().toISOString()
  };
}

async function enviarParaPlanilha() {
  const status = document.getElementById("status_form");
  status.textContent = "Enviando para a planilha...";
  status.className = "status";
  try {
    // text/plain evita preflight CORS no Web App do Apps Script.
    const resposta = await fetch(CONFIG.apps_script_url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(montarPayload())
    });
    const resultado = await resposta.json();
    if (resultado.ok) {
      status.textContent = "Gravado na planilha.";
      status.className = "status ok";
    } else {
      status.textContent = "Servidor recusou: " + (resultado.erros || []).join("; ");
      status.className = "status erro";
    }
  } catch (erro) {
    status.textContent = "Falha no envio: " + erro.message;
    status.className = "status erro";
  }
}

/* ── Utilidades ────────────────────────────────────────────────── */

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = String(texto);
  return div.innerHTML;
}
