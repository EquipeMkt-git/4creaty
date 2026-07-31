/**
 * 4creaty · Back-end (Google Apps Script)
 * Banco de dados dos carrosséis: uma planilha no Drive da 4blue.
 * Publicado como Web App, atende o app do GitHub Pages (app/storage.js).
 *
 * Publicar: Implantar > Nova implantação > App da Web
 *   Executar como: você · Acesso: qualquer pessoa
 * Depois cole a URL /exec em APPS_SCRIPT_URL no app/storage.js.
 *
 * Um registro por carrossel: id, nome, autor, atualizado_em, texto (o markup do editor).
 */

var CONFIG = {
  SHEET_ID: "COLE_AQUI_O_ID_DA_PLANILHA",
  ABA: "carrosseis",
  // Pasta no Drive onde os PNGs publicados são guardados (criada se não existir).
  DRIVE_FOLDER_NAME: "4creaty - Carrosseis"
};

var COLUNAS = ["id", "nome", "autor", "atualizado_em", "texto"];

/* ── Entradas ──────────────────────────────────────────────────────────────── */

function doGet(e) {
  var acao = (e && e.parameter && e.parameter.acao) || "";
  try {
    if (acao === "listar") return responder_({ ok: true, itens: listar_() });
    if (acao === "abrir") {
      var item = abrir_(e.parameter.id);
      return item ? responder_({ ok: true, item: item }) : responder_({ ok: false, erro: "não encontrado" });
    }
    return responder_({ ok: true, servico: "4creaty", versao: "1.0" }); // health check
  } catch (erro) {
    return responder_({ ok: false, erro: erro.message });
  }
}

function doPost(e) {
  try {
    var corpo = JSON.parse(e.postData.contents);
    if (corpo.acao === "salvar") return responder_(salvar_(corpo));
    if (corpo.acao === "publicar_png") return responder_(publicarPng_(corpo));
    return responder_({ ok: false, erro: "ação desconhecida" });
  } catch (erro) {
    return responder_({ ok: false, erro: "payload inválido: " + erro.message });
  }
}

/* ── Operações ─────────────────────────────────────────────────────────────── */

function listar_() {
  var aba = aba_();
  var valores = aba.getDataRange().getValues();
  var itens = [];
  for (var i = 1; i < valores.length; i++) {
    itens.push({
      id: valores[i][0],
      nome: valores[i][1],
      autor: valores[i][2],
      atualizado_em: valores[i][3]
    });
  }
  // Mais recentes primeiro
  itens.sort(function (a, b) { return String(b.atualizado_em).localeCompare(String(a.atualizado_em)); });
  return itens;
}

function abrir_(id) {
  var aba = aba_();
  var valores = aba.getDataRange().getValues();
  for (var i = 1; i < valores.length; i++) {
    if (String(valores[i][0]) === String(id)) {
      return {
        id: valores[i][0], nome: valores[i][1], autor: valores[i][2],
        atualizado_em: valores[i][3], texto: valores[i][4]
      };
    }
  }
  return null;
}

function salvar_(corpo) {
  var aba = aba_();
  var agora = new Date().toISOString();
  var texto = corpo.texto || "";
  var nome = corpo.nome || "Carrossel";
  var autor = corpo.autor || "";

  // Atualiza se veio um id existente; senão cria um novo registro.
  if (corpo.id) {
    var valores = aba.getDataRange().getValues();
    for (var i = 1; i < valores.length; i++) {
      if (String(valores[i][0]) === String(corpo.id)) {
        aba.getRange(i + 1, 1, 1, COLUNAS.length).setValues([[corpo.id, nome, autor, agora, texto]]);
        return { ok: true, id: corpo.id };
      }
    }
  }
  var id = Utilities.getUuid();
  aba.appendRow([id, nome, autor, agora, texto]);
  return { ok: true, id: id };
}

/* ── Publicação de imagens no Drive ─────────────────────────────────────────── */
/* Recebe os PNGs (data URL base64) do front, cria uma subpasta por carrossel
 * dentro da pasta base e devolve os links. As artes viram biblioteca da equipe. */

function publicarPng_(corpo) {
  var imagens = corpo.imagens || [];
  if (!imagens.length) return { ok: false, erro: "nenhuma imagem recebida" };

  var base = pastaBase_();
  var carimbo = new Date().toISOString().slice(0, 16).replace("T", " ");
  var pasta = base.createFolder((corpo.nome || "carrossel") + " — " + carimbo);

  var arquivos = [];
  for (var i = 0; i < imagens.length; i++) {
    var img = imagens[i];
    var b64 = String(img.dataUrl || "").replace(/^data:image\/png;base64,/, "");
    if (!b64) continue;
    var bytes = Utilities.base64Decode(b64);
    var nomeArq = "card-" + String(img.card || (i + 1)).padStart(2, "0") + ".png";
    var arq = pasta.createFile(Utilities.newBlob(bytes, "image/png", nomeArq));
    arquivos.push(arq.getUrl());
  }
  return { ok: true, pasta: pasta.getUrl(), arquivos: arquivos, quantidade: arquivos.length };
}

function pastaBase_() {
  var it = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
}

/* ── Utilitários ───────────────────────────────────────────────────────────── */

function aba_() {
  var planilha = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var aba = planilha.getSheetByName(CONFIG.ABA);
  if (!aba) {
    aba = planilha.insertSheet(CONFIG.ABA);
    aba.appendRow(COLUNAS);
  } else if (aba.getLastRow() === 0) {
    aba.appendRow(COLUNAS);
  }
  return aba;
}

function responder_(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
