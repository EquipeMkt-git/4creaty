/**
 * bulk.js — Geração em lote por planilha (CSV).
 * Cada linha do CSV vira um post do modelo de card único selecionado, usando o
 * formato, a cor e o tamanho atuais. Gera um ZIP com todas as imagens e pode
 * salvar cada uma no histórico do usuário (Drive).
 *
 * Fluxo: Baixar modelo CSV -> preencher no Excel/Google Sheets -> exportar CSV
 * -> Importar aqui -> Baixar tudo (ZIP) e/ou Salvar todos no Drive.
 */

let loteLinhas = [];

document.addEventListener('DOMContentLoaded', () => {
  const f = document.getElementById('lote-file');
  if (f) f.addEventListener('change', importarLoteArquivo);
});

function abrirLote() {
  document.getElementById('lote-modal').style.display = 'flex';
  loteLinhas = [];
  atualizarBotoesLote();
  if (estado.templateId === 'notas') {
    statusLote('Selecione um modelo de card único (Twitter ou Manchete) antes de usar o lote.', 'erro');
  } else {
    statusLote('Modelo atual: ' + TEMPLATES[estado.templateId].nome + '. Baixe o modelo CSV para começar.');
  }
}
function fecharLote(ev) {
  if (!ev || ev.target === document.getElementById('lote-modal')) document.getElementById('lote-modal').style.display = 'none';
}
function statusLote(msg, tipo) {
  const el = document.getElementById('lote-status');
  if (el) { el.textContent = msg || ''; el.className = 'status-linha' + (tipo ? ' ' + tipo : ''); }
}
function atualizarBotoesLote() {
  const on = loteLinhas.length > 0;
  document.getElementById('lote-zip').disabled = !on;
  document.getElementById('lote-save').disabled = !on;
}

/* ── Colunas do template (texto) ─────────────────────────────────────────── */

function colunasTexto(t) {
  return (t.campos || []).filter(c => c.tipo === 'text' || c.tipo === 'textarea').map(c => c.id);
}

function defaultsDoTemplate(t) {
  const f = {};
  (t.campos || []).forEach(c => {
    if (c.tipo === 'check') f[c.id] = c.valorPadrao !== false;
    else if (c.tipo === 'image') f[c.id] = '';
    else f[c.id] = '';
  });
  return f;
}

/* ── Modelo CSV ──────────────────────────────────────────────────────────── */

function baixarModeloCSV() {
  if (estado.templateId === 'notas') { statusLote('Escolha um modelo de card único primeiro.', 'erro'); return; }
  const t = TEMPLATES[estado.templateId];
  const cols = colunasTexto(t);
  const header = cols.join(',');
  const exemplo = cols.map(id => {
    const c = t.campos.find(x => x.id === id);
    return csvEscape((c && c.placeholder) || '');
  }).join(',');
  baixarTexto('modelo-' + t.id + '.csv', '﻿' + header + '\r\n' + exemplo + '\r\n');
  statusLote('Modelo baixado. Preencha uma linha por post e exporte como CSV.');
}

/* ── Importar CSV ────────────────────────────────────────────────────────── */

async function importarLoteArquivo(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (estado.templateId === 'notas') { statusLote('Escolha um modelo de card único primeiro.', 'erro'); event.target.value = ''; return; }
  try {
    const texto = await file.text();
    const linhas = parseCSV(texto);
    if (linhas.length < 2) { statusLote('CSV sem linhas de dados.', 'erro'); return; }

    const t = TEMPLATES[estado.templateId];
    const header = linhas[0].map(h => h.trim().toLowerCase());
    const mapCol = header.map(h => {
      const c = (t.campos || []).find(x => x.id.toLowerCase() === h || (x.label || '').toLowerCase() === h);
      return c ? c.id : null;
    });
    loteLinhas = linhas.slice(1).map(r => {
      const f = {};
      r.forEach((val, idx) => { if (mapCol[idx]) f[mapCol[idx]] = val; });
      return f;
    }).filter(f => Object.keys(f).length > 0);

    atualizarBotoesLote();
    statusLote(loteLinhas.length + ' linha(s) lida(s). Baixe tudo em ZIP ou salve todos no Drive.', 'ok');
  } catch (e) {
    statusLote('Falha ao ler o CSV: ' + e.message, 'erro');
  }
  event.target.value = '';
}

/* ── Gerar ZIP ───────────────────────────────────────────────────────────── */

async function gerarLoteZip() {
  if (!loteLinhas.length) return;
  if (typeof JSZip === 'undefined') { statusLote('Biblioteca de ZIP não carregou.', 'erro'); return; }
  const t = TEMPLATES[estado.templateId];
  const fmt = (typeof formatoExport === 'function') ? formatoExport() : 'png';
  const ext = fmt === 'jpeg' ? 'jpg' : 'png';

  const cont = document.createElement('div');
  cont.style.cssText = 'position:absolute;left:-99999px;top:0;width:540px;';
  document.body.appendChild(cont);

  const zip = new JSZip();
  try {
    for (let i = 0; i < loteLinhas.length; i++) {
      statusLote('Gerando ' + (i + 1) + ' de ' + loteLinhas.length + '...');
      const st = estadoDaLinha(t, loteLinhas[i]);
      const card = t.render(st);
      card.removeAttribute('id');
      cont.innerHTML = '';
      cont.appendChild(card);
      await esperar(40);
      const canvas = await html2canvas(card, { scale: 3, useCORS: true, backgroundColor: st.bg, width: card.offsetWidth, height: card.offsetHeight });
      const dataUrl = fmt === 'jpeg' ? canvas.toDataURL('image/jpeg', 0.95) : canvas.toDataURL('image/png');
      zip.file(nomeArquivoLinha(loteLinhas[i], i) + '.' + ext, dataUrl.split(',')[1], { base64: true });
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    baixarBlob('4blue-lote.zip', blob);
    statusLote(loteLinhas.length + ' imagens baixadas em ZIP.', 'ok');
  } catch (e) {
    statusLote('Falha ao gerar: ' + e.message, 'erro');
  } finally {
    document.body.removeChild(cont);
  }
}

/* ── Salvar todos no Drive (histórico do usuário) ────────────────────────── */

async function salvarLoteDrive() {
  if (!loteLinhas.length) return;
  if (typeof tokenAtual !== 'function' || !tokenAtual()) { statusLote('Entre na sua conta para salvar no Drive.', 'erro'); if (typeof abrirLogin === 'function') abrirLogin(); return; }
  const t = TEMPLATES[estado.templateId];
  let ok = 0;
  for (let i = 0; i < loteLinhas.length; i++) {
    statusLote('Salvando ' + (i + 1) + ' de ' + loteLinhas.length + '...');
    const st = estadoDaLinha(t, loteLinhas[i]);
    const texto = JSON.stringify({ v: 1, templateId: st.templateId, format: st.format, bg: st.bg, escala: st.escala, fields: st.fields });
    const nome = nomeArquivoLinha(loteLinhas[i], i);
    try {
      const r = await fetch(APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ acao: 'salvar', token: tokenAtual(), nome, texto }) });
      const d = await r.json();
      if (d.ok) ok++;
    } catch (e) { /* segue */ }
  }
  statusLote(ok + ' de ' + loteLinhas.length + ' salvos no seu histórico.', ok ? 'ok' : 'erro');
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function estadoDaLinha(t, linha) {
  return {
    templateId: estado.templateId,
    format: estado.format,
    bg: estado.bg,
    escala: estado.escala,
    fields: Object.assign(defaultsDoTemplate(t), linha)
  };
}

function nomeArquivoLinha(linha, i) {
  const base = (linha.nome || linha.titulo || linha.kicker || ('post-' + (i + 1))).toString().replace(/[^\w\- ]+/g, '').trim().slice(0, 40);
  return String(i + 1).padStart(2, '0') + '-' + (base || ('post-' + (i + 1)));
}

function esperar(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseCSV(text) {
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (ch === '\r') { /* ignora */ }
      else cur += ch;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.length && r.some(c => c.trim() !== ''));
}

function csvEscape(v) {
  v = String(v == null ? '' : v);
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

function baixarTexto(nome, conteudo) {
  baixarBlob(nome, new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
}
function baixarBlob(nome, blob) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
