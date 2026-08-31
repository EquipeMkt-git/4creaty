/**
 * editor.js — Ajuste fino por elemento no card ativo.
 * No modo edição, clique/arraste um texto para mover, e use o menu para mudar
 * tamanho e cor daquele trecho. Os ajustes ficam salvos no card (card.overrides).
 * Fora do modo edição, os ajustes continuam valendo (preview e export).
 */

window.modoEdicao = false;
let _elSel = null, _cardSel = null, _keySel = null;

// Elementos de texto de todos os modelos.
const TEXTO_SELETOR = 'p,.cit-texto,.cit-autor,.cit-papel,.frase-texto,.frase-autor,.tw-body,.tw-name,.tw-user,.kicker,.headline,.subtitulo,.titulo,.destaque,.ck-pergunta,.ck-txt,.ck-sub,.ck-cta,.ps-titulo,.ps-label,.ps-desc,.ps-rodape,.ff-box';
const CORES_TEXTO = ['#FFFFFF', '#111111', '#F6BF00', '#1998FF', '#0072CE', '#004882', '#8a1414', '#1E8E63', '#F1F3F9', '#8899a6'];

function toggleEditor() {
  window.modoEdicao = !window.modoEdicao;
  if (!window.modoEdicao) fecharToolbarEl();
  if (typeof render === 'function') render();
  if (typeof montarCardNav === 'function') montarCardNav();
}

// Aplica os ajustes salvos aos elementos (sempre, edite ou não).
function aplicarOverrides(cardEl, card) {
  cardEl.querySelectorAll(TEXTO_SELETOR).forEach((el, i) => {
    const key = 'e' + i;
    el.dataset.el = key;
    const ov = card.overrides && card.overrides[key];
    if (ov) {
      if (ov.dx || ov.dy) el.style.transform = 'translate(' + (ov.dx || 0) + '%,' + (ov.dy || 0) + '%)';
      if (ov.fs) el.style.fontSize = ov.fs + 'cqw';
      if (ov.cor) el.style.color = ov.cor;
    }
  });
}

// Liga a interação de edição no card ativo.
function habilitarEdicao(cardEl, card) {
  cardEl.classList.add('modo-edicao');
  cardEl.querySelectorAll(TEXTO_SELETOR).forEach(el => {
    el.classList.add('el-editavel');
    el.addEventListener('mousedown', (e) => iniciarDrag(e, el, card));
  });
}

function garantirOv(card, key) {
  if (!card.overrides) card.overrides = {};
  if (!card.overrides[key]) card.overrides[key] = {};
  return card.overrides[key];
}

function iniciarDrag(e, el, card) {
  e.preventDefault(); e.stopPropagation();
  selecionarEl(el, card);
  const cardEl = el.closest('.art-card');
  const rect = cardEl.getBoundingClientRect();
  const o = garantirOv(card, _keySel);
  const startX = e.clientX, startY = e.clientY;
  const baseDx = o.dx || 0, baseDy = o.dy || 0;
  function mv(ev) {
    o.dx = baseDx + (ev.clientX - startX) / rect.width * 100;
    o.dy = baseDy + (ev.clientY - startY) / rect.height * 100;
    el.style.transform = 'translate(' + o.dx + '%,' + o.dy + '%)';
  }
  function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); }
  document.addEventListener('mousemove', mv);
  document.addEventListener('mouseup', up);
}

function selecionarEl(el, card) {
  document.querySelectorAll('.el-sel').forEach(x => x.classList.remove('el-sel'));
  el.classList.add('el-sel');
  _elSel = el; _cardSel = card; _keySel = el.dataset.el;
  abrirToolbarEl();
}

function abrirToolbarEl() {
  let tb = document.getElementById('el-toolbar');
  if (!tb) { tb = document.createElement('div'); tb.id = 'el-toolbar'; tb.className = 'el-toolbar'; document.body.appendChild(tb); }
  const ov = (_cardSel.overrides && _cardSel.overrides[_keySel]) || {};
  tb.innerHTML = '';

  const l1 = document.createElement('div'); l1.className = 'elt-linha';
  const lab = document.createElement('span'); lab.textContent = 'Tamanho'; l1.appendChild(lab);
  const sl = document.createElement('input'); sl.type = 'range'; sl.min = '2'; sl.max = '18'; sl.step = '0.2';
  sl.value = ov.fs || 6;
  sl.addEventListener('input', () => { garantirOv(_cardSel, _keySel).fs = parseFloat(sl.value); if (_elSel) _elSel.style.fontSize = sl.value + 'cqw'; });
  l1.appendChild(sl);
  tb.appendChild(l1);

  const l2 = document.createElement('div'); l2.className = 'elt-cores';
  CORES_TEXTO.forEach(c => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'swatch-btn'; b.style.background = c; b.title = c;
    b.addEventListener('click', () => { garantirOv(_cardSel, _keySel).cor = c; if (_elSel) _elSel.style.color = c; });
    l2.appendChild(b);
  });
  tb.appendChild(l2);

  const l3 = document.createElement('div'); l3.className = 'elt-linha';
  const rst = document.createElement('button'); rst.className = 'btn-secondary'; rst.textContent = 'Resetar'; rst.addEventListener('click', resetarEl);
  const fch = document.createElement('button'); fch.className = 'btn-secondary'; fch.textContent = 'Fechar'; fch.addEventListener('click', fecharToolbarEl);
  l3.appendChild(rst); l3.appendChild(fch);
  tb.appendChild(l3);

  tb.style.display = 'flex';
}

function resetarEl() {
  if (_cardSel && _cardSel.overrides) delete _cardSel.overrides[_keySel];
  if (typeof render === 'function') render();
  fecharToolbarEl();
}

function fecharToolbarEl() {
  const tb = document.getElementById('el-toolbar'); if (tb) tb.style.display = 'none';
  document.querySelectorAll('.el-sel').forEach(x => x.classList.remove('el-sel'));
  _elSel = null;
}
