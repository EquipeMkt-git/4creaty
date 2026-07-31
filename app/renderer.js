/**
 * renderer.js — Converte dados de slide em elementos DOM prontos para exibir
 * e exportar como PNG via html2canvas.
 *
 * INLINE MARKUP SUPORTADO (dentro do campo `text` de qualquer linha)
 * ──────────────────────────────────────────────────────────────────
 *   *texto*   → <span class="inline-bold">
 *   _texto_   → <span class="inline-italic">
 *   =texto=   → <span class="hl"> (destaque amarelo)
 *
 * Caracteres especiais úteis no texto:
 *     (non-breaking space) → use entre palavras que não devem quebrar
 *   Ex: "R$ 89.000" mantém o valor na mesma linha
 */

/**
 * parseInline(text)
 * Converte uma string com marcações inline em um DocumentFragment com spans.
 */
function parseInline(text) {
  const frag = document.createDocumentFragment();

  // Regex que captura *bold*, _italic_ e =highlight= em qualquer ordem
  const regex = /(\*[^*]+\*|_[^_]+_|=[^=]+=)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Texto literal antes do match
    if (match.index > lastIndex) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }

    const raw = match[0];
    const inner = raw.slice(1, -1);

    if (raw.startsWith('*')) {
      const span = document.createElement('span');
      span.className = 'inline-bold';
      span.textContent = inner;
      frag.appendChild(span);
    } else if (raw.startsWith('_')) {
      const span = document.createElement('span');
      span.className = 'inline-italic';
      span.textContent = inner;
      frag.appendChild(span);
    } else if (raw.startsWith('=')) {
      const span = document.createElement('span');
      span.className = 'hl';
      span.textContent = inner;
      frag.appendChild(span);
    }

    lastIndex = match.index + raw.length;
  }

  // Texto restante após o último match
  if (lastIndex < text.length) {
    frag.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  return frag;
}

/**
 * buildLineElement(lineObj)
 * Cria o elemento DOM correspondente a uma linha do slide.
 */
function buildLineElement(lineObj) {
  // Divisória
  if (lineObj.type === 'divider') {
    const div = document.createElement('div');
    div.className = 'card-divider';
    return div;
  }

  // Parágrafo (cover-title, step-title, line-bold, line)
  const p = document.createElement('p');
  p.className = lineObj.type;
  p.appendChild(parseInline(lineObj.text || ''));
  return p;
}

/**
 * buildCardElement(slideData, index)
 * Monta o elemento DOM completo de um card (outer + inner + header + body).
 * Retorna o elemento `.card-outer` com id `card-{index}`.
 */
function buildCardElement(slideData, index) {
  // Wrapper externo (mantém aspect-ratio e container query)
  const outer = document.createElement('div');
  outer.className = 'card-outer';
  outer.id = `card-${index}`;

  // Inner: define cor de fundo (white/blue)
  const inner = document.createElement('div');
  inner.className = `card-inner ${slideData.theme}`;

  // Header estilo "Notas" do iOS
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

  // Body: itera pelas linhas do slide
  const body = document.createElement('div');
  body.className = 'card-body';

  slideData.lines.forEach(lineObj => {
    body.appendChild(buildLineElement(lineObj));
  });

  inner.appendChild(body);
  outer.appendChild(inner);
  return outer;
}

/**
 * buildCardWrap(slideData, index, onDownload)
 * Monta o bloco completo visível na grade:
 *   label + card + botão de download individual
 */
function buildCardWrap(slideData, index, onDownload) {
  const wrap = document.createElement('div');
  wrap.className = 'card-wrap';

  // Label "Card 1", "Card 2" …
  const label = document.createElement('div');
  label.className = 'card-label';
  label.textContent = `Card ${index + 1}`;
  wrap.appendChild(label);

  // O card em si
  const cardEl = buildCardElement(slideData, index);
  wrap.appendChild(cardEl);

  // Botão de download individual
  const btn = document.createElement('button');
  btn.className = 'btn-dl';
  btn.textContent = `Baixar card ${index + 1}`;
  btn.addEventListener('click', () => onDownload(index));
  wrap.appendChild(btn);

  return wrap;
}
