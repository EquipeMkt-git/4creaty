/**
 * app.js — Controlador principal.
 *  1. Preview VIVO: renderiza enquanto o copy digita/cola (sem precisar clicar).
 *  2. Importa copy de .docx (Word), .txt e .md.
 *  3. Exporta cada card em PNG ou JPG (alta resolução, 4×).
 */

let currentSlides = [];

// Texto de exemplo — carrega no início para o design já aparecer na tela.
const SAMPLE = `#1
**Pare de perder tempo com post que não vende**
=3 ajustes= que mudam o jogo

#2
## Passo 1: fale com uma pessoa só
Escreva como se fosse para *um cliente* específico — não para "todo mundo".

#3 :blue
=Comente EU QUERO= e receba o guia
_Mando no seu direct_`;

/* ── Render (preview vivo) ───────────────────────────────────────────────── */

function renderFromEditor(silent) {
  const raw = document.getElementById('editor').value.trim();
  const grid = document.getElementById('grid');
  const empty = document.getElementById('preview-empty');
  const bar = document.getElementById('download-bar');

  if (!raw) {
    currentSlides = [];
    grid.innerHTML = '';
    grid.style.display = 'none';
    bar.style.display = 'none';
    empty.style.display = 'block';
    if (!silent) alert('Cole um texto no editor.');
    return;
  }

  currentSlides = parseCarousel(raw);

  if (currentSlides.length === 0) {
    grid.innerHTML = '';
    grid.style.display = 'none';
    bar.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  grid.innerHTML = '';
  currentSlides.forEach((slide, index) => {
    grid.appendChild(buildCardWrap(slide, index, downloadCard));
  });

  empty.style.display = 'none';
  grid.style.display = 'grid';
  bar.style.display = 'flex';
}

// Mantido para o botão "Gerar" e o atalho de teclado.
function generateCarousel() {
  renderFromEditor(false);
}

function statusApp(msg, tipo) {
  const el = document.getElementById('status-app');
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'status-linha' + (tipo ? ' ' + tipo : '');
}

/* ── Export PNG / JPG ────────────────────────────────────────────────────── */

function formatoExport() {
  const sel = document.getElementById('export-format');
  return sel && sel.value === 'jpeg' ? 'jpeg' : 'png';
}

async function downloadCard(index) {
  const el = document.getElementById(`card-${index}`);
  if (!el) return;

  const bgColor = currentSlides[index]?.theme === 'blue' ? '#1B2D5B' : '#ffffff';
  const canvas = await html2canvas(el, {
    scale: 4, useCORS: true, backgroundColor: bgColor,
    width: el.offsetWidth, height: el.offsetHeight
  });

  const fmt = formatoExport();
  const mime = fmt === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = fmt === 'jpeg' ? 'jpg' : 'png';
  const link = document.createElement('a');
  link.download = `4blue-carousel-card-${index + 1}.${ext}`;
  link.href = fmt === 'jpeg' ? canvas.toDataURL(mime, 0.95) : canvas.toDataURL(mime);
  link.click();
}

async function downloadAll() {
  for (let i = 0; i < currentSlides.length; i++) {
    await downloadCard(i);
    await sleep(400);
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ── Importar documento (.docx / .txt / .md) ─────────────────────────────── */

async function handleFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const nome = file.name.toLowerCase();

  try {
    let texto = '';
    if (nome.endsWith('.docx')) {
      if (typeof mammoth === 'undefined') {
        alert('A biblioteca de leitura de .docx não carregou. Verifique a conexão e tente de novo.');
        return;
      }
      const buffer = await file.arrayBuffer();
      const resultado = await mammoth.convertToHtml({ arrayBuffer: buffer });
      texto = htmlToMarkup(resultado.value);
    } else {
      texto = await file.text();
    }
    document.getElementById('editor').value = texto;
    renderFromEditor(true);
    statusApp('Importado: ' + file.name, 'ok');
  } catch (erro) {
    alert('Falha ao importar: ' + erro.message);
  }
  event.target.value = ''; // permite reimportar o mesmo arquivo
}

/**
 * htmlToMarkup(html) — converte o HTML do Word na sintaxe do editor.
 * Cada título (h1..h6) inicia um novo card; negrito/itálico viram marcações.
 */
function htmlToMarkup(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out = [];
  let n = 0;
  let iniciado = false;

  const novoCard = () => { n++; out.push((out.length ? '\n' : '') + '#' + n); iniciado = true; };

  Array.prototype.forEach.call(doc.body.childNodes, (node) => {
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
      novoCard();
      out.push('## ' + node.textContent.trim());
      return;
    }
    if (!iniciado) novoCard();

    if (tag === 'hr') { out.push('---'); return; }
    if (tag === 'ul' || tag === 'ol') {
      Array.prototype.forEach.call(node.querySelectorAll('li'), (li) => {
        const t = inlineToMarkup(li).trim();
        if (t) out.push('→ ' + t);
      });
      return;
    }
    // parágrafo e demais blocos
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

/* ── Utilitários de UI ───────────────────────────────────────────────────── */

function clearEditor() {
  if (confirm('Deseja limpar o editor?')) {
    document.getElementById('editor').value = '';
    renderFromEditor(true);
    statusApp('');
  }
}

function openHelp() { document.getElementById('help-modal').style.display = 'flex'; }
function closeHelp(event) {
  if (!event || event.target === document.getElementById('help-modal')) {
    document.getElementById('help-modal').style.display = 'none';
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeHelp();
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generateCarousel();
});

/* ── Início: preview vivo + exemplo carregado ────────────────────────────── */

let _debounce;
document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('editor');
  if (editor && !editor.value.trim()) editor.value = SAMPLE;

  renderFromEditor(true);

  editor.addEventListener('input', () => {
    clearTimeout(_debounce);
    _debounce = setTimeout(() => renderFromEditor(true), 300);
  });

  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.addEventListener('change', handleFile);
});
