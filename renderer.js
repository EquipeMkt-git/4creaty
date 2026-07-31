/**
 * renderer.js — Converte dados de slide em elementos DOM prontos para exibir
 * e exportar como PNG/JPG via html2canvas. (Base do designer 4blue, intacta.)
 *
 * INLINE MARKUP (dentro do campo `text`)
 *   *texto*   → <span class="inline-bold">
 *   _texto_   → <span class="inline-italic">
 *   =texto=   → <span class="hl"> (destaque amarelo)
 */

function parseInline(text) {
  const frag = document.createDocumentFragment();
  const regex = /(\*[^*]+\*|_[^_]+_|=[^=]+=)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }
    const raw = match[0];
    const inner = raw.slice(1, -1);
    const span = document.createElement('span');
    if (raw.startsWith('*')) span.className = 'inline-bold';
    else if (raw.startsWith('_')) span.className = 'inline-italic';
    else span.className = 'hl';
    span.textContent = inner;
    frag.appendChild(span);
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < text.length) {
    frag.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
  return frag;
}

function buildLineElement(lineObj) {
  if (lineObj.type === 'divider') {
    const div = document.createElement('div');
    div.className = 'card-divider';
    return div;
  }
  const p = document.createElement('p');
  p.className = lineObj.type;
  p.appendChild(parseInline(lineObj.text || ''));
  return p;
}

function buildCardElement(slideData, index) {
  const outer = document.createElement('div');
  outer.className = 'card-outer';
  outer.id = `card-${index}`;

  const inner = document.createElement('div');
  inner.className = `card-inner ${slideData.theme}`;

  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = `
    <div class="h-left">
      <span class="h-chevron">‹</span> Notas
    </div>
    <div class="h-right">
      <div class="h-dots"><span>···</span></div>
      <span class="h-ok">OK</span>
    </div>
  `;
  inner.appendChild(header);

  const body = document.createElement('div');
  body.className = 'card-body';
  slideData.lines.forEach(lineObj => body.appendChild(buildLineElement(lineObj)));

  inner.appendChild(body);
  outer.appendChild(inner);
  return outer;
}

function buildCardWrap(slideData, index, onDownload) {
  const wrap = document.createElement('div');
  wrap.className = 'card-wrap';

  const label = document.createElement('div');
  label.className = 'card-label';
  label.textContent = `Card ${index + 1}`;
  wrap.appendChild(label);

  wrap.appendChild(buildCardElement(slideData, index));

  const btn = document.createElement('button');
  btn.className = 'btn-dl';
  btn.textContent = `Baixar card ${index + 1}`;
  btn.addEventListener('click', () => onDownload(index));
  wrap.appendChild(btn);

  return wrap;
}
