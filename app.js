/**
 * app.js — Controlador. Orquestra dois fluxos:
 *  - "notas": carrossel do designer (textarea -> parser -> renderer -> vários cards).
 *  - modelos de card único (Twitter, Manchete A/B): campos -> templates.js.
 * Preview ao vivo, seletor de modelo/formato/cor, export PNG/JPG e ZIP.
 */

const estado = { templateId: 'notas', format: '4:5', bg: '#FFFFFF', escala: 1, nome: '', cards: [], cardAtivo: 0 };

/* ── Cards (multi-card nos modelos de campo) ─────────────────────────────── */

function camposIniciais(t) {
  const f = {};
  (t.campos || []).forEach(c => {
    if (c.tipo === 'check') f[c.id] = c.valorPadrao !== false;
    else if (c.tipo === 'image') f[c.id] = '';
    else f[c.id] = c.placeholder || '';
  });
  return f;
}
function novoCard(templateId) { return { templateId, fields: camposIniciais(TEMPLATES[templateId]) }; }
function cardAtual() { return estado.cards[estado.cardAtivo]; }
// Campos "ativos": do card selecionado.
function f_() { return cardAtual() ? cardAtual().fields : {}; }

function selecionarCard(i) { if (i < 0 || i >= estado.cards.length) return; estado.cardAtivo = i; aplicarModoUI(); render(); }
function adicionarCard() { estado.cards.push(novoCard(cardAtual() ? cardAtual().templateId : estado.templateId)); estado.cardAtivo = estado.cards.length - 1; aplicarModoUI(); render(); }
function trocarModeloDoCard(newId) {
  const c = cardAtual();
  if (!c || c.templateId === newId) return;
  c.templateId = newId;
  c.fields = camposIniciais(TEMPLATES[newId]); // campos do novo modelo (com exemplo)
  aplicarModoUI();
  render();
}

/* ── Colar copy e dividir em cards (a copy chega como texto marcado) ─────── */

function abrirColar() { document.getElementById('colar-modal').style.display = 'flex'; }
function fecharColar(ev) { if (!ev || ev.target === document.getElementById('colar-modal')) document.getElementById('colar-modal').style.display = 'none'; }

// Divide o texto em blocos: por #1/#2... ou, se não houver, por linha em branco.
function dividirBlocos(texto) {
  if (/^#\d+/m.test(texto)) {
    const partes = []; let cur = null;
    texto.split('\n').forEach(l => {
      if (/^#\d+/.test(l.trim())) { if (cur != null) partes.push(cur.trim()); cur = ''; }
      else if (cur != null) { cur += l + '\n'; }
    });
    if (cur != null) partes.push(cur.trim());
    return partes.filter(p => p !== '');
  }
  return texto.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
}

function aplicarColar() {
  const texto = document.getElementById('colar-texto').value;
  const blocos = dividirBlocos(texto);
  if (!blocos.length) { statusApp('Nada para dividir.', 'erro'); return; }
  const modelo = estado.templateId; // usa o modelo atual (inclui Notas)
  const t = TEMPLATES[modelo];
  const principal = (t.campos.find(c => c.principal) || {}).id;
  estado.templateId = modelo;
  document.getElementById('model-select').value = modelo;
  estado.cards = blocos.map(b => {
    const f = camposIniciais(t);
    if (principal) f[principal] = b;
    return { templateId: modelo, fields: f };
  });
  estado.cardAtivo = 0;
  fecharColar();
  aplicarModoUI();
  montarSwatches();
  render();
  statusApp(blocos.length + ' card(s) criados a partir da copy.', 'ok');
}
function duplicarCard() {
  const c = cardAtual();
  estado.cards.splice(estado.cardAtivo + 1, 0, { templateId: c.templateId, fields: JSON.parse(JSON.stringify(c.fields)) });
  estado.cardAtivo++; aplicarModoUI(); render();
}
function removerCard() {
  if (estado.cards.length <= 1) return;
  estado.cards.splice(estado.cardAtivo, 1);
  estado.cardAtivo = Math.max(0, estado.cardAtivo - 1);
  aplicarModoUI(); render();
}

function montarCardNav() {
  const nav = document.getElementById('card-nav');
  nav.innerHTML = '';
  const info = document.createElement('span');
  info.className = 'card-nav-info';
  info.textContent = 'Card ' + (estado.cardAtivo + 1) + ' de ' + estado.cards.length;
  nav.appendChild(info);
  const mk = (txt, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-secondary'; b.textContent = txt; b.addEventListener('click', fn); return b; };
  nav.appendChild(mk('‹', () => selecionarCard(estado.cardAtivo - 1)));
  nav.appendChild(mk('›', () => selecionarCard(estado.cardAtivo + 1)));
  nav.appendChild(mk('Adicionar', adicionarCard));
  nav.appendChild(mk('Duplicar', duplicarCard));
  nav.appendChild(mk('Colar copy', abrirColar));
  if (estado.cards.length > 1) nav.appendChild(mk('Remover', removerCard));

  // Seletor de modelo DESTE card (post misto).
  const sel = document.createElement('select');
  sel.className = 'card-modelo-select';
  sel.title = 'Modelo deste card';
  Object.values(TEMPLATES).filter(t => t.tipo === 'single').forEach(t => {
    const o = document.createElement('option'); o.value = t.id; o.textContent = t.nome; sel.appendChild(o);
  });
  sel.value = cardAtual().templateId;
  sel.addEventListener('change', () => trocarModeloDoCard(sel.value));
  nav.appendChild(sel);
}

const SAMPLE = `#1
**Pare de perder tempo com post que não vende**
=3 ajustes= que mudam o jogo

#2
## Passo 1: fale com uma pessoa só
Escreva como se fosse para *um cliente* específico — não para "todo mundo".

#3
=Comente EU QUERO= e receba o guia
_Mando no seu direct_`;

/* ── Início ──────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  montarSeletorModelos();

  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.addEventListener('change', handleFile);

  document.getElementById('model-select').addEventListener('change', (e) => selecionarModelo(e.target.value));
  document.getElementById('format-select').addEventListener('change', (e) => { estado.format = e.target.value; render(); });
  const escala = document.getElementById('escala');
  if (escala) escala.addEventListener('input', (e) => { estado.escala = parseFloat(e.target.value) || 1; render(); });

  carregarTextoComoNotas(SAMPLE); // deixa um carrossel Notas de exemplo carregado atrás da home

  document.getElementById('home-screen').style.display = 'block';
  if (typeof carregarHome === 'function') carregarHome();
});

// Carrega um texto grande como um carrossel Notas (um card por bloco #N / linha em branco).
function carregarTextoComoNotas(texto) {
  estado.templateId = 'notas';
  const sel = document.getElementById('model-select'); if (sel) sel.value = 'notas';
  estado.format = TEMPLATES['notas'].formatos[0];
  const blocos = dividirBlocos(texto);
  const arr = blocos.length ? blocos : [''];
  estado.cards = arr.map(b => ({ templateId: 'notas', fields: { texto: b, header: true } }));
  estado.cardAtivo = 0;
  const escSlider = document.getElementById('escala'); if (escSlider) escSlider.value = estado.escala;
  aplicarModoUI();
  montarSwatches();
  render();
}

/* ── Controles ───────────────────────────────────────────────────────────── */

function montarSeletorModelos() {
  const sel = document.getElementById('model-select');
  sel.innerHTML = '';
  Object.values(TEMPLATES).forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id; opt.textContent = t.nome;
    sel.appendChild(opt);
  });
  sel.value = estado.templateId;
}

function montarSwatches() {
  const box = document.getElementById('bg-swatches');
  box.innerHTML = '';
  CORES_FUNDO.forEach(cor => {
    const b = document.createElement('button');
    b.className = 'swatch-btn' + (estado.bg === cor ? ' ativo' : '');
    b.style.background = cor;
    b.title = cor;
    b.addEventListener('click', () => { estado.bg = cor; montarSwatches(); render(); });
    box.appendChild(b);
  });
}

function selecionarModelo(id) {
  estado.templateId = id;
  estado.format = TEMPLATES[id].formatos[0];
  estado.escala = 1;
  const escSlider = document.getElementById('escala');
  if (escSlider) escSlider.value = 1;
  // "Modelo do post": cria o primeiro card ou aplica o modelo a todos os cards existentes.
  if (!estado.cards.length) estado.cards = [novoCard(id)];
  else estado.cards.forEach(c => { c.templateId = id; c.fields = camposIniciais(TEMPLATES[id]); });
  estado.cardAtivo = 0;
  aplicarModoUI();
  montarSwatches();
  render();
}

// Todos os modelos são card-based: sempre mostra campos + navegação de cards + controles.
function aplicarModoUI() {
  document.getElementById('fields-wrap').style.display = 'block';
  document.getElementById('card-nav').style.display = 'flex';
  document.getElementById('controles-arte').style.display = 'flex';

  const fmt = document.getElementById('format-select');
  fmt.innerHTML = '';
  ['9:16', '1:1', '4:5'].forEach(f => {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = f === '9:16' ? '1080 x 1920 (Story)' : f === '1:1' ? '1080 x 1080 (Feed)' : '1080 x 1350 (Retrato)';
    fmt.appendChild(opt);
  });
  fmt.value = estado.format;

  montarCardNav();
  montarCampos(TEMPLATES[cardAtual().templateId]);
}

function montarCampos(t) {
  const box = document.getElementById('fields-wrap');
  const alvo = f_();
  box.innerHTML = '';
  t.campos.forEach(c => {
    const wrap = document.createElement('div');
    wrap.className = 'campo';
    const lab = document.createElement('label');
    lab.textContent = c.label;
    lab.setAttribute('for', 'campo_' + c.id);
    wrap.appendChild(lab);

    if (c.tipo === 'textarea') {
      const ta = document.createElement('textarea');
      ta.id = 'campo_' + c.id; ta.rows = 3; ta.value = alvo[c.id] || '';
      let deb;
      ta.addEventListener('input', () => { alvo[c.id] = ta.value; clearTimeout(deb); deb = setTimeout(render, 200); });
      wrap.appendChild(ta);
    } else if (c.tipo === 'image') {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*'; inp.id = 'campo_' + c.id;
      inp.addEventListener('change', (e) => lerImagem(e, c.id, c.bg, t));
      wrap.appendChild(inp);
      const val = alvo[c.id];
      if (val && val.src) {
        wrap.appendChild(sliderImg('Zoom', c.id, 'zoom', 0.5, 2.5, 0.05));
        wrap.appendChild(sliderImg('Horizontal', c.id, 'x', -50, 50, 1));
        wrap.appendChild(sliderImg('Vertical', c.id, 'y', -50, 50, 1));
        if (c.bg) wrap.appendChild(sliderImg('Escurecer', c.id, 'overlay', 0, 0.8, 0.05));
        const rm = document.createElement('button');
        rm.type = 'button'; rm.className = 'btn-secondary'; rm.textContent = 'Remover imagem';
        rm.addEventListener('click', () => { delete alvo[c.id]; montarCampos(t); render(); });
        wrap.appendChild(rm);
      }
    } else if (c.tipo === 'check') {
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.id = 'campo_' + c.id; cb.checked = alvo[c.id] !== false;
      cb.addEventListener('change', () => { alvo[c.id] = cb.checked; render(); });
      lab.style.display = 'inline'; lab.style.marginLeft = '6px';
      wrap.innerHTML = ''; wrap.appendChild(cb); wrap.appendChild(lab);
    } else {
      const inp = document.createElement('input');
      inp.type = 'text'; inp.id = 'campo_' + c.id; inp.value = alvo[c.id] || '';
      let deb;
      inp.addEventListener('input', () => { alvo[c.id] = inp.value; clearTimeout(deb); deb = setTimeout(render, 200); });
      wrap.appendChild(inp);
    }
    box.appendChild(wrap);
  });
}

function lerImagem(event, campoId, bg, t) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    f_()[campoId] = { src: reader.result, zoom: 1, x: 0, y: 0, overlay: bg ? 0.35 : 0 };
    if (t) montarCampos(t);
    render();
  };
  reader.readAsDataURL(file);
}

// Slider de ajuste de imagem (zoom, posição, escurecer).
function sliderImg(label, campoId, prop, min, max, step) {
  const w = document.createElement('div');
  w.className = 'campo-slider';
  const l = document.createElement('label');
  l.textContent = label;
  w.appendChild(l);
  const r = document.createElement('input');
  r.type = 'range'; r.min = min; r.max = max; r.step = step;
  const obj = f_()[campoId] || {};
  r.value = obj[prop] != null ? obj[prop] : (prop === 'zoom' ? 1 : prop === 'overlay' ? 0.35 : 0);
  let deb;
  r.addEventListener('input', () => {
    if (!f_()[campoId]) f_()[campoId] = {};
    f_()[campoId][prop] = parseFloat(r.value);
    clearTimeout(deb); deb = setTimeout(render, 120);
  });
  w.appendChild(r);
  return w;
}

/* ── Render (preview vivo) ───────────────────────────────────────────────── */

function render() {
  const grid = document.getElementById('grid');
  const empty = document.getElementById('preview-empty');
  const bar = document.getElementById('download-bar');
  renderCards(grid, empty, bar);
}

function renderCards(grid, empty, bar) {
  grid.classList.remove('single');
  grid.innerHTML = '';
  estado.cards.forEach((card, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'card-wrap' + (i === estado.cardAtivo ? ' ativo' : '');
    const label = document.createElement('div');
    label.className = 'card-label';
    label.textContent = 'Card ' + (i + 1);
    wrap.appendChild(label);
    const st = { templateId: card.templateId, format: estado.format, bg: estado.bg, escala: estado.escala, fields: card.fields };
    const el = TEMPLATES[card.templateId].render(st);
    el.id = 'card-' + i;
    wrap.appendChild(el);
    wrap.addEventListener('click', () => { if (estado.cardAtivo !== i) { estado.cardAtivo = i; aplicarModoUI(); render(); } });
    grid.appendChild(wrap);
  });
  empty.style.display = 'none';
  grid.style.display = 'grid';
  bar.style.display = 'flex';
}

function generateCarousel() { render(); }

function statusApp(msg, tipo) {
  const el = document.getElementById('status-app');
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'status-linha' + (tipo ? ' ' + tipo : '');
}

/* ── Contagem / cor por card (compartilhado com storage.js) ──────────────── */

function contagemCards() { return estado.cards.length; }

function bgDoCard(index) { return estado.bg || '#FFFFFF'; }

/* ── Export PNG / JPG / ZIP ──────────────────────────────────────────────── */

function formatoExport() {
  const sel = document.getElementById('export-format');
  return sel && sel.value === 'jpeg' ? 'jpeg' : 'png';
}

async function capturaCanvas(index) {
  const el = document.getElementById('card-' + index);
  return html2canvas(el, { scale: 4, useCORS: true, backgroundColor: bgDoCard(index), width: el.offsetWidth, height: el.offsetHeight });
}

async function downloadCard(index) {
  const el = document.getElementById('card-' + index);
  if (!el) return;
  const canvas = await capturaCanvas(index);
  const fmt = formatoExport();
  const ext = fmt === 'jpeg' ? 'jpg' : 'png';
  const link = document.createElement('a');
  link.download = `4blue-${estado.templateId}-${index + 1}.${ext}`;
  link.href = fmt === 'jpeg' ? canvas.toDataURL('image/jpeg', 0.95) : canvas.toDataURL('image/png');
  link.click();
}

// Baixar tudo: 1 card = arquivo único; mais de 1 = ZIP automático.
async function baixarTudo() {
  const total = contagemCards();
  if (total <= 1) { await downloadCard(0); return; }
  if (typeof JSZip === 'undefined') { // fallback: baixa um a um
    for (let i = 0; i < total; i++) { await downloadCard(i); await sleep(400); }
    return;
  }
  statusApp('Gerando ZIP com ' + total + ' cards...');
  const zip = new JSZip();
  const fmt = formatoExport();
  const ext = fmt === 'jpeg' ? 'jpg' : 'png';
  for (let i = 0; i < total; i++) {
    const canvas = await capturaCanvas(i);
    const dataUrl = fmt === 'jpeg' ? canvas.toDataURL('image/jpeg', 0.95) : canvas.toDataURL('image/png');
    zip.file(`card-${String(i + 1).padStart(2, '0')}.${ext}`, dataUrl.split(',')[1], { base64: true });
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.download = '4blue-carrossel.zip';
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
  statusApp(total + ' cards baixados em ZIP.', 'ok');
}

// Usado pelo storage.js (publicar no Drive).
async function capturarCards() {
  const imgs = [];
  for (let i = 0; i < contagemCards(); i++) {
    const el = document.getElementById('card-' + i);
    if (!el) continue;
    const canvas = await capturaCanvas(i);
    imgs.push({ card: i + 1, dataUrl: canvas.toDataURL('image/png') });
  }
  return imgs;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ── Estado salvo (Drive) ────────────────────────────────────────────────── */

function obterEstadoJSON() {
  return JSON.stringify({ v: 2, templateId: estado.templateId, format: estado.format, bg: estado.bg, escala: estado.escala, cards: estado.cards });
}

function aplicarEstadoJSON(str) {
  let obj;
  try { obj = JSON.parse(str); } catch (e) { obj = null; }
  // Texto puro antigo -> vira um carrossel Notas (um card por bloco).
  if (!obj || !obj.templateId) { carregarTextoComoNotas(typeof str === 'string' ? str : ''); return; }
  // Save antigo do Notas (texto único) -> divide em cards Notas.
  if (obj.templateId === 'notas' && typeof obj.texto === 'string') {
    estado.bg = obj.bg || '#FFFFFF'; estado.escala = obj.escala || 1;
    carregarTextoComoNotas(obj.texto);
    return;
  }
  estado.templateId = obj.templateId;
  document.getElementById('model-select').value = obj.templateId;
  estado.format = obj.format || TEMPLATES[obj.templateId].formatos[0];
  estado.bg = obj.bg || '#FFFFFF';
  estado.escala = obj.escala || 1;
  // v2 traz cards[]; registros antigos (v1) tinham 'fields' de um card só.
  estado.cards = Array.isArray(obj.cards) ? obj.cards : [{ templateId: obj.templateId, fields: obj.fields || {} }];
  estado.cardAtivo = 0;
  const escSlider = document.getElementById('escala');
  if (escSlider) escSlider.value = estado.escala;
  aplicarModoUI();
  montarSwatches();
  render();
}

function nomeSugeridoAtual() {
  if (estado.nome) return estado.nome;
  const f = f_() || {};
  const base = f.texto || f.nome || f.titulo || f.kicker || 'Post';
  return String(base).split('\n')[0].replace(/[*_=#]/g, '').replace(/\s+/g, ' ').trim().slice(0, 50) || 'Post';
}

/* ── Importar documento (.docx / .txt / .md) — alimenta o modelo Notas ───── */

// Importa a copy de um Google Docs (via Apps Script). Cai no modelo Notas.
function importarGDoc() {
  if (typeof tokenAtual === 'function' && !tokenAtual()) { statusApp('Entre na sua conta para importar do Google Docs.', 'erro'); if (typeof abrirLogin === 'function') abrirLogin(); return; }
  const url = window.prompt('Cole o link do Google Docs (compartilhado com a conta do sistema):', '');
  if (!url) return;
  const m = String(url).match(/\/d\/([a-zA-Z0-9_-]+)/);
  const id = m ? m[1] : String(url).trim();
  statusApp('Lendo o Google Docs...');
  fetch(APPS_SCRIPT_URL + '?acao=gdoc&id=' + encodeURIComponent(id) + '&token=' + encodeURIComponent(tokenAtual()))
    .then(r => r.json())
    .then(d => {
      if (!d.ok) { statusApp('Falha: ' + (d.erro || 'erro'), 'erro'); return; }
      carregarTextoComoNotas(d.texto || '');
      statusApp('Google Docs importado como carrossel Notas.', 'ok');
    })
    .catch(e => statusApp('Falha: ' + e.message, 'erro'));
}

async function handleFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const nome = file.name.toLowerCase();
  try {
    let texto = '';
    if (nome.endsWith('.docx')) {
      if (typeof mammoth === 'undefined') { alert('Biblioteca de .docx não carregou.'); return; }
      const buffer = await file.arrayBuffer();
      const r = await mammoth.convertToHtml({ arrayBuffer: buffer });
      texto = htmlToMarkup(r.value);
    } else {
      texto = await file.text();
    }
    carregarTextoComoNotas(texto);
    statusApp('Importado como carrossel Notas: ' + file.name, 'ok');
  } catch (erro) {
    alert('Falha ao importar: ' + erro.message);
  }
  event.target.value = '';
}

function htmlToMarkup(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out = []; let n = 0; let iniciado = false;
  const novoCard = () => { n++; out.push((out.length ? '\n' : '') + '#' + n); iniciado = true; };
  Array.prototype.forEach.call(doc.body.childNodes, (node) => {
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) { novoCard(); out.push('## ' + node.textContent.trim()); return; }
    if (!iniciado) novoCard();
    if (tag === 'hr') { out.push('---'); return; }
    if (tag === 'ul' || tag === 'ol') {
      Array.prototype.forEach.call(node.querySelectorAll('li'), (li) => { const t = inlineToMarkup(li).trim(); if (t) out.push('→ ' + t); });
      return;
    }
    const t = inlineToMarkup(node).trim();
    if (t) out.push(t);
  });
  return out.join('\n');
}

function inlineToMarkup(el) {
  let out = '';
  Array.prototype.forEach.call(el.childNodes, (n) => {
    if (n.nodeType === 3) { out += n.textContent; return; }
    if (n.nodeType !== 1) return;
    const tag = n.tagName.toLowerCase();
    const inner = inlineToMarkup(n);
    if (tag === 'strong' || tag === 'b') out += '*' + inner + '*';
    else if (tag === 'em' || tag === 'i') out += '_' + inner + '_';
    else out += inner;
  });
  return out;
}

/* ── UI utilidades ───────────────────────────────────────────────────────── */

function clearEditor() {
  if (confirm('Limpar o editor?')) {
    estado.cards = [novoCard(estado.templateId)];
    estado.cardAtivo = 0;
    aplicarModoUI();
    render();
    statusApp('');
  }
}

/* ── Tela inicial ────────────────────────────────────────────────────────── */

function irParaHome() {
  document.getElementById('home-screen').style.display = 'block';
  if (typeof carregarHome === 'function') carregarHome();
}

function criarNovoPost() {
  const nome = window.prompt('Dê um nome para o post:', '');
  if (nome === null) return;
  estado.nome = nome.trim();
  carrosselAtualId = null; // post novo
  estado.templateId = 'notas'; estado.format = '4:5'; estado.bg = '#FFFFFF'; estado.escala = 1;
  estado.cards = [novoCard('notas')]; estado.cardAtivo = 0;
  const sel = document.getElementById('model-select'); if (sel) sel.value = 'notas';
  const esc = document.getElementById('escala'); if (esc) esc.value = 1;
  aplicarModoUI(); montarSwatches(); render();
  document.getElementById('home-screen').style.display = 'none';
  statusApp(estado.nome ? 'Novo post: "' + estado.nome + '".' : 'Dê um nome ao salvar.');
}

function openHelp() { document.getElementById('help-modal').style.display = 'flex'; }
function closeHelp(event) {
  if (!event || event.target === document.getElementById('help-modal')) document.getElementById('help-modal').style.display = 'none';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeHelp();
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') render();
});
