/**
 * app.js — Controlador. Orquestra dois fluxos:
 *  - "notas": carrossel do designer (textarea -> parser -> renderer -> vários cards).
 *  - modelos de card único (Twitter, Manchete A/B): campos -> templates.js.
 * Preview ao vivo, seletor de modelo/formato/cor, export PNG/JPG e ZIP.
 */

let currentSlides = [];
const estado = { templateId: 'notas', format: '4:5', bg: '#FFFFFF', escala: 1, fields: {} };

const SAMPLE = `#1
**Pare de perder tempo com post que não vende**
=3 ajustes= que mudam o jogo

#2
## Passo 1: fale com uma pessoa só
Escreva como se fosse para *um cliente* específico — não para "todo mundo".

#3 :blue
=Comente EU QUERO= e receba o guia
_Mando no seu direct_`;

/* ── Início ──────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  montarSeletorModelos();
  montarSwatches();

  const editor = document.getElementById('editor');
  if (editor && !editor.value.trim()) editor.value = SAMPLE;

  let deb;
  editor.addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(render, 300); });

  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.addEventListener('change', handleFile);

  document.getElementById('model-select').addEventListener('change', (e) => selecionarModelo(e.target.value));
  document.getElementById('format-select').addEventListener('change', (e) => { estado.format = e.target.value; render(); });
  const escala = document.getElementById('escala');
  if (escala) escala.addEventListener('input', (e) => { estado.escala = parseFloat(e.target.value) || 1; render(); });

  aplicarModoUI();
  render();
});

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
  const t = TEMPLATES[id];
  estado.format = t.formatos[0];
  estado.escala = 1;
  const escSlider = document.getElementById('escala');
  if (escSlider) escSlider.value = 1;
  // Inicializa os campos com os exemplos, para o modelo já aparecer desenhado.
  estado.fields = {};
  if (t.campos) {
    t.campos.forEach(c => {
      if (c.tipo === 'check') estado.fields[c.id] = c.valorPadrao !== false;
      else if (c.tipo === 'image') estado.fields[c.id] = '';
      else estado.fields[c.id] = c.placeholder || '';
    });
  }
  if (id !== 'notas' && (estado.bg === '#FFFFFF' || !estado.bg)) estado.bg = '#FFFFFF';
  aplicarModoUI();
  montarSwatches();
  render();
}

// Mostra textarea (notas) ou campos (modelos single); ajusta seletor de formato.
function aplicarModoUI() {
  const t = TEMPLATES[estado.templateId];
  const ehNotas = estado.templateId === 'notas';

  document.getElementById('editor-wrap').style.display = ehNotas ? 'block' : 'none';
  document.getElementById('fields-wrap').style.display = ehNotas ? 'none' : 'block';
  document.getElementById('controles-arte').style.display = ehNotas ? 'none' : 'flex';

  const fmt = document.getElementById('format-select');
  fmt.innerHTML = '';
  t.formatos.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = f === '9:16' ? '1080 x 1920 (Story)' : f === '1:1' ? '1080 x 1080 (Feed)' : f;
    fmt.appendChild(opt);
  });
  fmt.value = estado.format;

  if (!ehNotas) montarCampos(t);
}

function montarCampos(t) {
  const box = document.getElementById('fields-wrap');
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
      ta.id = 'campo_' + c.id; ta.rows = 3; ta.value = estado.fields[c.id] || '';
      let deb;
      ta.addEventListener('input', () => { estado.fields[c.id] = ta.value; clearTimeout(deb); deb = setTimeout(render, 200); });
      wrap.appendChild(ta);
    } else if (c.tipo === 'image') {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*'; inp.id = 'campo_' + c.id;
      inp.addEventListener('change', (e) => lerImagem(e, c.id, c.bg, t));
      wrap.appendChild(inp);
      const val = estado.fields[c.id];
      if (val && val.src) {
        wrap.appendChild(sliderImg('Zoom', c.id, 'zoom', 0.5, 2.5, 0.05));
        wrap.appendChild(sliderImg('Horizontal', c.id, 'x', -50, 50, 1));
        wrap.appendChild(sliderImg('Vertical', c.id, 'y', -50, 50, 1));
        if (c.bg) wrap.appendChild(sliderImg('Escurecer', c.id, 'overlay', 0, 0.8, 0.05));
        const rm = document.createElement('button');
        rm.type = 'button'; rm.className = 'btn-secondary'; rm.textContent = 'Remover imagem';
        rm.addEventListener('click', () => { delete estado.fields[c.id]; montarCampos(t); render(); });
        wrap.appendChild(rm);
      }
    } else if (c.tipo === 'check') {
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.id = 'campo_' + c.id; cb.checked = estado.fields[c.id] !== false;
      cb.addEventListener('change', () => { estado.fields[c.id] = cb.checked; render(); });
      lab.style.display = 'inline'; lab.style.marginLeft = '6px';
      wrap.innerHTML = ''; wrap.appendChild(cb); wrap.appendChild(lab);
    } else {
      const inp = document.createElement('input');
      inp.type = 'text'; inp.id = 'campo_' + c.id; inp.value = estado.fields[c.id] || '';
      let deb;
      inp.addEventListener('input', () => { estado.fields[c.id] = inp.value; clearTimeout(deb); deb = setTimeout(render, 200); });
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
    estado.fields[campoId] = { src: reader.result, zoom: 1, x: 0, y: 0, overlay: bg ? 0.35 : 0 };
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
  const obj = estado.fields[campoId] || {};
  r.value = obj[prop] != null ? obj[prop] : (prop === 'zoom' ? 1 : prop === 'overlay' ? 0.35 : 0);
  let deb;
  r.addEventListener('input', () => {
    if (!estado.fields[campoId]) estado.fields[campoId] = {};
    estado.fields[campoId][prop] = parseFloat(r.value);
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

  if (estado.templateId === 'notas') {
    grid.classList.remove('single');
    renderNotas(grid, empty, bar);
    return;
  }

  grid.classList.add('single');
  grid.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'card-wrap';
  wrap.appendChild(TEMPLATES[estado.templateId].render(estado));
  grid.appendChild(wrap);
  empty.style.display = 'none';
  grid.style.display = 'flex';
  bar.style.display = 'flex';
}

function renderNotas(grid, empty, bar) {
  const raw = document.getElementById('editor').value.trim();
  if (!raw) { currentSlides = []; grid.innerHTML = ''; grid.style.display = 'none'; bar.style.display = 'none'; empty.style.display = 'block'; return; }
  currentSlides = parseCarousel(raw);
  if (currentSlides.length === 0) { grid.innerHTML = ''; grid.style.display = 'none'; bar.style.display = 'none'; empty.style.display = 'block'; return; }
  grid.innerHTML = '';
  currentSlides.forEach((slide, i) => grid.appendChild(buildCardWrap(slide, i, downloadCard)));
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

function contagemCards() { return estado.templateId === 'notas' ? currentSlides.length : 1; }

function bgDoCard(index) {
  const el = document.getElementById('card-' + index);
  if (el && el.classList.contains('art-card')) return estado.bg || '#FFFFFF';
  return currentSlides[index] && currentSlides[index].theme === 'blue' ? '#1B2D5B' : '#ffffff';
}

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
  if (estado.templateId === 'notas') {
    return JSON.stringify({ v: 1, templateId: 'notas', texto: document.getElementById('editor').value });
  }
  return JSON.stringify({ v: 1, templateId: estado.templateId, format: estado.format, bg: estado.bg, escala: estado.escala, fields: estado.fields });
}

function aplicarEstadoJSON(str) {
  let obj;
  try { obj = JSON.parse(str); } catch (e) { obj = null; }
  if (!obj || !obj.templateId) { // compatível com registros antigos (texto puro do carrossel)
    estado.templateId = 'notas';
    document.getElementById('model-select').value = 'notas';
    aplicarModoUI();
    document.getElementById('editor').value = str || '';
    render();
    return;
  }
  estado.templateId = obj.templateId;
  document.getElementById('model-select').value = obj.templateId;
  if (obj.templateId === 'notas') {
    aplicarModoUI();
    document.getElementById('editor').value = obj.texto || '';
  } else {
    estado.format = obj.format || TEMPLATES[obj.templateId].formatos[0];
    estado.bg = obj.bg || '#FFFFFF';
    estado.escala = obj.escala || 1;
    estado.fields = obj.fields || {};
    const escSlider = document.getElementById('escala');
    if (escSlider) escSlider.value = estado.escala;
    aplicarModoUI();
    montarSwatches();
  }
  render();
}

function nomeSugeridoAtual() {
  if (estado.templateId === 'notas') return nomeSugerido(document.getElementById('editor').value.trim());
  const f = estado.fields || {};
  return (f.nome || f.titulo || f.kicker || 'Post').replace(/\s+/g, ' ').trim().slice(0, 50) || 'Post';
}

/* ── Importar documento (.docx / .txt / .md) — alimenta o modelo Notas ───── */

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
    if (estado.templateId !== 'notas') { estado.templateId = 'notas'; document.getElementById('model-select').value = 'notas'; aplicarModoUI(); }
    document.getElementById('editor').value = texto;
    render();
    statusApp('Importado: ' + file.name, 'ok');
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
    if (estado.templateId === 'notas') { document.getElementById('editor').value = ''; }
    else { const t = TEMPLATES[estado.templateId]; estado.fields = {}; if (t.campos) montarCampos(t); }
    render();
    statusApp('');
  }
}

function openHelp() { document.getElementById('help-modal').style.display = 'flex'; }
function closeHelp(event) {
  if (!event || event.target === document.getElementById('help-modal')) document.getElementById('help-modal').style.display = 'none';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeHelp();
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') render();
});
