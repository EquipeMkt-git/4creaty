/**
 * parser.js — Converte o texto do editor em dados estruturados de slides.
 *
 * Dois modos:
 *  - ESTRITO: quando o texto usa marcadores de card (#1, #2 …).
 *  - TOLERANTE: quando NÃO há #N — o sistema interpreta a copy "crua",
 *    tratando cada bloco separado por linha em branco como um card.
 *    Assim o copy pode colar o texto normal e já vê os cards.
 *
 * MARCAÇÕES (nos dois modos)
 *   :blue           → card com fundo azul
 *   ## Texto        → título de passo
 *   **Texto**       → parágrafo inteiro em negrito
 *   *texto*         → negrito inline
 *   _texto_         → itálico inline
 *   =texto=         → destaque amarelo
 *   ---             → linha divisória
 *
 * Retorno: [ { theme:'white'|'blue', isCover:bool, lines:[{type,text?}] } ]
 */

function parseCarousel(rawText) {
  const temMarcadores = /^#\d+/m.test(rawText);
  return temMarcadores ? parseEstrito(rawText) : parseTolerante(rawText);
}

/* ── Modo estrito (#1, #2 …) ─────────────────────────────────────────────── */
function parseEstrito(rawText) {
  const slides = [];
  let currentSlide = null;
  let firstCard = true;

  const lines = rawText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (/^#\d+/.test(trimmed)) {
      if (currentSlide) slides.push(currentSlide);
      const isBlue = /:blue/i.test(trimmed);
      currentSlide = { theme: isBlue ? 'blue' : 'white', isCover: firstCard, lines: [] };
      firstCard = false;
      continue;
    }
    if (!currentSlide) continue;

    if (/^---/.test(trimmed)) {
      if (/:blue/i.test(trimmed)) currentSlide.theme = 'blue';
      currentSlide.lines.push({ type: 'divider' });
      continue;
    }
    if (trimmed === '') continue;

    pushLinha(currentSlide, trimmed);
  }

  if (currentSlide) slides.push(currentSlide);
  return slides;
}

/* ── Modo tolerante (copy crua, sem #N) ──────────────────────────────────── */
function parseTolerante(rawText) {
  // Cada bloco separado por uma ou mais linhas em branco vira um card.
  const blocos = rawText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);

  return blocos.map((bloco, idx) => {
    let theme = 'white';
    const slide = { theme, isCover: idx === 0, lines: [] };

    bloco.split('\n').map(l => l.trim()).filter(Boolean).forEach(linha => {
      if (/:blue/i.test(linha) && /^---/.test(linha) === false && slide.lines.length === 0) {
        slide.theme = 'blue';
        linha = linha.replace(/:blue/ig, '').trim();
        if (!linha) return;
      }
      if (/^---/.test(linha)) {
        if (/:blue/i.test(linha)) slide.theme = 'blue';
        slide.lines.push({ type: 'divider' });
        return;
      }
      pushLinha(slide, linha);
    });

    return slide;
  }).filter(s => s.lines.length > 0);
}

/* ── Classificação de uma linha (compartilhada) ──────────────────────────── */
function pushLinha(slide, trimmed) {
  if (/^##\s+/.test(trimmed)) {
    slide.lines.push({ type: 'step-title', text: trimmed.replace(/^##\s+/, '') });
    return;
  }
  if (/^\*\*(.+)\*\*$/.test(trimmed)) {
    const text = trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '');
    const type = slide.isCover && slide.lines.length === 0 ? 'cover-title' : 'line-bold';
    slide.lines.push({ type, text });
    return;
  }
  const type = slide.isCover && slide.lines.length === 0 ? 'cover-title' : 'line';
  slide.lines.push({ type, text: trimmed });
}
